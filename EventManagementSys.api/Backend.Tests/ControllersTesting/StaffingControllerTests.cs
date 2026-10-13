using System.Security.Claims;
using EventManagementSys.api.Controllers;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Controllers;

public class StaffingControllerTests
{
    private readonly Mock<IStaffingService> _service = new();
    private readonly StaffingController _controller;
    private readonly CancellationToken _token = CancellationToken.None;

    public StaffingControllerTests() => _controller = new StaffingController(_service.Object);

    [Fact]
    public async Task AssignAndListActionsReturnOk()
    {
        var request = new AssignStaffDto { EmployeeId = 2, Task = "Setup" };
        _service.Setup(service => service.AssignAsync(4, request, _token)).ReturnsAsync(new StaffDto { AssignmentId = 11 });
        _service.Setup(service => service.GetStaffAsync(4, _token)).ReturnsAsync([new StaffDto { AssignmentId = 11 }]);
        _service.Setup(service => service.GetTasksByEmployeeIdAsync(2, _token)).ReturnsAsync([]);

        Assert.IsType<OkObjectResult>((await _controller.Assign(4, request, _token)).Result);
        Assert.IsType<OkObjectResult>((await _controller.GetStaff(4, _token)).Result);
        Assert.IsType<OkObjectResult>((await _controller.GetEmployeeTasks(2, _token)).Result);
    }

    [Fact]
    public async Task GetMyTasksRequiresEmailAndUsesClaimFallbacks()
    {
        ControllerTestHelpers.SetUser(_controller);
        Assert.IsType<UnauthorizedObjectResult>((await _controller.GetMyTasks(_token)).Result);

        ControllerTestHelpers.SetUser(_controller, new Claim("email", "worker@example.com"));
        _service.Setup(service => service.GetTasksByEmployeeEmailAsync("worker@example.com", _token)).ReturnsAsync([]);
        Assert.IsType<OkObjectResult>((await _controller.GetMyTasks(_token)).Result);

        ControllerTestHelpers.SetUser(_controller, new Claim("upn", "worker@example.com"));
        Assert.IsType<OkObjectResult>((await _controller.GetMyTasks(_token)).Result);
    }

    [Fact]
    public async Task AdminCanUpdateWithoutCheckingTaskOwnership()
    {
        ControllerTestHelpers.SetUser(_controller, new Claim(ClaimTypes.Role, "Admin"));
        _service.Setup(service => service.UpdateAsync(11, It.IsAny<UpdateStaffDto>(), _token)).ReturnsAsync(true);
        _service.Setup(service => service.UpdateAsync(12, It.IsAny<UpdateStaffDto>(), _token)).ReturnsAsync(false);

        Assert.IsType<NoContentResult>(await _controller.Update(11, new UpdateStaffDto(), _token));
        Assert.IsType<NotFoundResult>(await _controller.Update(12, new UpdateStaffDto(), _token));
        _service.Verify(service => service.GetTasksByEmployeeEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task EmployeeMustHaveEmailAndOwnAssignmentToUpdate()
    {
        ControllerTestHelpers.SetUser(_controller);
        Assert.IsType<UnauthorizedObjectResult>(await _controller.Update(11, new UpdateStaffDto(), _token));

        ControllerTestHelpers.SetUser(_controller, new Claim("email", "worker@example.com"));
        _service.Setup(service => service.GetTasksByEmployeeEmailAsync("worker@example.com", _token)).ReturnsAsync([]);
        Assert.IsType<ForbidResult>(await _controller.Update(11, new UpdateStaffDto(), _token));
        _service.Verify(service => service.UpdateAsync(It.IsAny<int>(), It.IsAny<UpdateStaffDto>(), It.IsAny<CancellationToken>()), Times.Never);

        _service.Setup(service => service.GetTasksByEmployeeEmailAsync("worker@example.com", _token))
            .ReturnsAsync([new StaffDto { AssignmentId = 11 }]);
        _service.Setup(service => service.UpdateAsync(11, It.IsAny<UpdateStaffDto>(), _token)).ReturnsAsync(true);
        Assert.IsType<NoContentResult>(await _controller.Update(11, new UpdateStaffDto(), _token));
    }

    [Fact]
    public async Task RemoveReturnsNotFoundOrNoContent()
    {
        _service.Setup(service => service.RemoveAsync(11, _token)).ReturnsAsync(true);
        _service.Setup(service => service.RemoveAsync(12, _token)).ReturnsAsync(false);
        Assert.IsType<NoContentResult>(await _controller.Remove(11, _token));
        Assert.IsType<NotFoundResult>(await _controller.Remove(12, _token));
    }
}
