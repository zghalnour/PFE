using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PfeRH.Migrations
{
    /// <inheritdoc />
    public partial class DepProjets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projets_Departements_DepartementId",
                table: "Projets");

            migrationBuilder.DropForeignKey(
                name: "FK_Projets_Departements_DepartementId2",
                table: "Projets");

            migrationBuilder.DropTable(
                name: "EmployeProjet");

            migrationBuilder.DropIndex(
                name: "IX_Projets_DepartementId",
                table: "Projets");

            migrationBuilder.DropIndex(
                name: "IX_Projets_DepartementId2",
                table: "Projets");

            migrationBuilder.DropColumn(
                name: "DepartementId",
                table: "Projets");

            migrationBuilder.DropColumn(
                name: "DepartementId2",
                table: "Projets");

            migrationBuilder.CreateTable(
                name: "Affectations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeId = table.Column<int>(type: "int", nullable: false),
                    ProjetId = table.Column<int>(type: "int", nullable: false),
                    DateAffectation = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Affectations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Affectations_AspNetUsers_EmployeId",
                        column: x => x.EmployeId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Affectations_Projets_ProjetId",
                        column: x => x.ProjetId,
                        principalTable: "Projets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Affectations_EmployeId",
                table: "Affectations",
                column: "EmployeId");

            migrationBuilder.CreateIndex(
                name: "IX_Affectations_ProjetId",
                table: "Affectations",
                column: "ProjetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Affectations");

            migrationBuilder.AddColumn<int>(
                name: "DepartementId",
                table: "Projets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DepartementId2",
                table: "Projets",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EmployeProjet",
                columns: table => new
                {
                    EmployesId = table.Column<int>(type: "int", nullable: false),
                    ProjetsId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeProjet", x => new { x.EmployesId, x.ProjetsId });
                    table.ForeignKey(
                        name: "FK_EmployeProjet_AspNetUsers_EmployesId",
                        column: x => x.EmployesId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmployeProjet_Projets_ProjetsId",
                        column: x => x.ProjetsId,
                        principalTable: "Projets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Projets_DepartementId",
                table: "Projets",
                column: "DepartementId");

            migrationBuilder.CreateIndex(
                name: "IX_Projets_DepartementId2",
                table: "Projets",
                column: "DepartementId2");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeProjet_ProjetsId",
                table: "EmployeProjet",
                column: "ProjetsId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projets_Departements_DepartementId",
                table: "Projets",
                column: "DepartementId",
                principalTable: "Departements",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Projets_Departements_DepartementId2",
                table: "Projets",
                column: "DepartementId2",
                principalTable: "Departements",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
