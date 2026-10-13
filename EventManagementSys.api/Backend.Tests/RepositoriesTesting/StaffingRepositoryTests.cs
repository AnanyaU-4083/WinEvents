using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;
using EventEntity = EventManagementSys.api.Models.Event;

namespace EventManagementSys.api.Tests.Repositories;

public class StaffingRepositoryTests : SqliteRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Fact]
    public async Task AssignmentQueriesFilterByAssignmentEventEmployeeAndEmail()
    {
        var repository = new StaffingRepository(Context);
        var eventEntity = new EventEntity { EventName = "Conference", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddHours(3) };
        var employee = new Employee { Name = "Jo", Email = "jo@example.com", OrgId = 1 };
        var otherEmployee = new Employee { Name = "Mina", Email = "mina@example.com", OrgId = 1 };
        Context.Events.Add(eventEntity);
        Context.Employees.AddRange(employee, otherEmployee);
        await Context.SaveChangesAsync(_token);
        var assignment = await repository.AddAsync(new EventEmployee
        {
            EventId = eventEntity.EventId, EmployeeId = employee.EmployeeId,
            Task = "Sound check", Deadline = DateTime.UtcNow.AddHours(1),
        }, _token);
        await repository.AddAsync(new EventEmployee
        {
            EventId = eventEntity.EventId, EmployeeId = otherEmployee.EmployeeId, Task = "Welcome desk",
        }, _token);

        var byId = await repository.GetByAssignmentIdAsync(assignment.AssignmentId, _token);
        Assert.Equal("Jo", byId!.EmployeeNavigation!.Name);
        Assert.Equal("Conference", byId.EventNavigation!.EventName);
        Assert.Equal(2, (await repository.GetByEventIdAsync(eventEntity.EventId, _token)).Count);
        Assert.Equal("Sound check", Assert.Single(await repository.GetByEmployeeIdAsync(employee.EmployeeId, _token)).Task);
        Assert.Equal("Welcome desk", Assert.Single(await repository.GetByEmployeeEmailAsync("mina@example.com", _token)).Task);
        Assert.Empty(await repository.GetByEmployeeEmailAsync("missing@example.com", _token));
        Assert.Null(await repository.GetByAssignmentIdAsync(-1, _token));
    }

    [Fact]
    public async Task AssignmentCanBeUpdatedAndDeleted()
    {
        var repository = new StaffingRepository(Context);
        var eventEntity = new EventEntity { EventName = "Meetup", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddHours(1) };
        var employee = new Employee { Name = "Jo", Email = "jo@example.com", OrgId = 1 };
        Context.Events.Add(eventEntity);
        Context.Employees.Add(employee);
        await Context.SaveChangesAsync(_token);
        var assignment = await repository.AddAsync(new EventEmployee
        {
            EventId = eventEntity.EventId, EmployeeId = employee.EmployeeId, Task = "Setup",
        }, _token);

        assignment.Task = "Cleanup";
        assignment.Status = EventEmployee.AssignmentStatus.Completed;
        await repository.UpdateAsync(assignment, _token);
        var updated = await repository.GetByAssignmentIdAsync(assignment.AssignmentId, _token);
        Assert.Equal(("Cleanup", EventEmployee.AssignmentStatus.Completed), (updated!.Task, updated.Status));

        await repository.DeleteAsync(assignment, _token);
        Assert.Empty(await repository.GetByEventIdAsync(eventEntity.EventId, _token));
    }
}
