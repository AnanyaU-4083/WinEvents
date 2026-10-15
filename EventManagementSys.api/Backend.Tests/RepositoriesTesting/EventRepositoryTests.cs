using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;
using EventEntity = EventManagementSys.api.Models.Event;

namespace EventManagementSys.api.Tests.Repositories;

public class EventRepositoryTests : UnitRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Fact]
    public async Task GetAllAppliesUpcomingAndPastFiltersAndIncludesVenue()
    {
        var repository = new EventRepository(Context);
        var venue = new Venue { Address = "Town Hall", Capacity = 100 };
        Context.Venues.Add(venue);
        await Context.SaveChangesAsync(_token);
        DateTime now = DateTime.UtcNow;
        Context.Events.AddRange(
            new EventEntity { EventName = "Upcoming", StartDate = now.AddDays(1), EndDate = now.AddDays(1).AddHours(1), VenueId = venue.VenueId, VenueNavigation = venue, Status = EventStatus.Scheduled },
            new EventEntity { EventName = "Upcoming cancelled", StartDate = now.AddDays(2), EndDate = now.AddDays(2).AddHours(1), Status = EventStatus.Cancelled },
            new EventEntity { EventName = "Past", StartDate = now.AddDays(-2), EndDate = now.AddDays(-1), Status = EventStatus.Completed },
            new EventEntity { EventName = "Past cancelled", StartDate = now.AddDays(-3), EndDate = now.AddDays(-2), Status = EventStatus.Cancelled });
        await Context.SaveChangesAsync(_token);

        var upcoming = await repository.GetAllAsync(true, _token);
        var past = await repository.GetAllAsync(false, _token);
        var all = await repository.GetAllAsync(null, _token);

        Assert.Equal("Upcoming", Assert.Single(upcoming).EventName);
        Assert.Equal("Town Hall", upcoming[0].VenueNavigation!.Address);
        Assert.Equal("Past", Assert.Single(past).EventName);
        Assert.Equal(4, all.Count);
    }

    [Fact]
    public async Task EventCrudAndSaveChangesPersistValues()
    {
        var repository = new EventRepository(Context);
        var venue = new Venue { Address = "Hall", Capacity = 40 };
        Context.Venues.Add(venue);
        await Context.SaveChangesAsync(_token);
        var eventEntity = await repository.AddAsync(new EventEntity
        {
            EventName = "Original", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddHours(2), VenueId = venue.VenueId, VenueNavigation = venue,
        }, _token);

        Assert.True(eventEntity.EventId > 0);
        Assert.Equal("Hall", (await repository.GetByIdAsync(eventEntity.EventId, _token))!.VenueNavigation!.Address);
        Assert.Null(await repository.GetByIdAsync(-1, _token));

        eventEntity.EventName = "Updated";
        await repository.UpdateAsync(eventEntity, _token);
        Assert.Equal("Updated", (await repository.GetByIdAsync(eventEntity.EventId, _token))!.EventName);

        eventEntity.Budget = 250m;
        await repository.SaveChangesAsync(_token);
        Assert.Equal(250m, (await repository.GetByIdAsync(eventEntity.EventId, _token))!.Budget);
    }
}
