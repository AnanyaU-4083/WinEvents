using System.ComponentModel.DataAnnotations;

namespace EventManagementSys.api.Models;

public class Attendee
{
    [Key]
    public int AttendeeId { get; set; }

    public int? UserId { get; set; }

    public string Name { get; set; } = string.Empty;

    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Ticket { get; set; } = string.Empty;

    public User? User { get; set; }
}