namespace EventManagementSys.api.DTOs;

public class CreateVenueDto
{
    public string Address { get; set; } = string.Empty;
    public int Capacity { get; set; }
}

public class VenueResponseDto
{
    public int VenueId { get; set; }
    public string Address { get; set; } = string.Empty;
    public int Capacity { get; set; }
}

public class VenueAvailabilityDto
{
    public int Capacity { get; set; }
    public int CurrentRegistrations { get; set; }
    public int SeatsRemaining { get; set; }
}