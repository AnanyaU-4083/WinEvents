using System.Security.Claims;
using EventManagementSys.api.Controllers;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<IAuthService> _service = new();
    private readonly AuthController _controller;
    private readonly CancellationToken _token = CancellationToken.None;

    public AuthControllerTests() => _controller = new AuthController(_service.Object);

    [Fact]
    public async Task RegisterAndLoginReturnServiceResponses()
    {
        var registerRequest = new RegisterUserDto { Username = "asha" };
        var user = new UserResponseDto { UserId = 3, Username = "asha" };
        _service.Setup(service => service.RegisterAsync(registerRequest, _token)).ReturnsAsync(user);
        Assert.Same(user, Assert.IsType<OkObjectResult>((await _controller.Register(registerRequest, _token)).Result).Value);

        var loginRequest = new LoginUserDto { Username = "asha" };
        var response = new LoginResponseDto { UserId = 3, Token = "token" };
        _service.Setup(service => service.LoginAsync(loginRequest, _token)).ReturnsAsync(response);
        Assert.Same(response, Assert.IsType<OkObjectResult>((await _controller.Login(loginRequest, _token)).Result).Value);
    }

    [Fact]
    public async Task GetCurrentUserRejectsMissingEmailClaim()
    {
        ControllerTestHelpers.SetUser(_controller);
        var result = Assert.IsType<UnauthorizedObjectResult>((await _controller.GetCurrentUser(_token)).Result);
        Assert.Equal("Unable to determine the logged-in Microsoft user's email.", result.Value);
        _service.Verify(service => service.GetOrCreateMicrosoftUserAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("preferred_username")]
    [InlineData("email")]
    [InlineData("upn")]
    [InlineData("name")]
    public async Task GetCurrentUserUsesSupportedEmailClaims(string claimType)
    {
        ControllerTestHelpers.SetUser(_controller, new Claim(claimType, "user@example.com"));
        var user = new UserResponseDto { UserId = 7, Email = "user@example.com" };
        _service.Setup(service => service.GetOrCreateMicrosoftUserAsync("user@example.com", claimType == "name" ? "user@example.com" : null, _token))
            .ReturnsAsync(user);

        Assert.Same(user, Assert.IsType<OkObjectResult>((await _controller.GetCurrentUser(_token)).Result).Value);
    }

    [Fact]
    public async Task GetCurrentUserPassesNameAsDisplayNameAlongsidePreferredEmail()
    {
        ControllerTestHelpers.SetUser(_controller,
            new Claim("preferred_username", "user@example.com"),
            new Claim("name", "User Name"));
        _service.Setup(service => service.GetOrCreateMicrosoftUserAsync("user@example.com", "User Name", _token))
            .ReturnsAsync(new UserResponseDto());

        Assert.IsType<OkObjectResult>((await _controller.GetCurrentUser(_token)).Result);
    }
}
