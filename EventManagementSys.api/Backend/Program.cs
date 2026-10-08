using EventManagementSys.api.Data;
using EventManagementSys.api.Exceptions;
using EventManagementSys.api.Repository.Implementations;
using EventManagementSys.api.Repository.Interfaces;
using EventManagementSys.api.Services.Implementations;
using EventManagementSys.api.Services.Interfaces;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);


// --------------------------------------------------
// Database
// --------------------------------------------------

var connectionString =
    builder.Configuration.GetConnectionString(
        "DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(
    options =>
        options.UseSqlServer(connectionString));


// --------------------------------------------------
// Controllers
// --------------------------------------------------

builder.Services.AddControllers();


// --------------------------------------------------
// Microsoft Authentication
// --------------------------------------------------

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(
        jwtOptions =>
        {
            builder.Configuration.Bind(
                "AzureAd",
                jwtOptions);

            // Keep the original Microsoft token
            // claim names.
            jwtOptions.MapInboundClaims = false;

            // Microsoft Entra application roles
            // are stored in the "roles" claim.
            jwtOptions
                .TokenValidationParameters
                .RoleClaimType = "roles";


            // --------------------------------------------------
            // Temporary authentication diagnostics
            // --------------------------------------------------

            jwtOptions.Events ??=
                new JwtBearerEvents();

            var existingTokenValidatedHandler =
                jwtOptions.Events.OnTokenValidated;

            jwtOptions.Events.OnTokenValidated =
                async context =>
                {
                    // Preserve existing Microsoft.Identity.Web
                    // token validation behavior.
                    if (existingTokenValidatedHandler
                        is not null)
                    {
                        await existingTokenValidatedHandler(
                            context);
                    }


                    Console.WriteLine(
                        "=== MICROSOFT TOKEN VALIDATED ===");


                    var identity =
                        context.Principal?.Identity
                        as System.Security.Claims.ClaimsIdentity;


                    Console.WriteLine(
                        $"RoleClaimType: {identity?.RoleClaimType}");


                    var roleClaims =
                        context.Principal?.Claims
                            .Where(
                                claim =>
                                    claim.Type == "roles"
                                    ||
                                    claim.Type ==
                                        System.Security.Claims
                                            .ClaimTypes.Role);


                    foreach (
                        var claim
                        in roleClaims ?? [])
                    {
                        Console.WriteLine(
                            $"Role claim: " +
                            $"{claim.Type} = {claim.Value}");
                    }


                    Console.WriteLine(
                        $"IsInRole(Admin): " +
                        $"{context.Principal?.IsInRole("Admin")}");
                };


            var existingAuthenticationFailedHandler =
                jwtOptions.Events.OnAuthenticationFailed;


            jwtOptions.Events.OnAuthenticationFailed =
                async context =>
                {
                    // Preserve existing
                    // Microsoft.Identity.Web behavior.
                    if (existingAuthenticationFailedHandler
                        is not null)
                    {
                        await existingAuthenticationFailedHandler(
                            context);
                    }


                    Console.WriteLine(
                        "=== MICROSOFT TOKEN " +
                        "AUTHENTICATION FAILED ===");


                    Console.WriteLine(
                        $"Error: " +
                        $"{context.Exception.Message}");
                };
        },
        microsoftIdentityOptions =>
        {
            builder.Configuration.Bind(
                "AzureAd",
                microsoftIdentityOptions);
        });


// --------------------------------------------------
// Authorization
// --------------------------------------------------

builder.Services.AddAuthorization();


// --------------------------------------------------
// Swagger
// --------------------------------------------------

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description =
                "Enter your Microsoft access token."
        });


    options.AddSecurityRequirement(
        document =>
            new OpenApiSecurityRequirement
            {
                [
                    new OpenApiSecuritySchemeReference(
                        "Bearer",
                        document)
                ] = []
            });
});


// --------------------------------------------------
// Authentication / User Services
// --------------------------------------------------

builder.Services.AddScoped<
    IAuthService,
    AuthService>();

builder.Services.AddScoped<
    IUserRepository,
    UserRepository>();


// --------------------------------------------------
// Attendee Services
// --------------------------------------------------

builder.Services.AddScoped<
    IAttendeeService,
    AttendeeService>();

builder.Services.AddScoped<
    IAttendeeRepository,
    AttendeeRepository>();


// --------------------------------------------------
// Event Services
// --------------------------------------------------

builder.Services.AddScoped<
    IEventService,
    EventService>();

builder.Services.AddScoped<
    IEventRepository,
    EventRepository>();


// --------------------------------------------------
// Employee Services
// --------------------------------------------------

builder.Services.AddScoped<
    IEmployeeService,
    EmployeeService>();

builder.Services.AddScoped<
    IEmployeeRepository,
    EmployeeRepository>();


// --------------------------------------------------
// Organization Services
// --------------------------------------------------

builder.Services.AddScoped<
    IOrganizationService,
    OrganizationService>();

builder.Services.AddScoped<
    IOrganizationRepository,
    OrganizationRepository>();


// --------------------------------------------------
// Venue Services
// --------------------------------------------------

builder.Services.AddScoped<
    IVenueService,
    VenueService>();

builder.Services.AddScoped<
    IVenueRepository,
    VenueRepository>();


// --------------------------------------------------
// Registration Services
// --------------------------------------------------

builder.Services.AddScoped<
    IRegistrationService,
    RegistrationService>();

builder.Services.AddScoped<
    IRegistrationRepository,
    RegistrationRepository>();


// --------------------------------------------------
// Staffing Services
// --------------------------------------------------

builder.Services.AddScoped<
    IStaffingRepository,
    StaffingRepository>();

builder.Services.AddScoped<
    IStaffingService,
    StaffService>();


// --------------------------------------------------
// Build Application
// --------------------------------------------------

var app = builder.Build();


// --------------------------------------------------
// Swagger
// --------------------------------------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(
        options =>
        {
            options.SwaggerEndpoint(
                "/swagger/v1/swagger.json",
                "Event Management System API v1");
        });
}


// --------------------------------------------------
// Exception Handling
// --------------------------------------------------

app.UseMiddleware<ExceptionHandling>();


// --------------------------------------------------
// HTTPS
// --------------------------------------------------

app.UseHttpsRedirection();


// --------------------------------------------------
// Authentication
// --------------------------------------------------

app.UseAuthentication();


// --------------------------------------------------
// Authorization
// --------------------------------------------------

app.UseAuthorization();


// --------------------------------------------------
// Controllers
// --------------------------------------------------

app.MapControllers();


// --------------------------------------------------
// Run
// --------------------------------------------------

app.Run();