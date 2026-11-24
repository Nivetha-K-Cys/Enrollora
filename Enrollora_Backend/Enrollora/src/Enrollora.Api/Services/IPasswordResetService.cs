using Enrollora.Api.DTOs;

namespace Enrollora.Api.Services;

public interface IPasswordResetService
{
    Task ForgotPasswordAsync(
        ForgotPasswordRequest request,
        CancellationToken ct);

    Task ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken ct);
}
