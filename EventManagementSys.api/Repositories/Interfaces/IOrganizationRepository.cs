using EventManagementSys.api.Models;

namespace EventManagementSys.api.Repository.Interfaces;

public interface IOrganizationRepository
{
    Task<List<Organization>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<Organization?> GetByIdAsync(
        int orgId,
        CancellationToken cancellationToken);

    Task<Organization> AddAsync(
        Organization organization,
        CancellationToken cancellationToken);

    Task UpdateAsync(
        Organization organization,
        CancellationToken cancellationToken);

    Task DeleteAsync(
        Organization organization,
        CancellationToken cancellationToken);
}