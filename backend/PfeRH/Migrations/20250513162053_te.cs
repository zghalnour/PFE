using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class te : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_AspNetUsers_GestionnaireRHId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_Projets_AspNetUsers_GestionnaireRHId",
                table: "Projets");

            migrationBuilder.DropIndex(
                name: "IX_Projets_GestionnaireRHId",
                table: "Projets");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_GestionnaireRHId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "GestionnaireRHId",
                table: "Projets");

            migrationBuilder.DropColumn(
                name: "GestionnaireRHId",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<DateTime>(
                name: "DateDepart",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateDepart",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<int>(
                name: "GestionnaireRHId",
                table: "Projets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GestionnaireRHId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projets_GestionnaireRHId",
                table: "Projets",
                column: "GestionnaireRHId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_GestionnaireRHId",
                table: "AspNetUsers",
                column: "GestionnaireRHId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_AspNetUsers_GestionnaireRHId",
                table: "AspNetUsers",
                column: "GestionnaireRHId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Projets_AspNetUsers_GestionnaireRHId",
                table: "Projets",
                column: "GestionnaireRHId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
