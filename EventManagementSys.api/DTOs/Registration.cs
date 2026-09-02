namespace EventManagementSys.api.DTOs;

public class RegistrationDto
{
    public int EventId { get; set; }

    public int AttendeeId { get; set; }

    public DateTime RegisteredAt { get; set; }
}

public class ParticipantDto
{
    public int AttendeeId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Ticket { get; set; } = string.Empty;
}