using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class test2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Offres_AspNetUsers_AdminId",
                table: "Offres");

            migrationBuilder.DropForeignKey(
                name: "FK_Offres_Tests_TestId",
                table: "Offres");

            migrationBuilder.DropIndex(
                name: "IX_Offres_TestId",
                table: "Offres");

            migrationBuilder.AddColumn<int>(
                name: "OffreId",
                table: "Tests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "AdminId",
                table: "Offres",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_Tests_OffreId",
                table: "Tests",
                column: "OffreId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Offres_AspNetUsers_AdminId",
                table: "Offres",
                column: "AdminId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Tests_Offres_OffreId",
                table: "Tests",
                column: "OffreId",
                principalTable: "Offres",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Offres_AspNetUsers_AdminId",
                table: "Offres");

            migrationBuilder.DropForeignKey(
                name: "FK_Tests_Offres_OffreId",
                table: "Tests");

            migrationBuilder.DropIndex(
                name: "IX_Tests_OffreId",
                table: "Tests");

            migrationBuilder.DropColumn(
                name: "OffreId",
                table: "Tests");

            migrationBuilder.AlterColumn<int>(
                name: "AdminId",
                table: "Offres",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Offres_TestId",
                table: "Offres",
                column: "TestId");

            migrationBuilder.AddForeignKey(
                name: "FK_Offres_AspNetUsers_AdminId",
                table: "Offres",
                column: "AdminId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Offres_Tests_TestId",
                table: "Offres",
                column: "TestId",
                principalTable: "Tests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
