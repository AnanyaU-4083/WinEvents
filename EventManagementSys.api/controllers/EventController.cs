using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/events")]
public class EventController(IEventService eventService) : ControllerBase
{
    [HttpGet] 
    [AllowAnonymous]
    public async Task<ActionResult<List<EventResponseDto>>> GetAll(bool? upcomingOnly,CancellationToken cancellationToken)
    {
        List<EventResponseDto> events =
            await eventService.GetAllAsync(upcomingOnly, cancellationToken);

        return Ok(events);
    }

    [HttpGet("{eventId:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<EventResponseDto>> GetById(int eventId,CancellationToken cancellationToken)
    {
        EventResponseDto? eventItem =
            await eventService.GetByIdAsync(eventId, cancellationToken);

        if (eventItem is null)
        {
            return NotFound();
        }

        return Ok(eventItem);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<EventResponseDto>> Create(CreateEventDto request,CancellationToken cancellationToken)
    {
        EventResponseDto eventItem =
            await eventService.CreateAsync(
                request,
                null,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { eventId = eventItem.EventId },
            eventItem);
    }

    [HttpPut("{eventId:int}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Update(int eventId,UpdateEventDto request,CancellationToken cancellationToken)
    {
        bool updated =
            await eventService.UpdateAsync(
                eventId,
                request,
                cancellationToken);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPatch("{eventId:int}/cancel")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Cancel(
        int eventId,
        CancellationToken cancellationToken)
    {
        bool cancelled =
            await eventService.CancelAsync(
                eventId,
                cancellationToken);

        if (!cancelled)
        {
            return NotFound();
        }

        return NoContent();
    }
}