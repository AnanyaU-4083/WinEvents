using EventManagementSys.api.Models;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<Venue> Venues { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Attendee> Attendees { get; set; }
    public DbSet<EventEmployee> EventEmployees { get; set; }
    public DbSet<EventAttendee> EventAttendees { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<EventEmployee>()
            .HasKey(ee => new { ee.EventId, ee.EmployeeId });

        modelBuilder.Entity<EventAttendee>()
            .HasKey(ea => new { ea.EventId, ea.AttendeeId });
    }
}
