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

}
