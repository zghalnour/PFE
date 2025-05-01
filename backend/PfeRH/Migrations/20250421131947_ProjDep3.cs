using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class ProjDep3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DepartementId",
                table: "Projets",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projets_DepartementId",
                table: "Projets",
                column: "DepartementId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projets_Departements_DepartementId",
                table: "Projets",
                column: "DepartementId",
                principalTable: "Departements",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projets_Departements_DepartementId",
                table: "Projets");

            migrationBuilder.DropIndex(
                name: "IX_Projets_DepartementId",
                table: "Projets");

            migrationBuilder.DropColumn(
                name: "DepartementId",
                table: "Projets");
        }
    }
}
