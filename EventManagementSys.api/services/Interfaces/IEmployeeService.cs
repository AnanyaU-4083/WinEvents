using EventManagementSys.api.DTOs;

namespace EventManagementSys.api.Services.Interfaces;

public interface IEmployeeService
{
    Task<List<EmployeeResponseDto>> GetAllAsync(CancellationToken cancellationToken);

    Task<EmployeeResponseDto?> GetByIdAsync(int employeeId,CancellationToken cancellationToken);

    Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto request,CancellationToken cancellationToken);

    Task<bool> UpdateAsync(int employeeId,UpdateEmployeeDto request,CancellationToken cancellationToken);

    Task<bool> DeleteAsync(int employeeId,CancellationToken cancellationToken);

    Task<List<EmployeeResponseDto>> GetTasksAsync(int employeeId,CancellationToken cancellationToken);
}