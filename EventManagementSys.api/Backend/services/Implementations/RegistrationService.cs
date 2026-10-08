using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class RegistrationService(IRegistrationRepository registrationRepository,IAttendeeRepository attendeeRepository) : IRegistrationService
{
    public async Task<RegistrationDto> RegisterAsync(int eventId,int attendeeId,CancellationToken cancellationToken)
    {
        EventAttendee? existingRegistration = await registrationRepository.GetAsync(eventId,attendeeId,cancellationToken);

        if (existingRegistration is not null)
        {
            throw new InvalidOperationException("The attendee is already registered for this event.");
        }

        EventAttendee registration = new()
        {
            EventId = eventId,
            AttendeeId = attendeeId,
            RegisteredTime = DateTime.UtcNow
        };

        EventAttendee createdRegistration = await registrationRepository.AddAsync(registration,cancellationToken);

        return new RegistrationDto
        {
            EventId = createdRegistration.EventId,
            AttendeeId = createdRegistration.AttendeeId,
            RegisteredAt = createdRegistration.RegisteredTime
        };
    }

    public async Task<RegistrationDto> RegisterCurrentUserAsync(
    int eventId,
    string email,
    CancellationToken cancellationToken)
{
    Attendee? attendee =
        await attendeeRepository.GetByUserEmailAsync(
            email,
            cancellationToken);

    if (attendee is null)
    {
        throw new KeyNotFoundException(
            "The logged-in Microsoft user is not connected to an attendee.");
    }

    return await RegisterAsync(
        eventId,
        attendee.AttendeeId,
        cancellationToken);
}

    public async Task<List<EventResponseDto>> GetRegisteredEventsAsync(
    string email,
    CancellationToken cancellationToken)
{
    Attendee? attendee =
        await attendeeRepository.GetByUserEmailAsync(
            email,
            cancellationToken);

    if (attendee is null)
    {
        throw new KeyNotFoundException(
            "The logged-in Microsoft user is not connected to an attendee.");
    }

    List<EventAttendee> registrations =
        await registrationRepository.GetByAttendeeIdAsync(
            attendee.AttendeeId,
            cancellationToken);

    return registrations
        .Where(registration => registration.EventNavigation is not null)
        .Select(registration => registration.EventNavigation!)
        .Select(eventItem => new EventResponseDto
        {
            EventId = eventItem.EventId,
            EventName = eventItem.EventName,
            StartDate = eventItem.StartDate,
            EndDate = eventItem.EndDate,
            Budget = eventItem.Budget,
            EventType = eventItem.EventType,
            Status = eventItem.Status,
            VenueId = eventItem.VenueId,
            OrgId = eventItem.OrgId
        })
        .ToList();
}

    public async Task<List<ParticipantDto>> GetParticipantsAsync(int eventId,CancellationToken cancellationToken)
    {
        List<EventAttendee> registrations = await registrationRepository.GetByEventIdAsync(eventId,cancellationToken);

        return registrations
            .Where(r => r.AttendeeNavigation is not null)
            .Select(r => new ParticipantDto
            {
                AttendeeId = r.AttendeeNavigation!.AttendeeId,
                Name = r.AttendeeNavigation.Name,
                Email = r.AttendeeNavigation.Email,
                Phone = r.AttendeeNavigation.Phone,
                Ticket = r.AttendeeNavigation.Ticket
            }).ToList();
    }

    public async Task<bool> RemoveParticipantAsync(int eventId,int attendeeId,CancellationToken cancellationToken)
    {
        EventAttendee? registration = await registrationRepository.GetAsync(eventId,attendeeId,cancellationToken);

        if (registration is null)
        {
            return false;
        }

        await registrationRepository.DeleteAsync(registration,cancellationToken);

        return true;
    }
}