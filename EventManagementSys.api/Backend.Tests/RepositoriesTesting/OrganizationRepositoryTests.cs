using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;

namespace EventManagementSys.api.Tests.Repositories;

public class OrganizationRepositoryTests : SqliteRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Fact]
    public async Task CrudMethodsPersistOrganizationChanges()
    {
        var repository = new OrganizationRepository(Context);
        var organization = await repository.AddAsync(new Organization { Name = "North", Email = "north@example.com", Phone = "123" }, _token);

        Assert.True(organization.OrgId > 0);
        Assert.Equal("North", (await repository.GetByIdAsync(organization.OrgId, _token))!.Name);
        Assert.Null(await repository.GetByIdAsync(-1, _token));
        Assert.Equal("North", Assert.Single(await repository.GetAllAsync(_token)).Name);

        organization.Name = "Updated North";
        await repository.UpdateAsync(organization, _token);
        Assert.Equal("Updated North", (await repository.GetByIdAsync(organization.OrgId, _token))!.Name);
        await repository.DeleteAsync(organization, _token);
        Assert.Empty(await repository.GetAllAsync(_token));
    }
}
