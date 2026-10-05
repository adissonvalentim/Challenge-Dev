using Dapper;
using Npgsql;

namespace MiniCx.Api.Contacts;

public sealed class ContactRepository(NpgsqlDataSource dataSource)
{
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
