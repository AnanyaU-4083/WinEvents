namespace EventManagementSys.api.DTOs;

public class AssignStaffDto
{
    public int EmployeeId { get; set; }

    public string Task { get; set; } = string.Empty;

    public DateTime? Deadline { get; set; }
}

public class UpdateStaffDto
{
    public string Status { get; set; } = "pending";

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