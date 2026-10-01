using EventManagementSys.api.Models;

namespace EventManagementSys.api.Repository.Interfaces;

public interface IRegistrationRepository
{
    Task<EventAttendee?> GetAsync(int eventId,int attendeeId,CancellationToken cancellationToken);

    Task<List<EventAttendee>> GetByEventIdAsync(int eventId,CancellationToken cancellationToken);

    Task<EventAttendee> AddAsync(EventAttendee registration,CancellationToken cancellationToken);

    Task DeleteAsync(EventAttendee registration,CancellationToken cancellationToken);
}