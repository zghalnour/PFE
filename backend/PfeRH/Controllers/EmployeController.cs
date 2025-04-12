using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;
using System.Text.Json;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<Utilisateur> _userManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;


        public EmployeController(ApplicationDbContext context, UserManager<Utilisateur> userManager, RoleManager<IdentityRole<int>> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }
        [HttpPost("add")]
        public async Task<IActionResult> CreerEmploye([FromBody] EmployeDto employeDto)
        {
            if (employeDto == null)
            {
                return BadRequest("Les données de l'employé sont invalides.");
            }

            // Vérifier si le département existe
            var departement = await _context.Departements
                                            .FirstOrDefaultAsync(d => d.Nom == employeDto.DepartementNom);

            if (departement == null)
            {
                departement = new Departement { Nom = employeDto.DepartementNom , NomResponsable = "Aucun" };
                _context.Departements.Add(departement);
                await _context.SaveChangesAsync(); // Sauvegarde pour générer l'ID
            }

            // Créer un employé en tant qu'utilisateur Identity
            var employe = new Employe
            {
                UserName = employeDto.Email,  // Nom d'utilisateur = Email
                Email = employeDto.Email,
                PhoneNumber = employeDto.PhoneNumber,
                NomPrenom = employeDto.NomPrenom,
                Poste = employeDto.Poste,
                Salaire = employeDto.Salaire,
                DepartementId = departement.Id,
                Role = "Employe",
                DateEmbauche = DateTime.Now.Date
            };

            // Créer l'utilisateur dans la base Identity avec le mot de passe
            var result = await _userManager.CreateAsync(employe, employeDto.Password);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // Optionnel : Ajouter un rôle à l'employé
            if (!await _roleManager.RoleExistsAsync("Employe"))
            {
                await _roleManager.CreateAsync(new IdentityRole<int> { Name = "Employe" });
            }

            await _userManager.AddToRoleAsync(employe, "Employe");
            var options = new JsonSerializerOptions
            {
                ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve,
                WriteIndented = true // Pour rendre le JSON plus lisible
            };

            // Sérialiser l'employé avec les options de référence
            var jsonString = JsonSerializer.Serialize(employe, options);

            return Ok(jsonString); 
        }
        [HttpGet("getNomEmployes")]
        public async Task<IActionResult> GetAllEmployes()
        {
            var employes = await _context.Users
                                         .Where(u => u.Role == "Employe")
                                         .Select(e => new { e.Id, e.NomPrenom })
                                         .ToListAsync();

            return Ok(employes);
        }
        [HttpGet("getAllEmployes")]
        public async Task<IActionResult> GetAllEmployesDetails()
        {
            var employes = await _context.Users
                                         .OfType<Employe>() // Filtrer uniquement les employés
                                         .Include(e => e.Departement)
                                         .Include(e => e.Projets)
                                         .Include(e => e.DemandesConge)
                                         .Include(e => e.EvaluationsRecues)
                                         .Include(e => e.ObjectifsSmarts)
                                         .Include(e => e.Reclamations)
                                         .Select(e => new
                                         {
                                             e.Id,
                                             e.NomPrenom,
                                             e.Email,
                                             e.PhoneNumber,
                                             e.Poste,
                                             e.Salaire,
                                             e.DateEmbauche,
                                             Departement = e.Departement != null ? e.Departement.Nom : null,
                                             Projets = e.Projets.Select(p => new { p.Id, p.Nom, p.Description }).ToList(),
                                             DemandesConge = e.DemandesConge.Select(d => new { d.Id, d.DateDebut, d.DateFin, d.Statut }).ToList(),
                                             EvaluationsRecues = e.EvaluationsRecues.Select(ev => new { ev.Id, ev.Commentaire }).ToList(),
                                             ObjectifsSmarts = e.ObjectifsSmarts.Select(o => new { o.Id, o.Description, o.Etat }).ToList(),
                                             Reclamations = e.Reclamations.Select(r => new { r.Id, r.Description, r.DateReclamation }).ToList()
                                         })
                                         .ToListAsync();

            return Ok(employes);
        }
        [HttpPut("updateEmByAdmin")]
        public async Task<IActionResult> UpdateEmploye([FromBody] UpdateEmployeDto dto)
        {
            var employe = await _context.Users
                                        .OfType<Employe>()
                                        .Include(e => e.ObjectifsSmarts)
                                        .FirstOrDefaultAsync(e => e.Id == dto.EmployeId);

            if (employe == null)
            {
                return NotFound("Employé non trouvé.");
            }

            // Mettre à jour les champs simples
            employe.Poste = dto.Poste;
            employe.Salaire = dto.Salaire;

            // Gérer le département
            var departement = await _context.Departements
                                            .FirstOrDefaultAsync(d => d.Nom == dto.DepartementNom);

            if (departement == null)
            {
                departement = new Departement { Nom = dto.DepartementNom };
                _context.Departements.Add(departement);
                await _context.SaveChangesAsync();
            }

            employe.DepartementId = departement.Id;

            // Supprimer les anciens objectifs SMART
            _context.Objectifs.RemoveRange(employe.ObjectifsSmarts);

            // Ajouter les nouveaux
            employe.ObjectifsSmarts = dto.ObjectifsSmarts.Select(o => new ObjectifSmart
            {
                Description = o.Description,
                Etat = o.Etat,
                EmployeId = employe.Id
            }).ToList();

            await _context.SaveChangesAsync();

            return Ok("Employé mis à jour avec succès.");
        }
        [HttpGet("getObjectifsSmart/{employeId}")]
        public async Task<IActionResult> GetObjectifsSmartByEmploye(int employeId)
        {
            var employe = await _context.Users
                                        .OfType<Employe>()
                                        .Include(e => e.ObjectifsSmarts)
                                        .FirstOrDefaultAsync(e => e.Id == employeId);

            if (employe == null)
            {
                return NotFound("Employé non trouvé.");
            }

            var objectifs = employe.ObjectifsSmarts.Select(o => new
            {
                o.Id,
                o.Description,
                o.Etat
            }).ToList();

            return Ok(objectifs);
        }




        public class EmployeDto
        {
            public string NomPrenom { get; set; }
            public string Email { get; set; }
            public string Password { get; set; }
            public string PhoneNumber { get; set; }
            public string Poste { get; set; }
            public double Salaire { get; set; }
            public string DepartementNom { get; set; }
           
        }
        public class UpdateEmployeDto
        {
            public int EmployeId { get; set; }
            public string Poste { get; set; }
            public double Salaire { get; set; }
            public string DepartementNom { get; set; }
            public List<ObjectifSmartDto> ObjectifsSmarts { get; set; }
        }

        public class ObjectifSmartDto
        {
            public string Description { get; set; }
            public Boolean Etat { get; set; }
        }




    }
}
