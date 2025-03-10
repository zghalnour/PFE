using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PfeRH.Models;
using PfeRH.DTO;
using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
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
                .Include(o => o.Candidatures) // Inclure les candidatures pour compter
                .Select(o => new OffreDTO
                {
                    ID=o.Id,
                    Titre = o.Titre,
                    Description = o.Description,
                    Competences = o.Competences,
                    NombreCandidatures = o.Candidatures != null ? o.Candidatures.Count : 0,
                    Statut = o.Statut,
                    DateLimite = DateOnly.FromDateTime(o.DateLimitePostulation).ToString("dd/MM/yyyy")

        })
                .ToListAsync();

            return Ok(offres);
        }

        [HttpGet("candidatures-par-offre-titre/{titre}")]
        public async Task<ActionResult> GetCandidaturesByOffreTitre(string titre)
        {
            // Recherche de l'offre par titre (insensible à la casse)
            var offre = await _context.Offres
                .FirstOrDefaultAsync(o => o.Titre.ToLower() == titre.ToLower());

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
                Score = c.ReponseCandidats.Count(r => r.EstCorrecte), // Score basé sur les réponses correctes
                scoreAI = c.ScoreAI, // Assurez-vous que ScoreAI est bien défini dans l'entité
                CompetencesExtraites = c.CompetencesExtraites.Split(", ").ToList(),
                Candidat = new CandidatDTO
                {
                    Id = c.Candidat.Id,
                    NomPrenom = c.Candidat.NomPrenom,
                    Email = c.Candidat.Email,
                    Telephone = c.Candidat.Telephone,
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

            // Retourner un JSON structuré avec un message et les candidatures
            return Ok(new
            {
                message = "Candidatures récupérées avec succès.",
                candidatures = result
            });
        }


        [HttpPut("modifier-offre/{id}")]
        public async Task<IActionResult> ModifierOffre(int id, [FromBody] OffreDTO offreDto)
        {
            if (offreDto == null)
            {
                return BadRequest("offreDto is required.");
            }

            var offre = await _context.Offres.FindAsync(id);
            if (offre == null)
            {
                return NotFound();
            }

            // Conversion de la chaîne de la dateLimite en DateOnly
            if (DateOnly.TryParseExact(offreDto.DateLimite, "dd/MM/yyyy", out DateOnly dateLimite))
            {
                // Mettre à jour seulement si la date a changé
                if (offre.DateLimitePostulation != dateLimite.ToDateTime(new TimeOnly(0, 0)))
                {
                    offre.DateLimitePostulation = dateLimite.ToDateTime(new TimeOnly(0, 0));
                }
            }
            else
            {
                return BadRequest("Invalid date format. Expected dd/MM/yyyy.");
            }

            // Mise à jour des autres propriétés, uniquement si elles ont changé
            if (offre.Titre != offreDto.Titre && !string.IsNullOrEmpty(offreDto.Titre))
            {
                offre.Titre = offreDto.Titre;
            }

            if (offre.Description != offreDto.Description && !string.IsNullOrEmpty(offreDto.Description))
            {
                offre.Description = offreDto.Description;
            }

            if (offre.Competences != offreDto.Competences && !string.IsNullOrEmpty(offreDto.Competences))
            {
                offre.Competences = offreDto.Competences;
            }

            // Le statut peut aussi être modifié en fonction de la date limite, si nécessaire.
            // Par exemple, si la date limite est passée, on pourrait mettre à jour le statut :
          

            // Mettre à jour l'état de l'entité dans le contexte
            _context.Entry(offre).State = EntityState.Modified;
            await _context.SaveChangesAsync();

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


    }
}
