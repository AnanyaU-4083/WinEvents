using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class AttendeeService(IAttendeeRepository attendeeRepository) : IAttendeeService
{
    public async Task<List<AttendeeResponseDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        List<Attendee> attendees = await attendeeRepository.GetAllAsync(cancellationToken);

        return attendees
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<AttendeeResponseDto?> GetByIdAsync(int attendeeId,CancellationToken cancellationToken)
    {
        Attendee? attendee =await attendeeRepository.GetByIdAsync(attendeeId,cancellationToken);

        return attendee is null
            ? null
            : MapToResponse(attendee);
    }

    public async Task<AttendeeResponseDto> CreateAsync(CreateAttendeeDto request,CancellationToken cancellationToken)
    {
        Attendee attendee = new()
        {
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Ticket = request.Ticket
        };

        Attendee createdAttendee = await attendeeRepository.AddAsync(attendee,cancellationToken);

        return MapToResponse(createdAttendee);
    }

    public async Task<bool> UpdateAsync(int attendeeId,UpdateAttendeeDto request,CancellationToken cancellationToken)
    {
        Attendee? attendee = await attendeeRepository.GetByIdAsync(attendeeId,cancellationToken);

        if (attendee is null)
        {
            return false;
        }

        if (request.Name is not null)
        {
            attendee.Name = request.Name;
        }

        if (request.Email is not null)
        {
            attendee.Email = request.Email;
        }

        if (request.Phone is not null)
        {
            attendee.Phone = request.Phone;
        }

        if (request.Ticket is not null)
        {
            attendee.Ticket = request.Ticket;
        }

        await attendeeRepository.UpdateAsync(attendee,cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(int attendeeId,CancellationToken cancellationToken)
    {
        Attendee? attendee = await attendeeRepository.GetByIdAsync(attendeeId,cancellationToken);

        if (attendee is null)
        {
            return false;
        }

        await attendeeRepository.DeleteAsync(attendee,cancellationToken);

        return true;
    }

    private static AttendeeResponseDto MapToResponse(Attendee attendee)
    {
        return new AttendeeResponseDto
        {
            AttendeeId = attendee.AttendeeId,
            Name = attendee.Name,
            Email = attendee.Email,
            Phone = attendee.Phone,
            Ticket = attendee.Ticket
        };
    }
}