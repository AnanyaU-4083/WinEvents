using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSys.api.Migrations
{
    /// <inheritdoc />
    public partial class Fifth_change_eventtableissue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrgId",
                table: "Events",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrgId",
                table: "Events");
        }
    }
}
