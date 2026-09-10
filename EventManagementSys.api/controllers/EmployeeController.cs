using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/employees")]
public class EmployeeController(IEmployeeService employeeService) : ControllerBase
{
    [HttpGet] 
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<List<EmployeeResponseDto>>> GetAll(CancellationToken cancellationToken)
    {
        List<EmployeeResponseDto> employees =
            await employeeService.GetAllAsync(cancellationToken);

        return Ok(employees);
    }

    [HttpGet("{employeeId:int}")] 
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<EmployeeResponseDto>> GetById(int employeeId,CancellationToken cancellationToken)
    {
        EmployeeResponseDto? employee =
            await employeeService.GetByIdAsync(
                employeeId,
                cancellationToken);

        if (employee is null)
        {
            return NotFound();
        }

        return Ok(employee);
    }

    [HttpPost] 
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EmployeeResponseDto>> Create(CreateEmployeeDto request,CancellationToken cancellationToken)
    {
        EmployeeResponseDto employee =
            await employeeService.CreateAsync(
                request,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { employeeId = employee.EmployeeId },
            employee);
    }

    [HttpPut("{employeeId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int employeeId,UpdateEmployeeDto request,CancellationToken cancellationToken)
    {
        bool updated =
            await employeeService.UpdateAsync(
                employeeId,
                request,
                cancellationToken);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{employeeId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(
        int employeeId,
        CancellationToken cancellationToken)
    {
        bool deleted =
            await employeeService.DeleteAsync(
                employeeId,
                cancellationToken);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}