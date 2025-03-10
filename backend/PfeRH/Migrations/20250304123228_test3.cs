using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class test3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tests_Offres_OffreId",
                table: "Tests");

            migrationBuilder.DropIndex(
                name: "IX_Tests_OffreId",
                table: "Tests");

            migrationBuilder.CreateIndex(
                name: "IX_Offres_TestId",
                table: "Offres",
                column: "TestId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Offres_Tests_TestId",
                table: "Offres",
                column: "TestId",
                principalTable: "Tests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Offres_Tests_TestId",
                table: "Offres");

            migrationBuilder.DropIndex(
                name: "IX_Offres_TestId",
                table: "Offres");

            migrationBuilder.CreateIndex(
                name: "IX_Tests_OffreId",
                table: "Tests",
                column: "OffreId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tests_Offres_OffreId",
                table: "Tests",
                column: "OffreId",
                principalTable: "Offres",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
