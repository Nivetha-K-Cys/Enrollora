using System.ComponentModel.DataAnnotations;

namespace Enrollora.Api.DTOs;

public sealed class CreateStudentRequest
{
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Department { get; set; } = string.Empty;

    [Range(17, 60)]
    public int Age { get; set; }

    [Range(typeof(decimal), "0", "10")]
    public decimal CGPA { get; set; }
}
