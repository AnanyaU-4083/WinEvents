using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EventManagementSys.api.Repository.Implementations;

public class UserRepository(
    AppDbContext dbContext) : IUserRepository
{
    public async Task<User?> GetByUsernameAsync(
        string username,
        CancellationToken cancellationToken)
    {
        return await dbContext.Users
            .FirstOrDefaultAsync(
                user => user.Username == username,
                cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken)
    {
        return await dbContext.Users
            .FirstOrDefaultAsync(
                user => user.Email == email,
                cancellationToken);
    }

    public async Task<User?> GetByIdAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Users
            .FirstOrDefaultAsync(
                user => user.UserId == userId,
                cancellationToken);
    }

    public async Task<User> AddAsync(
        User user,
        CancellationToken cancellationToken)
    {
        await dbContext.Users.AddAsync(
            user,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return user;
    }
}