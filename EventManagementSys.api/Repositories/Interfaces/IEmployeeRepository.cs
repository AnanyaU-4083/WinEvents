using EventManagementSys.api.Models;

namespace EventManagementSys.api.Repository.Interfaces;

public interface IEmployeeRepository
{
    Task<List<Employee>> GetAllAsync(CancellationToken cancellationToken);

    Task<Employee?> GetByIdAsync(int employeeId,CancellationToken cancellationToken);

    Task<Employee> AddAsync(Employee employee,CancellationToken cancellationToken);

    Task UpdateAsync(Employee employee,CancellationToken cancellationToken);

    Task DeleteAsync(Employee employee,CancellationToken cancellationToken);

    Task<List<Employee>> GetByOrganizationIdAsync(int orgId,CancellationToken cancellationToken);
}