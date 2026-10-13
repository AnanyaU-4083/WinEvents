using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Services;

public class VenueServiceTests
{
    private readonly Mock<IVenueRepository> _repository = new();
    private readonly VenueService _service;
    private readonly CancellationToken _token = CancellationToken.None;

    public VenueServiceTests() => _service = new VenueService(_repository.Object);

    [Fact]
    public async Task ReadsAndCreatesVenues()
    {
        var venue = new Venue { VenueId = 8, Address = "Town Hall", Capacity = 120 };
        _repository.Setup(repository => repository.GetAllAsync(_token)).ReturnsAsync([venue]);
        _repository.Setup(repository => repository.GetByIdAsync(8, _token)).ReturnsAsync(venue);
        _repository.Setup(repository => repository.AddAsync(It.IsAny<Venue>(), _token)).ReturnsAsync(venue);

        Assert.Equal("Town Hall", Assert.Single(await _service.GetAllAsync(_token)).Address);
        Assert.Equal(120, (await _service.GetByIdAsync(8, _token))!.Capacity);
        Assert.Equal(8, (await _service.CreateAsync(new CreateVenueDto { Address = "Town Hall", Capacity = 120 }, _token)).VenueId);
    }

    [Fact]
    public async Task GetByIdReturnsNullForUnknownVenue()
    {
        _repository.Setup(repository => repository.GetByIdAsync(8, _token)).ReturnsAsync((Venue?)null);
        Assert.Null(await _service.GetByIdAsync(8, _token));
    }

    [Fact]
    public async Task AvailabilityCalculatesRemainingSeatsAndFloorsAtZero()
    {
        var venue = new Venue { VenueId = 8, Capacity = 100 };
        _repository.Setup(repository => repository.GetByIdAsync(8, _token)).ReturnsAsync(venue);
        _repository.Setup(repository => repository.GetCurrentRegistrationsAsync(8, 4, _token)).ReturnsAsync(65);
        var available = await _service.GetAvailabilityAsync(8, 4, _token);
        Assert.Equal((100, 65, 35), (available!.Capacity, available.CurrentRegistrations, available.SeatsRemaining));

        _repository.Setup(repository => repository.GetCurrentRegistrationsAsync(8, 4, _token)).ReturnsAsync(130);
        Assert.Equal(0, (await _service.GetAvailabilityAsync(8, 4, _token))!.SeatsRemaining);
    }

    [Fact]
    public async Task AvailabilityReturnsNullWithoutQueryingRegistrationsWhenVenueIsMissing()
    {
        _repository.Setup(repository => repository.GetByIdAsync(8, _token)).ReturnsAsync((Venue?)null);
        Assert.Null(await _service.GetAvailabilityAsync(8, 4, _token));
        _repository.Verify(repository => repository.GetCurrentRegistrationsAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
