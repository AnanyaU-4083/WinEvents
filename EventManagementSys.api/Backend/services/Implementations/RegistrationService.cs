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
            if (!existingRegistration.IsCancelled)
            {
                throw new InvalidOperationException("The attendee is already registered for this event.");
            }

            existingRegistration.IsCancelled = false;
            existingRegistration.RegisteredTime = DateTime.UtcNow;
            await registrationRepository.UpdateAsync(existingRegistration, cancellationToken);

            return new RegistrationDto
            {
                EventId = existingRegistration.EventId,
                AttendeeId = existingRegistration.AttendeeId,
                RegisteredAt = existingRegistration.RegisteredTime
            };
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

    public async Task<bool> CancelCurrentUserRegistrationAsync(
        int eventId,
        string email,
        CancellationToken cancellationToken)
    {
        Attendee? attendee = await attendeeRepository.GetByUserEmailAsync(email, cancellationToken);

        if (attendee is null)
        {
            throw new KeyNotFoundException(
                "The logged-in Microsoft user is not connected to an attendee.");
        }

        EventAttendee? registration = await registrationRepository.GetAsync(
            eventId,
            attendee.AttendeeId,
            cancellationToken);

        if (registration is null)
        {
            return false;
        }

        if (!registration.IsCancelled)
        {
            registration.IsCancelled = true;
            await registrationRepository.UpdateAsync(registration, cancellationToken);
        }

        return true;
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
        .Select(registration => new EventResponseDto
        {
            EventId = registration.EventNavigation!.EventId,
            EventName = registration.EventNavigation.EventName,
            StartDate = DateTime.SpecifyKind(
                registration.EventNavigation.StartDate,
                DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(
                registration.EventNavigation.EndDate,
                DateTimeKind.Utc),
            Budget = registration.EventNavigation.Budget,
            EventType = registration.EventNavigation.EventType,
            Status = registration.EventNavigation.Status,
            VenueId = registration.EventNavigation.VenueId,
            OrgId = registration.EventNavigation.OrgId,
            IsRegistrationCancelled = registration.IsCancelled
        })
        .ToList();
}

    public async Task<List<ParticipantDto>> GetParticipantsAsync(int eventId,CancellationToken cancellationToken)
    {
        List<EventAttendee> registrations = await registrationRepository.GetByEventIdAsync(eventId,cancellationToken);

        return registrations
            .Where(r => !r.IsCancelled)
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
