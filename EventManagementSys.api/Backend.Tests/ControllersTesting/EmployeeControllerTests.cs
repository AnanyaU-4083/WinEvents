using EventManagementSys.api.Controllers;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Controllers;

public class EmployeeControllerTests
{
    private readonly Mock<IEmployeeService> _service = new();
    private readonly EmployeeController _controller;
    private readonly CancellationToken _token = CancellationToken.None;

    public EmployeeControllerTests() => _controller = new EmployeeController(_service.Object);

    [Fact]
    public async Task GetAllAndGetByIdReturnExpectedResults()
    {
        var employee = new EmployeeResponseDto { EmployeeId = 5, Name = "Jo" };
        _service.Setup(service => service.GetAllAsync(_token)).ReturnsAsync([employee]);
        _service.Setup(service => service.GetByIdAsync(5, _token)).ReturnsAsync(employee);
        _service.Setup(service => service.GetByIdAsync(9, _token)).ReturnsAsync((EmployeeResponseDto?)null);

        Assert.IsType<OkObjectResult>((await _controller.GetAll(_token)).Result);
        Assert.IsType<OkObjectResult>((await _controller.GetById(5, _token)).Result);
        Assert.IsType<NotFoundResult>((await _controller.GetById(9, _token)).Result);
    }

    [Fact]
    public async Task CreateReturnsCreatedAtAction()
    {
        var request = new CreateEmployeeDto { Name = "Jo" };
        var employee = new EmployeeResponseDto { EmployeeId = 5, Name = "Jo" };
        _service.Setup(service => service.CreateAsync(request, _token)).ReturnsAsync(employee);

        var result = Assert.IsType<CreatedAtActionResult>((await _controller.Create(request, _token)).Result);
        Assert.Equal(nameof(EmployeeController.GetById), result.ActionName);
        Assert.Equal(5, result.RouteValues!["employeeId"]);
    }

    [Fact]
    public async Task UpdateAndDeleteReturnNotFoundOrNoContent()
    {
        _service.Setup(service => service.UpdateAsync(5, It.IsAny<UpdateEmployeeDto>(), _token)).ReturnsAsync(true);
        _service.Setup(service => service.UpdateAsync(9, It.IsAny<UpdateEmployeeDto>(), _token)).ReturnsAsync(false);
        Assert.IsType<NoContentResult>(await _controller.Update(5, new UpdateEmployeeDto(), _token));
        Assert.IsType<NotFoundResult>(await _controller.Update(9, new UpdateEmployeeDto(), _token));

        _service.Setup(service => service.DeleteAsync(5, _token)).ReturnsAsync(true);
        _service.Setup(service => service.DeleteAsync(9, _token)).ReturnsAsync(false);
        Assert.IsType<NoContentResult>(await _controller.Delete(5, _token));
        Assert.IsType<NotFoundResult>(await _controller.Delete(9, _token));
    }
}
