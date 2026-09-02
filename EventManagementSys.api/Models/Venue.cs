using System.ComponentModel.DataAnnotations;

namespace EventManagementSys.api.Models;

public class Venue
{
    [Key]
    public int VenueId { get; set; }
    public string Address { get; set; } = string.Empty;
    public int Capacity { get; set; }
}
