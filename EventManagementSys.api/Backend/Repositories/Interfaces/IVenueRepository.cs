using EventManagementSys.api.Models;

namespace EventManagementSys.api.Repository.Interfaces;

public interface IVenueRepository
{
    Task<List<Venue>> GetAllAsync(CancellationToken cancellationToken);

    Task<Venue?> GetByIdAsync(int venueId,CancellationToken cancellationToken);

    Task<Venue> AddAsync(Venue venue,CancellationToken cancellationToken);

    Task<int> GetCurrentRegistrationsAsync(int venueId,int eventId,CancellationToken cancellationToken);
}