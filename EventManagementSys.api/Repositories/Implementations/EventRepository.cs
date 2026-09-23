using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Repository.Implementations;

public class EventRepository(AppDbContext dbContext) : IEventRepository
{
    public async Task<List<Event>> GetAllAsync(bool? upcomingOnly,CancellationToken cancellationToken)
    {
        IQueryable<Event> query = dbContext.Events;

        if (upcomingOnly == true)
        {
            query = query.Where(eventItem =>
                eventItem.StartDate >= DateTime.UtcNow&&
        eventItem.Status != EventStatus.Cancelled);
        }
        else if (upcomingOnly == false)
        {
            query = query.Where(eventItem => eventItem.EndDate < DateTime.UtcNow&&
        eventItem.Status != EventStatus.Cancelled);
        }

        return await query
            .Include(eventItem => eventItem.VenueNavigation)
            .ToListAsync(cancellationToken);
    }

    public async Task<Event?> GetByIdAsync(int eventId,CancellationToken cancellationToken)
    {
        return await dbContext.Events
            .Include(eventItem => eventItem.VenueNavigation)
            .FirstOrDefaultAsync(eventItem => eventItem.EventId == eventId,cancellationToken);
    }

    public async Task<Event> AddAsync(Event eventItem,CancellationToken cancellationToken)
    {
        await dbContext.Events.AddAsync(eventItem,cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return eventItem;
    }

    public async Task UpdateAsync(Event eventItem,CancellationToken cancellationToken)
    {
        dbContext.Events.Update(eventItem);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    
}