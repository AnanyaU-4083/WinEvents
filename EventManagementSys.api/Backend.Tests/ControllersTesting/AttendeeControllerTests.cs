using System.Security.Claims;
using EventManagementSys.api.Controllers;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Controllers;

public class AttendeeControllerTests
{
    private readonly Mock<IAttendeeService> _service = new();
    private readonly AttendeeController _controller;
    private readonly CancellationToken _token = CancellationToken.None;

    public AttendeeControllerTests() => _controller = new AttendeeController(_service.Object);

    [Fact]
    public async Task GetMeRequiresEmailAndUsesPreferredUsernameBeforeEmail()
    {
        ControllerTestHelpers.SetUser(_controller);
        Assert.IsType<UnauthorizedResult>((await _controller.GetMe(_token)).Result);

        ControllerTestHelpers.SetUser(_controller,
            new Claim("preferred_username", "preferred@example.com"),
            new Claim("email", "fallback@example.com"));
        _service.Setup(service => service.GetMeAsync("preferred@example.com", _token)).ReturnsAsync((AttendeeResponseDto?)null);
        Assert.IsType<NotFoundObjectResult>((await _controller.GetMe(_token)).Result);

        ControllerTestHelpers.SetUser(_controller, new Claim("email", "fallback@example.com"));
        var attendee = new AttendeeResponseDto { AttendeeId = 3 };
        _service.Setup(service => service.GetMeAsync("fallback@example.com", _token)).ReturnsAsync(attendee);
        Assert.Same(attendee, Assert.IsType<OkObjectResult>((await _controller.GetMe(_token)).Result).Value);
    }

}
