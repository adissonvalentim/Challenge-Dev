namespace MiniCx.Api.Analytics;

public static class AnalyticsEndpoints
{
    public static void MapAnalyticsEndpoints(this WebApplication app)
    {
        app.MapGet("/api/analytics/summary", async (
            AnalyticsRepository repository, CancellationToken cancellationToken) =>
            Results.Ok(await repository.GetSummaryAsync(cancellationToken)));
    }
}
