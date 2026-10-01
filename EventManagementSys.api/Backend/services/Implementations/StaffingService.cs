using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class StaffService(
    IStaffingRepository staffingRepository) : IStaffingService
{
    public async Task<StaffDto> AssignAsync(int eventId,AssignStaffDto request,CancellationToken cancellationToken)
    {
        EventEmployee? existingAssignment = await staffingRepository.GetAsync(eventId,request.EmployeeId,cancellationToken);

        if (existingAssignment is not null)
        {
            throw new InvalidOperationException("This employee is already assigned to this event.");
        }

        EventEmployee assignment = new()
        {
            EventId = eventId,
            EmployeeId = request.EmployeeId,
            Task = request.Task,
            Deadline = request.Deadline,
            Status = EventEmployee.AssignmentStatus.Pending
        };

        EventEmployee createdAssignment = await staffingRepository.AddAsync(assignment,cancellationToken);

        EventEmployee? assignmentWithEmployee = await staffingRepository.GetAsync(createdAssignment.EventId,createdAssignment.EmployeeId,cancellationToken);

        return MapToResponse(assignmentWithEmployee ?? createdAssignment);
    }

    public async Task<List<StaffDto>> GetStaffAsync(int eventId,CancellationToken cancellationToken)
    {
        List<EventEmployee> assignments = await staffingRepository.GetByEventIdAsync(eventId,cancellationToken);

        return assignments
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<bool> UpdateAsync(int eventId,int employeeId,UpdateStaffDto request,CancellationToken cancellationToken)
    {
        EventEmployee? assignment = await staffingRepository.GetAsync(eventId,employeeId,cancellationToken);

        if (assignment is null)
        {
            return false;
        }

        assignment.Task = request.Task;
        assignment.Deadline = request.Deadline;
        assignment.Status = request.Status;

        await staffingRepository.UpdateAsync(assignment,cancellationToken);

        return true;
    }

    public async Task<bool> RemoveAsync(int eventId,int employeeId,CancellationToken cancellationToken)
    {
        EventEmployee? assignment = await staffingRepository.GetAsync(eventId,employeeId,cancellationToken);

        if (assignment is null)
        {
            return false;
        }

        await staffingRepository.DeleteAsync(assignment,cancellationToken);

        return true;
    }

    private static StaffDto MapToResponse(EventEmployee assignment)
    {
        return new StaffDto
        {
            EmployeeId = assignment.EmployeeId,
            Name = assignment.EmployeeNavigation?.Name ?? string.Empty,
            JobTitle = assignment.EmployeeNavigation?.JobTitle ?? string.Empty,
            Task = assignment.Task,
            Deadline = assignment.Deadline,
            Status = assignment.Status.ToString()
        };
    }
}