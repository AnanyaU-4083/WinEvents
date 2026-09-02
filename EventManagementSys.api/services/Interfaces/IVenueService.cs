using EventManagementSys.api.DTOs;

namespace EventManagementSys.api.Services.Interfaces;

public interface IVenueService
{
    Task<List<VenueResponseDto>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<VenueResponseDto> CreateAsync(
        CreateVenueDto request,
        CancellationToken cancellationToken);

    Task<VenueAvailabilityDto?> GetAvailabilityAsync(
        int venueId,
        int eventId,
        CancellationToken cancellationToken);
}