using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PfeRH.Models;
using PfeRH.DTO;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Microsoft.IdentityModel.Tokens;
namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OffreController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OffreController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpPost("ajouter-offre-avec-test")]
        public async Task<ActionResult> AjouterOffreAvecTest(OffreCreateDto offreDto)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Créer un nouveau test
                    var nouveauTest = new Test
                    {
                        Description = offreDto.TestDescription,
                        // Autres propriétés du test (si nécessaire)
                    };

                    // Ajouter les questions au test
                    foreach (var questionDto in offreDto.Questions)
                    {
                        var question = new Question
                        {
                            Intitule = questionDto.Enonce,
                            Option1 = questionDto.Option1,
                            Option2 = questionDto.Option2,
                            Option3 = questionDto.Option3,
                            ReponseCorrecte = questionDto.ReponseCorrecte
                        };
                        nouveauTest.Questions.Add(question);
                    }

                    // Ajoutez le Test à la base de données
                    _context.Tests.Add(nouveauTest);
                    await _context.SaveChangesAsync(); // Sauvegardez d'abord le test pour obtenir l'ID

                    // Créer l'offre avec le TestId
                    var nouvelleOffre = new Offre
                    {
                        Titre = offreDto.Titre,
                        TypeContrat=offreDto.TypeContrat,
                        Description = offreDto.Description,
                        TestId = nouveauTest.Id, // Associez le TestId
                     
                        Competences = offreDto.Competences,
                        DateLimitePostulation = DateTime.Parse(offreDto.DateLimitePostulation)
                    // Ajoutez d'autres propriétés de l'offre si nécessaire
                };

                    // Ajoutez l'Offre à la base de données
                    _context.Offres.Add(nouvelleOffre);
                    await _context.SaveChangesAsync(); // Sauvegardez l'offre

                    // Si tout se passe bien, on valide la transaction
                    await transaction.CommitAsync();

                    return Ok(new { message = "Offre et Test avec questions ajoutés avec succès." });
                }
                catch (Exception ex)
                {
                    // En cas d'erreur, on annule la transaction
                    await transaction.RollbackAsync();
                    return BadRequest("Erreur lors de l'ajout de l'offre et du test : " + ex.Message);
                }
            }
        }
        [HttpGet("get-all-offres")]
        public async Task<ActionResult<IEnumerable<OffreDTO>>> GetAllOffres()
        {
            var offres = await _context.Offres
                .AsNoTracking()
                .GroupJoin(
                    _context.Candidatures,
                    o => o.Id,
                    c => c.OffreId,
                    (o, candidatures) => new { Offre = o, NombreCandidatures = candidatures.Count() }
                )
                .Select(o => new OffreDTO
                {
                    ID = o.Offre.Id,
                    Titre = o.Offre.Titre,
                    TypeContrat = o.Offre.TypeContrat,
                    Description = o.Offre.Description,
                    Competences = o.Offre.Competences,
                    NombreCandidatures = o.NombreCandidatures,
                    Statut = o.Offre.Statut,
                    DateLimite = DateOnly.FromDateTime(o.Offre.DateLimitePostulation).ToString("dd/MM/yyyy"),

                    // Vérification de l'existence du test
                    TestId = o.Offre.TestId ?? 0,
                    descTest = o.Offre.Test != null ? o.Offre.Test.Description : string.Empty,

                    // Charger uniquement les questions si un test existe
                    Questions = o.Offre.Test != null
                        ? o.Offre.Test.Questions.Select(q => new QuestionDTO
                        {
                            Id = q.Id,
                            Intitule = q.Intitule,
                            Option1 = q.Option1,
                            Option2 = q.Option2,
                            Option3 = q.Option3,
                            ReponseCorrecte = q.ReponseCorrecte
                        }).ToList()
                        : new List<QuestionDTO>()
                })
                .ToListAsync();

            return Ok(offres);
        }
        [HttpGet("get-Ouv-offres")]
        public async Task<ActionResult<IEnumerable<OffreDTO>>> GetAllOffresC()
        {
            var offres = await _context.Offres
                .AsNoTracking()
                .Where(o => o.DateLimitePostulation >= DateTime.Now) 
                .GroupJoin(
                    _context.Candidatures,
                    o => o.Id,
                    c => c.OffreId,
                    (o, candidatures) => new { Offre = o, NombreCandidatures = candidatures.Count() }
                )
                .Select(o => new OffreDTO
                {
                    ID = o.Offre.Id,
                    Titre = o.Offre.Titre,
                    TypeContrat = o.Offre.TypeContrat,
                    Description = o.Offre.Description,
                    Competences = o.Offre.Competences,
                    NombreCandidatures = o.NombreCandidatures,
                    Statut = o.Offre.Statut,
                    DateLimite = DateOnly.FromDateTime(o.Offre.DateLimitePostulation).ToString("dd/MM/yyyy"),

                    TestId = o.Offre.TestId ?? 0,
                    descTest = o.Offre.Test != null ? o.Offre.Test.Description : string.Empty,

                    Questions = o.Offre.Test != null
                        ? o.Offre.Test.Questions.Select(q => new QuestionDTO
                        {
                            Id = q.Id,
                            Intitule = q.Intitule,
                            Option1 = q.Option1,
                            Option2 = q.Option2,
                            Option3 = q.Option3,
                            ReponseCorrecte = q.ReponseCorrecte
                        }).ToList()
                        : new List<QuestionDTO>()
                })
                .ToListAsync();

            return Ok(offres);
        }


        [HttpGet("candidatures-par-offre-titre/{titre}")]
        public async Task<ActionResult> GetCandidaturesByOffreTitre(string titre)
        {
            

            // Recherche de l'offre par titre (insensible à la casse et aux espaces)
            var offre = await _context.Offres
                .FirstOrDefaultAsync(o => o.Titre.Trim().ToLower() == titre.Trim().ToLower());

            if (offre == null)
            {
                return NotFound(new { message = "Offre non trouvée." });
            }

            // Recherche des candidatures pour l'offre trouvée
            var candidatures = await _context.Candidatures
                .Where(c => c.OffreId == offre.Id)
                .Include(c => c.Candidat)
                .Include(c => c.ReponseCandidats)
                    .ThenInclude(r => r.Question)
                .OrderByDescending(c => c.ScoreAI)
                .ToListAsync();

            if (!candidatures.Any())
            {
                return NotFound(new { message = "Aucune candidature trouvée pour cette offre." });
            }

            // Construction du résultat
            var result = candidatures.Select(c => new CandidatureDto
            {
                Id = c.Id,
                Statut = c.Statut,
                Score = c.ReponseCandidats.Count(r => r.EstCorrecte),
                scoreAI = c.ScoreAI,
                CompetencesExtraites = c.CompetencesExtraites.Split(", ").ToList(),
                Candidat = new CandidatDTO
                {
                    Id = c.Candidat.Id,
                    NomPrenom = c.Candidat.NomPrenom,
                    Email = c.Candidat.Email,
                    PhoneNumber = c.Candidat.PhoneNumber,
                    LinkedIn = c.Candidat.LinkedIn,
                    CVPath = c.Candidat.CVPath
                },
                Reponses = c.ReponseCandidats.Select(r => new ReponseCandidatDTO
                {
                    Intitule = r.Question.Intitule,
                    OptionChoisie = r.Question.GetOptionById(r.OptionChoisieId),
                    EstCorrecte = r.EstCorrecte
                }).ToList()
            }).ToList();

            return Ok(new
            {
                message = "Candidatures récupérées avec succès.",
                candidatures = result
            });
        }
        [HttpGet("candidatures-sans-test/{titre}")]
        public async Task<ActionResult> GetCandidaturesSansTest(string titre)
        {
            // Recherche de l'offre par titre (insensible à la casse et aux espaces)
            var offre = await _context.Offres
                .FirstOrDefaultAsync(o => o.Titre.Trim().ToLower() == titre.Trim().ToLower());

            if (offre == null)
            {
                return NotFound(new { message = "Offre non trouvée." });
            }

            // Recherche des candidatures pour l'offre trouvée
            var candidatures = await _context.Candidatures
                .Where(c => c.OffreId == offre.Id)
                .Include(c => c.Candidat)
                .ToListAsync();

            if (!candidatures.Any())
            {
                return NotFound(new { message = "Aucune candidature trouvée pour cette offre." });
            }

            // Construction du résultat (avec scoreAI mais sans test score ni réponses candidat)
            var result = candidatures.Select(c => new
            {
                Id = c.Id,
                Statut = c.Statut,
                ScoreAI = c.ScoreAI,  // ✅ Score AI conservé
                CompetencesExtraites = c.CompetencesExtraites.Split(", ").ToList(),
                Candidat = new
                {
                    Id = c.Candidat.Id,
                    NomPrenom = c.Candidat.NomPrenom,
                    Email = c.Candidat.Email,
                    PhoneNumber = c.Candidat.PhoneNumber,
                    LinkedIn = c.Candidat.LinkedIn,
                    CVPath = c.Candidat.CVPath
                }
            }).ToList();

            return Ok(new
            {
                message = "Candidatures récupérées avec succès.",
                candidatures = result
            });
        }


        [HttpPost("ajouter-offre-sans-test")]
        public async Task<ActionResult> AjouterOffre(OffreSansTestDto offreDto)
        {
            try
            {
                var nouvelleOffre = new Offre
                {
                    Titre = offreDto.Titre,
                    TypeContrat = offreDto.TypeContrat,
                    Description = offreDto.Description,
                    Competences = offreDto.Competences,
                    DateLimitePostulation = DateTime.Parse(offreDto.DateLimitePostulation)
                };

                _context.Offres.Add(nouvelleOffre);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Offre ajoutée avec succès.", offreId = nouvelleOffre.Id });
            }
            catch (Exception ex)
            {
                return BadRequest("Erreur lors de l'ajout de l'offre : " + ex.Message);
            }
        }



        [HttpPut("modifier-offre/{id}")]
        public async Task<IActionResult> ModifierOffre(int id, [FromBody] OffreDTO offreDto)
        {
            if (offreDto == null)
            {
                return BadRequest("offreDto is required.");
            }

            var offre = await _context.Offres
                .Include(o => o.Test)
                .ThenInclude(t => t.Questions)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (offre == null)
            {
                return NotFound("Offre not found.");
            }

            bool isUpdated = false;

            // Mise à jour des champs de l'offre
            if (!string.IsNullOrEmpty(offreDto.Titre) && offre.Titre != offreDto.Titre)
            {
                offre.Titre = offreDto.Titre;
                isUpdated = true;
            }
            if (!string.IsNullOrEmpty(offreDto.TypeContrat) && offre.TypeContrat != offreDto.TypeContrat)
            {
                offre.TypeContrat = offreDto.TypeContrat;
                isUpdated = true;
            }

            if (!string.IsNullOrEmpty(offreDto.Description) && offre.Description != offreDto.Description)
            {
                offre.Description = offreDto.Description;
                isUpdated = true;
            }

            if (!string.IsNullOrEmpty(offreDto.Competences) && offre.Competences != offreDto.Competences)
            {
                offre.Competences = offreDto.Competences;
                isUpdated = true;
            }

            // Mise à jour de la date limite
            if (!string.IsNullOrEmpty(offreDto.DateLimite) && DateOnly.TryParseExact(offreDto.DateLimite, "dd/MM/yyyy", out DateOnly dateLimite))
            {
                var nouvelleDate = dateLimite.ToDateTime(new TimeOnly(0, 0));
                if (offre.DateLimitePostulation != nouvelleDate)
                {
                    offre.DateLimitePostulation = nouvelleDate;
                    isUpdated = true;
                }
            }
            else if (!string.IsNullOrEmpty(offreDto.DateLimite))
            {
                return BadRequest("Invalid date format. Expected dd/MM/yyyy.");
            }

            // Mise à jour du test associé
            if (offreDto.TestId > 0 && (offre.Test == null || offre.Test.Id != offreDto.TestId))
            {
                var test = await _context.Tests
                    .Include(t => t.Questions)
                    .FirstOrDefaultAsync(t => t.Id == offreDto.TestId);

                if (test == null)
                {
                    return NotFound("Test not found.");
                }

                offre.Test = test;
                isUpdated = true;
            }
            if (offre.Test != null && !string.IsNullOrEmpty(offreDto.descTest) && offre.Test.Description != offreDto.descTest)
            {
                offre.Test.Description = offreDto.descTest;
                isUpdated = true;
            }

            // Mise à jour des questions
            if (offre.Test != null && offreDto.Questions != null)
            {
                foreach (var questionDto in offreDto.Questions)
                {
                    var existingQuestion = offre.Test.Questions.FirstOrDefault(q => q.Id == questionDto.Id);
                    if (existingQuestion != null)
                    {
                        bool questionUpdated = false;

                        if (!string.IsNullOrEmpty(questionDto.Intitule) && existingQuestion.Intitule != questionDto.Intitule)
                        {
                            existingQuestion.Intitule = questionDto.Intitule;
                            questionUpdated = true;
                        }

                        if (!string.IsNullOrEmpty(questionDto.Option1) && existingQuestion.Option1 != questionDto.Option1)
                        {
                            existingQuestion.Option1 = questionDto.Option1;
                            questionUpdated = true;
                        }

                        if (!string.IsNullOrEmpty(questionDto.Option2) && existingQuestion.Option2 != questionDto.Option2)
                        {
                            existingQuestion.Option2 = questionDto.Option2;
                            questionUpdated = true;
                        }

                        if (!string.IsNullOrEmpty(questionDto.Option3) && existingQuestion.Option3 != questionDto.Option3)
                        {
                            existingQuestion.Option3 = questionDto.Option3;
                            questionUpdated = true;
                        }

                        if (questionDto.ReponseCorrecte > 0 && existingQuestion.ReponseCorrecte != questionDto.ReponseCorrecte)

                        {
                            existingQuestion.ReponseCorrecte = questionDto.ReponseCorrecte;
                            questionUpdated = true;
                        }

                        if (questionUpdated)
                        {
                            isUpdated = true;
                        }
                    }
                    else
                    {
                        // Ajouter une nouvelle question seulement si toutes les valeurs sont valides
                        if (!string.IsNullOrEmpty(questionDto.Intitule) &&
                            !string.IsNullOrEmpty(questionDto.Option1) &&
                            !string.IsNullOrEmpty(questionDto.Option2) &&
                            !string.IsNullOrEmpty(questionDto.Option3) &&
                           questionDto.ReponseCorrecte > 0)
                        {
                            offre.Test.Questions.Add(new Question
                            {
                                Intitule = questionDto.Intitule,
                                Option1 = questionDto.Option1,
                                Option2 = questionDto.Option2,
                                Option3 = questionDto.Option3,
                                ReponseCorrecte = questionDto.ReponseCorrecte
                            });

                            isUpdated = true;
                        }
                    }
                }
            }

            if (isUpdated)
            {
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }



        [HttpDelete("supprimer-offre/{id}")]
        public async Task<IActionResult> SupprimerOffre(int id)
        {
            var offre = await _context.Offres
                .Include(o => o.Candidatures) // Inclure les candidatures associées
                .ThenInclude(c => c.ReponseCandidats) // Inclure les réponses des candidats associées
                .Include(o => o.Test) // Inclure le test associé à l'offre
                .FirstOrDefaultAsync(o => o.Id == id);

            if (offre == null)
            {
                return NotFound("Offre non trouvée.");
            }

            // Supprimer le test associé (si existe)
            if (offre.Test != null)
            {
                _context.Tests.Remove(offre.Test); // Suppression du test
            }

            // Supprimer les réponses des candidats associées
            foreach (var candidature in offre.Candidatures)
            {
                _context.ReponseCandidats.RemoveRange(candidature.ReponseCandidats);
            }

            // Supprimer les candidatures associées
            _context.Candidatures.RemoveRange(offre.Candidatures);

            // Supprimer l'offre
            _context.Offres.Remove(offre);

            // Sauvegarder les changements dans la base de données
            await _context.SaveChangesAsync();

            return Ok("Offre, candidatures, réponses des candidats et test supprimés avec succès.");
        }

        [HttpGet("get-offre/{id}")]
        public async Task<ActionResult<OffreDTO>> GetOffreById(int id)
        {
            var offre = await _context.Offres
                .AsNoTracking()
                .Where(o => o.Id == id)
                .GroupJoin(
                    _context.Candidatures,
                    o => o.Id,
                    c => c.OffreId,
                    (o, candidatures) => new { Offre = o, NombreCandidatures = candidatures.Count() }
                )
                .Select(o => new OffreDTO
                {
                    ID = o.Offre.Id,
                    Titre = o.Offre.Titre,
                    TypeContrat = o.Offre.TypeContrat,
                    Description = o.Offre.Description,
                    Competences = o.Offre.Competences,
                    NombreCandidatures = o.NombreCandidatures,
                    Statut = o.Offre.Statut,
                    DateLimite = DateOnly.FromDateTime(o.Offre.DateLimitePostulation).ToString("dd/MM/yyyy"),

                    // Vérifie si un test existe
                    TestId = o.Offre.TestId ?? 0,
                    descTest = o.Offre.Test != null ? o.Offre.Test.Description : string.Empty,

                    // Charge les questions uniquement si un test est présent
                    Questions = o.Offre.Test != null
                        ? o.Offre.Test.Questions.Select(q => new QuestionDTO
                        {
                            Id = q.Id,
                            Intitule = q.Intitule,
                            Option1 = q.Option1,
                            Option2 = q.Option2,
                            Option3 = q.Option3,
                            ReponseCorrecte = q.ReponseCorrecte
                        }).ToList()
                        : new List<QuestionDTO>()
                })
                .FirstOrDefaultAsync();

            if (offre == null)
            {
                return NotFound(new { message = "Offre non trouvée." });
            }

            return Ok(offre);
        }



    }
    public class OffreSansTestDto
    {
        public string Titre { get; set; }
        public string Description { get; set; }
        public string TypeContrat { get; set; }
        public string Competences { get; set; }
        public string DateLimitePostulation { get; set; }
    }
}
