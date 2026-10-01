using EventManagementSys.api.Models;

namespace EventManagementSys.api.DTOs;

public class CreateEventDto
{
    public string EventName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int VenueId { get; set; }
    public decimal? Budget { get; set; }
    public EventType EventType { get; set; }
    public int? OrgId { get; set; }
}

public class UpdateEventDto
{
    public string? EventName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? Budget { get; set; }
    public EventType? EventType { get; set; }
    public int? VenueId { get; set; }
}

public class EventResponseDto
{
    public int EventId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal? Budget { get; set; }
    public EventType EventType { get; set; }
    public EventStatus Status { get; set; }
    public int? VenueId { get; set; }
    public int? OrgId { get; set; }
}