using System.Net;
using System.Text.Json;
using EventManagementSys.api.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EventManagementSys.api.Tests.Middleware;

public class ExceptionHandlingTests
{
    private readonly Mock<ILogger<ExceptionHandling>> _logger = new();

}
