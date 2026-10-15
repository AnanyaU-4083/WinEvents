using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;

namespace EventManagementSys.api.Tests.Repositories;

public class UserRepositoryTests : UnitRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

    [Fact]
    public async Task UserQueriesReturnMatchingUserOrNull()
    {
        var expected = new User { UserId = 7, Username = "asha", Email = "asha@example.com" };
        Context.Users.Add(expected);
        var repository = new UserRepository(Context);

        Assert.Same(expected, await repository.GetByUsernameAsync("asha", _token));
        Assert.Same(expected, await repository.GetByEmailAsync("asha@example.com", _token));
        Assert.Same(expected, await repository.GetByIdAsync(7, _token));
        Assert.Null(await repository.GetByUsernameAsync("missing", _token));
        Assert.Null(await repository.GetByEmailAsync("missing@example.com", _token));
        Assert.Null(await repository.GetByIdAsync(-1, _token));
    }

    [Fact]
    public async Task AddUserSavesAndReturnsTheSameInstance()
    {
        var repository = new UserRepository(Context);
        var user = new User { Username = "asha", Email = "asha@example.com" };

        User result = await repository.AddAsync(user, _token);

        Assert.Same(user, result);
        Assert.Same(user, await repository.GetByEmailAsync("asha@example.com", _token));
    }

}
