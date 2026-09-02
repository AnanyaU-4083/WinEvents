using EventManagementSys.api.DTOs;

namespace EventManagementSys.api.Services.Interfaces;

public interface IStaffingService
{
    Task<StaffDto> AssignAsync(
        int eventId,
        AssignStaffDto request,
        CancellationToken cancellationToken);

    Task<List<StaffDto>> GetStaffAsync(
        int eventId,
        CancellationToken cancellationToken);

    Task<bool> UpdateAsync(
        int eventId,
        int employeeId,
        UpdateStaffDto request,
        CancellationToken cancellationToken);

    Task<bool> RemoveAsync(
        int eventId,
        int employeeId,
        CancellationToken cancellationToken);
}