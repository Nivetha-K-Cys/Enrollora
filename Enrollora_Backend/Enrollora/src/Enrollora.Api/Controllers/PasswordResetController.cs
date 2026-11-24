using Microsoft.AspNetCore.RateLimiting;
using Enrollora.Api.DTOs;
using Enrollora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Enrollora.Api.Controllers;

[EnableRateLimiting("PasswordReset")]
[ApiController]
[Route("api/auth")]
public sealed class PasswordResetController(
    IPasswordResetService passwordResetService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken ct)
    {
        await passwordResetService.ForgotPasswordAsync(request, ct);

        return Ok(new
        {
            message = "If the email is registered, a password reset link will be sent."
        });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken ct)
    {
        try
        {
            await passwordResetService.ResetPasswordAsync(request, ct);

            return Ok(new
            {
                message = "Password reset successfully."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

