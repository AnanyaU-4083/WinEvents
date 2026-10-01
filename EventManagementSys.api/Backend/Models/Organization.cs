using System.ComponentModel.DataAnnotations;

namespace EventManagementSys.api.Models;

public class Organization
{
    [Key] public int OrgId { get; set; }
    public string Name { get; set; } = string.Empty;
    [EmailAddress] public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
}
