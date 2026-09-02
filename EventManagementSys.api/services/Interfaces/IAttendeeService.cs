using EventManagementSys.api.DTOs;

namespace EventManagementSys.api.Services.Interfaces;

public interface IAttendeeService
{
    Task<List<AttendeeResponseDto>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<AttendeeResponseDto?> GetByIdAsync(
        int attendeeId,
        CancellationToken cancellationToken);

    Task<AttendeeResponseDto> CreateAsync(
        CreateAttendeeDto request,
        CancellationToken cancellationToken);

    Task<bool> UpdateAsync(
        int attendeeId,
        UpdateAttendeeDto request,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(
        int attendeeId,
        CancellationToken cancellationToken);
}