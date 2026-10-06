using System.Net.Mail;
using Npgsql;

namespace MiniCx.Api.Contacts;

public sealed record ContactInput(string? Name, string? Email, string? Segment);
public sealed record ContactWriteResult(Contact? Contact, string? Error, bool Conflict = false, bool NotFound = false);

public sealed class ContactService(ContactRepository repository)
{
    public async Task<ContactWriteResult> CreateAsync(ContactInput input, CancellationToken cancellationToken)
    {
        var error = Validate(input);
        if (error is not null) return new(null, error);
        var name = input.Name!.Trim();
        var email = input.Email!.Trim();

        try
        {
            var contact = await repository.CreateAsync(name, email, input.Segment, cancellationToken);
            return new(contact, null);
        }
        catch (PostgresException exception) when (
            exception.SqlState == PostgresErrorCodes.UniqueViolation
            && exception.ConstraintName == "ux_contacts_active_email")
        {
            // O índice também protege contra cadastros simultâneos do mesmo e-mail.
            return new(null, "Já existe um contato ativo com esse e-mail.", Conflict: true);
        }
    }
    public async Task<ContactWriteResult> UpdateAsync(int id, ContactInput input, CancellationToken cancellationToken)
    {
        if (await repository.GetByIdAsync(id, cancellationToken) is null)
            return new(null, null, NotFound: true);
        var error = Validate(input);
        if (error is not null) return new(null, error);
        try
        {
            var contact = await repository.UpdateAsync(id, input.Name!.Trim(), input.Email!.Trim(), input.Segment, cancellationToken);
            return new(contact, null, NotFound: contact is null);
        }
        catch (PostgresException exception) when (
            exception.SqlState == PostgresErrorCodes.UniqueViolation
            && exception.ConstraintName == "ux_contacts_active_email")
        {
            return new(null, "Já existe um contato ativo com esse e-mail.", Conflict: true);
        }
    }

    private static string? Validate(ContactInput input)
    {
        var name = input.Name?.Trim();
        var email = input.Email?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return "name é obrigatório e não pode estar vazio.";
        if (string.IsNullOrWhiteSpace(email) || !MailAddress.TryCreate(email, out var address)
            || !string.Equals(email, address.Address, StringComparison.OrdinalIgnoreCase))
            return "email é obrigatório e deve ter formato válido.";
        return null;
    }

}
