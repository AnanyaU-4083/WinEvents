using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class RegistrationService(
    IRegistrationRepository registrationRepository) : IRegistrationService
{
    public async Task<RegistrationDto> RegisterAsync(
        int eventId,
        int attendeeId,
        CancellationToken cancellationToken)
    {
        EventAttendee? existingRegistration =
            await registrationRepository.GetAsync(
                eventId,
                attendeeId,
                cancellationToken);

        if (existingRegistration is not null)
        {
            throw new InvalidOperationException(
                "The attendee is already registered for this event.");
        }

        EventAttendee registration = new()
        {
            EventId = eventId,
            AttendeeId = attendeeId,
            RegisteredTime = DateTime.UtcNow
        };

        EventAttendee createdRegistration =
            await registrationRepository.AddAsync(
                registration,
                cancellationToken);

        return new RegistrationDto
        {
            EventId = createdRegistration.EventId,
            AttendeeId = createdRegistration.AttendeeId,
            RegisteredAt = createdRegistration.RegisteredTime
        };
    }

    public async Task<List<ParticipantDto>> GetParticipantsAsync(
        int eventId,
        CancellationToken cancellationToken)
    {
        List<EventAttendee> registrations =
            await registrationRepository.GetByEventIdAsync(
                eventId,
                cancellationToken);

        return registrations
            .Where(r => r.AttendeeNavigation is not null)
            .Select(r => new ParticipantDto
            {
                AttendeeId = r.AttendeeNavigation!.AttendeeId,
                Name = r.AttendeeNavigation.Name,
                Email = r.AttendeeNavigation.Email,
                Phone = r.AttendeeNavigation.Phone,
                Ticket = r.AttendeeNavigation.Ticket
            })
            .ToList();
    }

    public async Task<bool> RemoveParticipantAsync(
        int eventId,
        int attendeeId,
        CancellationToken cancellationToken)
    {
        EventAttendee? registration =
            await registrationRepository.GetAsync(
                eventId,
                attendeeId,
                cancellationToken);

        if (registration is null)
        {
            return false;
        }

        await registrationRepository.DeleteAsync(
            registration,
            cancellationToken);

        return true;
    }
}