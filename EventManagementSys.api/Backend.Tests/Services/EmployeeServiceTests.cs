using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Services;

public class EmployeeServiceTests
{
    private readonly Mock<IEmployeeRepository> _repository = new();
    private readonly EmployeeService _service;
    private readonly CancellationToken _token = CancellationToken.None;

    public EmployeeServiceTests() => _service = new EmployeeService(_repository.Object);

    [Fact]
    public async Task ReadsAndCreatesEmployees()
    {
        var employee = new Employee { EmployeeId = 2, Name = "Ravi", JobTitle = "Coordinator", Email = "ravi@example.com", OrgId = 6 };
        _repository.Setup(repository => repository.GetAllAsync(_token)).ReturnsAsync([employee]);
        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync(employee);
        _repository.Setup(repository => repository.AddAsync(It.IsAny<Employee>(), _token)).ReturnsAsync(employee);

        Assert.Equal("Ravi", Assert.Single(await _service.GetAllAsync(_token)).Name);
        Assert.Equal(6, (await _service.GetByIdAsync(2, _token))!.OrgId);
        Assert.Equal("Coordinator", (await _service.CreateAsync(new CreateEmployeeDto { Name = "Ravi" }, _token)).JobTitle);
    }

    [Fact]
    public async Task GetByIdAndGetTasksHandleMissingEmployee()
    {
        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync((Employee?)null);
        Assert.Null(await _service.GetByIdAsync(2, _token));
        Assert.Empty(await _service.GetTasksAsync(2, _token));
    }

    [Fact]
    public async Task GetTasksReturnsTheEmployeeWhenFound()
    {
        var employee = new Employee { EmployeeId = 2, Name = "Ravi" };
        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync(employee);
        Assert.Equal("Ravi", Assert.Single(await _service.GetTasksAsync(2, _token)).Name);
    }

    [Fact]
    public async Task UpdateAppliesProvidedProperties()
    {
        var employee = new Employee { EmployeeId = 2, Name = "Old", JobTitle = "Helper", Email = "old@example.com", OrgId = 1 };
        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync(employee);

        Assert.True(await _service.UpdateAsync(2, new UpdateEmployeeDto { Name = "Ravi", JobTitle = "Lead", Email = "ravi@example.com", OrgId = 6 }, _token));
        Assert.Equal(("Ravi", "Lead", "ravi@example.com", 6), (employee.Name, employee.JobTitle, employee.Email, employee.OrgId));
        _repository.Verify(repository => repository.UpdateAsync(employee, _token), Times.Once);
    }

    [Fact]
    public async Task UpdateAndDeleteReturnFalseForMissingEmployee()
    {
        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync((Employee?)null);
        Assert.False(await _service.UpdateAsync(2, new UpdateEmployeeDto(), _token));
        Assert.False(await _service.DeleteAsync(2, _token));
        _repository.Verify(repository => repository.UpdateAsync(It.IsAny<Employee>(), It.IsAny<CancellationToken>()), Times.Never);
        _repository.Verify(repository => repository.DeleteAsync(It.IsAny<Employee>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteRemovesExistingEmployee()
    {
        var employee = new Employee { EmployeeId = 2 };
        _repository.Setup(repository => repository.GetByIdAsync(2, _token)).ReturnsAsync(employee);
        Assert.True(await _service.DeleteAsync(2, _token));
        _repository.Verify(repository => repository.DeleteAsync(employee, _token), Times.Once);
    }
}
