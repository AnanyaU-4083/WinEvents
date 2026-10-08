using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/attendees")]
public class AttendeeController(IAttendeeService attendeeService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<List<AttendeeResponseDto>>> GetAll(CancellationToken cancellationToken)
    {
        List<AttendeeResponseDto> attendees =
            await attendeeService.GetAllAsync(cancellationToken);

        return Ok(attendees);
    }

    [HttpGet("{attendeeId:int}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<AttendeeResponseDto>> GetById(int attendeeId,CancellationToken cancellationToken)
    {
        AttendeeResponseDto? attendee =
            await attendeeService.GetByIdAsync(
                attendeeId,
                cancellationToken);

        if (attendee is null)
            return NotFound();

        return Ok(attendee);
    }

    [HttpGet("me")]
[Authorize(Roles = "Attendee")]
public async Task<ActionResult<AttendeeResponseDto>> GetMe(
    CancellationToken cancellationToken)
{
    string? email =
        User.FindFirst("preferred_username")?.Value
        ?? User.FindFirst("email")?.Value;

    if (string.IsNullOrWhiteSpace(email))
    {
        return Unauthorized();
    }

    AttendeeResponseDto? attendee =
        await attendeeService.GetMeAsync(
            email,
            cancellationToken);

    if (attendee is null)
    {
        return NotFound(
            "No attendee record was found for the logged-in Microsoft account.");
    }

    return Ok(attendee);
}

    [HttpPost]
    [Authorize(Roles = "Admin,Employee")] // Admin and Employee
    public async Task<ActionResult<AttendeeResponseDto>> Create(CreateAttendeeDto request,CancellationToken cancellationToken)
    {
        AttendeeResponseDto attendee =
            await attendeeService.CreateAsync(
                request,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { attendeeId = attendee.AttendeeId },
            attendee);
    }

    [HttpPut("{attendeeId:int}")]
    [Authorize(Roles = "Admin,Employee")] 
    public async Task<IActionResult> Update(int attendeeId,UpdateAttendeeDto request,CancellationToken cancellationToken)
    {
        bool updated =
            await attendeeService.UpdateAsync(
                attendeeId,
                request,
                cancellationToken);

        if (!updated)
            return NotFound();

        return NoContent();
    }

    [HttpDelete("{attendeeId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int attendeeId,CancellationToken cancellationToken)
    {
        bool deleted =
            await attendeeService.DeleteAsync(
                attendeeId,
                cancellationToken);

        if (!deleted)
            return NotFound();

        return NoContent();
    }
}