using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Repository.Implementations;

public class RegistrationRepository(AppDbContext dbContext) : IRegistrationRepository
{
    public async Task<EventAttendee?> GetAsync(int eventId,int attendeeId,CancellationToken cancellationToken)
    {
        return await dbContext.EventAttendees
            .Include(registration => registration.AttendeeNavigation)
            .FirstOrDefaultAsync(
                registration =>
                    registration.EventId == eventId &&
                    registration.AttendeeId == attendeeId,
                cancellationToken);
    }

    public async Task<List<EventAttendee>> GetByEventIdAsync(int eventId,CancellationToken cancellationToken)
    {
        return await dbContext.EventAttendees
            .Include(registration => registration.AttendeeNavigation)
            .Where(registration => registration.EventId == eventId)
            .ToListAsync(cancellationToken);
    }

    public async Task<EventAttendee> AddAsync(EventAttendee registration,CancellationToken cancellationToken)
    {
        await dbContext.EventAttendees.AddAsync(
            registration,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return registration;
    }

    public async Task DeleteAsync(EventAttendee registration,CancellationToken cancellationToken)
    {
        dbContext.EventAttendees.Remove(registration);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}