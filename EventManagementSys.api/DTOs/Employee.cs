namespace EventManagementSys.api.DTOs;

public class CreateEmployeeDto
{
    public string Name { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Task { get; set; } = string.Empty;
    public int OrgId { get; set; }
}

public class UpdateEmployeeDto
{
    public string? Name { get; set; }
    public string? JobTitle { get; set; }
    public string? Email { get; set; }
    public string? Task { get; set; }
    public int? OrgId { get; set; }
}

public class EmployeeResponseDto
{
    public int EmployeeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Task { get; set; }
    public int OrgId { get; set; }
}