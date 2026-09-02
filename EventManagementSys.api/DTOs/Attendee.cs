namespace EventManagementSys.api.DTOs;

public class CreateAttendeeDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Ticket { get; set; } = string.Empty;
}

public class UpdateAttendeeDto
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Ticket { get; set; }
}

public class AttendeeResponseDto
{
    public int AttendeeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Ticket { get; set; } = string.Empty;
}

public class AttendeeEventDto
{
    public int AttendeeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Ticket { get; set; } = string.Empty;
    public DateTime RegisteredTime { get; set; }
}
