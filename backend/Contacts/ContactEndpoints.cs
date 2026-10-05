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
            var (input, error) = await ReadInputAsync(request, cancellationToken);
            if (error is not null) return Results.BadRequest(new { error });

            var result = await service.CreateAsync(input!, cancellationToken);
            if (result.Error is not null)
                return Results.Json(new { error = result.Error }, statusCode: result.Conflict ? 409 : 400);
            return Results.Created($"/api/contacts/{result.Contact!.Id}", result.Contact);
        });

        app.MapPut("/api/contacts/{id:int}", async (
            int id, HttpRequest request, ContactService service, CancellationToken cancellationToken) =>
        {
            var (input, error) = await ReadInputAsync(request, cancellationToken);
            if (error is not null) return Results.BadRequest(new { error });
            var result = await service.UpdateAsync(id, input!, cancellationToken);
            if (result.NotFound) return Results.NotFound();
            if (result.Error is not null)
                return Results.Json(new { error = result.Error }, statusCode: result.Conflict ? 409 : 400);
            return Results.Ok(result.Contact);
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

    private static async Task<(ContactInput? Input, string? Error)> ReadInputAsync(
        HttpRequest request, CancellationToken cancellationToken)
    {
        if (!request.HasJsonContentType())
            return (null, "Envie um corpo JSON com Content-Type application/json.");
        try
        {
            var input = await request.ReadFromJsonAsync<ContactInput>(cancellationToken);
            return input is null ? (null, "O corpo da requisição é obrigatório.") : (input, null);
        }
        catch (Exception exception) when (exception is JsonException or BadHttpRequestException)
        {
            return (null, "O corpo da requisição deve ser um JSON válido.");
        }
    }

    private static bool TryReadInteger(HttpRequest request, string name, int fallback, out int value)
    {
        value = fallback;
        if (!request.Query.TryGetValue(name, out var raw)) return true;
        return raw.Count == 1 && int.TryParse(raw[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }
}
