using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventManagementSys.api.Migrations
{
    /// <inheritdoc />
    public partial class ConnectUsersAndAttendees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendees_Users_UserId",
                table: "Attendees");

            migrationBuilder.DropIndex(
                name: "IX_Attendees_UserId",
                table: "Attendees");

            migrationBuilder.CreateIndex(
                name: "IX_Attendees_UserId",
                table: "Attendees",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendees_Users_UserId",
                table: "Attendees",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendees_Users_UserId",
                table: "Attendees");

            migrationBuilder.DropIndex(
                name: "IX_Attendees_UserId",
                table: "Attendees");

            migrationBuilder.CreateIndex(
                name: "IX_Attendees_UserId",
                table: "Attendees",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendees_Users_UserId",
                table: "Attendees",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId");
        }
    }
}
