using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;
using EventEntity = EventManagementSys.api.Models.Event;

namespace EventManagementSys.api.Tests.Repositories;

public class VenueRepositoryTests : SqliteRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Fact]
    public async Task VenueCrudAndCurrentRegistrationCountAreCorrect()
    {
        var repository = new VenueRepository(Context);
        var venue = await repository.AddAsync(new Venue { Address = "Town Hall", Capacity = 80 }, _token);
        var otherVenue = await repository.AddAsync(new Venue { Address = "Library", Capacity = 30 }, _token);
        var eventAtVenue = new EventEntity { EventName = "Meetup", VenueId = venue.VenueId };
        var eventAtOtherVenue = new EventEntity { EventName = "Workshop", VenueId = otherVenue.VenueId };
        var attendee = new Attendee { Name = "Asha", Email = "asha@example.com" };
        Context.Events.AddRange(eventAtVenue, eventAtOtherVenue);
        Context.Attendees.Add(attendee);
        await Context.SaveChangesAsync(_token);
        Context.EventAttendees.AddRange(
            new EventAttendee { EventId = eventAtVenue.EventId, AttendeeId = attendee.AttendeeId },
            new EventAttendee { EventId = eventAtOtherVenue.EventId, AttendeeId = attendee.AttendeeId });
        await Context.SaveChangesAsync(_token);

        Assert.Equal("Town Hall", (await repository.GetByIdAsync(venue.VenueId, _token))!.Address);
        Assert.Null(await repository.GetByIdAsync(-1, _token));
        Assert.Equal(2, (await repository.GetAllAsync(_token)).Count);
        Assert.Equal(1, await repository.GetCurrentRegistrationsAsync(venue.VenueId, eventAtVenue.EventId, _token));
        Assert.Equal(0, await repository.GetCurrentRegistrationsAsync(venue.VenueId, -1, _token));
    }
}
