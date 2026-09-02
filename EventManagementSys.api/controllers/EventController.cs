using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/events")]
public class EventController(IEventService eventService) : ControllerBase
{
    [HttpGet] // Get all events
    public async Task<ActionResult<List<EventResponseDto>>> GetAll(
        bool upcomingOnly,
        CancellationToken cancellationToken)
    {
        List<EventResponseDto> events =
            await eventService.GetAllAsync(
                upcomingOnly,
                cancellationToken);

        return Ok(events);
    }

    [HttpGet("{eventId:int}")] // Get event by ID
    public async Task<ActionResult<EventResponseDto>> GetById(
        int eventId,
        CancellationToken cancellationToken)
    {
        EventResponseDto? eventItem =
            await eventService.GetByIdAsync(
                eventId,
                cancellationToken);

        if (eventItem is null)
        {
            return NotFound();
        }

        return Ok(eventItem);
    }

    [HttpPost] // Create event
    public async Task<ActionResult<EventResponseDto>> Create(
        CreateEventDto request,
        CancellationToken cancellationToken)
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

    [HttpPut("{eventId:int}")] // Update event
    public async Task<IActionResult> Update(
        int eventId,
        UpdateEventDto request,
        CancellationToken cancellationToken)
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

    [HttpDelete("{eventId:int}")] // Delete event
    public async Task<IActionResult> Delete(
        int eventId,
        CancellationToken cancellationToken)
    {
        bool deleted =
            await eventService.DeleteAsync(
                eventId,
                cancellationToken);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}