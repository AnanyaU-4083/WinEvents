using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;

namespace EventManagementSys.api.Tests.Repositories;

public class AttendeeRepositoryTests : SqliteRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Fact]
    public async Task AddGetByIdGetByEmailAndGetAllReadPersistedAttendees()
    {
        var repository = new AttendeeRepository(Context);
        var user = new User { Username = "asha", Email = "asha@example.com" };
        Context.Users.Add(user);
        await Context.SaveChangesAsync(_token);
        var attendee = new Attendee { UserId = user.UserId, Name = "Asha", Email = "public@example.com", Phone = "123", Ticket = "VIP" };

        Attendee added = await repository.AddAsync(attendee, _token);

        Assert.True(added.AttendeeId > 0);
        Assert.Equal("Asha", (await repository.GetByIdAsync(added.AttendeeId, _token))!.Name);
        Assert.Equal(added.AttendeeId, (await repository.GetByEmailAsync("public@example.com", _token))!.AttendeeId);
        Assert.Equal(added.AttendeeId, Assert.Single(await repository.GetAllAsync(_token)).AttendeeId);
    }

    [Fact]
    public async Task UserEmailLookupIncludesTheRelatedUserAndReturnsNullForUnknownValues()
    {
        var repository = new AttendeeRepository(Context);
        var user = new User { Username = "asha", Email = "asha@example.com" };
        Context.Users.Add(user);
        await Context.SaveChangesAsync(_token);
        Context.Attendees.Add(new Attendee { UserId = user.UserId, Name = "Asha", Email = "other@example.com" });
        await Context.SaveChangesAsync(_token);

        var attendee = await repository.GetByUserEmailAsync("asha@example.com", _token);

        Assert.Equal("Asha", attendee!.Name);
        Assert.Equal("asha@example.com", attendee.User!.Email);
        Assert.Null(await repository.GetByUserEmailAsync("missing@example.com", _token));
        Assert.Null(await repository.GetByEmailAsync("missing@example.com", _token));
        Assert.Null(await repository.GetByIdAsync(-1, _token));
    }

    [Fact]
    public async Task UpdateAndDeletePersistChanges()
    {
        var repository = new AttendeeRepository(Context);
        var attendee = await repository.AddAsync(new Attendee { Name = "Old", Email = "old@example.com" }, _token);

        attendee.Name = "Updated";
        await repository.UpdateAsync(attendee, _token);
        Assert.Equal("Updated", (await repository.GetByIdAsync(attendee.AttendeeId, _token))!.Name);

        await repository.DeleteAsync(attendee, _token);
        Assert.Null(await repository.GetByIdAsync(attendee.AttendeeId, _token));
    }
}
