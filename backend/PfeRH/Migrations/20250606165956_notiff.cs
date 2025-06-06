using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class notiff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Candidatures_CandidatureId",
                table: "Notifications");

            migrationBuilder.AlterColumn<int>(
                name: "CandidatureId",
                table: "Notifications",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Candidatures_CandidatureId",
                table: "Notifications",
                column: "CandidatureId",
                principalTable: "Candidatures",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Candidatures_CandidatureId",
                table: "Notifications");

            migrationBuilder.AlterColumn<int>(
                name: "CandidatureId",
                table: "Notifications",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Candidatures_CandidatureId",
                table: "Notifications",
                column: "CandidatureId",
                principalTable: "Candidatures",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
