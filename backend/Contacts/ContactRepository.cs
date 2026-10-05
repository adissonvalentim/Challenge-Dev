using Dapper;
using Npgsql;

namespace MiniCx.Api.Contacts;

public sealed class ContactRepository(NpgsqlDataSource dataSource)
{
    public async Task<IReadOnlyList<ContactResponse>?> GetResponsesAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead, cancellationToken);
        using var results = await connection.QueryMultipleAsync(new CommandDefinition("""
            SELECT EXISTS (SELECT 1 FROM contacts WHERE id = @Id AND deleted_at IS NULL);

            SELECT r.id, r.survey_id AS "SurveyId", s.name AS "SurveyName",
                   s.type AS "SurveyType", r.score, r.comment, r.channel,
                   r.responded_at AS "RespondedAt"
            FROM responses r
            JOIN surveys s ON s.id = r.survey_id
            JOIN contacts c ON c.id = r.contact_id
            WHERE r.contact_id = @Id AND r.deleted_at IS NULL AND c.deleted_at IS NULL
            ORDER BY r.responded_at DESC, r.id DESC;
            """, new { Id = id }, transaction, cancellationToken: cancellationToken));
        var exists = await results.ReadSingleAsync<bool>();
        var responses = (await results.ReadAsync<ContactResponse>()).ToArray();
        await transaction.CommitAsync(cancellationToken);
        return exists ? responses : null;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        var affected = await connection.ExecuteAsync(new CommandDefinition("""
            UPDATE contacts SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = @Id AND deleted_at IS NULL;
            """, new { Id = id }, cancellationToken: cancellationToken));
        return affected == 1;
    }

    public async Task<Contact?> UpdateAsync(int id, string name, string email, string? segment, CancellationToken cancellationToken)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<Contact>(new CommandDefinition("""
            UPDATE contacts SET name = @Name, email = @Email, segment = @Segment
            WHERE id = @Id AND deleted_at IS NULL
            RETURNING id, name, email, segment;
            """, new { Id = id, Name = name, Email = email, Segment = segment }, cancellationToken: cancellationToken));
    }

    public async Task<Contact> CreateAsync(string name, string email, string? segment, CancellationToken cancellationToken)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleAsync<Contact>(new CommandDefinition("""
            INSERT INTO contacts (name, email, segment)
            VALUES (@Name, @Email, @Segment)
            RETURNING id, name, email, segment;
            """, new { Name = name, Email = email, Segment = segment }, cancellationToken: cancellationToken));
    }

    public async Task<Contact?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<Contact>(new CommandDefinition("""
            SELECT id, name, email, segment FROM contacts
            WHERE id = @Id AND deleted_at IS NULL;
            """, new { Id = id }, cancellationToken: cancellationToken));
    }

    public async Task<ContactPage> ListAsync(string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        // Busca literal: %, _ e a barra digitados pelo usuário não viram curingas.
        var pattern = search is null ? null : "%" + search
            .Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%";
        var parameters = new { Search = pattern, Limit = pageSize, Offset = ((long)page - 1) * pageSize };

        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        // As duas consultas usam o mesmo snapshot, mantendo total e items consistentes.
        await using var transaction = await connection.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead, cancellationToken);
        var command = new CommandDefinition("""
            SELECT COUNT(*) FROM contacts
            WHERE deleted_at IS NULL
              AND (CAST(@Search AS TEXT) IS NULL OR name ILIKE @Search OR email ILIKE @Search);

            SELECT id, name, email, segment FROM contacts
            WHERE deleted_at IS NULL
              AND (CAST(@Search AS TEXT) IS NULL OR name ILIKE @Search OR email ILIKE @Search)
            ORDER BY id
            LIMIT @Limit OFFSET @Offset;
            """, parameters, transaction, cancellationToken: cancellationToken);
        using var results = await connection.QueryMultipleAsync(command);
        var total = await results.ReadSingleAsync<long>();
        var items = (await results.ReadAsync<Contact>()).ToArray();
        await transaction.CommitAsync(cancellationToken);
        return new ContactPage(items, total, page, pageSize);
    }
}
