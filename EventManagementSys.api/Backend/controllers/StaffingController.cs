using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/events")]
public class StaffingController(IStaffingService staffingService) : ControllerBase
{
    [HttpPost("{eventId:int}/staff")] 
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<StaffDto>> Assign(int eventId,AssignStaffDto request,CancellationToken cancellationToken)
    {
        StaffDto staff =
            await staffingService.AssignAsync(
                eventId,
                request,
                cancellationToken);

        return Ok(staff);
    }

    [HttpGet("{eventId:int}/staff")] 
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<List<StaffDto>>> GetStaff(int eventId,CancellationToken cancellationToken)
    {
        List<StaffDto> staff =
            await staffingService.GetStaffAsync(
                eventId,
                cancellationToken);

        return Ok(staff);
    }

    [HttpPut("{eventId:int}/staff/{employeeId:int}")] 
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Update(int eventId,int employeeId,UpdateStaffDto request,CancellationToken cancellationToken)
    {
        bool updated =
            await staffingService.UpdateAsync(
                eventId,
                employeeId,
                request,
                cancellationToken);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{eventId:int}/staff/{employeeId:int}")] 
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Remove(int eventId,int employeeId,CancellationToken cancellationToken)
    {
        bool removed =
            await staffingService.RemoveAsync(
                eventId,
                employeeId,
                cancellationToken);

        if (!removed)
        {
            return NotFound();
        }

        return NoContent();
    }
}