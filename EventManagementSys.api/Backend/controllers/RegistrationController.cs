using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/events")]
public class RegistrationController(IRegistrationService registrationService) : ControllerBase
{
    [HttpPost("{eventId:int}/attendees/{attendeeId:int}")] 
    //[Authorize(Roles = "Admin,Employee,Attendee")]
    public async Task<ActionResult<RegistrationDto>> Register(int eventId,int attendeeId,CancellationToken cancellationToken)
    {
        RegistrationDto registration =
            await registrationService.RegisterAsync(
                eventId,
                attendeeId,
                cancellationToken);

        return Ok(registration);
    }

    [HttpGet("{eventId:int}/attendees")] 
    //[Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<List<ParticipantDto>>> GetParticipants(int eventId,CancellationToken cancellationToken)
    {
        List<ParticipantDto> participants =
            await registrationService.GetParticipantsAsync(
                eventId,
                cancellationToken);

        return Ok(participants);
    }

    [HttpDelete("{eventId:int}/attendees/{attendeeId:int}")] 
    //[Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> RemoveParticipant(int eventId,int attendeeId,CancellationToken cancellationToken)
    {
        bool removed =
            await registrationService.RemoveParticipantAsync(
                eventId,
                attendeeId,
                cancellationToken);

        if (!removed)
        {
            return NotFound();
        }

        return NoContent();
    }
}