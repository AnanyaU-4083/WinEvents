using EventManagementSys.api.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EventManagementSys.api.Tests.Repositories;

public abstract class SqliteRepositoryTestBase : IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("Data Source=:memory:");

    protected AppDbContext Context { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        Context = new AppDbContext(options);
        await Context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await Context.DisposeAsync();
        await _connection.DisposeAsync();
    }
}
