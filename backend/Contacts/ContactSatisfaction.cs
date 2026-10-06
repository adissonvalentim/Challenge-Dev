namespace MiniCx.Api.Contacts;

public sealed record ContactSatisfaction(
    long ResponsesCount, long Promoters, long Neutrals, long Detractors,
    string? LatestNpsClass);

internal sealed record ContactSatisfactionAggregate(
    bool Exists, long ResponsesCount, long Promoters, long Neutrals,
    long Detractors, string? LatestNpsClass);
