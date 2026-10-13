using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Services;

public class AttendeeServiceTests
{
    private readonly Mock<IAttendeeRepository> _repository = new();
    private readonly AttendeeService _service;
    private readonly CancellationToken _token = CancellationToken.None;

    public AttendeeServiceTests() => _service = new AttendeeService(_repository.Object);

    [Fact]
    public async Task ReadsAndCreatesAttendees()
    {
        var attendee = new Attendee { AttendeeId = 4, Name = "Asha", Email = "asha@example.com", Phone = "123", Ticket = "VIP" };
        _repository.Setup(repository => repository.GetAllAsync(_token)).ReturnsAsync([attendee]);
        _repository.Setup(repository => repository.GetByIdAsync(4, _token)).ReturnsAsync(attendee);
        _repository.Setup(repository => repository.GetByEmailAsync("asha@example.com", _token)).ReturnsAsync(attendee);
        _repository.Setup(repository => repository.AddAsync(It.IsAny<Attendee>(), _token))
            .Returns((Attendee created, CancellationToken _) => Task.FromResult(created));

        var all = await _service.GetAllAsync(_token);
        var byId = await _service.GetByIdAsync(4, _token);
        var me = await _service.GetMeAsync("asha@example.com", _token);
        var created = await _service.CreateAsync(new CreateAttendeeDto { Name = "Asha", Email = "asha@example.com", Phone = "123", Ticket = "VIP" }, _token);

        Assert.Equal("Asha", Assert.Single(all).Name);
        Assert.Equal(4, byId!.AttendeeId);
        Assert.Equal("VIP", me!.Ticket);
        Assert.Equal("asha@example.com", created.Email);
    }

    [Fact]
    public async Task GetByIdAndGetMeReturnNullWhenNotFound()
    {
        _repository.Setup(repository => repository.GetByIdAsync(4, _token)).ReturnsAsync((Attendee?)null);
        _repository.Setup(repository => repository.GetByEmailAsync("missing@example.com", _token)).ReturnsAsync((Attendee?)null);

        Assert.Null(await _service.GetByIdAsync(4, _token));
        Assert.Null(await _service.GetMeAsync("missing@example.com", _token));
    }

    [Fact]
    public async Task UpdateChangesOnlyProvidedFields()
    {
        var attendee = new Attendee { AttendeeId = 4, Name = "Asha", Email = "old@example.com", Phone = "123", Ticket = "Standard" };
        _repository.Setup(repository => repository.GetByIdAsync(4, _token)).ReturnsAsync(attendee);

        bool result = await _service.UpdateAsync(4, new UpdateAttendeeDto { Name = "New name", Email = "new@example.com", Phone = "456", Ticket = "VIP" }, _token);

        Assert.True(result);
        Assert.Equal("New name", attendee.Name);
        Assert.Equal("new@example.com", attendee.Email);
        Assert.Equal("456", attendee.Phone);
        Assert.Equal("VIP", attendee.Ticket);
        _repository.Verify(repository => repository.UpdateAsync(attendee, _token), Times.Once);
    }

    [Fact]
    public async Task UpdateReturnsFalseForMissingAttendee()
    {
        _repository.Setup(repository => repository.GetByIdAsync(4, _token)).ReturnsAsync((Attendee?)null);
        Assert.False(await _service.UpdateAsync(4, new UpdateAttendeeDto(), _token));
        _repository.Verify(repository => repository.UpdateAsync(It.IsAny<Attendee>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeleteReturnsTrueOnlyWhenAttendeeExists()
    {
        var attendee = new Attendee { AttendeeId = 4 };
        _repository.SetupSequence(repository => repository.GetByIdAsync(4, _token)).ReturnsAsync(attendee).ReturnsAsync((Attendee?)null);

        Assert.True(await _service.DeleteAsync(4, _token));
        Assert.False(await _service.DeleteAsync(4, _token));
        _repository.Verify(repository => repository.DeleteAsync(attendee, _token), Times.Once);
    }
}
