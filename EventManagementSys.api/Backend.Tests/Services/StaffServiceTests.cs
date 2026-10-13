using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Services;

public class StaffServiceTests
{
    private readonly Mock<IStaffingRepository> _repository = new();
    private readonly StaffService _service;
    private readonly CancellationToken _cancellationToken = CancellationToken.None;

    public StaffServiceTests()
    {
        _service = new StaffService(_repository.Object);
    }

    [Fact]
    public async Task AssignAsync_TrimsTaskAndAllowsAnotherDistinctTaskForSameEmployeeAndEvent()
    {
        var existingAssignment = new EventEmployee
        {
            AssignmentId = 10,
            EventId = 3,
            EmployeeId = 7,
            Task = "Set up chairs",
        };

        _repository
            .Setup(repository => repository.GetByEventIdAsync(3, _cancellationToken))
            .ReturnsAsync([existingAssignment]);
        _repository
            .Setup(repository => repository.AddAsync(
                It.IsAny<EventEmployee>(),
                _cancellationToken))
            .Returns((EventEmployee assignment, CancellationToken _) =>
            {
                assignment.AssignmentId = 11;
                return Task.FromResult(assignment);
            });
        _repository
            .Setup(repository => repository.GetByAssignmentIdAsync(11, _cancellationToken))
            .ReturnsAsync((EventEmployee?)null);

        StaffDto result = await _service.AssignAsync(
            3,
            new AssignStaffDto { EmployeeId = 7, Task = "  Check sound system  " },
            _cancellationToken);

        Assert.Equal("Check sound system", result.Task);
        Assert.Equal(11, result.AssignmentId);
        _repository.Verify(repository => repository.AddAsync(
            It.Is<EventEmployee>(assignment =>
                assignment.EventId == 3 &&
                assignment.EmployeeId == 7 &&
                assignment.Task == "Check sound system"),
            _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task AssignAsync_RejectsDuplicateTaskIgnoringCaseAndWhitespace()
    {
        _repository
            .Setup(repository => repository.GetByEventIdAsync(3, _cancellationToken))
            .ReturnsAsync(
            [
                new EventEmployee
                {
                    EventId = 3,
                    EmployeeId = 7,
                    Task = " Prepare stage ",
                },
            ]);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.AssignAsync(
                3,
                new AssignStaffDto { EmployeeId = 7, Task = "prepare STAGE" },
                _cancellationToken));

        Assert.Equal(
            "This task is already assigned to this employee for this event.",
            exception.Message);
        _repository.Verify(repository => repository.AddAsync(
            It.IsAny<EventEmployee>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AssignAsync_AllowsSameTaskForDifferentEmployee()
    {
        _repository
            .Setup(repository => repository.GetByEventIdAsync(3, _cancellationToken))
            .ReturnsAsync(
            [
                new EventEmployee
                {
                    EventId = 3,
                    EmployeeId = 8,
                    Task = "Prepare stage",
                },
            ]);
        _repository
            .Setup(repository => repository.AddAsync(
                It.IsAny<EventEmployee>(),
                _cancellationToken))
            .Returns((EventEmployee assignment, CancellationToken _) =>
                Task.FromResult(assignment));

        await _service.AssignAsync(
            3,
            new AssignStaffDto { EmployeeId = 7, Task = "Prepare stage" },
            _cancellationToken);

        _repository.Verify(repository => repository.AddAsync(
            It.Is<EventEmployee>(assignment => assignment.EmployeeId == 7),
            _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_RejectsDuplicateTaskOnAnotherAssignment()
    {
        EventEmployee assignment = new()
        {
            AssignmentId = 10,
            EventId = 3,
            EmployeeId = 7,
            Task = "Old task",
        };
        _repository
            .Setup(repository => repository.GetByAssignmentIdAsync(10, _cancellationToken))
            .ReturnsAsync(assignment);
        _repository
            .Setup(repository => repository.GetByEventIdAsync(3, _cancellationToken))
            .ReturnsAsync(
            [
                assignment,
                new EventEmployee
                {
                    AssignmentId = 11,
                    EventId = 3,
                    EmployeeId = 7,
                    Task = "Prepare stage",
                },
            ]);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UpdateAsync(
            10,
            new UpdateStaffDto { Task = " prepare STAGE " },
            _cancellationToken));

        _repository.Verify(repository => repository.UpdateAsync(
            It.IsAny<EventEmployee>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_AllowsAssignmentToKeepItsOwnTaskAndUpdatesFields()
    {
        EventEmployee assignment = new()
        {
            AssignmentId = 10,
            EventId = 3,
            EmployeeId = 7,
            Task = "Prepare stage",
        };
        _repository
            .Setup(repository => repository.GetByAssignmentIdAsync(10, _cancellationToken))
            .ReturnsAsync(assignment);
        _repository
            .Setup(repository => repository.GetByEventIdAsync(3, _cancellationToken))
            .ReturnsAsync([assignment]);

        DateTime deadline = new(2026, 10, 20, 9, 30, 0, DateTimeKind.Utc);
        bool result = await _service.UpdateAsync(
            10,
            new UpdateStaffDto
            {
                Task = " Prepare stage ",
                Deadline = deadline,
                Status = EventEmployee.AssignmentStatus.InProgress,
            },
            _cancellationToken);

        Assert.True(result);
        Assert.Equal("Prepare stage", assignment.Task);
        Assert.Equal(deadline, assignment.Deadline);
        Assert.Equal(EventEmployee.AssignmentStatus.InProgress, assignment.Status);
        _repository.Verify(repository => repository.UpdateAsync(assignment, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalseWhenAssignmentDoesNotExist()
    {
        _repository
            .Setup(repository => repository.GetByAssignmentIdAsync(99, _cancellationToken))
            .ReturnsAsync((EventEmployee?)null);

        bool result = await _service.UpdateAsync(
            99,
            new UpdateStaffDto { Task = "Any task" },
            _cancellationToken);

        Assert.False(result);
        _repository.Verify(repository => repository.GetByEventIdAsync(
            It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RemoveAsync_DeletesExistingAssignment()
    {
        EventEmployee assignment = new() { AssignmentId = 10 };
        _repository
            .Setup(repository => repository.GetByAssignmentIdAsync(10, _cancellationToken))
            .ReturnsAsync(assignment);

        bool result = await _service.RemoveAsync(10, _cancellationToken);

        Assert.True(result);
        _repository.Verify(repository => repository.DeleteAsync(assignment, _cancellationToken), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_ReturnsFalseWhenAssignmentDoesNotExist()
    {
        _repository
            .Setup(repository => repository.GetByAssignmentIdAsync(99, _cancellationToken))
            .ReturnsAsync((EventEmployee?)null);

        bool result = await _service.RemoveAsync(99, _cancellationToken);

        Assert.False(result);
        _repository.Verify(repository => repository.DeleteAsync(
            It.IsAny<EventEmployee>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }
}
