using System.Net;
using System.Text.Json;

namespace EventManagementSys.api.Exceptions;

public class ExceptionHandling
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandling> _logger;

    public ExceptionHandling(
        RequestDelegate next,
        ILogger<ExceptionHandling> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled Exception Occurred");

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse();

        switch (exception)
        {
            case UnauthorizedAccessException:

                response.StatusCode =
                    (int)HttpStatusCode.Unauthorized;

                response.Message = exception.Message;
                break;

            case KeyNotFoundException:

                response.StatusCode =
                    (int)HttpStatusCode.NotFound;

                response.Message = exception.Message;
                break;

            case ArgumentException:

                response.StatusCode =
                    (int)HttpStatusCode.BadRequest;

                response.Message = exception.Message;
                break;

            case InvalidOperationException:

                response.StatusCode =
                    (int)HttpStatusCode.BadRequest;

                response.Message = exception.Message;
                break;

            default:

                response.StatusCode =
                    (int)HttpStatusCode.InternalServerError;

                response.Message = "Internal Server Error";
                break;
        }

        context.Response.StatusCode = response.StatusCode;

        var json = JsonSerializer.Serialize(response);

        await context.Response.WriteAsync(json);
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }

    public string Message { get; set; } = string.Empty;
}