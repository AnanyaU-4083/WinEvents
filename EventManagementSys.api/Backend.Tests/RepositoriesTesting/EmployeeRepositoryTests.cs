using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;

namespace EventManagementSys.api.Tests.Repositories;

public class EmployeeRepositoryTests : UnitRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Fact]
    public async Task CrudAndOrganizationFilterUsePersistedRows()
    {
        var repository = new EmployeeRepository(Context);
        var employee = await repository.AddAsync(new Employee { Name = "Mina", Email = "mina@example.com", OrgId = 4 }, _token);
        await repository.AddAsync(new Employee { Name = "Jo", Email = "jo@example.com", OrgId = 5 }, _token);

        Assert.True(employee.EmployeeId > 0);
        Assert.Equal(2, (await repository.GetAllAsync(_token)).Count);
        Assert.Equal("Mina", (await repository.GetByIdAsync(employee.EmployeeId, _token))!.Name);
        Assert.Null(await repository.GetByIdAsync(-1, _token));
        Assert.Equal("Mina", Assert.Single(await repository.GetByOrganizationIdAsync(4, _token)).Name);

        employee.JobTitle = "Coordinator";
        await repository.UpdateAsync(employee, _token);
        Assert.Equal("Coordinator", (await repository.GetByIdAsync(employee.EmployeeId, _token))!.JobTitle);
        await repository.DeleteAsync(employee, _token);
        Assert.Null(await repository.GetByIdAsync(employee.EmployeeId, _token));
    }
}
