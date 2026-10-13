using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using Moq;
using Xunit;
using EventEntity = EventManagementSys.api.Models.Event;

namespace EventManagementSys.api.Tests.Services;

public class EventServiceTests
{
    private readonly Mock<IEventRepository> _repository = new();
    private readonly EventService _service;
    private readonly CancellationToken _token = CancellationToken.None;

    public EventServiceTests() => _service = new EventService(_repository.Object);

    [Fact]
    public async Task GetAllMarksOnlyPastScheduledEventsCompletedAndSavesWhenChanged()
    {
        var events = new List<EventEntity>
        {
            new() { EventId = 1, EventName = "Past", EndDate = DateTime.UtcNow.AddDays(-1), Status = EventStatus.Scheduled },
            new() { EventId = 2, EventName = "Future", EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.Scheduled },
            new() { EventId = 3, EventName = "Cancelled", EndDate = DateTime.UtcNow.AddDays(-2), Status = EventStatus.Cancelled },
        };
        _repository.Setup(repository => repository.GetAllAsync(null, _token)).ReturnsAsync(events);

        List<EventResponseDto> result = await _service.GetAllAsync(null, _token);

        Assert.Equal(EventStatus.Completed, result[0].Status);
        Assert.Equal(EventStatus.Scheduled, result[1].Status);
        Assert.Equal(EventStatus.Cancelled, result[2].Status);
        Assert.Equal(DateTimeKind.Utc, result[0].EndDate.Kind);
        _repository.Verify(repository => repository.SaveChangesAsync(_token), Times.Once);
    }

    [Fact]
    public async Task GetAllDoesNotSaveWhenNoEventNeedsCompletion()
    {
        _repository.Setup(repository => repository.GetAllAsync(true, _token)).ReturnsAsync(
        [new EventEntity { EndDate = DateTime.UtcNow.AddDays(1), Status = EventStatus.Scheduled }]);

        await _service.GetAllAsync(true, _token);

        _repository.Verify(repository => repository.SaveChangesAsync(_token), Times.Never);
    }

    [Fact]
    public async Task GetByIdHandlesMissingActiveAndPastEvents()
    {
        _repository.Setup(repository => repository.GetByIdAsync(1, _token)).ReturnsAsync((EventEntity?)null);
        Assert.Null(await _service.GetByIdAsync(1, _token));

        var past = new EventEntity { EventId = 2, EndDate = DateTime.UtcNow.AddHours(-1), Status = EventStatus.Scheduled };
        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync(past);
        Assert.Equal(EventStatus.Completed, (await _service.GetByIdAsync(2, _token))!.Status);

        var active = new EventEntity { EventId = 3, EndDate = DateTime.UtcNow.AddHours(1), Status = EventStatus.Scheduled };
        _repository.Setup(repository => repository.GetByIdAsync(3, _token)).ReturnsAsync(active);
        Assert.Equal(EventStatus.Scheduled, (await _service.GetByIdAsync(3, _token))!.Status);
        _repository.Verify(repository => repository.SaveChangesAsync(_token), Times.Once);
    }

    [Fact]
    public async Task CreateMapsEventFields()
    {
        _repository.Setup(repository => repository.AddAsync(It.IsAny<EventEntity>(), _token))
            .Returns((EventEntity item, CancellationToken _) => Task.FromResult(item));
        DateTime start = DateTime.SpecifyKind(new DateTime(2026, 11, 2, 9, 0, 0), DateTimeKind.Unspecified);
        DateTime end = start.AddHours(2);

        EventResponseDto result = await _service.CreateAsync(new CreateEventDto
        {
            EventName = "Launch", StartDate = start, EndDate = end, VenueId = 4,
            Budget = 1000m, EventType = EventType.ProductLaunch, OrgId = 6,
        }, 9, _token);

        Assert.Equal("Launch", result.EventName);
        Assert.Equal(DateTimeKind.Utc, result.StartDate.Kind);
        Assert.Equal(4, result.VenueId);
        Assert.Equal(6, result.OrgId);
        _repository.Verify(repository => repository.AddAsync(It.Is<EventEntity>(item => item.EventName == "Launch" && item.Budget == 1000m), _token), Times.Once);
    }

    [Fact]
    public async Task UpdateReturnsFalseForMissingEventAndRejectsCancelledEvent()
    {
        _repository.Setup(repository => repository.GetByIdAsync(1, _token)).ReturnsAsync((EventEntity?)null);
        Assert.False(await _service.UpdateAsync(1, new UpdateEventDto(), _token));

        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync(new EventEntity { Status = EventStatus.Cancelled });
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateAsync(2, new UpdateEventDto(), _token));
        _repository.Verify(repository => repository.UpdateAsync(It.IsAny<EventEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAppliesEveryOptionalField()
    {
        var eventEntity = new EventEntity { EventId = 5, Status = EventStatus.Scheduled };
        _repository.Setup(repository => repository.GetByIdAsync(5, _token)).ReturnsAsync(eventEntity);
        DateTime start = DateTime.UtcNow.AddDays(2);
        DateTime end = start.AddHours(3);

        Assert.True(await _service.UpdateAsync(5, new UpdateEventDto
        {
            EventName = "Updated", StartDate = start, EndDate = end, Budget = 500m,
            EventType = EventType.Workshop, VenueId = 8, OrgId = 10,
        }, _token));

        Assert.Equal(("Updated", start, end, 500m, EventType.Workshop, 8, 10),
            (eventEntity.EventName, eventEntity.StartDate, eventEntity.EndDate, eventEntity.Budget, eventEntity.EventType, eventEntity.VenueId, eventEntity.OrgId));
        _repository.Verify(repository => repository.UpdateAsync(eventEntity, _token), Times.Once);
    }

    [Fact]
    public async Task UpdateAllowsAnEmptyPatchForNonCancelledEvent()
    {
        var eventEntity = new EventEntity { EventId = 5, EventName = "Same", Status = EventStatus.Completed };
        _repository.Setup(repository => repository.GetByIdAsync(5, _token)).ReturnsAsync(eventEntity);

        Assert.True(await _service.UpdateAsync(5, new UpdateEventDto(), _token));
        Assert.Equal("Same", eventEntity.EventName);
        _repository.Verify(repository => repository.UpdateAsync(eventEntity, _token), Times.Once);
    }

    [Fact]
    public async Task CancelHandlesMissingAlreadyCancelledAndCompletedEvents()
    {
        _repository.Setup(repository => repository.GetByIdAsync(1, _token)).ReturnsAsync((EventEntity?)null);
        Assert.False(await _service.CancelAsync(1, _token));
        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync(new EventEntity { Status = EventStatus.Cancelled });
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CancelAsync(2, _token));
        _repository.Setup(repository => repository.GetByIdAsync(3, _token)).ReturnsAsync(new EventEntity { Status = EventStatus.Completed });
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CancelAsync(3, _token));
        _repository.Verify(repository => repository.UpdateAsync(It.IsAny<EventEntity>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CancelMarksScheduledEventCancelled()
    {
        var eventEntity = new EventEntity { EventId = 9, Status = EventStatus.Scheduled };
        _repository.Setup(repository => repository.GetByIdAsync(9, _token)).ReturnsAsync(eventEntity);

        Assert.True(await _service.CancelAsync(9, _token));

        Assert.Equal(EventStatus.Cancelled, eventEntity.Status);
        _repository.Verify(repository => repository.UpdateAsync(eventEntity, _token), Times.Once);
    }
}
