using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class testN : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Offres_TestId",
                table: "Offres");

            migrationBuilder.AlterColumn<int>(
                name: "TestId",
                table: "Offres",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_Offres_TestId",
                table: "Offres",
                column: "TestId",
                unique: true,
                filter: "[TestId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Offres_TestId",
                table: "Offres");

            migrationBuilder.AlterColumn<int>(
                name: "TestId",
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
                column: "TestId",
                unique: true);
        }
    }
}
