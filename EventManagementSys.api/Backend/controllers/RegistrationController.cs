using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/events")]
public class RegistrationController(
    IRegistrationService registrationService
) : ControllerBase
{
    [HttpPost("{eventId:int}/attendees/{attendeeId:int}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<RegistrationDto>> Register(
        int eventId,
        int attendeeId,
        CancellationToken cancellationToken)
    {
        RegistrationDto registration =
            await registrationService.RegisterAsync(
                eventId,
                attendeeId,
                cancellationToken);

        return Ok(registration);
    }

    [HttpPost("{eventId:int}/register")]
    [Authorize(Roles = "Attendee")]
    public async Task<ActionResult<RegistrationDto>> RegisterCurrentUser(
        int eventId,
        CancellationToken cancellationToken)
    {
        string? email =
            User.FindFirst(
                System.Security.Claims.ClaimTypes.Email)?.Value
            ?? User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst(
                System.Security.Claims.ClaimTypes.Upn)?.Value
            ?? User.FindFirst(
                System.Security.Claims.ClaimTypes.Name)?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized(
                "Unable to determine the logged-in user's email.");
        }

        RegistrationDto registration =
            await registrationService.RegisterCurrentUserAsync(
                eventId,
                email,
                cancellationToken);

        return Ok(registration);
    }

    [HttpGet("my-registrations")]
    [Authorize(Roles = "Attendee")]
    public async Task<ActionResult<List<EventResponseDto>>> GetMyRegistrations(
        CancellationToken cancellationToken)
    {
        string? email =
            User.FindFirst(
                System.Security.Claims.ClaimTypes.Email)?.Value
            ?? User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst(
                System.Security.Claims.ClaimTypes.Upn)?.Value
            ?? User.FindFirst(
                System.Security.Claims.ClaimTypes.Name)?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized(
                "Unable to determine the logged-in user's email.");
        }

        List<EventResponseDto> events =
            await registrationService.GetRegisteredEventsAsync(
                email,
                cancellationToken);

        return Ok(events);
    }

    [HttpGet("{eventId:int}/attendees")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<List<ParticipantDto>>> GetParticipants(
        int eventId,
        CancellationToken cancellationToken)
    {
        List<ParticipantDto> participants =
            await registrationService.GetParticipantsAsync(
                eventId,
                cancellationToken);

        return Ok(participants);
    }

    [HttpDelete("{eventId:int}/attendees/{attendeeId:int}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> RemoveParticipant(
        int eventId,
        int attendeeId,
        CancellationToken cancellationToken)
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