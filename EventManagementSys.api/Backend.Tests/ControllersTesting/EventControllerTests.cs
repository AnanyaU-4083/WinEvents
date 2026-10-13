using EventManagementSys.api.Controllers;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Controllers;

public class EventControllerTests
{
    private readonly Mock<IEventService> _service = new();
    private readonly EventController _controller;
    private readonly CancellationToken _token = CancellationToken.None;

    public EventControllerTests() => _controller = new EventController(_service.Object);

    [Fact]
    public async Task GetAllPassesUpcomingFilterToService()
    {
        _service.Setup(service => service.GetAllAsync(false, _token)).ReturnsAsync([]);
        Assert.IsType<OkObjectResult>((await _controller.GetAll(false, _token)).Result);
        _service.Verify(service => service.GetAllAsync(false, _token), Times.Once);
    }

    [Fact]
    public async Task GetByIdReturnsOkOrNotFound()
    {
        _service.Setup(service => service.GetByIdAsync(4, _token)).ReturnsAsync(new EventResponseDto { EventId = 4 });
        _service.Setup(service => service.GetByIdAsync(9, _token)).ReturnsAsync((EventResponseDto?)null);
        Assert.IsType<OkObjectResult>((await _controller.GetById(4, _token)).Result);
        Assert.IsType<NotFoundResult>((await _controller.GetById(9, _token)).Result);
    }

    [Fact]
    public async Task CreateUsesNullCreatorAndReturnsCreatedLocation()
    {
        var request = new CreateEventDto { EventName = "Conference" };
        _service.Setup(service => service.CreateAsync(request, null, _token)).ReturnsAsync(new EventResponseDto { EventId = 12 });

        var result = Assert.IsType<CreatedAtActionResult>((await _controller.Create(request, _token)).Result);
        Assert.Equal(nameof(EventController.GetById), result.ActionName);
        Assert.Equal(12, result.RouteValues!["eventId"]);
        _service.Verify(service => service.CreateAsync(request, null, _token), Times.Once);
    }

    [Fact]
    public async Task UpdateAndCancelMapBooleansToHttpResults()
    {
        _service.Setup(service => service.UpdateAsync(4, It.IsAny<UpdateEventDto>(), _token)).ReturnsAsync(true);
        _service.Setup(service => service.UpdateAsync(9, It.IsAny<UpdateEventDto>(), _token)).ReturnsAsync(false);
        Assert.IsType<NoContentResult>(await _controller.Update(4, new UpdateEventDto(), _token));
        Assert.IsType<NotFoundResult>(await _controller.Update(9, new UpdateEventDto(), _token));

        _service.Setup(service => service.CancelAsync(4, _token)).ReturnsAsync(true);
        _service.Setup(service => service.CancelAsync(9, _token)).ReturnsAsync(false);
        Assert.IsType<NoContentResult>(await _controller.Cancel(4, _token));
        Assert.IsType<NotFoundResult>(await _controller.Cancel(9, _token));
    }
}
