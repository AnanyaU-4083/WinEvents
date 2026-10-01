using EventManagementSys.api.DTOs;

namespace EventManagementSys.api.Services.Interfaces;

public interface IRegistrationService
{
    Task<RegistrationDto> RegisterAsync(int eventId,int attendeeId,CancellationToken cancellationToken);

    Task<List<ParticipantDto>> GetParticipantsAsync(int eventId,CancellationToken cancellationToken);

    Task<bool> RemoveParticipantAsync(int eventId,int attendeeId,CancellationToken cancellationToken);
}