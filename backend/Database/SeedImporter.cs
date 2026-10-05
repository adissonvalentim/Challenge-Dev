using System.Text.Json;
using Dapper;
using Npgsql;

namespace MiniCx.Api.Database;

public sealed class SeedImporter(NpgsqlDataSource dataSource, ILogger<SeedImporter> logger)
{
    public async Task ImportAsync(string seedPath)
    {
        await using var connection = await dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        // Serializa a inicialização caso duas instâncias iniciem ao mesmo tempo.
        await connection.ExecuteAsync("SELECT pg_advisory_xact_lock(20261005);", transaction: transaction);
        var schema = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "Database", "schema.sql"));
        await connection.ExecuteAsync(schema, transaction: transaction);
        await connection.ExecuteAsync("""
            CREATE TABLE IF NOT EXISTS seed_imports (
                name TEXT PRIMARY KEY,
                imported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """, transaction: transaction);

        const string importName = "initial-seed";
        var imported = await connection.ExecuteScalarAsync<bool>(
            "SELECT EXISTS (SELECT 1 FROM seed_imports WHERE name = @Name);",
            new { Name = importName }, transaction);
        if (imported)
        {
            await transaction.CommitAsync();
            logger.LogInformation("Seed já importado; dados existentes preservados.");
            return;
        }

        await using var file = File.OpenRead(seedPath);
        var seed = await JsonSerializer.DeserializeAsync<SeedData>(file, new JsonSerializerOptions(JsonSerializerDefaults.Web))
            ?? throw new InvalidOperationException("O arquivo de seed está vazio.");

        await connection.ExecuteAsync("""
            INSERT INTO companies (id, name, description) VALUES (@Id, @Name, @Description);
            """, seed.Company, transaction);
        await connection.ExecuteAsync("""
            INSERT INTO surveys (id, name, type, created_at) VALUES (@Id, @Name, @Type, @CreatedAt);
            """, seed.Surveys, transaction);
        await connection.ExecuteAsync("""
            INSERT INTO contacts (id, name, email, segment) VALUES (@Id, @Name, @Email, @Segment);
            """, seed.Contacts, transaction);
        await connection.ExecuteAsync("""
            INSERT INTO responses (id, survey_id, contact_id, score, comment, channel, responded_at, deleted_at)
            VALUES (@Id, @SurveyId, @ContactId, @Score, @Comment, @Channel, @RespondedAt, @DeletedAt);
            """, seed.Responses, transaction);

        // IDs explícitos do seed não avançam as sequences automaticamente.
        await connection.ExecuteAsync("""
            SELECT setval(pg_get_serial_sequence('companies', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM companies;
            SELECT setval(pg_get_serial_sequence('surveys', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM surveys;
            SELECT setval(pg_get_serial_sequence('contacts', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM contacts;
            SELECT setval(pg_get_serial_sequence('responses', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) FROM responses;
            """, transaction: transaction);
        await connection.ExecuteAsync("INSERT INTO seed_imports (name) VALUES (@Name);", new { Name = importName }, transaction);
        await transaction.CommitAsync();
        logger.LogInformation("Seed importado: {Contacts} contatos e {Responses} respostas.", seed.Contacts.Length, seed.Responses.Length);
    }
}
