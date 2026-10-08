using EventManagementSys.api.Models;

namespace EventManagementSys.api.Repository.Interfaces;

public interface IStaffingRepository
{
    Task<EventEmployee?> GetAsync(
        int eventId,
        int employeeId,
        CancellationToken cancellationToken);

    Task<List<EventEmployee>> GetByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken);

    Task<List<EventEmployee>> GetByEmployeeIdAsync(
        int employeeId,
        CancellationToken cancellationToken);

    Task<List<EventEmployee>> GetByEmployeeEmailAsync(
        string email,
        CancellationToken cancellationToken);

    Task<EventEmployee> AddAsync(
        EventEmployee assignment,
        CancellationToken cancellationToken);

    Task UpdateAsync(
        EventEmployee assignment,
        CancellationToken cancellationToken);

    Task DeleteAsync(
        EventEmployee assignment,
        CancellationToken cancellationToken);
}