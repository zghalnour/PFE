using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class RespEntre1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ResponsableId",
                table: "Entretiens",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Entretiens_ResponsableId",
                table: "Entretiens",
                column: "ResponsableId");

            migrationBuilder.AddForeignKey(
                name: "FK_Entretiens_AspNetUsers_ResponsableId",
                table: "Entretiens",
                column: "ResponsableId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Entretiens_AspNetUsers_ResponsableId",
                table: "Entretiens");

            migrationBuilder.DropIndex(
                name: "IX_Entretiens_ResponsableId",
                table: "Entretiens");

            migrationBuilder.DropColumn(
                name: "ResponsableId",
                table: "Entretiens");
        }
    }
}
