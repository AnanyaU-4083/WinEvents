using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Services;

public class OrganizationServiceTests
{
    private readonly Mock<IOrganizationRepository> _organizations = new();
    private readonly Mock<IEmployeeRepository> _employees = new();
    private readonly OrganizationService _service;
    private readonly CancellationToken _token = CancellationToken.None;

    public OrganizationServiceTests() => _service = new OrganizationService(_organizations.Object, _employees.Object);

    [Fact]
    public async Task ReadsAndCreatesOrganizations()
    {
        var organization = new Organization { OrgId = 3, Name = "North", Email = "north@example.com", Phone = "123", ContactPerson = "Mina" };
        _organizations.Setup(repository => repository.GetAllAsync(_token)).ReturnsAsync([organization]);
        _organizations.Setup(repository => repository.GetByIdAsync(3, _token)).ReturnsAsync(organization);
        _organizations.Setup(repository => repository.AddAsync(It.IsAny<Organization>(), _token)).ReturnsAsync(organization);

        Assert.Equal("North", Assert.Single(await _service.GetAllAsync(_token)).Name);
        Assert.Equal("Mina", (await _service.GetByIdAsync(3, _token))!.ContactPerson);
        Assert.Equal("North", (await _service.CreateAsync(new CreateOrganizationDto { Name = "North" }, _token)).Name);
        _organizations.Verify(repository => repository.AddAsync(It.Is<Organization>(item => item.ContactPerson == string.Empty), _token), Times.Once);
    }

    [Fact]
    public async Task GetByIdReturnsNullForMissingOrganization()
    {
        _organizations.Setup(repository => repository.GetByIdAsync(3, _token)).ReturnsAsync((Organization?)null);
        Assert.Null(await _service.GetByIdAsync(3, _token));
    }

    [Fact]
    public async Task UpdateChangesProvidedFields()
    {
        var organization = new Organization { OrgId = 3, Name = "Old", Email = "old@example.com", Phone = "1", ContactPerson = "A" };
        _organizations.Setup(repository => repository.GetByIdAsync(3, _token)).ReturnsAsync(organization);

        Assert.True(await _service.UpdateAsync(3, new UpdateOrganizationDto { Name = "New", Email = "new@example.com", Phone = "2", ContactPerson = "B" }, _token));
        Assert.Equal(("New", "new@example.com", "2", "B"), (organization.Name, organization.Email, organization.Phone, organization.ContactPerson));
        _organizations.Verify(repository => repository.UpdateAsync(organization, _token), Times.Once);
    }

    [Fact]
    public async Task MissingOrganizationCannotBeUpdatedOrDeleted()
    {
        _organizations.Setup(repository => repository.GetByIdAsync(3, _token)).ReturnsAsync((Organization?)null);
        Assert.False(await _service.UpdateAsync(3, new UpdateOrganizationDto(), _token));
        Assert.False(await _service.DeleteAsync(3, _token));
        _organizations.Verify(repository => repository.UpdateAsync(It.IsAny<Organization>(), It.IsAny<CancellationToken>()), Times.Never);
        _organizations.Verify(repository => repository.DeleteAsync(It.IsAny<Organization>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteRemovesOrganizationAndGetEmployeesMapsEmployees()
    {
        var organization = new Organization { OrgId = 3 };
        var employee = new Employee { EmployeeId = 5, Name = "Jo", OrgId = 3 };
        _organizations.Setup(repository => repository.GetByIdAsync(3, _token)).ReturnsAsync(organization);
        _employees.Setup(repository => repository.GetByOrganizationIdAsync(3, _token)).ReturnsAsync([employee]);

        Assert.True(await _service.DeleteAsync(3, _token));
        Assert.Equal(5, Assert.Single(await _service.GetEmployeesAsync(3, _token)).EmployeeId);
        _organizations.Verify(repository => repository.DeleteAsync(organization, _token), Times.Once);
    }
}
