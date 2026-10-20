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
    public static TheoryData<Exception, int, string> ExceptionCases => new()
    {
        { new UnauthorizedAccessException("Access denied"), (int)HttpStatusCode.Unauthorized, "Access denied" },
        { new KeyNotFoundException("Record not found"), (int)HttpStatusCode.NotFound, "Record not found" },
        { new ArgumentException("Invalid argument"), (int)HttpStatusCode.BadRequest, "Invalid argument" },
        { new InvalidOperationException("Invalid operation"), (int)HttpStatusCode.BadRequest, "Invalid operation" },
        { new Exception("Sensitive internal details"), (int)HttpStatusCode.InternalServerError, "Internal Server Error" },
    };

    [Theory]
    [MemberData(nameof(ExceptionCases))]
    public async Task InvokeAsync_WhenNextThrows_WritesMappedJsonResponseAndLogsException(
        Exception exception,
        int expectedStatusCode,
        string expectedMessage)
    {
        var logger = new Mock<ILogger<ExceptionHandling>>();
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionHandling(_ => throw exception, logger.Object);

        await middleware.InvokeAsync(context);

        Assert.Equal(expectedStatusCode, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body, leaveOpen: true);
        var json = await reader.ReadToEndAsync();
        var response = JsonSerializer.Deserialize<ErrorResponse>(json);

        Assert.NotNull(response);
        Assert.Equal(expectedStatusCode, response.StatusCode);
        Assert.Equal(expectedMessage, response.Message);

        var logInvocation = Assert.Single(logger.Invocations);
        Assert.Equal(LogLevel.Error, logInvocation.Arguments[0]);
        Assert.Equal("Unhandled Exception Occurred", logInvocation.Arguments[2]?.ToString());
        Assert.Same(exception, logInvocation.Arguments[3]);
    }

    [Fact]
    public async Task InvokeAsync_WhenNextSucceeds_PassesThroughWithoutLogging()
    {
        var logger = new Mock<ILogger<ExceptionHandling>>();
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionHandling(
            async httpContext =>
            {
                httpContext.Response.StatusCode = (int)HttpStatusCode.NoContent;
                await httpContext.Response.WriteAsync("completed");
            },
            logger.Object);

        await middleware.InvokeAsync(context);

        Assert.Equal((int)HttpStatusCode.NoContent, context.Response.StatusCode);
        Assert.Empty(logger.Invocations);
    }
}