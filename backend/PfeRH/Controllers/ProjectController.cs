using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PfeRH.Hubs;
using PfeRH.Models;
using System.Globalization;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectController : ControllerBase

    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ProjectController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }
        [HttpDelete("{projetId}/delete")]
        public async Task<IActionResult> DeleteProjetWithTaches(int projetId)
        {
            // Récupérer le projet avec ses tâches associées
            var projet = await _context.Projets
                .Include(p => p.Taches) // Inclure les tâches associées au projet
                .FirstOrDefaultAsync(p => p.Id == projetId);

            if (projet == null)
            {
                return NotFound("Projet non trouvé.");
            }

            // Supprimer les tâches associées au projet
            _context.Taches.RemoveRange(projet.Taches);

            // Supprimer le projet
            _context.Projets.Remove(projet);

            // Sauvegarder les changements dans la base de données
            await _context.SaveChangesAsync();

            return Ok(new { message = "Le projet et ses tâches ont été supprimés avec succès." });
        }
        [HttpGet("{projetId}/progress")]
        public async Task<IActionResult> GetProjectProgress(int projetId)
        {
            // Récupérer les tâches du projet
            var projet = await _context.Projets
                .Include(p => p.Taches)
                .FirstOrDefaultAsync(p => p.Id == projetId);

            if (projet == null)
            {
                return NotFound("Projet non trouvé.");
            }

            var totalTaches = projet.Taches.Count;

            // Si aucune tâche dans le projet, retourner 0%
            if (totalTaches == 0)
            {
                return Ok("0%");
            }

            // Compter le nombre de tâches terminées
            var tachesTerminees = projet.Taches.Count(t => t.Statut == "Terminée");

            // Calculer le taux de progression et arrondir à l'entier le plus proche
            var tauxProgression = (int)Math.Round((double)tachesTerminees / totalTaches * 100);

            // Retourner le taux de progression avec le format "xx%"
            return Ok(tauxProgression);
        }

        [HttpGet("{projetId}/taches")]
        public async Task<IActionResult> GetTachesByProjetId(int projetId)
        {
            var projet = await _context.Projets
                .Include(p => p.Taches)
                .FirstOrDefaultAsync(p => p.Id == projetId);

            if (projet == null)
            {
                return NotFound("Projet non trouvé.");
            }

            var taches = projet.Taches.Select(t => new
            {
                t.Id,
                t.Nom,
                t.Description,
                t.Statut,
                t.EmployeId
            }).ToList();

            return Ok(taches);
        }
        [HttpGet("{projetId}/evaluations")]
        public async Task<IActionResult> GetEvaluationsByProjetId(int projetId)
        {
            var projet = await _context.Projets
                .Include(p => p.Evaluations)
                .FirstOrDefaultAsync(p => p.Id == projetId);

            if (projet == null)
            {
                return NotFound("Projet non trouvé.");
            }

            var evaluations = projet.Evaluations.Select(t => new
            {
                t.Id,
                t.Titre,
                t.DateEvaluation,
                t.Lieu,
                
                
            }).ToList();

            return Ok(evaluations);
        }
        [HttpGet("par-departement/{nomDepartement}")]
        public async Task<IActionResult> GetProjetsParDepartement(string nomDepartement)
        {
            // Récupérer les projets liés aux employés d’un département donné
            var projets = await _context.Projets
                .Where(p => p.Affectations
                    .Any(a => a.Employe.Departement.Nom == nomDepartement))
                .Include(p => p.Taches)
                .Include(p => p.Evaluations)
                .Include(p => p.Affectations)
                    .ThenInclude(a => a.Employe)
                .ThenInclude(e => e.Departement)
                .ToListAsync();

            if (!projets.Any())
            {
                return NotFound("Aucun projet trouvé pour ce département.");
            }

            var result = projets.Select(p => new
            {
                p.Id,
                p.Nom,
                p.DateDebut,
                p.DateFin,
                Taches = p.Taches.Select(t => new
                {
                    t.Id,
                    t.Nom,
                    t.Description,
                    t.Statut,
                    t.EmployeId
                }),
                Employes = p.Affectations.Select(a => new
                {
                    a.Employe.Id,
                    a.Employe.NomPrenom
                }).Distinct(),
                Evaluations=p.Evaluations.Select(r => new
                { r.Id,
                  r.DateEvaluation,
                  r.Lieu,
                  

                })
            });

            return Ok(result);
        }
        [HttpPut("{projetId}/update")]
        public async Task<IActionResult> UpdateProjetEtAjouterTaches(int projetId, [FromBody] ProjetUpdateDto dto)
        {
            var projet = await _context.Projets
                .Include(p => p.Taches)
                .Include(p => p.Affectations)
                .FirstOrDefaultAsync(p => p.Id == projetId);

            if (projet == null)
                return NotFound("Projet non trouvé.");

            // === Mettre à jour les propriétés du projet ===
            if (!string.IsNullOrWhiteSpace(dto.Nom) && dto.Nom.ToLower() != "string")
                projet.Nom = dto.Nom;

            if (!string.IsNullOrWhiteSpace(dto.Description) && dto.Description.ToLower() != "string")
                projet.Description = dto.Description;

            if (!string.IsNullOrWhiteSpace(dto.DateFin))
            {
                if (DateTime.TryParseExact(dto.DateFin, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDateFin))
                {
                    projet.DateFin = parsedDateFin;
                }
                else
                {
                    return BadRequest("Format de la date de fin invalide. Utilisez le format 'dd/MM/yyyy'.");
                }
            }

            // === Identifier les ID des tâches finales ===
            var tacheIdsDto = dto.Taches.Where(t => t.Id > 0).Select(t => t.Id).ToHashSet();

            // === Supprimer les tâches qui ne sont plus dans la liste DTO ===
            var tachesASupprimer = projet.Taches.Where(t => !tacheIdsDto.Contains(t.Id)).ToList();

            // Mémoriser les employés à retirer
            var employesASupprimer = tachesASupprimer.Select(t => t.EmployeId).ToHashSet();

            if (tachesASupprimer.Any())
                _context.Taches.RemoveRange(tachesASupprimer);

            // === Mettre à jour ou ajouter les tâches restantes ===
            var nouvellesTaches = new List<Tache>();
            var nouveauxEmployes = new List<int>();

            foreach (var tacheDto in dto.Taches)
            {
                if (tacheDto.Id > 0)
                {
                    var ancienneTache = projet.Taches.FirstOrDefault(t => t.Id == tacheDto.Id);
                    if (ancienneTache != null)
                    {
                        if (!string.IsNullOrWhiteSpace(tacheDto.Nom))
                            ancienneTache.Nom = tacheDto.Nom;

                        if (!string.IsNullOrWhiteSpace(tacheDto.Description))
                            ancienneTache.Description = tacheDto.Description;

                        if (tacheDto.EmployeId > 0 && tacheDto.EmployeId != ancienneTache.EmployeId)
                        {
                            int ancienEmployeId = ancienneTache.EmployeId?? 0;

                            ancienneTache.EmployeId = tacheDto.EmployeId;
                            nouveauxEmployes.Add(tacheDto.EmployeId);

                            // Vérifier si l'ancien employé est encore assigné à d'autres tâches du projet
                            bool encoreAssigne = projet.Taches.Any(t => t.Id != tacheDto.Id && t.EmployeId == ancienEmployeId);

                            if (!encoreAssigne)
                            {
                                var affectationASupprimer = projet.Affectations
                                    .FirstOrDefault(a => a.EmployeId == ancienEmployeId);
                                if (affectationASupprimer != null)
                                {
                                    _context.Affectations.Remove(affectationASupprimer);
                                }
                            }
                        }

                        else
                        {
                            nouveauxEmployes.Add(ancienneTache.EmployeId??0);
                        }
                    }
                }
                else if (!string.IsNullOrWhiteSpace(tacheDto.Nom) && tacheDto.EmployeId > 0)
                {
                    var newTache = new Tache
                    {
                        Nom = tacheDto.Nom,
                        Description = tacheDto.Description,
                        Statut = "En cours",
                        EmployeId = tacheDto.EmployeId,
                        ProjetId = projet.Id
                    };
                    nouvellesTaches.Add(newTache);
                    nouveauxEmployes.Add(tacheDto.EmployeId);
                }
            }

            if (nouvellesTaches.Any())
                _context.Taches.AddRange(nouvellesTaches);

            // === Mettre à jour les affectations ===
            var dejaAffectes = projet.Affectations.Select(a => a.EmployeId).ToHashSet();
            var affectationsAAjouter = nouveauxEmployes
                .Where(id => !dejaAffectes.Contains(id))
                .Distinct()
                .Select(id => new Affectation
                {
                    EmployeId = id,
                    ProjetId = projet.Id,
                    DateAffectation = DateTime.Now
                }).ToList();

            if (affectationsAAjouter.Any())
            {
                _context.Affectations.AddRange(affectationsAAjouter);
                await _context.SaveChangesAsync();

                // Envoyer une notification à chaque nouvel employé affecté
                foreach (var affectation in affectationsAAjouter)
                {
                    var notification = new Notification(
                        contenu: $"Vous avez été affecté(e) au projet « {projet.Nom} ».",
                        type: "Affectation",
                        utilisateurId: affectation.EmployeId
                    );

                    _context.Notifications.Add(notification);

                    // Envoi en temps réel via SignalR
                    await _hubContext.Clients.User(affectation.EmployeId.ToString())
                        .SendAsync("ReceiveNotification", new
                        {
                            message = notification.Contenu
                        });
                }

                await _context.SaveChangesAsync();
            }

            // Supprimer les affectations des employés retirés
            var affectationsASupprimer = projet.Affectations
                .Where(a => employesASupprimer.Contains(a.EmployeId))
                .ToList();

            if (affectationsASupprimer.Any())
                _context.Affectations.RemoveRange(affectationsASupprimer);

            await _context.SaveChangesAsync();

            return Ok("Projet et tâches mis à jour avec succès.");
        }
        [HttpPost("{projetId}/ajouter-evaluation")]
        public async Task<IActionResult> AjouterEvaluation(int projetId, [FromBody] EvaluationDto dto)
        {
            var projet = await _context.Projets
                .Include(p => p.Evaluations)
                .FirstOrDefaultAsync(p => p.Id == projetId);

            if (projet == null)
            {
                return NotFound("Projet non trouvé.");
            }

            if (!DateTime.TryParseExact(dto.DateEvaluation, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateEval))
            {
                return BadRequest("Format de la date invalide. Utilisez le format 'dd/MM/yyyy'.");
            }

            var nouvelleEvaluation = new EvaluationProjet
            {
                ProjetId = projetId,
                DateEvaluation = dateEval,
                Lieu = dto.Lieu,
                Titre = dto.Titre,
               
            };

            _context.EvaluationProjets.Add(nouvelleEvaluation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Évaluation ajoutée avec succès.", evaluationId = nouvelleEvaluation.Id });
        }



    }
    public class ProjetUpdateDto
    {
        public string Nom { get; set; }
        public string Description { get; set; }
        public string DateFin { get; set; }
        public List<TacheDto>? Taches { get; set; }
    }

    public class TacheDto
    {
        public int Id { get; set; }
        public string Nom { get; set; }
        public string Description { get; set; }
        public int EmployeId { get; set; }
    }
    public class EvaluationDto
    {
        public string DateEvaluation { get; set; }  
        public string Lieu { get; set; }
        public string Titre {  get; set; }
        
    }





}
