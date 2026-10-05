using System.Globalization;

namespace MiniCx.Api.Contacts;

public static class ContactEndpoints
{
    public static void MapContactEndpoints(this WebApplication app)
    {
        app.MapGet("/api/contacts", async (
            HttpRequest request, ContactRepository repository, CancellationToken cancellationToken) =>
        {
            if (!TryReadInteger(request, "page", 1, out var page) || page < 1)
                return Results.BadRequest(new { error = "page deve ser um inteiro maior ou igual a 1." });
            if (!TryReadInteger(request, "pageSize", 20, out var pageSize) || pageSize is < 1 or > 100)
                return Results.BadRequest(new { error = "pageSize deve ser um inteiro entre 1 e 100." });

            var search = request.Query["search"].ToString();
            return Results.Ok(await repository.ListAsync(
                search.Length == 0 ? null : search, page, pageSize, cancellationToken));
        });
    }

    private static bool TryReadInteger(HttpRequest request, string name, int fallback, out int value)
    {
        value = fallback;
        if (!request.Query.TryGetValue(name, out var raw)) return true;
        return raw.Count == 1 && int.TryParse(raw[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }
}
