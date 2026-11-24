using System.Net;
using System.Net.Mail;

namespace Enrollora.Api.Services;

public sealed class EmailService(
    IConfiguration configuration) : IEmailService
{
    public async Task SendPasswordResetEmailAsync(
        string email,
        string resetLink,
        CancellationToken ct)
    {
        var host = configuration["Smtp:Host"]
            ?? throw new InvalidOperationException("SMTP host is missing.");

        var port = configuration.GetValue<int>("Smtp:Port", 587);

        var sender = configuration["Smtp:Email"]
            ?? throw new InvalidOperationException("SMTP email is missing.");

        var password = configuration["Smtp:Password"]
            ?? throw new InvalidOperationException("SMTP password is missing.");

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(sender, password)
        };

        using var message = new MailMessage
        {
            From = new MailAddress(sender, "Enrollora"),
            Subject = "Enrollora - Password Reset",
            Body = $"Reset your password using this link:\n\n{resetLink}\n\nThis link expires in 15 minutes.\n\nIf you did not request this, ignore this email.",
            IsBodyHtml = false
        };

        message.To.Add(email);

        await client.SendMailAsync(message, ct);
    }
}
