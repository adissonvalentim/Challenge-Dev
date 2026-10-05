using System.Globalization;
using System.Text.Json;

namespace MiniCx.Api.Contacts;

public static class ContactEndpoints
{
    public static void MapContactEndpoints(this WebApplication app)
    {
        app.MapPost("/api/contacts", async (
            HttpRequest request, ContactService service, CancellationToken cancellationToken) =>
        {
            if (!request.HasJsonContentType())
                return Results.BadRequest(new { error = "Envie um corpo JSON com Content-Type application/json." });

            ContactInput? input;
            try
            {
                input = await request.ReadFromJsonAsync<ContactInput>(cancellationToken);
            }
            catch (Exception exception) when (exception is JsonException or BadHttpRequestException)
            {
                return Results.BadRequest(new { error = "O corpo da requisição deve ser um JSON válido." });
            }
            if (input is null)
                return Results.BadRequest(new { error = "O corpo da requisição é obrigatório." });

            var result = await service.CreateAsync(input, cancellationToken);
            if (result.Error is not null)
                return Results.Json(new { error = result.Error }, statusCode: result.Conflict ? 409 : 400);
            return Results.Created($"/api/contacts/{result.Contact!.Id}", result.Contact);
        });

        app.MapGet("/api/contacts/{id:int}", async (
            int id, ContactRepository repository, CancellationToken cancellationToken) =>
        {
            var contact = await repository.GetByIdAsync(id, cancellationToken);
            return contact is null
                ? Results.NotFound()
                : Results.Ok(contact);
        });

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
