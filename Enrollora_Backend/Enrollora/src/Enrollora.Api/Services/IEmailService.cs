namespace Enrollora.Api.Services;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(
        string email,
        string resetLink,
        CancellationToken ct);
}
