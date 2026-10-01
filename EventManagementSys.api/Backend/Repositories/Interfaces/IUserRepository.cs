using EventManagementSys.api.Models;

namespace EventManagementSys.api.Repository.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username,CancellationToken cancellationToken);

    Task<User?> GetByEmailAsync(string email,CancellationToken cancellationToken);

    Task<User?> GetByIdAsync(int userId,CancellationToken cancellationToken);

    Task<User> AddAsync(User user,CancellationToken cancellationToken);
}