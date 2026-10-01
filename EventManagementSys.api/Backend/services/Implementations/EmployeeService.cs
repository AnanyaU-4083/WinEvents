using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class EmployeeService(
    IEmployeeRepository employeeRepository) : IEmployeeService
{
    public async Task<List<EmployeeResponseDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        List<Employee> employees = await employeeRepository.GetAllAsync(cancellationToken);

        return employees
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<EmployeeResponseDto?> GetByIdAsync(int employeeId,CancellationToken cancellationToken)
    {
        Employee? employee = await employeeRepository.GetByIdAsync(employeeId,cancellationToken);

        return employee is null
            ? null
            : MapToResponse(employee);
    }

    public async Task<EmployeeResponseDto> CreateAsync(CreateEmployeeDto request,CancellationToken cancellationToken)
    {
        Employee employee = new()
        {
            Name = request.Name,
            JobTitle = request.JobTitle,
            Email = request.Email,
            
            OrgId = request.OrgId
        };

        Employee createdEmployee =await employeeRepository.AddAsync(employee,cancellationToken);

        return MapToResponse(createdEmployee);
    }

    public async Task<bool> UpdateAsync(int employeeId,UpdateEmployeeDto request,CancellationToken cancellationToken)
    {
        Employee? employee = await employeeRepository.GetByIdAsync(employeeId,cancellationToken);

        if (employee is null)
        {
            return false;
        }

        if (request.Name is not null)
        {
            employee.Name = request.Name;
        }

        if (request.JobTitle is not null)
        {
            employee.JobTitle = request.JobTitle;
        }

        if (request.Email is not null)
        {
            employee.Email = request.Email;
        }

       

        if (request.OrgId.HasValue)
        {
            employee.OrgId = request.OrgId.Value;
        }

        await employeeRepository.UpdateAsync(employee,cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(int employeeId,CancellationToken cancellationToken)
    {
        Employee? employee = await employeeRepository.GetByIdAsync(employeeId,cancellationToken);

        if (employee is null)
        {
            return false;
        }

        await employeeRepository.DeleteAsync(employee,cancellationToken);

        return true;
    }

    public async Task<List<EmployeeResponseDto>> GetTasksAsync(int employeeId,CancellationToken cancellationToken)
    {
        Employee? employee = await employeeRepository.GetByIdAsync(employeeId,cancellationToken);

        if (employee is null)
        {
            return [];
        }

        return
        [
            MapToResponse(employee)
        ];
    }

    private static EmployeeResponseDto MapToResponse(Employee employee)
    {
        return new EmployeeResponseDto
        {
            EmployeeId = employee.EmployeeId,
            Name = employee.Name,
            JobTitle = employee.JobTitle,
            Email = employee.Email,
            OrgId = employee.OrgId
        };
    }
}