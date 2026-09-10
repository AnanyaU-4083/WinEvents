using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSys.api.Migrations
{
    /// <inheritdoc />
    public partial class Sixith_update_eventtabble_orgid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrganizationOrgId",
                table: "Events",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Events_OrganizationOrgId",
                table: "Events",
                column: "OrganizationOrgId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Organizations_OrganizationOrgId",
                table: "Events",
                column: "OrganizationOrgId",
                principalTable: "Organizations",
                principalColumn: "OrgId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Organizations_OrganizationOrgId",
                table: "Events");

            migrationBuilder.DropIndex(
                name: "IX_Events_OrganizationOrgId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "OrganizationOrgId",
                table: "Events");
        }
    }
}
