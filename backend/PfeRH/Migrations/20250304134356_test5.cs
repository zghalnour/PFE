using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class test5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OptionQuestions_Questions_QuestionId",
                table: "OptionQuestions");

            migrationBuilder.DropForeignKey(
                name: "FK_ReponseCandidats_OptionQuestions_OptionChoisieId",
                table: "ReponseCandidats");

            migrationBuilder.DropIndex(
                name: "IX_ReponseCandidats_OptionChoisieId",
                table: "ReponseCandidats");

            migrationBuilder.DropIndex(
                name: "IX_OptionQuestions_QuestionId",
                table: "OptionQuestions");

            migrationBuilder.DropColumn(
                name: "QuestionId",
                table: "OptionQuestions");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Tests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Option1",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Option2",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Option3",
                table: "Questions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ReponseCorrecte",
                table: "Questions",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Tests");

            migrationBuilder.DropColumn(
                name: "Option1",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "Option2",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "Option3",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "ReponseCorrecte",
                table: "Questions");

            migrationBuilder.AddColumn<int>(
                name: "QuestionId",
                table: "OptionQuestions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ReponseCandidats_OptionChoisieId",
                table: "ReponseCandidats",
                column: "OptionChoisieId");

            migrationBuilder.CreateIndex(
                name: "IX_OptionQuestions_QuestionId",
                table: "OptionQuestions",
                column: "QuestionId");

            migrationBuilder.AddForeignKey(
                name: "FK_OptionQuestions_Questions_QuestionId",
                table: "OptionQuestions",
                column: "QuestionId",
                principalTable: "Questions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ReponseCandidats_OptionQuestions_OptionChoisieId",
                table: "ReponseCandidats",
                column: "OptionChoisieId",
                principalTable: "OptionQuestions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
