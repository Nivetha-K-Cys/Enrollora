using System.ComponentModel.DataAnnotations;

namespace Enrollora.Api.Models;

public sealed class PasswordResetToken
{
    public int PasswordResetTokenId { get; set; }

    public int StudentId { get; set; }

    [MaxLength(128)]
    public string TokenHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAt { get; set; }

    public bool IsUsed { get; set; } = false;

    [Timestamp]
    public byte[] RowVersion { get; set; } = [];

    public Student Student { get; set; } = null!;
}
