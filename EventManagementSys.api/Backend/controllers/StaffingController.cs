using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/events")]
public class StaffingController(
    IStaffingService staffingService) : ControllerBase
{
    [HttpPost("{eventId:int}/staff")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<StaffDto>> Assign(
        int eventId,
        AssignStaffDto request,
        CancellationToken cancellationToken)
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
    public async Task<ActionResult<List<StaffDto>>> GetStaff(
        int eventId,
        CancellationToken cancellationToken)
    {
        List<StaffDto> staff =
            await staffingService.GetStaffAsync(
                eventId,
                cancellationToken);

        return Ok(staff);
    }


    [HttpGet("/api/employees/{employeeId:int}/tasks")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<List<StaffDto>>> GetEmployeeTasks(
        int employeeId,
        CancellationToken cancellationToken)
    {
        List<StaffDto> tasks =
            await staffingService.GetTasksByEmployeeIdAsync(
                employeeId,
                cancellationToken);

        return Ok(tasks);
    }


    [HttpGet("/api/employees/my-tasks")]
    [Authorize(Roles = "Employee,Admin")]
    public async Task<ActionResult<List<StaffDto>>> GetMyTasks(
        CancellationToken cancellationToken)
    {
        string? email =
            User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst("email")?.Value
            ?? User.FindFirst("upn")?.Value
            ?? User.FindFirst("name")?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized(
                "Unable to determine the logged-in user's email.");
        }

        List<StaffDto> tasks =
            await staffingService.GetTasksByEmployeeEmailAsync(
                email,
                cancellationToken);

        return Ok(tasks);
    }


    [HttpPut("{eventId:int}/staff/{employeeId:int}")]
    [Authorize(Roles = "Admin,Employee")]
    public async Task<IActionResult> Update(
        int eventId,
        int employeeId,
        UpdateStaffDto request,
        CancellationToken cancellationToken)
    {
        // Admin can update any employee's assignment.
        bool isAdmin =
            User.IsInRole("Admin");

        if (!isAdmin)
        {
            // Get the logged-in Microsoft user's email.
            string? email =
                User.FindFirst("preferred_username")?.Value
                ?? User.FindFirst("email")?.Value
                ?? User.FindFirst("upn")?.Value
                ?? User.FindFirst("name")?.Value;

            if (string.IsNullOrWhiteSpace(email))
            {
                return Unauthorized(
                    "Unable to determine the logged-in user's email.");
            }

            // Get tasks belonging to the logged-in employee.
            List<StaffDto> myTasks =
                await staffingService.GetTasksByEmployeeEmailAsync(
                    email,
                    cancellationToken);

            // Check whether the employee owns this assignment.
            bool ownsTask =
                myTasks.Any(task =>
                    task.EventId == eventId &&
                    task.EmployeeId == employeeId);

            if (!ownsTask)
            {
                return Forbid();
            }
        }

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
    public async Task<IActionResult> Remove(
        int eventId,
        int employeeId,
        CancellationToken cancellationToken)
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