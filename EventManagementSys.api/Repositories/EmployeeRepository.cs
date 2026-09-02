using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Repository.Implementations;

public class EmployeeRepository(
    AppDbContext dbContext) : IEmployeeRepository
{
    public async Task<List<Employee>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.Employees
            .ToListAsync(cancellationToken);
    }

    public async Task<Employee?> GetByIdAsync(
        int employeeId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Employees
            .FirstOrDefaultAsync(
                employee => employee.EmployeeId == employeeId,
                cancellationToken);
    }

    public async Task<Employee> AddAsync(
        Employee employee,
        CancellationToken cancellationToken)
    {
        await dbContext.Employees.AddAsync(
            employee,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return employee;
    }

    public async Task UpdateAsync(
        Employee employee,
        CancellationToken cancellationToken)
    {
        dbContext.Employees.Update(employee);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(
        Employee employee,
        CancellationToken cancellationToken)
    {
        dbContext.Employees.Remove(employee);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Employee>> GetByOrganizationIdAsync(
        int orgId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Employees
            .Where(employee => employee.OrgId == orgId)
            .ToListAsync(cancellationToken);
    }
}