using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/organizations")]
public class OrganizationController(IOrganizationService organizationService) : ControllerBase
{
    [HttpGet] 
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<List<OrganizationResponseDto>>> GetAll(CancellationToken cancellationToken)
    {
        List<OrganizationResponseDto> organizations =
            await organizationService.GetAllAsync(cancellationToken);

        return Ok(organizations);
    }

    [HttpGet("{orgId:int}")] 
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<OrganizationResponseDto>> GetById(int orgId,CancellationToken cancellationToken)
    {
        OrganizationResponseDto? organization =
            await organizationService.GetByIdAsync(
                orgId,
                cancellationToken);

        if (organization is null)
        {
            return NotFound();
        }

        return Ok(organization);
    }

    [HttpPost] 
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrganizationResponseDto>> Create(CreateOrganizationDto request,CancellationToken cancellationToken)
    {
        OrganizationResponseDto organization =
            await organizationService.CreateAsync(
                request,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { orgId = organization.OrgId },
            organization);
    }

    [HttpPut("{orgId:int}")] 
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int orgId,UpdateOrganizationDto request,CancellationToken cancellationToken)
    {
        bool updated =
            await organizationService.UpdateAsync(
                orgId,
                request,
                cancellationToken);

        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{orgId:int}")] 
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int orgId,CancellationToken cancellationToken)
    {
        bool deleted =
            await organizationService.DeleteAsync(
                orgId,
                cancellationToken);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}