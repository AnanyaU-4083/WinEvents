using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using Moq;
using Xunit;
using EventEntity = EventManagementSys.api.Models.Event;

namespace EventManagementSys.api.Tests.Services;

public class RegistrationServiceTests
{
    private readonly Mock<IRegistrationRepository> _registrations = new();
    private readonly Mock<IAttendeeRepository> _attendees = new();
    private readonly RegistrationService _service;
    private readonly CancellationToken _token = CancellationToken.None;

    public RegistrationServiceTests() => _service = new RegistrationService(_registrations.Object, _attendees.Object);

    [Fact]
    public async Task RegisterCreatesRegistrationAndRejectsDuplicates()
    {
        _registrations.Setup(repository => repository.GetAsync(5, 8, _token)).ReturnsAsync((EventAttendee?)null);
        _registrations.Setup(repository => repository.AddAsync(It.IsAny<EventAttendee>(), _token))
            .Returns((EventAttendee item, CancellationToken _) => Task.FromResult(item));

        var created = await _service.RegisterAsync(5, 8, _token);
        Assert.Equal((5, 8), (created.EventId, created.AttendeeId));
        Assert.NotEqual(default, created.RegisteredAt);

        _registrations.Setup(repository => repository.GetAsync(5, 8, _token)).ReturnsAsync(new EventAttendee());
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.RegisterAsync(5, 8, _token));
        _registrations.Verify(repository => repository.AddAsync(It.IsAny<EventAttendee>(), _token), Times.Once);
    }

    [Fact]
    public async Task RegisterCurrentUserRequiresMappedAttendee()
    {
        _attendees.Setup(repository => repository.GetByUserEmailAsync("missing@example.com", _token)).ReturnsAsync((Attendee?)null);
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.RegisterCurrentUserAsync(5, "missing@example.com", _token));

        _attendees.Setup(repository => repository.GetByUserEmailAsync("user@example.com", _token)).ReturnsAsync(new Attendee { AttendeeId = 8 });
        _registrations.Setup(repository => repository.GetAsync(5, 8, _token)).ReturnsAsync((EventAttendee?)null);
        _registrations.Setup(repository => repository.AddAsync(It.IsAny<EventAttendee>(), _token))
            .Returns((EventAttendee item, CancellationToken _) => Task.FromResult(item));
        Assert.Equal(8, (await _service.RegisterCurrentUserAsync(5, "user@example.com", _token)).AttendeeId);
    }

    [Fact]
    public async Task GetRegisteredEventsRequiresAttendeeAndSkipsMissingEventNavigation()
    {
        _attendees.Setup(repository => repository.GetByUserEmailAsync("missing@example.com", _token)).ReturnsAsync((Attendee?)null);
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GetRegisteredEventsAsync("missing@example.com", _token));

        _attendees.Setup(repository => repository.GetByUserEmailAsync("user@example.com", _token)).ReturnsAsync(new Attendee { AttendeeId = 8 });
        _registrations.Setup(repository => repository.GetByAttendeeIdAsync(8, _token)).ReturnsAsync(
        [
            new EventAttendee(),
            new EventAttendee { EventNavigation = new EventEntity { EventId = 5, EventName = "Meetup" } },
        ]);

        var events = await _service.GetRegisteredEventsAsync("user@example.com", _token);
        Assert.Equal("Meetup", Assert.Single(events).EventName);
    }

    [Fact]
    public async Task GetParticipantsSkipsRegistrationsWithoutAttendeeNavigation()
    {
        _registrations.Setup(repository => repository.GetByEventIdAsync(5, _token)).ReturnsAsync(
        [
            new EventAttendee(),
            new EventAttendee { AttendeeNavigation = new Attendee { AttendeeId = 8, Name = "Mina", Email = "mina@example.com", Phone = "123", Ticket = "VIP" } },
        ]);

        var participants = await _service.GetParticipantsAsync(5, _token);
        var participant = Assert.Single(participants);
        Assert.Equal((8, "Mina", "VIP"), (participant.AttendeeId, participant.Name, participant.Ticket));
    }

    [Fact]
    public async Task RemoveParticipantReturnsFalseWhenMissingAndDeletesWhenPresent()
    {
        var registration = new EventAttendee { EventId = 5, AttendeeId = 8 };
        _registrations.SetupSequence(repository => repository.GetAsync(5, 8, _token)).ReturnsAsync((EventAttendee?)null).ReturnsAsync(registration);

        Assert.False(await _service.RemoveParticipantAsync(5, 8, _token));
        Assert.True(await _service.RemoveParticipantAsync(5, 8, _token));
        _registrations.Verify(repository => repository.DeleteAsync(registration, _token), Times.Once);
    }
}
