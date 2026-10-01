using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class OrganizationService(IOrganizationRepository organizationRepository,IEmployeeRepository employeeRepository) : IOrganizationService
{
    public async Task<List<OrganizationResponseDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        List<Organization> organizations = await organizationRepository.GetAllAsync(cancellationToken);

        return organizations
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<OrganizationResponseDto?> GetByIdAsync(int orgId,CancellationToken cancellationToken)
    {
        Organization? organization =await organizationRepository.GetByIdAsync(orgId,cancellationToken);

        return organization is null
            ? null
            : MapToResponse(organization);
    }

    public async Task<OrganizationResponseDto> CreateAsync(CreateOrganizationDto request,CancellationToken cancellationToken)
    {
        Organization organization = new()
        {
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            ContactPerson = request.ContactPerson ?? string.Empty
        };

        Organization createdOrganization =await organizationRepository.AddAsync(organization,cancellationToken);

        return MapToResponse(createdOrganization);
    }

    public async Task<bool> UpdateAsync(int orgId,UpdateOrganizationDto request,CancellationToken cancellationToken)
    {
        Organization? organization = await organizationRepository.GetByIdAsync(orgId,cancellationToken);

        if (organization is null)
        {
            return false;
        }

        if (request.Name is not null)
        {
            organization.Name = request.Name;
        }

        if (request.Email is not null)
        {
            organization.Email = request.Email;
        }

        if (request.Phone is not null)
        {
            organization.Phone = request.Phone;
        }

        if (request.ContactPerson is not null)
        {
            organization.ContactPerson = request.ContactPerson;
        }

        await organizationRepository.UpdateAsync(organization,cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(int orgId,CancellationToken cancellationToken)
    {
        Organization? organization = await organizationRepository.GetByIdAsync(orgId,cancellationToken);

        if (organization is null)
        {
            return false;
        }

        await organizationRepository.DeleteAsync(organization,cancellationToken);

        return true;
    }

    public async Task<List<EmployeeResponseDto>> GetEmployeesAsync(int orgId,CancellationToken cancellationToken)
    {
        List<Employee> employees =await employeeRepository.GetByOrganizationIdAsync(orgId,cancellationToken);

        return employees.Select(employee => new EmployeeResponseDto
            {
                EmployeeId = employee.EmployeeId,
                Name = employee.Name,
                JobTitle = employee.JobTitle,
                Email = employee.Email,
                OrgId = employee.OrgId
            }).ToList();
    }

    private static OrganizationResponseDto MapToResponse(Organization organization)
    {
        return new OrganizationResponseDto
        {
            OrgId = organization.OrgId,
            Name = organization.Name,
            Email = organization.Email,
            Phone = organization.Phone,
            ContactPerson = organization.ContactPerson
        };
    }
}