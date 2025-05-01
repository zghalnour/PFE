using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;
using PfeRH.services;
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

        private readonly EmailService _emailService;

        public EmployeController(ApplicationDbContext context, UserManager<Utilisateur> userManager, RoleManager<IdentityRole<int>> roleManager, EmailService emailService)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _emailService = emailService;
        }
        [HttpPost("add")]
        public async Task<IActionResult> CreerEmploye([FromBody] EmployeDto employeDto)
        {
            try
            {
                var departement = await _context.Departements
                                   .FirstOrDefaultAsync(d => d.Nom == employeDto.DepartementNom);

                if (departement == null)
                {
                    departement = new Departement { Nom = employeDto.DepartementNom, NomResponsable = "Aucun" };
                    _context.Departements.Add(departement);
                    await _context.SaveChangesAsync();
                }

                var candidat = await _context.Users
                    .OfType<Condidat>()
                    .Include(c => c.Candidatures)
                        .ThenInclude(ca => ca.Entretiens)
                    .FirstOrDefaultAsync(c => c.Email == employeDto.Email);

                if (candidat != null)
                {
                    foreach (var candidature in candidat.Candidatures)
                    {
                        _context.Entretiens.RemoveRange(candidature.Entretiens);
                    }

                    _context.Candidatures.RemoveRange(candidat.Candidatures);
                    _context.Users.Remove(candidat);
                    await _context.SaveChangesAsync();
                }

                var employe = new Employe
                {
                    UserName = employeDto.Email,
                    Email = employeDto.Email,
                    PhoneNumber = employeDto.PhoneNumber,
                    NomPrenom = employeDto.NomPrenom,
                    Poste = employeDto.Poste,
                    Salaire = employeDto.Salaire,
                    DepartementId = departement.Id,
                    Role = "Employe",
                    DateEmbauche = DateTime.Now.Date
                };

                var result = await _userManager.CreateAsync(employe, employeDto.Password);
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                if (!await _roleManager.RoleExistsAsync("Employe"))
                {
                    var role = new IdentityRole<int> { Name = "Employe", NormalizedName = "EMPLOYE" };
                    var roleResult = await _roleManager.CreateAsync(role);

                    if (!roleResult.Succeeded)
                        return BadRequest("Erreur lors de la création du rôle Employe.");
                }

                var addToRoleResult = await _userManager.AddToRoleAsync(employe, "Employe");
                if (!addToRoleResult.Succeeded)
                {
                    return BadRequest("Erreur lors de l’ajout du rôle à l’utilisateur.");
                }
                try
                {
                    await _emailService.EnvoyerEmailConfirmationAsync(
                        employe.Email,
                        employe.NomPrenom,
                        employe.Email,
                        employeDto.Password
                    );
                }
                catch (Exception emailEx)
                {
                    // Optionnel : journaliser ou ignorer l'échec d'envoi
                    Console.WriteLine($"Erreur envoi mail : {emailEx.Message}");
                }


                var options = new JsonSerializerOptions
                {
                    ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve,
                    WriteIndented = true
                };

                var jsonString = JsonSerializer.Serialize(employe, options);
                return Ok(jsonString);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur lors de la création de l'employé : {ex.Message}");
            }
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
                                          .Include(e => e.Affectations)
                                          .ThenInclude(a => a.Projet)
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
                                             Projets = e.Affectations.Select(a => new
                                             {
                                                 a.Projet.Id,
                                                 a.Projet.Nom,
                                                 a.Projet.Description,
                                                 a.Projet.DateDebut,
                                                 a.Projet.DateFin
                                             }).ToList(),
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

        [HttpPost("test-email")]
        public async Task<IActionResult> TesterEmail([FromBody] EmailTestDto dto)
        {
            try
            {
                await _emailService.EnvoyerEmailConfirmationAsync(
                    dto.Destinataire,
                    dto.NomPrenom,
                    dto.Email,
                    dto.MotDePasse
                );

                return Ok("Email envoyé avec succès !");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur lors de l’envoi de l’email : {ex.Message}");
            }
        }
        [HttpPost("ajouter-projet")]
        public async Task<IActionResult> AjouterProjet([FromBody] ProjetCreateDto dto)
        {
            if (dto.Taches == null || !dto.Taches.Any())
            {
                return BadRequest("La liste des tâches est vide.");
            }

            // Créer le projet
            var projet = new Projet
            {
                Nom = dto.Nom,
                Description = dto.Description,
                DateDebut = dto.DateDebut,
                DateFin = dto.DateFin,
            };

            _context.Projets.Add(projet);
            await _context.SaveChangesAsync();

            // Ajouter les tâches avec leur employé assigné
            var taches = dto.Taches.Select(t => new Tache
            {
                Nom = t.Nom,
                Description = t.Description,
                Statut = "En cours",
                ProjetId = projet.Id,
                EmployeId = t.EmployeId // Assure-toi que le modèle Tache a un champ EmployeId
            }).ToList();

            _context.Taches.AddRange(taches);

            // Facultatif : créer une affectation par employé unique s'il n'existe pas déjà
            var employeIds = taches.Select(t => t.EmployeId).Distinct().ToList();

            var affectations = employeIds.Select(employeId => new Affectation
            {
                EmployeId = employeId ?? 0,
                ProjetId = projet.Id,
                DateAffectation = DateTime.Now
            }).ToList();

            _context.Affectations.AddRange(affectations);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Projet avec tâches et assignations créé avec succès",
                Projet = new
                {
                    projet.Id,
                    projet.Nom,
                    projet.Description,
                    projet.DateDebut,
                    projet.DateFin,
                    Taches = taches.Select(t => new
                    {
                        t.Nom,
                        t.Description,
                        t.Statut,
                        t.EmployeId
                    }).ToList()
                }
            });
        }


     
        [HttpPost("affecter-employe")]
        public async Task<IActionResult> AffecterEmploye([FromBody] AffecterEmployeDto dto)
        {
            var projet = await _context.Projets.FindAsync(dto.ProjetId);
            if (projet == null)
                return NotFound("Projet non trouvé");

            var employe = await _context.Users
                .OfType<Employe>()
                .Include(e => e.Departement)
                .FirstOrDefaultAsync(e => e.Id == dto.EmployeId);
            if (employe == null)
                return NotFound("Employé non trouvé");

            var affectationExiste = await _context.Affectations
                .AnyAsync(a => a.ProjetId == dto.ProjetId && a.EmployeId == dto.EmployeId);
            if (affectationExiste)
                return BadRequest("Cet employé est déjà affecté à ce projet");

            var affectation = new Affectation
            {
                EmployeId = dto.EmployeId,
                ProjetId = dto.ProjetId,
                DateAffectation = DateTime.Now
            };

            _context.Affectations.Add(affectation);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Employé affecté avec succès au projet",
                Projet = new
                {
                    projet.Id,
                    projet.Nom
                },
                Employe = new
                {
                    employe.Id,
                    employe.NomPrenom,
                    Departement = employe.Departement?.Nom
                }
            });
        }
        [HttpGet("api/employes/{idEmploye}/projets-taches")]
        public async Task<ActionResult<EmployeProjetResponse>> GetEmployeProjetsEtTaches(int idEmploye)
        {
            var employe = await _context.Users
                .OfType<Employe>()
                .Where(e => e.Id == idEmploye)
                .Select(e => new EmployeProjetResponse
                {
                    EmployeId = e.Id,
                    Nom = e.NomPrenom,
                    Poste=e.Poste,
                    NomDepartement = e.Departement != null ? e.Departement.Nom : null,
                    Projets = e.Affectations
                        .Select(a => new ProjetResponse
                        {
                            ProjetId = a.Projet.Id,
                            NomProjet = a.Projet.Nom,
                            Taches = a.Projet.Taches
                                .Where(t => t.EmployeId == e.Id)
                                .Select(t => new TacheResponse
                                {
                                    TacheId = t.Id,
                                    Titre = t.Nom,
                                    Description = t.Description,
                                    Statut = t.Statut
                                }).ToList(),
                            NombreTachesCompletes = a.Projet.Taches.Count(t => t.EmployeId == e.Id && t.Statut == "Terminée"),
                            NombreTachesACompleter = a.Projet.Taches.Count(t => t.EmployeId == e.Id && t.Statut == "En cours")
                        }).ToList(),
                    ReunionsAVenir = e.Affectations
                .SelectMany(a => a.Projet.Evaluations)
                .Where(r => r.DateEvaluation > DateTime.Now)
                .Select(r => new ReunionResponse
                {
                    ReunionId = r.Id,
                    Titre = r.Titre,
                    DateEvaluation = r.DateEvaluation,
                    Lieu = r.Lieu,
                }).ToList(),
                    ObjectifsSmart = e.ObjectifsSmarts
                .Select(o => new ObjectifSmartResponse
                {
                    ObjectifId = o.Id,
                    Description = o.Description,
                    Etat=o.Etat,
                   
                }).ToList(),
                    NombreTachesCompletesParMois = e.Affectations
                .SelectMany(a => a.Projet.Taches)
                .Where(t => t.EmployeId == e.Id && t.Statut == "Terminée" && t.DateFinir != null)
                .GroupBy(t => new { t.DateFinir.Value.Year, t.DateFinir.Value.Month })
                .Select(g => new TachesParMoisResponse
                {
                    Mois = $"{g.Key.Year}-{g.Key.Month:D2}",
                    NombreTaches = g.Count()
                }).ToList()
                })
                .FirstOrDefaultAsync();

            if (employe == null)
                return NotFound();

            return Ok(employe);
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
        public class EmailTestDto
        {
            public string Destinataire { get; set; }
            public string NomPrenom { get; set; }
            public string Email { get; set; }
            public string MotDePasse { get; set; }
        }

        public class TacheCreateDto
        {
            public string Nom { get; set; }
            public string Description { get; set; }
            public int EmployeId { get; set; }
        }

        public class ProjetCreateDto
        {
            public string Nom { get; set; }
            public string Description { get; set; }
            public DateTime DateDebut { get; set; }
            public DateTime DateFin { get; set; }
            public List<TacheCreateDto> Taches { get; set; }
        }

        public class AffecterEmployeDto
        {
            public int ProjetId { get; set; }
            public int EmployeId { get; set; }
        }
        public class EmployeProjetResponse
        {
            public int EmployeId { get; set; }
            public string Nom { get; set; }
            public string Poste { get; set; }
            public string NomDepartement { get; set; }
            public List<ProjetResponse> Projets { get; set; }
            public List<ReunionResponse> ReunionsAVenir { get; set; }
            public List<ObjectifSmartResponse> ObjectifsSmart { get; set; }
            public List<TachesParMoisResponse> NombreTachesCompletesParMois { get; set; }
        }

        public class ProjetResponse
        {
            public int ProjetId { get; set; }
            public string NomProjet { get; set; }
            public List<TacheResponse> Taches { get; set; }
            public int NombreTachesCompletes { get; set; }
            public int NombreTachesACompleter { get; set; }
        }

        public class TacheResponse
        {
            public int TacheId { get; set; }
            public string Titre { get; set; }
            public string Description {  get; set; }
            public string Statut { get; set; } // "Terminé" ou "À compléter"
        }

        public class ReunionResponse
        {
            public int ReunionId { get; set; }
            public string Titre { get; set; }
            public DateTime DateEvaluation { get; set; }
            public string Lieu { get; set; }
            
        }

        public class ObjectifSmartResponse
        {
            public int ObjectifId { get; set; }
            public string Titre { get; set; }
            public string Description { get; set; }
            public Boolean Etat { get; set; }
        }

        public class TachesParMoisResponse
        {
            public string Mois { get; set; } // exemple "2025-05"
            public int NombreTaches { get; set; }
        }



    }
}
