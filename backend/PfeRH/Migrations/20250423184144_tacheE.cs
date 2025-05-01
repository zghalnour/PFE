using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class tacheE : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmployeId",
                table: "Taches",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Taches_EmployeId",
                table: "Taches",
                column: "EmployeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Taches_AspNetUsers_EmployeId",
                table: "Taches",
                column: "EmployeId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Taches_AspNetUsers_EmployeId",
                table: "Taches");

            migrationBuilder.DropIndex(
                name: "IX_Taches_EmployeId",
                table: "Taches");

            migrationBuilder.DropColumn(
                name: "EmployeId",
                table: "Taches");
        }
    }
}
