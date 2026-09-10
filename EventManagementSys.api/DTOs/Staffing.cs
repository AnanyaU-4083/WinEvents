using EventManagementSys.api.Models;
namespace EventManagementSys.api.DTOs;


public class AssignStaffDto
{
    public int EmployeeId { get; set; }

    public string Task { get; set; } = string.Empty;

    public DateTime? Deadline { get; set; }
}

public class UpdateStaffDto
{
    public EventEmployee.AssignmentStatus Status { get; set; }

    public string Task { get; set; } = string.Empty;

    public DateTime? Deadline { get; set; }
}

public class StaffDto
{
    public int EmployeeId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string JobTitle { get; set; } = string.Empty;

    public string Task { get; set; } = string.Empty;

    public DateTime? Deadline { get; set; }

    public string Status { get; set; } = "pending";
}