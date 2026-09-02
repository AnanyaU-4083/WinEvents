namespace EventManagementSys.api.Models;

public class Event
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal? Budget { get; set; }
    public EventType EventType { get; set; }
    public int? VenueId { get; set; }

    // Navigation properties
    public virtual Venue? VenueNavigation { get; set; }
    
}
