using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Repository.Implementations;

public class StaffingRepository(
    AppDbContext dbContext) : IStaffingRepository
{
    public async Task<EventEmployee?> GetAsync(
        int eventId,
        int employeeId,
        CancellationToken cancellationToken)
    {
        return await dbContext.EventEmployees
            .Include(assignment => assignment.EmployeeNavigation)
            .FirstOrDefaultAsync(
                assignment =>
                    assignment.EventId == eventId &&
                    assignment.EmployeeId == employeeId,
                cancellationToken);
    }

    public async Task<List<EventEmployee>> GetByEventIdAsync(
        int eventId,
        CancellationToken cancellationToken)
    {
        return await dbContext.EventEmployees
            .Include(assignment => assignment.EmployeeNavigation)
            .Where(assignment => assignment.EventId == eventId)
            .ToListAsync(cancellationToken);
    }

    public async Task<EventEmployee> AddAsync(
        EventEmployee assignment,
        CancellationToken cancellationToken)
    {
        await dbContext.EventEmployees.AddAsync(
            assignment,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return assignment;
    }

    public async Task UpdateAsync(
        EventEmployee assignment,
        CancellationToken cancellationToken)
    {
        dbContext.EventEmployees.Update(assignment);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(
        EventEmployee assignment,
        CancellationToken cancellationToken)
    {
        dbContext.EventEmployees.Remove(assignment);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}