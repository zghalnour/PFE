using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PfeRH.DTO;
using PfeRH.Hubs;
using PfeRH.Models;
using PfeRH.services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CandidatureController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<Utilisateur> _userManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;
        private readonly CvScoringController _cvScoringController;
        private readonly EmailService _emailService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public CandidatureController(ApplicationDbContext context, UserManager<Utilisateur> userManager, RoleManager<IdentityRole<int>> roleManager, CvScoringController cvScoringController,
            EmailService emailService, IHubContext<NotificationHub> hubContext
            )
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _cvScoringController = cvScoringController;
            _emailService = emailService;
            _hubContext = hubContext;
        }
        [HttpPost("soumettre-candidature")]
        public async Task<IActionResult> SoumettreCandidature([FromForm] CandidatureSubmissionDto candidatureDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var roleCandidat = await _roleManager.FindByNameAsync("Candidat");
                if (roleCandidat == null)
                {
                    var newRole = new IdentityRole<int> { Name = "Candidat" };
                    var createRoleResult = await _roleManager.CreateAsync(newRole);
                    if (!createRoleResult.Succeeded)
                    {
                        return StatusCode(500, "Erreur lors de la création du rôle Candidat.");
                    }
                }
                // Vérifier l'offre et le test associé
                var offre = await _context.Offres
                                           .Include(o => o.Test)
                                           .ThenInclude(t => t.Questions)
                                           .FirstOrDefaultAsync(o => o.Id == candidatureDto.OffreId);

                if (offre == null || offre.Test == null)
                {
                    return NotFound("Offre ou test associé non trouvé.");
                }

                // Vérifier si le candidat existe ou le créer
                var candidat = await _context.Candidats
      .FirstOrDefaultAsync(c => c.Email == candidatureDto.Email);

                if (candidat == null)
                {
                    candidat = new Condidat
                    {
                        NomPrenom = candidatureDto.NomPrenom,
                        Email = candidatureDto.Email,
                      
                        PhoneNumber = candidatureDto.Telephone,
                        LinkedIn = !string.IsNullOrEmpty(candidatureDto.LinkedIn)
    ? (candidatureDto.LinkedIn.StartsWith("http") ? candidatureDto.LinkedIn : "https://" + candidatureDto.LinkedIn)
    : null, // ou "" si tu veux éviter le null

                      
                    };

                    _context.Candidats.Add(candidat);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    candidat.NomPrenom = candidatureDto.NomPrenom;
                    candidat.PhoneNumber = candidatureDto.Telephone;
                    candidat.LinkedIn = candidatureDto.LinkedIn;
                }

                // Sauvegarde du CV (si fourni)
                string cvPath = null;
                if (candidatureDto.CVFile != null && candidatureDto.CVFile.Length > 0)
                {
                    var extension = Path.GetExtension(candidatureDto.CVFile.FileName);
                    if (extension.ToLower() != ".pdf")
                    {
                        return BadRequest("Seuls les fichiers PDF sont acceptés.");
                    }

                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(candidatureDto.CVFile.FileName)}";
                    var filePath = Path.Combine(uploadsDir, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await candidatureDto.CVFile.CopyToAsync(stream);
                    }

                    // Construire l'URL complète
                    string baseUrl = $"{Request.Scheme}://{Request.Host}"; // Récupère l'URL de base du backend
                    cvPath = $"{baseUrl}/uploads/{fileName}";

                    candidat.CVPath = cvPath;
                }


                _context.Candidats.Update(candidat);
                await _context.SaveChangesAsync();


                double scoreAI = 0.0;
                string competencesExtraites = "";

                var responseObject = await _cvScoringController.ScoreCVPdf(candidatureDto.CVFile,offre.Competences.ToLower()) as OkObjectResult;

                // Vérifiez que la réponse contient une valeur
                if (responseObject != null && responseObject.Value != null)
                {
                    // Sérialiser l'objet en JSON pour l'afficher sous forme lisible
                    string jsonResponse = JsonConvert.SerializeObject(responseObject.Value, Formatting.Indented);
                    Console.WriteLine($"Response Content: {jsonResponse}");
                    var jsonObject = JObject.Parse(jsonResponse);
                     scoreAI = jsonObject["Value"]["ScoreAI"].Value<double>();
                    var extractedSkills = jsonObject["Value"]["ExtractedSkills"].ToObject<List<string>>();

                    // Convertir les compétences extraites en une chaîne, par exemple en une liste séparée par des virgules
                     competencesExtraites = string.Join(", ", extractedSkills);

                    Console.WriteLine($"Score AI: {scoreAI}");
                    Console.WriteLine($"Competences Extraites: {competencesExtraites}");
                }
                else
                {
                    Console.WriteLine("La réponse est vide ou invalide.");
                }


                // Création de l'objet Candidature
                var candidature = new Candidature
                {
                    CandidatId = candidat.Id,
                    OffreId = offre.Id,
                    Statut = "En cours",
                    DateCandidature = DateTime.Now,
                  
                };
              
                candidature.ScoreAI = scoreAI;
                candidature.CompetencesExtraites= competencesExtraites;


                // Ajout de la candidature à la base de données
                _context.Candidatures.Add(candidature);
                await _context.SaveChangesAsync();


                // Désérialisation des réponses JSON
                List<ReponseCandidatDto> reponsesList;
                try
                {
                    reponsesList = JsonConvert.DeserializeObject<List<ReponseCandidatDto>>(candidatureDto.ReponsesJson) ?? new();
                }
                catch (Exception)
                {
                    return BadRequest("Format des réponses invalide.");
                }

                if (!reponsesList.Any())
                {
                    return BadRequest("Aucune réponse fournie.");
                }

                // Calcul et enregistrement des réponses
                double testScore = 0.0;
                foreach (var repDto in reponsesList)
                {
                    var question = offre.Test.Questions.FirstOrDefault(q => q.Id == repDto.QuestionId);
                    if (question == null)
                    {
                        return BadRequest($"La question avec l'ID {repDto.QuestionId} n'existe pas.");
                    }
               

                    var repCandidat = new ReponseCandidat
                    {
                        CandidatureId = candidature.Id,
                        QuestionId = repDto.QuestionId,
                        OptionChoisieId = repDto.OptionChoisieId
                    };

                    _context.ReponseCandidats.Add(repCandidat);

                    // Calcul du score du test
                    if (repDto.OptionChoisieId == question.ReponseCorrecte)
                    {
                        testScore += 1.0;
                    }
                }

                await _context.SaveChangesAsync();

                // Mise à jour du score du test dans la candidature
                candidature.TestScore = testScore;
                _context.Candidatures.Update(candidature);
                await _context.SaveChangesAsync();

                // Commit de la transaction
                await transaction.CommitAsync();
                await _emailService.EnvoyerEmailConfirmationCandidatureAsync(candidature.Candidat.Email, candidature.Candidat.NomPrenom);
                var admin = (await _userManager.GetUsersInRoleAsync("Admin")).FirstOrDefault();
                var notification = new Notification(
                       contenu: $"Un nouveau candidat a soumis sa candidature pour l'offre {candidature.Offre.Titre} ",

                       type: "Nouvelle Candidature",
                       utilisateurId: admin.Id, // ID de l'administrateur
                       candidatureId: candidature.Id
                   );

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Envoyer via SignalR
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    message = notification.Contenu
                });
                return Ok(new { message = "Candidature soumise avec succès.", candidatureId = candidature.Id, testScore  });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Une erreur est survenue : {ex.Message}");
            }
        }

        [HttpDelete("supprimer-candidature/{id}")]
        public async Task<IActionResult> SupprimerCandidature(int id)
        {
            try
            {
                // Rechercher la candidature dans la base de données, y compris ses réponses et ses entretiens
                var candidature = await _context.Candidatures
                                                .Include(c => c.ReponseCandidats)
                                                .Include(c => c.Entretiens) // Inclure les entretiens liés
                                                .FirstOrDefaultAsync(c => c.Id == id);

                if (candidature == null)
                {
                    return NotFound("Candidature non trouvée.");
                }

                // Supprimer les entretiens associés
                if (candidature.Entretiens != null && candidature.Entretiens.Any())
                {
                    _context.Entretiens.RemoveRange(candidature.Entretiens);
                }

                // Supprimer les réponses associées
                if (candidature.ReponseCandidats != null && candidature.ReponseCandidats.Any())
                {
                    _context.ReponseCandidats.RemoveRange(candidature.ReponseCandidats);
                }

                // Supprimer la candidature
                _context.Candidatures.Remove(candidature);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Candidature supprimée avec succès." });
            }
            catch (Exception ex)
            {
                var innerExceptionMessage = ex.InnerException?.Message ?? "Aucune exception interne";
                return StatusCode(500, $"Une erreur est survenue : {ex.Message}. Exception interne: {innerExceptionMessage}");
            }
        }


        [HttpPut("modifier-statut/{id}/{nouveauStatut}")]
        public async Task<IActionResult> ModifierStatutCandidature(int id, string nouveauStatut)
        {
            try
            {
                // Vérifier si la candidature existe
                var candidature = await _context.Candidatures
               .Include(c => c.Candidat)
               .Include(c => c.Entretiens)

               .FirstOrDefaultAsync(c => c.Id == id);

                if (candidature == null)
                {
                    return NotFound("Candidature non trouvée.");
                }

                // Mettre à jour le statut
                candidature.Statut = nouveauStatut;

                // Sauvegarder les modifications
                _context.Candidatures.Update(candidature);
                await _context.SaveChangesAsync();
                var statutNormalise = nouveauStatut.Trim().ToLower();
             
                 if (statutNormalise == "acceptepreselection")
                {
                    await _emailService.EnvoyerEmailPreselectionAsync(candidature.Candidat.Email, candidature.Candidat.NomPrenom);
                    var rh = (await _userManager.GetUsersInRoleAsync("Gestionnaire RH")).FirstOrDefault();
                    if (rh == null)
                    {
                        // Log, throw, ou skip en toute sécurité
                        Console.WriteLine("Aucun utilisateur avec le rôle Gestionnaire RH trouvé.");
                        
                    }

                    var notification = new Notification(
                           contenu: $"Une nouvelle candidature a été acceptée lors de la présélection",

                           type: "PreSelection",
                           utilisateurId: rh.Id, // ID de l'administrateur
                           candidatureId: candidature.Id
                       );

                    try
                    {
                        _context.Notifications.Add(notification);
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Erreur lors de l'enregistrement de la notification : " + ex.Message);
                    }


                    // Envoyer via SignalR
                    await _hubContext.Clients.User(rh.Id.ToString()).SendAsync("ReceiveNotification", new
                    {
                        message = notification.Contenu
                    });

                }
                else if (statutNormalise == "refusepreselection" || statutNormalise == "refusé")
                {
                    await _emailService.EnvoyerEmailRefusAsync(
       candidature.Candidat.Email,
       candidature.Candidat.NomPrenom
   );
                }
  
                else if (statutNormalise.Contains("programmé"))
                {
                    // Récupérer la liste des entretiens futurs triés par date
                    var entretiensProchains = candidature.Entretiens
                        .Where(e => e.Statut == "En cours")
                        .OrderBy(e => e.DateEntretien)
                        .ToList();

                    // Prendre le plus proche
                    var entretienLePlusProche = entretiensProchains.FirstOrDefault();

                    if (entretienLePlusProche != null)
                    {
                        await _emailService.EnvoyerEmailEntretienProgrammeAsync(
                            candidature.Candidat.Email,
                            candidature.Candidat.NomPrenom,
                            entretienLePlusProche.TypeEntretien,
                            entretienLePlusProche.ModeEntretien,
                            entretienLePlusProche.DateEntretien
                        );
                    }
                }
                else if (statutNormalise.Contains("accepté"))
                {
                    // Récupérer les entretiens passés (ceux dont la date est antérieure ou égale à maintenant)
                    var entretiensPasses = candidature.Entretiens
                       .Where(e => e.DateEntretien <= DateTime.Now || e.Statut != "En cours")

                        .OrderByDescending(e => e.DateEntretien)
                        .ToList();

                    int nbPasses = entretiensPasses.Count;

                    if (nbPasses <= candidature.nbEntretiens)
                    {
                        var dernierEntretien = entretiensPasses.FirstOrDefault();

                        if (dernierEntretien != null)
                        {
                            await _emailService.EnvoyerEmailEntretienReussiEtEnAttenteAsync(
                                candidature.Candidat.Email,
                                candidature.Candidat.NomPrenom,
                                dernierEntretien.TypeEntretien,
                                dernierEntretien.DateEntretien
                            );
                        }
                    }
                }
          
              
              


                return Ok(new { message = "Statut de la candidature mis à jour avec succès." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Une erreur est survenue : {ex.Message}");
            }
        }
        [HttpPost("soumettre-candidature-simple")]
        public async Task<IActionResult> SoumettreCandidatureSimple([FromForm] CandidatureSimpleDto candidatureDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var roleCandidat = await _roleManager.FindByNameAsync("Candidat");
                if (roleCandidat == null)
                {
                    var newRole = new IdentityRole<int> { Name = "Candidat" };
                    var createRoleResult = await _roleManager.CreateAsync(newRole);
                    if (!createRoleResult.Succeeded)
                    {
                        return StatusCode(500, "Erreur lors de la création du rôle Candidat.");
                    }
                }

                // Vérification de l'offre
                var offre = await _context.Offres.FirstOrDefaultAsync(o => o.Id == candidatureDto.OffreId);
                if (offre == null)
                {
                    return NotFound("Offre non trouvée.");
                }

                // Vérifier si le candidat existe ou le créer
                var candidat = await _context.Candidats
     .FirstOrDefaultAsync(c => c.Email == candidatureDto.Email);

                if (candidat == null)
                {
                    candidat = new Condidat
                    {
                        NomPrenom = candidatureDto.NomPrenom,
                        Email = candidatureDto.Email,
                        
                        PhoneNumber = candidatureDto.Telephone,
                        LinkedIn = !string.IsNullOrEmpty(candidatureDto.LinkedIn)
                            ? (candidatureDto.LinkedIn.StartsWith("http") ? candidatureDto.LinkedIn : "https://" + candidatureDto.LinkedIn)
                            : null,
                       
                    };

                    _context.Candidats.Add(candidat);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    candidat.NomPrenom = candidatureDto.NomPrenom;
                    candidat.PhoneNumber = candidatureDto.Telephone;
                    candidat.LinkedIn = candidatureDto.LinkedIn;
                }

                // Sauvegarde du CV (si fourni)
                string cvPath = null;
                if (candidatureDto.CVFile != null && candidatureDto.CVFile.Length > 0)
                {
                    var extension = Path.GetExtension(candidatureDto.CVFile.FileName);
                    if (extension.ToLower() != ".pdf")
                    {
                        return BadRequest("Seuls les fichiers PDF sont acceptés.");
                    }

                    var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
                    if (!Directory.Exists(uploadsDir))
                    {
                        Directory.CreateDirectory(uploadsDir);
                    }

                    var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(candidatureDto.CVFile.FileName)}";
                    var filePath = Path.Combine(uploadsDir, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await candidatureDto.CVFile.CopyToAsync(stream);
                    }

                    string baseUrl = $"{Request.Scheme}://{Request.Host}";
                    cvPath = $"{baseUrl}/uploads/{fileName}";
                    candidat.CVPath = cvPath;
                }

                _context.Candidats.Update(candidat);
                await _context.SaveChangesAsync();

                // Calcul du ScoreAI et des compétences extraites
                double scoreAI = 0.0;
                string competencesExtraites = "";

                if (candidatureDto.CVFile != null)
                {
                    var responseObject = await _cvScoringController.ScoreCVPdf(candidatureDto.CVFile,offre.Competences.ToLower()) as OkObjectResult;
                    if (responseObject != null && responseObject.Value != null)
                    {
                        string jsonResponse = JsonConvert.SerializeObject(responseObject.Value, Formatting.Indented);
                        Console.WriteLine($"Response Content: {jsonResponse}");
                        var jsonObject = JObject.Parse(jsonResponse);
                        scoreAI = jsonObject["Value"]["ScoreAI"].Value<double>();
                        var extractedSkills = jsonObject["Value"]["ExtractedSkills"].ToObject<List<string>>();
                        competencesExtraites = string.Join(", ", extractedSkills);
                    }
                }

                // Création de l'objet Candidature
                var candidature = new Candidature
                {
                    CandidatId = candidat.Id,
                    OffreId = candidatureDto.OffreId,
                    Statut = "En cours",
                    DateCandidature = DateTime.Now,
                    ScoreAI = scoreAI,
                    CompetencesExtraites = competencesExtraites
                };

                _context.Candidatures.Add(candidature);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                await _emailService.EnvoyerEmailConfirmationCandidatureAsync(candidature.Candidat.Email, candidature.Candidat.NomPrenom);
                var admin = (await _userManager.GetUsersInRoleAsync("Admin")).FirstOrDefault();
                var notification = new Notification(
                       contenu: $"Un nouveau candidat a soumis sa candidature pour l'offre {candidature.Offre.Titre} ",

                       type: "Nouvelle Candidature",
                       utilisateurId: admin.Id, // ID de l'administrateur
                       candidatureId: candidature.Id
                   );

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Envoyer via SignalR
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                {
                    message = notification.Contenu
                });

                return Ok(new { message = "Candidature soumise avec succès.", candidatureId = candidature.Id, scoreAI });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Une erreur est survenue : {ex.Message}");
            }
        }
        [HttpGet("{id}/statut")]
        public async Task<IActionResult> GetStatutParCandidatureId(int id)
        {
            var candidature = await _context.Candidatures
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    Statut = c.Statut
                })
                .FirstOrDefaultAsync();

            if (candidature == null)
            {
                return NotFound(new { message = "Candidature non trouvée." });
            }

            return Ok(candidature);
        }


        [HttpGet("getAllCandidatures")]
        public async Task<ActionResult<IEnumerable<CandidatureDtoRH>>> GetAllCandidatures()
        {
            var candidatures = await _context.Candidatures
                .Include(c => c.Offre)
                .Include(c => c.Candidat)
                .Include(c => c.Entretiens) // Ajout de l'inclusion des entretiens associés
                .Select(c => new CandidatureDtoRH
                {
                    Id = c.Id,
                    Statut = c.Statut,
                    NomOffre = c.Offre.Titre,
                    NomPrenom = c.Candidat.NomPrenom,
                    Email = c.Candidat.Email,
                    Telephone = c.Candidat.PhoneNumber,
                    nbEntretiens=c.nbEntretiens,
                    // Transformation des entretiens en une liste de DTO ou propriétés appropriées
                    Entretiens = c.Entretiens.Select(e => new EntretienDto
                    {
                        Id = e.Id,
                        DateEntretien = e.DateEntretien,
                        Statut = e.Statut,
                        Commentaire=e.Commentaire,
                        TypeEntretien = e.TypeEntretien,
                        ModeEntretien = e.ModeEntretien
                    }).ToList()  // Retourner les entretiens associés sous forme de liste
                })
                .ToListAsync();

            return Ok(candidatures);
        }
        [HttpPut("updateNbEntretiens/{id}/{nbEntretiens}")]
        public async Task<IActionResult> UpdateNbEntretiens(int id, int nbEntretiens)
        {
            var candidature = await _context.Candidatures.FindAsync(id);

            if (candidature == null)
            {
                return NotFound(new { message = "Candidature non trouvée." });
            }

            candidature.nbEntretiens = nbEntretiens;
            await _context.SaveChangesAsync();

            return Ok(new { message = "nbEntretiens mis à jour avec succès." });
        }

        [HttpGet("{candidatureId}/entretiens")]
        public async Task<IActionResult> GetEntretiensParCandidature(int candidatureId)
        {
            try
            {
                // Récupérer la candidature avec les entretiens et le candidat
                var candidature = await _context.Candidatures
                    .Include(c => c.Offre)
                    .Include(c => c.Candidat)  // Inclure le candidat pour récupérer son nom
                    .Include(c => c.Entretiens)
                    .ThenInclude(e => e.Responsable)  // Inclure le responsable dans les entretiens
                    .FirstOrDefaultAsync(c => c.Id == candidatureId);

                if (candidature == null)
                {
                    return NotFound("Candidature non trouvée.");
                }

                // Créer le DTO avec l'ajout du nom du candidat
                var entretiensDto = candidature.Entretiens.OrderBy(e => e.DateEntretien).Select(e => new
                {
                    e.Id,
                    e.TypeEntretien,
                    e.DateEntretien,
                    e.Statut,
                    e.Commentaire,
                    e.ModeEntretien,
                    responsableId = e.ResponsableId, // ✅ Utiliser directement la propriété ResponsableId
                    responsableNom = e.Responsable != null ? e.Responsable.NomPrenom : "Non assigné", // Nom du responsable
                    NomCandidat = candidature.Candidat != null ? candidature.Candidat.NomPrenom : "Candidat non trouvé",
                    EmailCandidat = candidature.Candidat != null ? candidature.Candidat.Email : "Email non trouvé", 
                    TelephoneCandidat = candidature.Candidat != null ? candidature.Candidat.PhoneNumber : "Téléphone non trouvé",
                    Poste=candidature.Offre.Titre
                });

                return Ok(entretiensDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erreur serveur : {ex.Message}");
            }
        }


        [HttpGet("{id}/parcours")]
        public async Task<IActionResult> GetParcoursEtapes(int id)
        {
            var candidature = await _context.Candidatures
                .Include(c => c.Entretiens)
                    .ThenInclude(e => e.Responsable)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (candidature == null)
            {
                return NotFound(new { Message = "Candidature non trouvée" });
            }

            var parcoursEtapes = new List<ParcoursEtape>();

            // Étape 1 : Pré-sélection
            bool hasEntretiens = candidature.Entretiens.Any();
            parcoursEtapes.Add(new ParcoursEtape
            {
                EtapeNom = "Pré-sélection",
                ResponsableNom = "Admin",
                
                Statut = hasEntretiens ? "Terminé" : "En attente",
                Commentaire = hasEntretiens ? "Des entretiens ont été planifiés." : "En attente d'entretien."
            });

            // Étapes suivantes : Entretiens
            foreach (var entretien in candidature.Entretiens.OrderBy(e => e.DateEntretien))
            {
                parcoursEtapes.Add(new ParcoursEtape
                {
                    EtapeNom = entretien.TypeEntretien,
                    ResponsableNom = entretien.Responsable?.NomPrenom ?? "Responsable inconnu",
                    DateEntretien = entretien.DateEntretien,
                    Statut = entretien.Statut,
                    Commentaire = entretien.Commentaire
                });
            }

            return Ok(parcoursEtapes);
        }




    }
    public class CandidatureSimpleDto
    {
        public int OffreId { get; set; }
        public string NomPrenom { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }
        public string LinkedIn { get; set; }
        public IFormFile CVFile { get; set; }
    }
    public class CandidatureDtoRH
    {
        public int Id { get; set; }
        public string Statut { get; set; }
        public string NomOffre { get; set; }
        public string NomPrenom { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }
        public List<EntretienDto> Entretiens { get; set; }
        public int? nbEntretiens { get; set; }
    }
    public class EntretienDto
    {  public int Id { get; set; }
        public string TypeEntretien { get; set; }
        public DateTime DateEntretien { get; set; }
        public string ModeEntretien { get; set; }
        public string Statut { get; set; }
        public string Commentaire { get; set; }
    }

    public class ParcoursEtape
    {
        public string EtapeNom { get; set; }
        public string ResponsableNom { get; set; }
        public DateTime? DateEntretien { get; set; }
        public string Statut { get; set; }
        public string Commentaire { get; set; }
    }

}
