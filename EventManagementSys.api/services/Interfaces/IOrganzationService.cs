using EventManagementSys.api.DTOs;

namespace EventManagementSys.api.Services.Interfaces;

public interface IOrganizationService
{
    Task<List<OrganizationResponseDto>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<OrganizationResponseDto?> GetByIdAsync(
        int orgId,
        CancellationToken cancellationToken);

    Task<OrganizationResponseDto> CreateAsync(
        CreateOrganizationDto request,
        CancellationToken cancellationToken);

    Task<bool> UpdateAsync(
        int orgId,
        UpdateOrganizationDto request,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(
        int orgId,
        CancellationToken cancellationToken);

    Task<List<EmployeeResponseDto>> GetEmployeesAsync(
        int orgId,
        CancellationToken cancellationToken);
}