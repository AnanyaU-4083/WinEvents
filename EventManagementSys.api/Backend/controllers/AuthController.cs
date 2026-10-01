using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<UserResponseDto>> Register(RegisterUserDto request,CancellationToken cancellationToken)
    {
        UserResponseDto user =
            await authService.RegisterAsync(
                request,
                cancellationToken);

        
        return NoContent();
    }

    [HttpPost("login")] 
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login(LoginUserDto request,CancellationToken cancellationToken)
    {
        LoginResponseDto response =
            await authService.LoginAsync(
                request,
                cancellationToken);

        return Ok(response);
    }
}