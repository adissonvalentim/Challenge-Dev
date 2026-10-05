namespace MiniCx.Api.Analytics;

public sealed record NpsClass(long Count, decimal Pct);
public sealed record AnalyticsSummary(
    int NpsScore, long NpsResponses, NpsClass Promoters, NpsClass Neutrals,
    NpsClass Detractors, long ResponsesCount, decimal? CsatAvg);

internal sealed record SummaryAggregate(
    long ResponsesCount, long NpsResponses, long Promoters, long Neutrals,
    long Detractors, decimal? CsatAvg);
