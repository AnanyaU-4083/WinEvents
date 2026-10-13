using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Implementations;
using Xunit;

namespace EventManagementSys.api.Tests.Repositories;

public class UserRepositoryTests : SqliteRepositoryTestBase
{
    private readonly CancellationToken _token = CancellationToken.None;

}
