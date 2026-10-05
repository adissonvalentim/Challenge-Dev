namespace MiniCx.Api.Database;

public sealed record SeedData(
    CompanySeed Company,
    SurveySeed[] Surveys,
    ContactSeed[] Contacts,
    ResponseSeed[] Responses);

public sealed record CompanySeed(int Id, string Name, string Description);
public sealed record SurveySeed(int Id, string Name, string Type, DateTime CreatedAt);
public sealed record ContactSeed(int Id, string Name, string Email, string? Segment);
public sealed record ResponseSeed(
    int Id, int SurveyId, int ContactId, int Score, string? Comment,
    string Channel, DateTime RespondedAt, DateTime? DeletedAt);
