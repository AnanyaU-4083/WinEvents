using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<UserResponseDto>> Register(
        RegisterUserDto request,
        CancellationToken cancellationToken)
    {
        UserResponseDto user =
            await authService.RegisterAsync(
                request,
                cancellationToken);

        return Ok(user);
    }


    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login(
        LoginUserDto request,
        CancellationToken cancellationToken)
    {
        LoginResponseDto response =
            await authService.LoginAsync(
                request,
                cancellationToken);

        return Ok(response);
    }


    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponseDto>> GetCurrentUser(
        CancellationToken cancellationToken)
    {
        string? email =
            User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? User.FindFirst("upn")?.Value
            ?? User.FindFirst("name")?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized(
                "Unable to determine the logged-in Microsoft user's email.");
        }

        string? displayName =
            User.FindFirst("name")?.Value;

        UserResponseDto user =
            await authService.GetOrCreateMicrosoftUserAsync(
                email,
                displayName,
                cancellationToken);

        return Ok(user);
    }
}