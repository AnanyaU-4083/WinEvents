using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Interfaces;

namespace EventManagementSys.api.Services.Implementations;

public class EventService(IEventRepository eventRepository) : IEventService
{
    public async Task<List<EventResponseDto>> GetAllAsync(bool? upcomingOnly,CancellationToken cancellationToken)
{
    List<Event> events = await eventRepository.GetAllAsync(upcomingOnly,cancellationToken);

    return events
        .Select(MapToResponse)
        .ToList();
}

    public async Task<EventResponseDto?> GetByIdAsync(int eventId,CancellationToken cancellationToken)
    {
        Event? eventEntity = await eventRepository.GetByIdAsync(eventId,cancellationToken);

        return eventEntity is null
            ? null
            : MapToResponse(eventEntity);
    }

    public async Task<EventResponseDto> CreateAsync(CreateEventDto request,int? createdByUserId,CancellationToken cancellationToken)
    {
        Event eventEntity = new()
        {
            EventName = request.EventName,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            VenueId = request.VenueId,
            Budget = request.Budget,
            EventType = request.EventType,
            OrgId = request.OrgId
        };

        Event createdEvent = await eventRepository.AddAsync(eventEntity,cancellationToken);

        return MapToResponse(createdEvent);
    }

    public async Task<bool> UpdateAsync(int eventId,UpdateEventDto request,CancellationToken cancellationToken)
    {
        Event? eventEntity = await eventRepository.GetByIdAsync(eventId,cancellationToken);

        if (eventEntity is null)
        {
            return false;
        }

        if (eventEntity.Status == EventStatus.Cancelled)
        {
            throw new InvalidOperationException(
        "A cancelled event cannot be updated.");
        }

        if (request.EventName is not null)
        {
            eventEntity.EventName = request.EventName;
        }

        if (request.StartDate.HasValue)
        {
            eventEntity.StartDate = request.StartDate.Value;
        }

        if (request.EndDate.HasValue)
        {
            eventEntity.EndDate = request.EndDate.Value;
        }

        if (request.Budget.HasValue)
        {
            eventEntity.Budget = request.Budget.Value;
        }

        if (request.EventType.HasValue)
        {
            eventEntity.EventType = request.EventType.Value;
        }

        if (request.VenueId.HasValue)
        {
            eventEntity.VenueId = request.VenueId.Value;
        }

        if (request.OrgId.HasValue)
        {
            eventEntity.OrgId = request.OrgId.Value;
        }
        

        

        await eventRepository.UpdateAsync(eventEntity,cancellationToken);

        return true;
    }

    public async Task<bool> CancelAsync(
    int eventId,
    CancellationToken cancellationToken)
    {
    Event? eventEntity =
        await eventRepository.GetByIdAsync(
            eventId,
            cancellationToken);

    if (eventEntity is null)
    {
        return false;
    }
    if (eventEntity.Status == EventStatus.Cancelled)
    {
        throw new InvalidOperationException(
            "Event is already cancelled.");
    }

    if (eventEntity.Status == EventStatus.Completed)
    {
        throw new InvalidOperationException(
            "A completed event cannot be cancelled.");
    }

    eventEntity.Status = EventStatus.Cancelled;

    await eventRepository.UpdateAsync(
        eventEntity,
        cancellationToken);

    return true;
    }

    private static EventResponseDto MapToResponse(Event eventEntity)
    {
        return new EventResponseDto
        {
            EventId = eventEntity.EventId,
            EventName = eventEntity.EventName,
            StartDate = eventEntity.StartDate,
            EndDate = eventEntity.EndDate,
            Budget = eventEntity.Budget,
            EventType = eventEntity.EventType,
            Status = eventEntity.Status,
            VenueId = eventEntity.VenueId,
            OrgId = eventEntity.OrgId
        };
    }
}