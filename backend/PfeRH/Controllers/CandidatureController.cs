using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PfeRH.DTO;
using PfeRH.Models;
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

        public CandidatureController(ApplicationDbContext context, UserManager<Utilisateur> userManager, RoleManager<IdentityRole<int>> roleManager, CvScoringController cvScoringController)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _cvScoringController = cvScoringController;
        }
        [HttpPost("soumettre-candidature")]
        public async Task<IActionResult> SoumettreCandidature([FromForm] CandidatureSubmissionDto candidatureDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
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
                var candidat = await _context.Utilisateurs.OfType<Condidat>()
                                                          .FirstOrDefaultAsync(c => c.Email == candidatureDto.Email);

                if (candidat == null)
                {
                    candidat = new Condidat
                    {
                        NomPrenom = candidatureDto.NomPrenom,
                        Email = candidatureDto.Email,
                        UserName = candidatureDto.Email,
                        Telephone = candidatureDto.Telephone,
                        LinkedIn = candidatureDto.LinkedIn,
                        Role = "Candidat"
                    };

                    var result = await _userManager.CreateAsync(candidat, "DefaultPassword123!");
                    if (!result.Succeeded)
                    {
                        return BadRequest(result.Errors);
                    }

                    await _userManager.AddToRoleAsync(candidat, "Candidat");
                }
                else
                {
                    candidat.NomPrenom = candidatureDto.NomPrenom;
                    candidat.Telephone = candidatureDto.Telephone;
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

                    cvPath = $"uploads/{fileName}";
                    candidat.CVPath = cvPath;
                }

                _context.Utilisateurs.Update(candidat);
                await _context.SaveChangesAsync();


                double scoreAI = 0.0;
                string competencesExtraites = "";

                var responseObject = await _cvScoringController.ScoreCVPdf(candidatureDto.CVFile, offre.Competences) as OkObjectResult;

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
                // Rechercher la candidature dans la base de données, y compris ses réponses
                var candidature = await _context.Candidatures
                                                .Include(c => c.ReponseCandidats) // Inclure les réponses associées
                                                .FirstOrDefaultAsync(c => c.Id == id);

                if (candidature == null)
                {
                    return NotFound("Candidature non trouvée.");
                }

                // Supprimer toutes les réponses associées
                _context.ReponseCandidats.RemoveRange(candidature.ReponseCandidats);

                // Supprimer la candidature
                _context.Candidatures.Remove(candidature);
                await _context.SaveChangesAsync();

                // Retourner une réponse réussie
                return Ok(new { message = "Candidature supprimée avec succès." });
            }
            catch (Exception ex)
            {
                // Enregistrer l'exception interne
                var innerExceptionMessage = ex.InnerException?.Message ?? "Aucune exception interne";
                return StatusCode(500, $"Une erreur est survenue : {ex.Message}. Exception interne: {innerExceptionMessage}");
            }
        }




    }
}
