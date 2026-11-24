using System.ComponentModel.DataAnnotations;

namespace Enrollora.Api.DTOs;

public sealed class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;
}
