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

    Task<List<StaffDto>> GetTasksByEmployeeIdAsync(
        int employeeId,
        CancellationToken cancellationToken);

    Task<List<StaffDto>> GetTasksByEmployeeEmailAsync(
        string email,
        CancellationToken cancellationToken);

    Task<bool> UpdateAsync(
        int assignmentId,
        UpdateStaffDto request,
        CancellationToken cancellationToken);

    Task<bool> RemoveAsync(
        int assignmentId,
        CancellationToken cancellationToken);
}