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
                .Include(d => d.Employes)
                .ThenInclude(e => e.Affectations)
                .ThenInclude(a => a.Projet)
                .ThenInclude(p => p.Evaluations)
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
                    projets = d.Employes
                        .SelectMany(e => e.Affectations)
                        .Where(a => a.Projet != null)
                        .GroupBy(a => a.Projet.Id) // Grouper les projets par leur Id
                        .Select(g => new
                        {
                            id = g.Key,
                            nom = g.FirstOrDefault().Projet.Nom,
                            description = g.FirstOrDefault().Projet.Description,
                            dateDebut = g.FirstOrDefault().Projet.DateDebut,
                            dateFin = g.FirstOrDefault().Projet.DateFin,
                            employesAssignes = g.Select(aff => new
                            {
                                aff.EmployeId,
                                aff.Employe.NomPrenom
                            }).ToList(),
                            reunions = g.FirstOrDefault().Projet.Evaluations.Select(r => new
                            {
                                r.Id,
                                r.DateEvaluation,
                                r.Lieu,
                               
                            }).ToList()

                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(departements);
        }


        [HttpPut("update/{id}")]
public async Task<IActionResult> UpdateDepartement(int id, [FromBody] UpdateDepartementRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Nom))
    {
        return BadRequest("Le nom du département est requis.");
    }

    var departement = await _context.Departements
        .FirstOrDefaultAsync(d => d.Id == id);

    if (departement == null)
    {
        return NotFound(new { message = "Département non trouvé." });
    }

    bool isModified = false;

    // Mettre à jour le nom si différent de "string"
    if (!string.Equals(request.Nom, "string", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(departement.Nom, request.Nom, StringComparison.Ordinal))
    {
        departement.Nom = request.Nom;
        isModified = true;
    }

   

    if (!isModified)
    {
        return Ok(new { message = "Aucune modification détectée." });
    }

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Département mis à jour avec succès.",
        DepartementId = departement.Id,
        Nom = departement.Nom,
       
    });
}


        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteDepartement(int id)
        {
            var departement = await _context.Departements
                .Include(d => d.Employes)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (departement == null)
                return NotFound("Département introuvable.");

            // Détacher les employés
            foreach (var employe in departement.Employes)
            {
                employe.DepartementId = null;
            }

            _context.Departements.Remove(departement);

            await _context.SaveChangesAsync();

            return Ok("Département supprimé avec succès.");
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
