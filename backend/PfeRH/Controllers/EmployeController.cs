using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PfeRH.Hubs;
using PfeRH.Models;
using PfeRH.services;
using System.Linq;
using System.Text.Json;
using static Google.Cloud.Dialogflow.V2.MessageEntry.Types;
using static PfeRH.Controllers.EmployeController;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<Utilisateur> _userManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;
        private readonly IHubContext<NotificationHub> _hubContext;

        private readonly EmailService _emailService;

        public EmployeController(ApplicationDbContext context, UserManager<Utilisateur> userManager, RoleManager<IdentityRole<int>> roleManager, 
            EmailService emailService, IHubContext<NotificationHub> hubContext
            )
        { 
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _hubContext = hubContext;
            _emailService = emailService;
        }
        [HttpPost("add")]
        public async Task<IActionResult> CreerEmploye([FromBody] EmployeDto employeDto)
        {
            try
            {
                Departement departement = null;
                if (!string.IsNullOrWhiteSpace(employeDto.DepartementNom))
                {
                    departement = await _context.Departements
                        .FirstOrDefaultAsync(d => d.Nom == employeDto.DepartementNom);

                    if (departement == null)
                    {
                        departement = new Departement { Nom = employeDto.DepartementNom, NomResponsable = "Aucun" };
                        _context.Departements.Add(departement);
                        await _context.SaveChangesAsync();
                    }
                }

                var candidat = await _context.Candidats
            .Include(c => c.Candidatures)
                .ThenInclude(ca => ca.Entretiens)
            .FirstOrDefaultAsync(c => c.Email == employeDto.Email);

                try
                {
                    if (candidat != null)
                    {
                        foreach (var candidature in candidat.Candidatures)
                        {
                            // Supprimer les notifications liées à cette candidature
                            var notifications = await _context.Notifications
                                .Where(n => n.CandidatureId == candidature.Id)
                                .ToListAsync();

                            _context.Notifications.RemoveRange(notifications);

                            // Supprimer les entretiens liés
                            _context.Entretiens.RemoveRange(candidature.Entretiens);
                        }

                        foreach (var candidature in candidat.Candidatures)
                        {
                            _context.Entretiens.RemoveRange(candidature.Entretiens);
                        }

                        _context.Candidatures.RemoveRange(candidat.Candidatures);
                        _context.Candidats.Remove(candidat);

                        await _context.SaveChangesAsync();
                    }
                }
                catch (DbUpdateException dbEx)
                {
                    return StatusCode(500, $"Erreur DBUpdateException : {dbEx.Message} | Inner : {dbEx.InnerException?.Message}");
                }
                catch (Exception ex)
                {
                    return StatusCode(500, $"Erreur Exception : {ex.Message} | Inner : {ex.InnerException?.Message}");
                }


                var employe = new Employe
                    {
                        UserName = employeDto.Email.Split('@')[0],
                        Email = employeDto.Email,
                        PhoneNumber = employeDto.PhoneNumber,
                        NomPrenom = employeDto.NomPrenom,
                        Salaire = employeDto.Salaire,
                        DepartementId = departement?.Id,
                        Role = employeDto.Poste,
                        DateEmbauche = DateTime.Now.Date
                    };
                    
                

                var result = await _userManager.CreateAsync(employe, employeDto.Password);
                if (!result.Succeeded)
                {
                    return BadRequest(result.Errors);
                }

                if (!await _roleManager.RoleExistsAsync(employeDto.Poste))
                {
                    var role = new IdentityRole<int> { Name = employeDto.Poste, NormalizedName = employeDto.Poste.ToUpper() };
                    var roleResult = await _roleManager.CreateAsync(role);

                    if (!roleResult.Succeeded)
                        return BadRequest("Erreur lors de la création du rôle Employe.");
                }

                var addToRoleResult = await _userManager.AddToRoleAsync(employe, employeDto.Poste);
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
        [HttpPost("add-gestionnaire-rh")]
        public async Task<IActionResult> CreerGestionnaireRH([FromBody] GestionnaireRhDto rhDto)
        {
            try
            {
                var candidat = await _context.Candidats
        .Include(c => c.Candidatures)
            .ThenInclude(ca => ca.Entretiens)
        .FirstOrDefaultAsync(c => c.Email == rhDto.Email);

                try
                {
                    if (candidat != null)
                    {
                        foreach (var candidature in candidat.Candidatures)
                        {
                            // Supprimer les notifications liées à cette candidature
                            var notifications = await _context.Notifications
                                .Where(n => n.CandidatureId == candidature.Id)
                                .ToListAsync();

                            _context.Notifications.RemoveRange(notifications);

                            // Supprimer les entretiens liés
                            _context.Entretiens.RemoveRange(candidature.Entretiens);
                        }

                        foreach (var candidature in candidat.Candidatures)
                        {
                            _context.Entretiens.RemoveRange(candidature.Entretiens);
                        }

                        _context.Candidatures.RemoveRange(candidat.Candidatures);
                        _context.Candidats.Remove(candidat);

                        await _context.SaveChangesAsync();
                    }
                }
                catch (DbUpdateException dbEx)
                {
                    return StatusCode(500, $"Erreur DBUpdateException : {dbEx.Message} | Inner : {dbEx.InnerException?.Message}");
                }
                catch (Exception ex)
                {
                    return StatusCode(500, $"Erreur Exception : {ex.Message} | Inner : {ex.InnerException?.Message}");
                }

                var rh = new GestionnaireRH
                {
                    UserName = rhDto.Email.Split('@')[0],
                    Email = rhDto.Email,
                    PhoneNumber = rhDto.PhoneNumber,
                    NomPrenom = rhDto.NomPrenom,
                    Role = rhDto.Poste,
                    DateEmbauche = DateTime.Now.Date,
                    Salaire = rhDto.Salaire
                };

                var result = await _userManager.CreateAsync(rh, rhDto.Password);
                if (!result.Succeeded) return BadRequest(result.Errors);

                if (!await _roleManager.RoleExistsAsync(rhDto.Poste))
                {
                    var role = new IdentityRole<int> { Name = rhDto.Poste, NormalizedName = rhDto.Poste.ToUpper() };
                    var roleResult = await _roleManager.CreateAsync(role);

                    if (!roleResult.Succeeded)
                        return BadRequest("Erreur lors de la création du rôle Employe.");
                }

                var addToRoleResult = await _userManager.AddToRoleAsync(rh, rhDto.Poste);
                if (!addToRoleResult.Succeeded)
                {
                    return BadRequest("Erreur lors de l’ajout du rôle à l’utilisateur.");
                }
                try
                {
                    await _emailService.EnvoyerEmailConfirmationAsync(
                        rh.Email,
                        rh.NomPrenom,
                        rh.Email,
                        rh.Password
                    );
                }
                catch (Exception emailEx)
                {
                    // Optionnel : journaliser ou ignorer l'échec d'envoi
                    Console.WriteLine($"Erreur envoi mail : {emailEx.Message}");
                }


                return Ok(rh);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur création RH : {ex.Message}");
            }
        }



        [HttpGet("getNomEmployes")]
        public async Task<IActionResult> GetAllEmployes()
        {
            var employes = await _context.Users
                                         .Where(u => u.Role != "Admin" && u.Role != "RH")

                                         .Select(e => new { e.Id, e.NomPrenom })
                                         .ToListAsync();

            return Ok(employes);
        }
        [HttpGet("getAllEmployes")]
        public async Task<IActionResult> GetAllEmployesDetails()
        {
            // Employés
            var employes = await _context.Users
                .OfType<Employe>()
                .Include(e => e.Departement)
                .Include(e => e.Affectations).ThenInclude(a => a.Projet)
                .Include(e => e.DemandesConge)
                .Include(e => e.ObjectifsSmarts)
                .Include(e => e.Reclamations)
                .Select(e => new UserDto
                {
                    Id = e.Id,
                    NomPrenom = e.NomPrenom,
                    Email = e.Email,
                    PhoneNumber = e.PhoneNumber,
                    Role = e.Role,
                    Etat=e.Etat,
                    Salaire = e.Salaire,
                    DateEmbauche = e.DateEmbauche,
                    Departement = e.Departement != null ? e.Departement.Nom : null,
                    Projets = e.Affectations.Select(a => new
                    {
                        a.Projet.Id,
                        a.Projet.Nom,
                        a.Projet.Description,
                        a.Projet.DateDebut,
                        a.Projet.DateFin
                    }).Cast<object>().ToList(),
                    DemandesConge = e.DemandesConge.Select(d => new { d.Id, d.DateDebut, d.DateFin, d.Statut }).Cast<object>().ToList(),
                    ObjectifsSmarts = e.ObjectifsSmarts.Select(o => new { o.Id, o.Description, o.Etat }).Cast<object>().ToList(),
                    Reclamations = e.Reclamations.Select(r => new { r.Id, r.Description, r.DateReclamation }).Cast<object>().ToList()
                })
                .ToListAsync();

            // RH non-employés
            var rhUsers = await _context.Users
        .OfType<Personnel>() // assure que c’est bien du type Personnel (y compris RH)
        .Where(u => u.Role.ToLower().Contains("rh") && !(u is Employe))
        .Select(u => new UserDto
        {
            Id = u.Id,
            NomPrenom = u.NomPrenom,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber,
            Role = u.Role,
            Etat = u.Etat,
            Salaire = u.Salaire,
            DateEmbauche = u.DateEmbauche,
            Departement = null,
            Projets = new List<object>(),
            DemandesConge = new List<object>(),
            ObjectifsSmarts = new List<object>(),
            Reclamations = new List<object>()
        })
        .ToListAsync();


            // Fusion
            var result = employes.Concat(rhUsers).ToList();

            return Ok(result);
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
            var Id = dto.EmployeId;

            // Mettre à jour les champs simples
            employe.Role = dto.Poste;
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

            var anciensObjectifsCount = await _context.Objectifs
    .Where(o => o.EmployeId == employe.Id)
    .CountAsync();
            _context.Objectifs.RemoveRange(employe.ObjectifsSmarts);

            // Ajouter les nouveaux
            employe.ObjectifsSmarts = dto.ObjectifsSmarts.Select(o => new ObjectifSmart
            {
                Description = o.Description,
                Etat = o.Etat,
                EmployeId = employe.Id
            }).ToList();

            await _context.SaveChangesAsync();
            
            if ( dto.ObjectifsSmarts.Count() > anciensObjectifsCount)
            {
             
                Console.WriteLine($"gergegregre {Id}");

                var utilisateurExiste = await _context.Personnels.AnyAsync(u => u.Id == Id);
               
                if (utilisateurExiste)
                {
                    var notification = new Notification(
                        contenu: $"Un ou plusieurs nouveaux objectifs SMART ont été ajoutés.",
                        type: "Objectif",
                        utilisateurId: Id
                    );

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    await _hubContext.Clients.User(Id.ToString()).SendAsync("ReceiveNotification", new
                    {
                        message = notification.Contenu
                    });
                }
            }

            return Ok("Employé mis à jour avec succès.");
        }
        [HttpPut("updateRh")]
        public async Task<IActionResult> UpdateRh([FromBody] UpdateRhDto dto)
        {
            var rh = await _context.Users
                .OfType<Personnel>()
                .FirstOrDefaultAsync(u => u.Id == dto.RhId && u.Role.ToLower().Contains("rh"));


            if (rh == null)
            {
                return NotFound("Gestionnaire RH non trouvé.");
            }

            // Mettre à jour seulement si différent et non vide/nul
            if (dto.NomPrenom!="string" && dto.NomPrenom != rh.NomPrenom)
            {
                rh.NomPrenom = dto.NomPrenom;
            }

            if (dto.Salaire > 0 && dto.Salaire != rh.Salaire)
            {
                rh.Salaire = dto.Salaire;
            }

            await _context.SaveChangesAsync();

            return Ok("RH mis à jour avec succès.");
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
                EmployeId = t.EmployeId 
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
            foreach (var employeId in employeIds)
            {
                var notification = new Notification(
                    contenu: $"Vous avez été affecté(e) au projet '{projet.Nom}'.",
                    type: "Affectation",
                    utilisateurId: employeId??0
                );

                _context.Notifications.Add(notification);

                // Optionnel : envoyer via SignalR si tu utilises un hub de notifications
                await _hubContext.Clients.User(employeId.ToString()).SendAsync("ReceiveNotification", new
                {
                    message = notification.Contenu
                });
            }

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
        [HttpGet("{idEmploye}")]
        public async Task<ActionResult<EmployeInfoResponse>> GetEmployeInfo(int idEmploye)
        {
            var employe = await _context.Users
                .OfType<Employe>()
                .Where(e => e.Id == idEmploye)
                .Select(e => new EmployeInfoResponse
                {
                    EmployeId = e.Id,
                    Nom = e.NomPrenom,
                    Poste = e.Role,
                    NomDepartement = e.Departement != null ? e.Departement.Nom : null,
                })
                .FirstOrDefaultAsync();

            if (employe == null)
                return NotFound();

            return Ok(employe);
        }
        [HttpGet("{idEmploye}/projets")]
        public async Task<ActionResult<List<ProjetResponse>>> GetEmployeProjets(int idEmploye)
        {
            var projets = await _context.Affectations
                .Where(a => a.EmployeId == idEmploye)
                .Select(a => new ProjetResponse
                {
                    ProjetId = a.Projet.Id,
                    NomProjet = a.Projet.Nom,
                    Taches = a.Projet.Taches
                        .Where(t => t.EmployeId == idEmploye)
                        .Select(t => new TacheResponse
                        {
                            TacheId = t.Id,
                            Titre = t.Nom,
                            Description = t.Description,
                            Statut = t.Statut
                        }).ToList(),
                    NombreTachesCompletes = a.Projet.Taches.Count(t => t.EmployeId == idEmploye && t.Statut == "Terminée"),
                    NombreTachesACompleter = a.Projet.Taches.Count(t => t.EmployeId == idEmploye && t.Statut == "En cours")
                })
                .ToListAsync();

            return Ok(projets);
        }
        [HttpGet("{idEmploye}/reunions-avenir")]
        public async Task<ActionResult<List<ReunionResponse>>> GetReunionsAVenir(int idEmploye)
        {
            var reunions = await _context.Affectations
                .Where(a => a.EmployeId == idEmploye)
                .SelectMany(a => a.Projet.Evaluations)
                .Where(r => r.DateEvaluation > DateTime.Now)
                .Select(r => new ReunionResponse
                {
                    ReunionId = r.Id,
                    Titre = r.Titre,
                    DateEvaluation = r.DateEvaluation,
                    Lieu = r.Lieu,
                })
                .ToListAsync();

            return Ok(reunions);
        }
        [HttpGet("{idEmploye}/objectifs-smart")]
        public async Task<ActionResult<List<ObjectifSmartResponse>>> GetObjectifsSmart(int idEmploye)
        {
            var objectifs = await _context.Objectifs
                .Where(o => o.EmployeId == idEmploye)
                .Select(o => new ObjectifSmartResponse
                {
                    ObjectifId = o.Id,
                    Description = o.Description,
                    Etat = o.Etat,
                })
                .ToListAsync();

            return Ok(objectifs);
        }
        [HttpGet("{idEmploye}/taches-par-mois")]
        public async Task<ActionResult<List<TachesParMoisResponse>>> GetTachesParMois(int idEmploye)
        {
            var tachesParMois = await _context.Taches
                .Where(t => t.EmployeId == idEmploye && t.Statut == "Terminée" && t.DateFinir != null)
                .GroupBy(t => new { t.DateFinir.Value.Year, t.DateFinir.Value.Month })
                .Select(g => new TachesParMoisResponse
                {
                    Mois = $"{g.Key.Year}-{g.Key.Month:D2}",
                    NombreTaches = g.Count()
                })
                .ToListAsync();

            return Ok(tachesParMois);
        }



        [HttpGet("{idEmploye}/projets-taches")]
        public async Task<ActionResult<EmployeProjetResponse>> GetEmployeProjetsEtTaches(int idEmploye)
        {
            var employe = await _context.Users
                .OfType<Employe>()
                .Where(e => e.Id == idEmploye)
                .Select(e => new EmployeProjetResponse
                {
                    EmployeId = e.Id,
                    Nom = e.NomPrenom,
                    Poste=e.Role,
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



        public class UpdateRhDto
        {
            public int RhId { get; set; }
            public string NomPrenom { get; set; }
            public double Salaire { get; set; }
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
        public class UserDto
        {
            public int Id { get; set; }
            public string NomPrenom { get; set; }
            public string Email { get; set; }
            public string PhoneNumber { get; set; }
            public string Role { get; set; }
            public Boolean Etat { get; set; }   
            public double? Salaire { get; set; }
            public DateTime? DateEmbauche { get; set; }
            public string Departement { get; set; }
            public List<object> Projets { get; set; } = new();
            public List<object> DemandesConge { get; set; } = new();
            public List<object> ObjectifsSmarts { get; set; } = new();
            public List<object> Reclamations { get; set; } = new();
        }

        public class GestionnaireRhDto
        {
            public string NomPrenom { get; set; }
            public string Email { get; set; }
             public string PhoneNumber { get; set; }
            public string Password { get; set; }
            public string Poste { get; set; }
            public double Salaire { get; set; }
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
        
        
        public class EmployeInfoResponse
        {
            public int EmployeId { get; set; }
            public string Nom { get; set; }
            public string Poste { get; set; }
            public string NomDepartement { get; set; }
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
