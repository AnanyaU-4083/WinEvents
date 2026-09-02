using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Repository.Implementations;

public class VenueRepository(
    AppDbContext dbContext) : IVenueRepository
{
    public async Task<List<Venue>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.Venues
            .ToListAsync(cancellationToken);
    }

    public async Task<Venue?> GetByIdAsync(
        int venueId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Venues
            .FirstOrDefaultAsync(
                venue => venue.VenueId == venueId,
                cancellationToken);
    }

    public async Task<Venue> AddAsync(
        Venue venue,
        CancellationToken cancellationToken)
    {
        await dbContext.Venues.AddAsync(
            venue,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return venue;
    }

    public async Task<int> GetCurrentRegistrationsAsync(
        int venueId,
        int eventId,
        CancellationToken cancellationToken)
    {
        return await dbContext.EventAttendees
            .CountAsync(
                registration =>
                    registration.EventNavigation != null &&
                    registration.EventNavigation.VenueId == venueId &&
                    registration.EventId == eventId,
                cancellationToken);
    }
}