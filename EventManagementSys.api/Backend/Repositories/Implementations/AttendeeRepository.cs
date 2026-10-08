using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Repository.Implementations;

public class AttendeeRepository(
    AppDbContext dbContext) : IAttendeeRepository
{
    public async Task<List<Attendee>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.Attendees
            .ToListAsync(cancellationToken);
    }


    public async Task<Attendee?> GetByIdAsync(
        int attendeeId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Attendees
            .FirstOrDefaultAsync(
                attendee => attendee.AttendeeId == attendeeId,
                cancellationToken);
    }


    public async Task<Attendee> AddAsync(
        Attendee attendee,
        CancellationToken cancellationToken)
    {
        await dbContext.Attendees.AddAsync(
            attendee,
            cancellationToken);

        await dbContext.SaveChangesAsync(
            cancellationToken);

        return attendee;
    }


    public async Task UpdateAsync(
        Attendee attendee,
        CancellationToken cancellationToken)
    {
        dbContext.Attendees.Update(attendee);

        await dbContext.SaveChangesAsync(
            cancellationToken);
    }


    public async Task DeleteAsync(
        Attendee attendee,
        CancellationToken cancellationToken)
    {
        dbContext.Attendees.Remove(attendee);

        await dbContext.SaveChangesAsync(
            cancellationToken);
    }


    public async Task<Attendee?> GetByUserEmailAsync(
        string email,
        CancellationToken cancellationToken)
    {
        return await dbContext.Attendees
            .Include(attendee => attendee.User)
            .FirstOrDefaultAsync(
                attendee =>
                    attendee.User != null &&
                    attendee.User.Email == email,
                cancellationToken);
    }


    public async Task<Attendee?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken)
    {
        return await dbContext.Attendees
            .FirstOrDefaultAsync(
                attendee => attendee.Email == email,
                cancellationToken);
    }
}