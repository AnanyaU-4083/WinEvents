namespace EventManagementSys.api.DTOs;

public class CreateOrganizationDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
}

public class UpdateOrganizationDto
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? ContactPerson { get; set; }
}

public class OrganizationResponseDto
{
    public int OrgId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
}