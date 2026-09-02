using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace EventManagementSys.api.Services.Implementations;

public class AuthService(
    IUserRepository userRepository,
    IConfiguration configuration) : IAuthService
{
    public async Task<UserResponseDto> RegisterAsync(
        RegisterUserDto request,
        CancellationToken cancellationToken)
    {
        User? existingUser =
            await userRepository.GetByUsernameAsync(
                request.Username,
                cancellationToken);

        if (existingUser is not null)
        {
            throw new InvalidOperationException(
                "A user with this username already exists.");
        }

        User? existingEmail =
            await userRepository.GetByEmailAsync(
                request.Email,
                cancellationToken);

        if (existingEmail is not null)
        {
            throw new InvalidOperationException(
                "A user with this email already exists.");
        }

        User user = new()
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = "Attendee",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        User createdUser =
            await userRepository.AddAsync(
                user,
                cancellationToken);

        return MapToResponse(createdUser);
    }

    public async Task<LoginResponseDto> LoginAsync(
        LoginUserDto request,
        CancellationToken cancellationToken)
    {
        User? user =
            await userRepository.GetByUsernameAsync(
                request.Username,
                cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedAccessException(
                "Invalid username or password.");
        }

        bool passwordValid =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash);

        if (!passwordValid)
        {
            throw new UnauthorizedAccessException(
                "Invalid username or password.");
        }

        string token = GenerateJwtToken(user);

        return new LoginResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Token = token,
            Role = user.Role
        };
    }

    private string GenerateJwtToken(User user)
    {
        string? secretKey =
            configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException(
                "JWT key is not configured.");
        }

        string issuer =
            configuration["Jwt:Issuer"]
            ?? "EventManagementSys.api";

        string audience =
            configuration["Jwt:Audience"]
            ?? "EventManagementSys.api";

        List<Claim> claims =
        [
            new Claim(
                ClaimTypes.NameIdentifier,
                user.UserId.ToString()),

            new Claim(
                ClaimTypes.Name,
                user.Username),

            new Claim(
                ClaimTypes.Email,
                user.Email),

            new Claim(
                ClaimTypes.Role,
                user.Role)
        ];

        SymmetricSecurityKey key =
            new(Encoding.UTF8.GetBytes(secretKey));

        SigningCredentials credentials =
            new(
                key,
                SecurityAlgorithms.HmacSha256);

        JwtSecurityToken token =
            new(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }

    private static UserResponseDto MapToResponse(User user)
    {
        return new UserResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}