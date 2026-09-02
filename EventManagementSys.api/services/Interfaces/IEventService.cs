using EventManagementSys.api.DTOs;

namespace EventManagementSys.api.Services.Interfaces;

public interface IEventService
{
    Task<List<EventResponseDto>> GetAllAsync(
        bool upcomingOnly,
        CancellationToken cancellationToken);

    Task<EventResponseDto?> GetByIdAsync(
        int eventId,
        CancellationToken cancellationToken);

    Task<EventResponseDto> CreateAsync(
        CreateEventDto request,
        int? createdByUserId,
        CancellationToken cancellationToken);

    Task<bool> UpdateAsync(
        int eventId,
        UpdateEventDto request,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(
        int eventId,
        CancellationToken cancellationToken);
}