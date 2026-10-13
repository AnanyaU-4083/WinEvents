using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class StaffService(
    IStaffingRepository staffingRepository) : IStaffingService
{
    public async Task<StaffDto> AssignAsync(
        int eventId,
        AssignStaffDto request,
        CancellationToken cancellationToken)
    {
        string taskName = request.Task.Trim();
        List<EventEmployee> eventAssignments =
            await staffingRepository.GetByEventIdAsync(
                eventId,
                cancellationToken);

        bool duplicateTask = eventAssignments.Any(assignment =>
            assignment.EmployeeId == request.EmployeeId &&
            string.Equals(
                assignment.Task.Trim(),
                taskName,
                StringComparison.OrdinalIgnoreCase));

        if (duplicateTask)
        {
            throw new InvalidOperationException(
                "This task is already assigned to this employee for this event.");
        }
        EventEmployee assignment = new()
        {
            EventId = eventId,
            EmployeeId = request.EmployeeId,
            Task = taskName,
            Deadline = request.Deadline,
            Status =
                EventEmployee.AssignmentStatus.Pending
        };

        EventEmployee createdAssignment =
            await staffingRepository.AddAsync(
                assignment,
                cancellationToken);

        EventEmployee? assignmentWithEmployee =
            await staffingRepository.GetByAssignmentIdAsync(
                createdAssignment.AssignmentId,
                cancellationToken);

        return MapToResponse(
            assignmentWithEmployee ?? createdAssignment);
    }

    public async Task<List<StaffDto>> GetStaffAsync(
        int eventId,
        CancellationToken cancellationToken)
    {
        List<EventEmployee> assignments =
            await staffingRepository.GetByEventIdAsync(
                eventId,
                cancellationToken);

        return assignments
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<StaffDto>> GetTasksByEmployeeIdAsync(
        int employeeId,
        CancellationToken cancellationToken)
    {
        List<EventEmployee> assignments =
            await staffingRepository.GetByEmployeeIdAsync(
                employeeId,
                cancellationToken);

        return assignments
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<List<StaffDto>> GetTasksByEmployeeEmailAsync(
        string email,
        CancellationToken cancellationToken)
    {
        List<EventEmployee> assignments =
            await staffingRepository.GetByEmployeeEmailAsync(
                email,
                cancellationToken);

        return assignments
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<bool> UpdateAsync(
        int assignmentId,
        UpdateStaffDto request,
        CancellationToken cancellationToken)
    {
        EventEmployee? assignment =
            await staffingRepository.GetByAssignmentIdAsync(
                assignmentId,
                cancellationToken);

        if (assignment is null)
        {
            return false;
        }

        List<EventEmployee> eventAssignments =
            await staffingRepository.GetByEventIdAsync(
                assignment.EventId,
                cancellationToken);
        string taskName = request.Task.Trim();

        bool duplicateTask = eventAssignments.Any(existing =>
            existing.AssignmentId != assignmentId &&
            existing.EmployeeId == assignment.EmployeeId &&
            string.Equals(
                existing.Task.Trim(),
                taskName,
                StringComparison.OrdinalIgnoreCase));

        if (duplicateTask)
        {
            throw new InvalidOperationException(
                "This task is already assigned to this employee for this event.");
        }

        assignment.Task = taskName;
        assignment.Deadline = request.Deadline;
        assignment.Status = request.Status;

        await staffingRepository.UpdateAsync(
            assignment,
            cancellationToken);

        return true;
    }

    public async Task<bool> RemoveAsync(
        int assignmentId,
        CancellationToken cancellationToken)
    {
        EventEmployee? assignment =
            await staffingRepository.GetByAssignmentIdAsync(
                assignmentId,
                cancellationToken);

        if (assignment is null)
        {
            return false;
        }

        await staffingRepository.DeleteAsync(
            assignment,
            cancellationToken);

        return true;
    }

    private static StaffDto MapToResponse(
        EventEmployee assignment)
    {
        return new StaffDto
        {
            AssignmentId = assignment.AssignmentId,
            EventId = assignment.EventId,

            EventName =
                assignment.EventNavigation?.EventName
                ?? string.Empty,

            EmployeeId = assignment.EmployeeId,

            Name =
                assignment.EmployeeNavigation?.Name
                ?? string.Empty,

            JobTitle =
                assignment.EmployeeNavigation?.JobTitle
                ?? string.Empty,

            Task = assignment.Task,

            Deadline = assignment.Deadline.HasValue
                ? DateTime.SpecifyKind(
                    assignment.Deadline.Value,
                    DateTimeKind.Utc)
                : null,

            Status = assignment.Status.ToString()
        };
    }
}