using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.DTO;
using PfeRH.Models;
using Newtonsoft.Json;
using System.Text.Json;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DepartementController(ApplicationDbContext context)
        {
            _context = context;
        }

       
        [HttpGet("getAllDepartements")]
        public async Task<IActionResult> GetAllDepartements()
        {
            var departements = await _context.Departements
                .Include(d => d.Employes)    // Inclure les employés associés
                .Include(d => d.Projets)     // Inclure les projets associés
                .Select(d => new
                {
                    Id = d.Id,
                    Nom = d.Nom,
                    // Recherche du responsable insensible à la casse
                    NomResponsable = d.Employes
                        .FirstOrDefault(e => e.Poste.ToLower().Contains("chef")).NomPrenom ?? "Aucun",  // Si aucun responsable, afficher "Aucun"
                    Employes = d.Employes.Select(e => new
                    {
                        e.Id,
                        e.NomPrenom,
                    }).ToList(),
                    Projets = d.Projets.Select(p => new
                    {
                        p.Id,
                        p.Nom,
                        p.Description  // Ajoutez d'autres propriétés des projets que vous souhaitez renvoyer
                    }).ToList()
                })
                .ToListAsync();

            return Ok(departements);
        }
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateDepartement(int id, [FromBody] UpdateDepartementRequest request)
        {
            if (string.IsNullOrEmpty(request.Nom))
            {
                return BadRequest("Le nom du département est requis.");
            }

            // Chercher le département existant
            var departement = await _context.Departements
                .FirstOrDefaultAsync(d => d.Id == id);

            if (departement == null)
            {
                return NotFound(new { message = "Département non trouvé." });
            }

            // Mettre à jour uniquement le nom du département
            departement.Nom = request.Nom;

            // Enregistrer les modifications
            _context.Departements.Update(departement);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Nom du département mis à jour avec succès",
                DepartementId = departement.Id
            });
        }


        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteDepartement(int id)
        {
            var departement = await _context.Departements
                .Include(d => d.Projets) // Inclure les projets associés
                .FirstOrDefaultAsync(d => d.Id == id);

            if (departement == null)
            {
                return NotFound(new { message = "Département non trouvé." });
            }

            // Supprimer explicitement les projets associés
            _context.Projets.RemoveRange(departement.Projets);

            // Supprimer le département
            _context.Departements.Remove(departement);

            // Sauvegarder les changements
            await _context.SaveChangesAsync();

            return Ok(new { message = "Département et ses projets supprimés avec succès." });
        }


        public class AddDepartementRequest
        {
            public string Nom { get; set; }
            public string NomResponsable { get; set; }
        }

        public class UpdateDepartementRequest
        {
            public string Nom { get; set; }
           
        }
    }
}
