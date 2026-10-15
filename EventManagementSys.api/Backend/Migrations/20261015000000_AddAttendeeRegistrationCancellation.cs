using EventManagementSys.api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSys.api.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261015000000_AddAttendeeRegistrationCancellation")]
public partial class AddAttendeeRegistrationCancellation : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsCancelled",
            table: "EventAttendees",
            type: "bit",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "IsCancelled",
            table: "EventAttendees");
    }
}
