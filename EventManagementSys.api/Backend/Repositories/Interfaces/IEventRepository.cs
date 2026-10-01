using EventManagementSys.api.Models;

namespace EventManagementSys.api.Repository.Interfaces;

public interface IEventRepository
{
    Task<List<Event>> GetAllAsync(bool? upcomingOnly,CancellationToken cancellationToken);

    Task<Event?> GetByIdAsync(int eventId,CancellationToken cancellationToken);

    Task<Event> AddAsync(Event eventItem,CancellationToken cancellationToken);

    Task UpdateAsync(Event eventItem,CancellationToken cancellationToken);

    Task SaveChangesAsync(
        CancellationToken cancellationToken);

    
}