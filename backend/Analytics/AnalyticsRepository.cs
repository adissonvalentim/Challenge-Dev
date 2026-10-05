using Dapper;
using Npgsql;

namespace MiniCx.Api.Analytics;

public sealed class AnalyticsRepository(NpgsqlDataSource dataSource)
{
    public async Task<AnalyticsSummary> GetSummaryAsync(CancellationToken cancellationToken)
    {
        await using var connection = await dataSource.OpenConnectionAsync(cancellationToken);
        var aggregate = await connection.QuerySingleAsync<SummaryAggregate>(new CommandDefinition("""
            SELECT COUNT(*) AS "ResponsesCount",
                   COUNT(CASE WHEN s.type = 'NPS' THEN 1 END) AS "NpsResponses",
                   COUNT(CASE WHEN s.type = 'NPS' AND r.score BETWEEN 9 AND 10 THEN 1 END) AS "Promoters",
                   COUNT(CASE WHEN s.type = 'NPS' AND r.score BETWEEN 7 AND 8 THEN 1 END) AS "Neutrals",
                   COUNT(CASE WHEN s.type = 'NPS' AND r.score BETWEEN 0 AND 6 THEN 1 END) AS "Detractors",
                   AVG(CASE WHEN s.type = 'CSAT' THEN r.score::numeric END) AS "CsatAvg"
            FROM responses r
            JOIN surveys s ON s.id = r.survey_id
            JOIN contacts c ON c.id = r.contact_id
            WHERE r.deleted_at IS NULL AND c.deleted_at IS NULL;
            """, cancellationToken: cancellationToken));

        // Apenas apresentação/arredondamento em C#: toda agregação já ocorreu no SQL.
        decimal Percent(long count) => aggregate.NpsResponses == 0
            ? 0m : count * 100m / aggregate.NpsResponses;
        static decimal Round(decimal value, int digits) =>
            Math.Round(value, digits, MidpointRounding.AwayFromZero);

        var score = (int)Round(Percent(aggregate.Promoters) - Percent(aggregate.Detractors), 0);
        return new AnalyticsSummary(
            score, aggregate.NpsResponses,
            new NpsClass(aggregate.Promoters, Round(Percent(aggregate.Promoters), 1)),
            new NpsClass(aggregate.Neutrals, Round(Percent(aggregate.Neutrals), 1)),
            new NpsClass(aggregate.Detractors, Round(Percent(aggregate.Detractors), 1)),
            aggregate.ResponsesCount,
            aggregate.CsatAvg is { } average ? Round(average, 2) : null);
    }
}
