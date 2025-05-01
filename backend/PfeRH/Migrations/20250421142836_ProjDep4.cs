using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class ProjDep4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projets_Departements_DepartementId",
                table: "Projets");

            migrationBuilder.DropIndex(
                name: "IX_Projets_DepartementId",
                table: "Projets");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
    }
}
