using EventManagementSys.api.DTOs;

namespace EventManagementSys.api.Services.Interfaces;

public interface IAuthService
{
    Task<UserResponseDto> RegisterAsync(
        RegisterUserDto request,
        CancellationToken cancellationToken);

    Task<LoginResponseDto> LoginAsync(
        LoginUserDto request,
        CancellationToken cancellationToken);
}