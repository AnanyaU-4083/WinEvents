using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSys.api.Migrations
{
    /// <inheritdoc />
    public partial class Fourth_change_removeTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Task",
                table: "Employees");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Task",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
