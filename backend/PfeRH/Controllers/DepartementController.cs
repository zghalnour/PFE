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
        [HttpPost("add")]
        public async Task<IActionResult> AddDepartement([FromBody] AddDepartementRequest request)
        {
            if (string.IsNullOrEmpty(request.Nom))
            {
                return BadRequest("Le nom du département est requis.");
            }

            if (string.IsNullOrEmpty(request.NomResponsable))
            {
                return BadRequest("Le nom du responsable est requis.");
            }

            // Vérifier si le responsable existe déjà
            var responsable = await _context.Responsables
                .FirstOrDefaultAsync(r => r.NomPrenom == request.NomResponsable);

            if (responsable == null)
            {
                // Créer un nouveau responsable
                responsable = new Responsable
                {
                    NomPrenom = request.NomResponsable
                };

                _context.Responsables.Add(responsable);
                await _context.SaveChangesAsync();
            }

            // Créer le département et lui affecter le responsable
            var departement = new Departement
            {
                Nom = request.Nom,
                ResponsableId = responsable.Id
            };

            _context.Departements.Add(departement);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Département ajouté avec succès",
                DepartementId = departement.Id,
                ResponsableId = responsable.Id
            });
        }
        [HttpGet("getAllDepartements")]
        public async Task<IActionResult> GetAllDepartements()
        {
            var departements = await _context.Departements
                .Include(d => d.Responsable)
                .Include(d => d.Employes)
                .Include(d => d.Projets)
                .Select(d => new
                {
                    Nom = d.Nom,
                    NomResponsable = d.Responsable != null ? d.Responsable.NomPrenom : "Aucun",
                    Employes = d.Employes.Select(e => new
                    {
                        e.Id,
                        e.NomPrenom,

                    }).ToList(),
                    Projets = d.Projets.Select(p => new
                    {
                        p.Id,
                        p.Nom,
                        p.Description // Ajoutez d'autres propriétés des projets que vous souhaitez renvoyer
                    }).ToList()
                })
                .ToListAsync();

            return Ok(departements);
        }
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateDepartement(int id, [FromBody] UpdateDepartementRequest request)
        {
            // Commencer une transaction
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Charger le département avec les employés
                var departement = await _context.Departements
                    .Include(d => d.Employes)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (departement == null)
                {
                    return NotFound(new { message = "Département non trouvé." });
                }

                // Mise à jour du nom
                if (!string.IsNullOrEmpty(request.Nom))
                {
                    departement.Nom = request.Nom;
                }

                // Mise à jour du responsable
                if (!string.IsNullOrEmpty(request.NomResponsable))
                {
                    var responsable = await _context.Responsables
                        .FirstOrDefaultAsync(r => r.NomPrenom == request.NomResponsable);

                    if (responsable == null)
                    {
                        responsable = new Responsable { NomPrenom = request.NomResponsable };
                        _context.Responsables.Add(responsable);
                        await _context.SaveChangesAsync();
                    }

                    departement.ResponsableId = responsable.Id;
                }

                // Mise à jour des employés
                if (request.EmployesIds != null && request.EmployesIds.Any())
                {
                    // Vider la collection actuelle
                    departement.Employes.Clear();

                    // Attacher les nouveaux employés
                    foreach (var idE in request.EmployesIds)
                    {
                        var employee = new Employe { Id = idE };
                        _context.Attach(employee);
                        departement.Employes.Add(employee);
                    }
                }

                // Sauvegarder les changements
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Recharger les données pour la réponse
                var updatedDepartement = await _context.Departements
                    .Include(d => d.Responsable)
                    .Include(d => d.Employes)
                    .FirstOrDefaultAsync(d => d.Id == id);

                return Ok(new
                {
                    message = "Département mis à jour avec succès.",
                    departement = new
                    {
                        updatedDepartement.Id,
                        updatedDepartement.Nom,
                        NomResponsable = updatedDepartement.Responsable?.NomPrenom ?? "Aucun",
                        Employes = updatedDepartement.Employes.Select(e => new { e.Id, e.NomPrenom }).ToList()
                    }
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    message = "Erreur lors de la mise à jour du département.",
                    error = ex.Message
                });
            }
        }
        public class AddDepartementRequest
        {
            public string Nom { get; set; }
            public string NomResponsable { get; set; }
        }
        public class UpdateDepartementRequest
        {
            public string Nom { get; set; }
            public string NomResponsable { get; set; }
            public List<int> EmployesIds { get; set; }

        }


    }
}
