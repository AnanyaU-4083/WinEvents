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
    IAttendeeRepository attendeeRepository,
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
            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password),
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

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            throw new UnauthorizedAccessException(
                "This account uses Microsoft authentication.");
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

        string token =
            GenerateJwtToken(user);

        return new LoginResponseDto
        {
            UserId = user.UserId,
            Username = user.Username,
            Token = token,
            Role = user.Role
        };
    }


    public async Task<UserResponseDto> GetOrCreateMicrosoftUserAsync(
        string email,
        string? displayName,
        CancellationToken cancellationToken)
    {
        User? existingUser =
            await userRepository.GetByEmailAsync(
                email,
                cancellationToken);

        if (existingUser is not null)
        {
            return MapToResponse(existingUser);
        }

        string username =
            email.Split('@')[0];

        User user = new()
        {
            Username = username,
            Email = email,
            PasswordHash = null,
            FirstName = displayName,
            LastName = null,
            Role = "Attendee",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        User createdUser =
            await userRepository.AddAsync(
                user,
                cancellationToken);

        Attendee attendee = new()
        {
            UserId = createdUser.UserId,
            Name = displayName ?? username,
            Email = email,
            Phone = string.Empty,
            Ticket = string.Empty
        };

        await attendeeRepository.AddAsync(
            attendee,
            cancellationToken);

        return MapToResponse(createdUser);
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
            new(
                Encoding.UTF8.GetBytes(secretKey));

        SigningCredentials credentials =
            new(
                key,
                SecurityAlgorithms.HmacSha256);

        JwtSecurityToken token =
            new(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }


    private static UserResponseDto MapToResponse(
        User user)
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