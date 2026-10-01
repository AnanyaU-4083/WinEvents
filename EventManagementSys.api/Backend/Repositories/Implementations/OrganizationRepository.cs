using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Repository.Implementations;

public class OrganizationRepository(AppDbContext dbContext) : IOrganizationRepository
{
    public async Task<List<Organization>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Organizations.ToListAsync(cancellationToken);
    }

    public async Task<Organization?> GetByIdAsync(int orgId,CancellationToken cancellationToken)
    {
        return await dbContext.Organizations.FirstOrDefaultAsync(organization => organization.OrgId == orgId,cancellationToken);
    }

    public async Task<Organization> AddAsync(Organization organization,CancellationToken cancellationToken)
    {
        await dbContext.Organizations.AddAsync(organization,cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return organization;
    }

    public async Task UpdateAsync(Organization organization,CancellationToken cancellationToken)
    {
        dbContext.Organizations.Update(organization);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Organization organization,CancellationToken cancellationToken)
    {
        dbContext.Organizations.Remove(organization);

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}