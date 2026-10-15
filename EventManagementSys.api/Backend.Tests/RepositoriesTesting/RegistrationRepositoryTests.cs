using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;
using EventEntity = EventManagementSys.api.Models.Event;

namespace EventManagementSys.api.Tests.Repositories;

public class RegistrationRepositoryTests : UnitRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Fact]
    public async Task RegistrationQueriesLoadExpectedNavigationPropertiesAndDelete()
    {
        var repository = new RegistrationRepository(Context);
        var eventEntity = new EventEntity { EventName = "Community Day", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddHours(2) };
        var attendee = new Attendee { Name = "Asha", Email = "asha@example.com", Ticket = "VIP" };
        Context.Events.Add(eventEntity);
        Context.Attendees.Add(attendee);
        await Context.SaveChangesAsync(_token);
        var registration = await repository.AddAsync(new EventAttendee
        {
            EventId = eventEntity.EventId,
            AttendeeId = attendee.AttendeeId,
            RegisteredTime = DateTime.UtcNow,
            EventNavigation = eventEntity,
            AttendeeNavigation = attendee,
        }, _token);

        var found = await repository.GetAsync(eventEntity.EventId, attendee.AttendeeId, _token);
        Assert.Equal("Asha", found!.AttendeeNavigation!.Name);
        Assert.Single(await repository.GetByEventIdAsync(eventEntity.EventId, _token));
        var attendeeRegistrations = await repository.GetByAttendeeIdAsync(attendee.AttendeeId, _token);
        Assert.Equal("Community Day", Assert.Single(attendeeRegistrations).EventNavigation!.EventName);
        Assert.Null(await repository.GetAsync(-1, attendee.AttendeeId, _token));

        registration.IsCancelled = true;
        await repository.UpdateAsync(registration, _token);
        Assert.True((await repository.GetAsync(eventEntity.EventId, attendee.AttendeeId, _token))!.IsCancelled);

        await repository.DeleteAsync(registration, _token);
        Assert.Empty(await repository.GetByEventIdAsync(eventEntity.EventId, _token));
    }
}
