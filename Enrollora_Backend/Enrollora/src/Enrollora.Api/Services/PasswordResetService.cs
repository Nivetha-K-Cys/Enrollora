using System.Security.Cryptography;
using System.Text;
using System.Data;
using Enrollora.Api.Data;
using Enrollora.Api.DTOs;
using Enrollora.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Enrollora.Api.Services;

public sealed class PasswordResetService(
    ApplicationDbContext db,
    IPasswordHasher hasher,
    IEmailService emailService,
    IConfiguration configuration) : IPasswordResetService
{
    public async Task ForgotPasswordAsync(
        ForgotPasswordRequest request,
        CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var student = await db.Students
            .FirstOrDefaultAsync(x => x.Email == email, ct);

        if (student is null)
            return;

        var frontendUrl = configuration["Frontend:BaseUrl"]
            ?? "http://localhost:4200";

        var token = Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32));

        var now = DateTime.UtcNow;

        db.PasswordResetTokens.Add(new PasswordResetToken
        {
            StudentId = student.StudentId,
            TokenHash = HashToken(token),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(15),
            IsUsed = false
        });

        await db.SaveChangesAsync(ct);

        var resetLink =
            $"{frontendUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(token)}";

        await emailService.SendPasswordResetEmailAsync(
            student.Email, resetLink, ct);
    }

    public async Task ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken ct)
    {
        if (request.NewPassword.Length < 8)
            throw new ArgumentException(
                "Password must contain at least 8 characters.");

        if (request.NewPassword != request.ConfirmPassword)
            throw new ArgumentException(
                "Passwords do not match.");

        var tokenHash = HashToken(request.Token);
        var now = DateTime.UtcNow;

        await using var transaction =
            await db.Database.BeginTransactionAsync(
                IsolationLevel.Serializable, ct);

        var resetToken = await db.PasswordResetTokens
            .Include(x => x.Student)
            .FirstOrDefaultAsync(x =>
                x.TokenHash == tokenHash &&
                !x.IsUsed &&
                x.ExpiresAt > now, ct);

        if (resetToken is null)
            throw new ArgumentException(
                "Invalid or expired reset token.");

        resetToken.Student.PasswordHash =
            hasher.Hash(request.NewPassword);

        var activeTokens = await db.PasswordResetTokens
            .Where(x =>
                x.StudentId == resetToken.StudentId &&
                !x.IsUsed)
            .ToListAsync(ct);

        foreach (var item in activeTokens)
            item.IsUsed = true;

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    private static string HashToken(string token)
    {
        return Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }
}
