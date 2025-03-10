using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class supOffre : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Offres_Tests_TestId",
                table: "Offres");

            migrationBuilder.AddForeignKey(
                name: "FK_Offres_Tests_TestId",
                table: "Offres",
                column: "TestId",
                principalTable: "Tests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Offres_Tests_TestId",
                table: "Offres");

            migrationBuilder.AddForeignKey(
                name: "FK_Offres_Tests_TestId",
                table: "Offres",
                column: "TestId",
                principalTable: "Tests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
