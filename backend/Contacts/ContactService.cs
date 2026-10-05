using System.Net.Mail;
using Npgsql;

namespace MiniCx.Api.Contacts;

public sealed record ContactInput(string? Name, string? Email, string? Segment);
public sealed record CreateContactResult(Contact? Contact, string? Error, bool Conflict = false);

public sealed class ContactService(ContactRepository repository)
{
    public async Task<CreateContactResult> CreateAsync(ContactInput input, CancellationToken cancellationToken)
    {
        var name = input.Name?.Trim();
        var email = input.Email?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return new(null, "name é obrigatório e não pode estar vazio.");
        if (string.IsNullOrWhiteSpace(email) || !MailAddress.TryCreate(email, out var address)
            || !string.Equals(email, address.Address, StringComparison.OrdinalIgnoreCase))
            return new(null, "email é obrigatório e deve ter formato válido.");

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
}
