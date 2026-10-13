using EventManagementSys.api.Controllers;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Controllers;

public class OrganizationControllerTests
{
    private readonly Mock<IOrganizationService> _service = new();
    private readonly OrganizationController _controller;
    private readonly CancellationToken _token = CancellationToken.None;

    public OrganizationControllerTests() => _controller = new OrganizationController(_service.Object);

    [Fact]
    public async Task GetAllAndGetByIdReturnExpectedResults()
    {
        var organization = new OrganizationResponseDto { OrgId = 3, Name = "North" };
        _service.Setup(service => service.GetAllAsync(_token)).ReturnsAsync([organization]);
        _service.Setup(service => service.GetByIdAsync(3, _token)).ReturnsAsync(organization);
        _service.Setup(service => service.GetByIdAsync(9, _token)).ReturnsAsync((OrganizationResponseDto?)null);

        Assert.IsType<OkObjectResult>((await _controller.GetAll(_token)).Result);
        Assert.IsType<OkObjectResult>((await _controller.GetById(3, _token)).Result);
        Assert.IsType<NotFoundResult>((await _controller.GetById(9, _token)).Result);
    }

    [Fact]
    public async Task CreateReturnsCreatedAtActionWithOrganizationId()
    {
        var request = new CreateOrganizationDto { Name = "North" };
        _service.Setup(service => service.CreateAsync(request, _token)).ReturnsAsync(new OrganizationResponseDto { OrgId = 3 });

        var result = Assert.IsType<CreatedAtActionResult>((await _controller.Create(request, _token)).Result);
        Assert.Equal(nameof(OrganizationController.GetById), result.ActionName);
        Assert.Equal(3, result.RouteValues!["orgId"]);
    }

    [Fact]
    public async Task UpdateAndDeleteMapServiceResultToHttpStatus()
    {
        _service.Setup(service => service.UpdateAsync(3, It.IsAny<UpdateOrganizationDto>(), _token)).ReturnsAsync(true);
        _service.Setup(service => service.UpdateAsync(9, It.IsAny<UpdateOrganizationDto>(), _token)).ReturnsAsync(false);
        Assert.IsType<NoContentResult>(await _controller.Update(3, new UpdateOrganizationDto(), _token));
        Assert.IsType<NotFoundResult>(await _controller.Update(9, new UpdateOrganizationDto(), _token));

        _service.Setup(service => service.DeleteAsync(3, _token)).ReturnsAsync(true);
        _service.Setup(service => service.DeleteAsync(9, _token)).ReturnsAsync(false);
        Assert.IsType<NoContentResult>(await _controller.Delete(3, _token));
        Assert.IsType<NotFoundResult>(await _controller.Delete(9, _token));
    }
}
