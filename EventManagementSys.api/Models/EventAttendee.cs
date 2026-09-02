namespace EventManagementSys.api.Models;

public class EventAttendee
{
    public int EventId { get; set; }
    public int AttendeeId { get; set; }
    public DateTime RegisteredTime { get; set; }

    // Navigation properties
    public virtual Event? EventNavigation { get; set; }
    public virtual Attendee? AttendeeNavigation { get; set; }
}
