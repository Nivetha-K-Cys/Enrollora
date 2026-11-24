using System.ComponentModel.DataAnnotations;

namespace Enrollora.Api.DTOs;

public sealed class ResetPasswordRequest
{
    [Required]
    [MaxLength(256)]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare(nameof(NewPassword))]
    public string ConfirmPassword { get; set; } = string.Empty;
}
