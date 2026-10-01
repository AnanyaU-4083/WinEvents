using System.ComponentModel.DataAnnotations;
namespace EventManagementSys.api.Models;

public class Employee
{
    [Key] public int EmployeeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    [EmailAddress] public string Email { get; set; } = string.Empty;
    
    public int OrgId { get; set; }

    public Organization? Organization { get; set; }
}
