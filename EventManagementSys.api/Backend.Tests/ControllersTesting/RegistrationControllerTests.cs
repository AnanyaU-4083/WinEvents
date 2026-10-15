using System.Security.Claims;
using EventManagementSys.api.Controllers;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Controllers;

public class RegistrationControllerTests
{
    private readonly Mock<IRegistrationService> _service = new();
    private readonly RegistrationController _controller;
    private readonly CancellationToken _token = CancellationToken.None;

    public RegistrationControllerTests() => _controller = new RegistrationController(_service.Object);

    [Fact]
    public async Task RegisterReturnsOkWithRegistration()
    {
        var registration = new RegistrationDto { EventId = 4, AttendeeId = 8 };
        _service.Setup(service => service.RegisterAsync(4, 8, _token)).ReturnsAsync(registration);

        Assert.Same(registration, Assert.IsType<OkObjectResult>((await _controller.Register(4, 8, _token)).Result).Value);
    }

    [Fact]
    public async Task RegisterCurrentUserRequiresEmailAndSupportsClaimFallback()
    {
        ControllerTestHelpers.SetUser(_controller);
        var unauthorized = Assert.IsType<UnauthorizedObjectResult>((await _controller.RegisterCurrentUser(4, _token)).Result);
        Assert.Equal("Unable to determine the logged-in user's email.", unauthorized.Value);

        ControllerTestHelpers.SetUser(_controller, new Claim("email", "person@example.com"));
        var registration = new RegistrationDto { EventId = 4, AttendeeId = 8 };
        _service.Setup(service => service.RegisterCurrentUserAsync(4, "person@example.com", _token)).ReturnsAsync(registration);
        Assert.Same(registration, Assert.IsType<OkObjectResult>((await _controller.RegisterCurrentUser(4, _token)).Result).Value);
    }

    [Fact]
    public async Task CancelCurrentUserRegistrationRequiresEmailAndReturnsExpectedStatus()
    {
        ControllerTestHelpers.SetUser(_controller);
        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(
            await _controller.CancelCurrentUserRegistration(4, _token));
        Assert.Equal("Unable to determine the logged-in user's email.", unauthorized.Value);

        ControllerTestHelpers.SetUser(_controller, new Claim("email", "person@example.com"));
        _service.Setup(service => service.CancelCurrentUserRegistrationAsync(4, "person@example.com", _token))
            .ReturnsAsync(false);
        Assert.IsType<NotFoundResult>(await _controller.CancelCurrentUserRegistration(4, _token));

        _service.Setup(service => service.CancelCurrentUserRegistrationAsync(4, "person@example.com", _token))
            .ReturnsAsync(true);
        Assert.IsType<NoContentResult>(await _controller.CancelCurrentUserRegistration(4, _token));
    }

    [Fact]
    public async Task GetMyRegistrationsRequiresEmailAndReturnsEvents()
    {
        ControllerTestHelpers.SetUser(_controller);
        Assert.IsType<UnauthorizedObjectResult>((await _controller.GetMyRegistrations(_token)).Result);

        ControllerTestHelpers.SetUser(_controller, new Claim("preferred_username", "person@example.com"));
        _service.Setup(service => service.GetRegisteredEventsAsync("person@example.com", _token)).ReturnsAsync([]);
        Assert.IsType<OkObjectResult>((await _controller.GetMyRegistrations(_token)).Result);
    }

    [Fact]
    public async Task ParticipantsAndRemovalReturnExpectedResults()
    {
        _service.Setup(service => service.GetParticipantsAsync(4, _token)).ReturnsAsync([new ParticipantDto { AttendeeId = 8 }]);
        Assert.IsType<OkObjectResult>((await _controller.GetParticipants(4, _token)).Result);

        _service.Setup(service => service.RemoveParticipantAsync(4, 8, _token)).ReturnsAsync(true);
        _service.Setup(service => service.RemoveParticipantAsync(4, 9, _token)).ReturnsAsync(false);
        Assert.IsType<NoContentResult>(await _controller.RemoveParticipant(4, 8, _token));
        Assert.IsType<NotFoundResult>(await _controller.RemoveParticipant(4, 9, _token));
    }

    [Theory]
    [InlineData("email")]
    [InlineData("preferred_username")]
    [InlineData("upn")]
    public async Task CurrentUserEmailCanComeFromSupportedClaims(string claimType)
    {
        ControllerTestHelpers.SetUser(_controller, new Claim(claimType, "person@example.com"));
        _service.Setup(service => service.RegisterCurrentUserAsync(4, "person@example.com", _token)).ReturnsAsync(new RegistrationDto());
        Assert.IsType<OkObjectResult>((await _controller.RegisterCurrentUser(4, _token)).Result);
    }
}
