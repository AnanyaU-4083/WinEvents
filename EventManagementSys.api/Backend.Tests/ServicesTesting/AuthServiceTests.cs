using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EventManagementSys.api.DTOs;
using EventManagementSys.api.Models;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Services;

public class AuthServiceTests
{
    private const string SigningKey = "a-test-signing-key-that-is-long-enough-for-hmac-sha256";
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IAttendeeRepository> _attendees = new();
    private readonly CancellationToken _token = CancellationToken.None;

    private AuthService CreateService(Dictionary<string, string?>? settings = null)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings ?? new Dictionary<string, string?>
            {
                ["Jwt:Key"] = SigningKey,
            })
            .Build();
        return new AuthService(_users.Object, _attendees.Object, configuration);
    }

    [Fact]
    public async Task RegisterRejectsExistingUsernameBeforeCheckingEmail()
    {
        _users.Setup(repository => repository.GetByUsernameAsync("asha", _token)).ReturnsAsync(new User());

        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateService().RegisterAsync(
            new RegisterUserDto { Username = "asha", Email = "asha@example.com", Password = "secret" }, _token));

        _users.Verify(repository => repository.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RegisterRejectsExistingEmail()
    {
        _users.Setup(repository => repository.GetByUsernameAsync("asha", _token)).ReturnsAsync((User?)null);
        _users.Setup(repository => repository.GetByEmailAsync("asha@example.com", _token)).ReturnsAsync(new User());

        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateService().RegisterAsync(
            new RegisterUserDto { Username = "asha", Email = "asha@example.com", Password = "secret" }, _token));
        _users.Verify(repository => repository.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RegisterCreatesAttendeeUserWithHashedPassword()
    {
        _users.Setup(repository => repository.GetByUsernameAsync("asha", _token)).ReturnsAsync((User?)null);
        _users.Setup(repository => repository.GetByEmailAsync("asha@example.com", _token)).ReturnsAsync((User?)null);
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>(), _token))
            .Returns((User user, CancellationToken _) =>
            {
                user.UserId = 9;
                return Task.FromResult(user);
            });

        var result = await CreateService().RegisterAsync(new RegisterUserDto
        {
            Username = "asha", Email = "asha@example.com", Password = "secret", FirstName = "Asha", LastName = "Rao",
        }, _token);

        Assert.Equal((9, "Attendee", "Asha"), (result.UserId, result.Role, result.FirstName));
        _users.Verify(repository => repository.AddAsync(It.Is<User>(user =>
            user.PasswordHash != "secret" && BCrypt.Net.BCrypt.Verify("secret", user.PasswordHash!) &&
            user.Role == "Attendee"), _token), Times.Once);
    }

    [Fact]
    public async Task LoginRejectsUnknownUserExternalAccountAndWrongPassword()
    {
        var service = CreateService();
        _users.Setup(repository => repository.GetByUsernameAsync("unknown", _token)).ReturnsAsync((User?)null);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(new LoginUserDto { Username = "unknown" }, _token));

        _users.Setup(repository => repository.GetByUsernameAsync("external", _token)).ReturnsAsync(new User { PasswordHash = null });
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(new LoginUserDto { Username = "external" }, _token));

        _users.Setup(repository => repository.GetByUsernameAsync("asha", _token)).ReturnsAsync(new User
        {
            Username = "asha", Email = "asha@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct"),
        });
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.LoginAsync(new LoginUserDto { Username = "asha", Password = "wrong" }, _token));
    }

    [Fact]
    public async Task LoginCreatesTokenUsingDefaultIssuerAndAudience()
    {
        var user = new User
        {
            UserId = 9, Username = "asha", Email = "asha@example.com", Role = "Employee",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("secret"),
        };
        _users.Setup(repository => repository.GetByUsernameAsync("asha", _token)).ReturnsAsync(user);

        var response = await CreateService().LoginAsync(new LoginUserDto { Username = "asha", Password = "secret" }, _token);
        JwtSecurityToken token = new JwtSecurityTokenHandler().ReadJwtToken(response.Token);

        Assert.Equal((9, "asha", "Employee"), (response.UserId, response.Username, response.Role));
        Assert.Equal("EventManagementSys.api", token.Issuer);
        Assert.Contains("EventManagementSys.api", token.Audiences);
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.NameIdentifier && claim.Value == "9");
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.Email && claim.Value == "asha@example.com");
    }

    [Fact]
    public async Task LoginUsesConfiguredIssuerAndAudienceAndRequiresSigningKey()
    {
        var user = new User { UserId = 9, Username = "asha", Email = "asha@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("secret") };
        _users.Setup(repository => repository.GetByUsernameAsync("asha", _token)).ReturnsAsync(user);

        var service = CreateService(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = SigningKey,
            ["Jwt:Issuer"] = "custom-issuer",
            ["Jwt:Audience"] = "custom-audience",
        });
        JwtSecurityToken token = new JwtSecurityTokenHandler().ReadJwtToken((await service.LoginAsync(new LoginUserDto { Username = "asha", Password = "secret" }, _token)).Token);
        Assert.Equal("custom-issuer", token.Issuer);
        Assert.Contains("custom-audience", token.Audiences);

        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateService(new Dictionary<string, string?>())
            .LoginAsync(new LoginUserDto { Username = "asha", Password = "secret" }, _token));
    }

    [Fact]
    public async Task MicrosoftUserLookupReturnsExistingUserWithoutCreatingAttendee()
    {
        var existing = new User { UserId = 4, Username = "existing", Email = "user@example.com", Role = "Employee" };
        _users.Setup(repository => repository.GetByEmailAsync("user@example.com", _token)).ReturnsAsync(existing);

        var result = await CreateService().GetOrCreateMicrosoftUserAsync("user@example.com", "Name", _token);

        Assert.Equal(4, result.UserId);
        _users.Verify(repository => repository.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
        _attendees.Verify(repository => repository.AddAsync(It.IsAny<Attendee>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MicrosoftUserCreationAddsUserAndAttendeeWithDisplayNameFallback()
    {
        _users.Setup(repository => repository.GetByEmailAsync(It.IsAny<string>(), _token)).ReturnsAsync((User?)null);
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>(), _token))
            .Returns((User user, CancellationToken _) =>
            {
                user.UserId = 12;
                return Task.FromResult(user);
            });

        await CreateService().GetOrCreateMicrosoftUserAsync("jane@example.com", null, _token);
        await CreateService().GetOrCreateMicrosoftUserAsync("john@example.com", "John Doe", _token);

        _users.Verify(repository => repository.AddAsync(It.Is<User>(user =>
            user.Username == "jane" && user.PasswordHash == null && user.FirstName == null), _token), Times.Once);
        _attendees.Verify(repository => repository.AddAsync(It.Is<Attendee>(attendee =>
            attendee.Email == "jane@example.com" && attendee.Name == "jane" && attendee.UserId == 12), _token), Times.Once);
        _attendees.Verify(repository => repository.AddAsync(It.Is<Attendee>(attendee =>
            attendee.Email == "john@example.com" && attendee.Name == "John Doe"), _token), Times.Once);
    }
}
