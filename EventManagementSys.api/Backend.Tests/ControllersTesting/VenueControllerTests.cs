using EventManagementSys.api.Controllers;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Controllers;

public class VenueControllerTests
{
    private readonly Mock<IVenueService> _service = new();
    private readonly VenueController _controller;
    private readonly CancellationToken _token = CancellationToken.None;

    public VenueControllerTests() => _controller = new VenueController(_service.Object);

    [Fact]
    public async Task GetAllAndGetByIdReturnExpectedResults()
    {
        var venue = new VenueResponseDto { VenueId = 6, Address = "Town Hall" };
        _service.Setup(service => service.GetAllAsync(_token)).ReturnsAsync([venue]);
        _service.Setup(service => service.GetByIdAsync(6, _token)).ReturnsAsync(venue);
        _service.Setup(service => service.GetByIdAsync(9, _token)).ReturnsAsync((VenueResponseDto?)null);

        Assert.IsType<OkObjectResult>((await _controller.GetAll(_token)).Result);
        Assert.IsType<OkObjectResult>((await _controller.GetById(6, _token)).Result);
        Assert.IsType<NotFoundResult>((await _controller.GetById(9, _token)).Result);
    }

    [Fact]
    public async Task CreateReturnsCreatedAtActionWithVenueId()
    {
        var request = new CreateVenueDto { Address = "Town Hall", Capacity = 60 };
        _service.Setup(service => service.CreateAsync(request, _token)).ReturnsAsync(new VenueResponseDto { VenueId = 6 });

        var result = Assert.IsType<CreatedAtActionResult>((await _controller.Create(request, _token)).Result);
        Assert.Equal(nameof(VenueController.GetById), result.ActionName);
        Assert.Equal(6, result.RouteValues!["venueId"]);
    }
}
