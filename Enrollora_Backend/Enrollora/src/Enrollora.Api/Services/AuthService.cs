using Enrollora.Api.DTOs;
using Enrollora.Api.Models;
using Enrollora.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Enrollora.Api.Services;

public sealed class AuthService(
    IRepository<Student> students,
    IRepository<AdminUser> admins,
    IPasswordHasher hasher,
    ITokenService tokens) : IAuthService
{
    public async Task RegisterAsync(RegisterStudentRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await students.Query().AnyAsync(x => x.Email == email, ct) ||
            await admins.Query().AnyAsync(x => x.Email == email, ct))
            throw new InvalidOperationException("An account with this email already exists.");

        await students.AddAsync(new Student
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = hasher.Hash(request.Password),
            Department = request.Department.Trim(),
            Age = request.Age,
            CGPA = request.CGPA,
            Status = StudentStatus.Pending,
            RegisteredAt = DateTime.UtcNow
        }, ct);

        await students.SaveChangesAsync(ct);
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var admin = await admins.Query().FirstOrDefaultAsync(x => x.Email == email, ct);
        if (admin is not null)
        {
            if (!admin.IsActive || !hasher.Verify(admin.PasswordHash, request.Password))
                throw new UnauthorizedAccessException("Invalid email or password.");

            return tokens.CreateToken(
                admin.AdminUserId.ToString(), admin.Name, admin.Email, "Administrator");
        }

        var student = await students.Query().FirstOrDefaultAsync(x => x.Email == email, ct);
        if (student is null || !hasher.Verify(student.PasswordHash, request.Password))
            throw new UnauthorizedAccessException("Invalid email or password.");

        if (student.Status == StudentStatus.Pending)
            throw new UnauthorizedAccessException("Your account is pending administrator approval.");

        if (student.Status == StudentStatus.Rejected)
            throw new UnauthorizedAccessException("Your registration was rejected. Contact the administrator.");

        return tokens.CreateToken(
            student.StudentId.ToString(), student.Name, student.Email, "Student");
    }

    public async Task ChangePasswordAsync(
        int studentId,
        ChangePasswordRequest request,
        CancellationToken ct)
    {
        var student = await students.Query()
            .FirstOrDefaultAsync(x => x.StudentId == studentId, ct);

        if (student is null)
            throw new KeyNotFoundException("Student not found.");

        if (!hasher.Verify(student.PasswordHash, request.CurrentPassword))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        if (request.NewPassword != request.ConfirmPassword)
            throw new ArgumentException("New password and confirm password do not match.");

        if (request.NewPassword.Length < 8)
            throw new ArgumentException("New password must contain at least 8 characters.");

        if (hasher.Verify(student.PasswordHash, request.NewPassword))
            throw new ArgumentException("New password must be different from current password.");

        student.PasswordHash = hasher.Hash(request.NewPassword);

        await students.SaveChangesAsync(ct);
    }
}

