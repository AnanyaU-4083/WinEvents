using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSys.api.Migrations
{
    /// <inheritdoc />
    public partial class AllowMultipleTasksPerEventEmployee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_EventEmployees",
                table: "EventEmployees");

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<int>(
                name: "AssignmentId",
                table: "EventEmployees",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddPrimaryKey(
                name: "PK_EventEmployees",
                table: "EventEmployees",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_EventEmployees_EventId",
                table: "EventEmployees",
                column: "EventId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_EventEmployees",
                table: "EventEmployees");

            migrationBuilder.DropIndex(
                name: "IX_EventEmployees_EventId",
                table: "EventEmployees");

            migrationBuilder.DropColumn(
                name: "AssignmentId",
                table: "EventEmployees");

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_EventEmployees",
                table: "EventEmployees",
                columns: new[] { "EventId", "EmployeeId" });
        }
    }
}
