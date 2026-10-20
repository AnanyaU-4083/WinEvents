using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class VenueService(IVenueRepository venueRepository) : IVenueService
{
    public async Task<List<VenueResponseDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        List<Venue> venues = await venueRepository.GetAllAsync(cancellationToken);
        return venues.Select(MapToResponse).ToList();
    }

    public async Task<VenueResponseDto?> GetByIdAsync(int venueId, CancellationToken cancellationToken)
    {
        Venue? venue = await venueRepository.GetByIdAsync(venueId, cancellationToken);
        return venue is null ? null : MapToResponse(venue);
    }

    public async Task<VenueResponseDto> CreateAsync(CreateVenueDto request, CancellationToken cancellationToken)
    {
        Venue venue = new()
        {
            Address = request.Address,
            Capacity = request.Capacity
        };

        Venue createdVenue = await venueRepository.AddAsync(venue, cancellationToken);
        return MapToResponse(createdVenue);
    }

    public async Task<bool> UpdateAsync(int venueId, UpdateVenueDto request, CancellationToken cancellationToken)
    {
        Venue? venue = await venueRepository.GetByIdAsync(venueId, cancellationToken);
        if (venue is null)
        {
            return false;
        }

        if (request.Address is not null)
        {
            venue.Address = request.Address;
        }

        if (request.Capacity is not null)
        {
            venue.Capacity = request.Capacity.Value;
        }

        await venueRepository.UpdateAsync(venue, cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int venueId, CancellationToken cancellationToken)
    {
        Venue? venue = await venueRepository.GetByIdAsync(venueId, cancellationToken);
        if (venue is null)
        {
            return false;
        }

        await venueRepository.DeleteAsync(venue, cancellationToken);
        return true;
    }

    public async Task<VenueAvailabilityDto?> GetAvailabilityAsync(int venueId, int eventId, CancellationToken cancellationToken)
    {
        Venue? venue = await venueRepository.GetByIdAsync(venueId, cancellationToken);
        if (venue is null)
        {
            return null;
        }

        int currentRegistrations = await venueRepository.GetCurrentRegistrationsAsync(venueId, eventId, cancellationToken);
        int seatsRemaining = Math.Max(0, venue.Capacity - currentRegistrations);

        return new VenueAvailabilityDto
        {
            Capacity = venue.Capacity,
            CurrentRegistrations = currentRegistrations,
            SeatsRemaining = seatsRemaining
        };
    }

    private static VenueResponseDto MapToResponse(Venue venue)
    {
        return new VenueResponseDto
        {
            VenueId = venue.VenueId,
            Address = venue.Address,
            Capacity = venue.Capacity
        };
    }
}