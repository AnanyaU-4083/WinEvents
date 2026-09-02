namespace EventManagementSys.api.Models;

public class EventEmployee
{
    public int EventId { get; set; }

    public int EmployeeId { get; set; }

    public string Task { get; set; } = string.Empty;

    public DateTime? Deadline { get; set; }

    public string Status { get; set; } = "pending";

    // Navigation properties
    public virtual Event? EventNavigation { get; set; }

    public virtual Employee? EmployeeNavigation { get; set; }
}