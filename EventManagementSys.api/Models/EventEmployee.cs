using System.ComponentModel.DataAnnotations;
namespace EventManagementSys.api.Models;

public class EventEmployee
{
    [Key] public int EventId { get; set; }

    public int EmployeeId { get; set; }

    public string Task { get; set; } = string.Empty;

    public DateTime? Deadline { get; set; }
    public enum AssignmentStatus
{
    Pending,
    InProgress,
    Completed
}
     public AssignmentStatus Status { get; set; } = AssignmentStatus.Pending;

    // Navigation properties
    public virtual Event? EventNavigation { get; set; }

    public virtual Employee? EmployeeNavigation { get; set; }
}