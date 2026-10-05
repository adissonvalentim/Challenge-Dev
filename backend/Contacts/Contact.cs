namespace MiniCx.Api.Contacts;

public sealed record Contact(int Id, string Name, string Email, string? Segment);
public sealed record ContactPage(IReadOnlyList<Contact> Items, long Total, int Page, int PageSize);
