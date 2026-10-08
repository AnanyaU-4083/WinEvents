using EventManagementSys.api.Models;

namespace EventManagementSys.api.Repository.Interfaces;

public interface IAttendeeRepository
{
    Task<List<Attendee>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<Attendee?> GetByIdAsync(
        int attendeeId,
        CancellationToken cancellationToken);

    Task<Attendee?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken);

    Task<Attendee?> GetByUserEmailAsync(
        string email,
        CancellationToken cancellationToken);

    Task<Attendee> AddAsync(
        Attendee attendee,
        CancellationToken cancellationToken);

    Task UpdateAsync(
        Attendee attendee,
        CancellationToken cancellationToken);

    Task DeleteAsync(
        Attendee attendee,
        CancellationToken cancellationToken);
}