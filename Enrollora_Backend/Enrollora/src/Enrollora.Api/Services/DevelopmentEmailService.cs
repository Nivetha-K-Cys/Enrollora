namespace Enrollora.Api.Services;

public sealed class DevelopmentEmailService(
    IWebHostEnvironment environment) : IEmailService
{
    public Task SendPasswordResetEmailAsync(
        string email,
        string resetLink,
        CancellationToken ct)
    {
        if (!environment.IsDevelopment())
            throw new InvalidOperationException(
                "Development email service is not allowed in production.");

        ct.ThrowIfCancellationRequested();

        Console.WriteLine("================================");
        Console.WriteLine("PASSWORD RESET - LOCAL TESTING");
        Console.WriteLine($"Reset Link: {resetLink}");
        Console.WriteLine("================================");

        return Task.CompletedTask;
    }
}
