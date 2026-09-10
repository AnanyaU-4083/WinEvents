using System.ComponentModel.DataAnnotations;

namespace EventManagementSys.api.Models;

public class Event
{
    [Key] public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal? Budget { get; set; }
    public EventType EventType { get; set; }
    public int? VenueId { get; set; }

    public int? OrgId { get; set; }

    // Navigation properties
    public virtual Venue? VenueNavigation { get; set; }

    public virtual Organization? Organization { get; set; }
    
}
