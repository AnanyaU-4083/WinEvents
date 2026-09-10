using EventManagementSys.api.DTOs;
using EventManagementSys.api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventManagementSys.api.Controllers;

[ApiController]
[Route("api/venues")]
public class VenueController(IVenueService venueService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<VenueResponseDto>>> GetAll(CancellationToken cancellationToken)
    {
        List<VenueResponseDto> venues =
            await venueService.GetAllAsync(cancellationToken);

        return Ok(venues);
    }

    [HttpGet("{venueId:int}")] 
    [AllowAnonymous]
    public async Task<ActionResult<VenueResponseDto>> GetById(int venueId,CancellationToken cancellationToken)
    {
        VenueResponseDto? venue =
            await venueService.GetByIdAsync(
                venueId,
                cancellationToken);

        if (venue is null)
        {
            return NotFound();
        }

        return Ok(venue);
    }

    [HttpPost] 
    [Authorize(Roles = "Admin,Employee")]
    public async Task<ActionResult<VenueResponseDto>> Create(CreateVenueDto request,CancellationToken cancellationToken)
    {
        VenueResponseDto venue =
            await venueService.CreateAsync(
                request,
                cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { venueId = venue.VenueId },
            venue);
    }
}