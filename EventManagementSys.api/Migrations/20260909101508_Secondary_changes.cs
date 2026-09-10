using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSys.api.Migrations
{
    /// <inheritdoc />
    public partial class Secondary_changes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrganizationOrgId",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_OrganizationOrgId",
                table: "Employees",
                column: "OrganizationOrgId");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Organizations_OrganizationOrgId",
                table: "Employees",
                column: "OrganizationOrgId",
                principalTable: "Organizations",
                principalColumn: "OrgId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Organizations_OrganizationOrgId",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_OrganizationOrgId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OrganizationOrgId",
                table: "Employees");
        }
    }
}
