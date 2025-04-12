using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EntretienController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EntretienController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpPost("add")]
        public async Task<ActionResult<Entretien>> AddEntretien([FromBody] EntretienCreateDto dto)
        {
            var candidature = await _context.Candidatures.FindAsync(dto.CandidatureId);
            if (candidature == null)
            {
                return NotFound($"Candidature avec ID {dto.CandidatureId} non trouvée.");
            }
            var responsable = await _context.Users
       .OfType<Employe>() // Filtrer pour obtenir uniquement les Employe
       .FirstOrDefaultAsync(u => u.Id == dto.ResponsableId); // Rechercher l'employé avec l'ID du responsable

            if (responsable == null)
            {
                return NotFound($"Responsable avec ID {dto.ResponsableId} non trouvé.");
            }

            var entretien = new Entretien
            {
                CandidatureId = dto.CandidatureId,
                TypeEntretien = dto.TypeEntretien,
                ModeEntretien = dto.ModeEntretien,
                DateEntretien = dto.DateEntretien,
                ResponsableId = dto.ResponsableId,
                Commentaire = "", // vide par défaut
                Statut = "En cours" // par défaut
            };

            _context.Entretiens.Add(entretien);
            await _context.SaveChangesAsync();

            return Ok(entretien.Id);


        }
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateEntretien(int id, [FromBody] EntretienUpdateDto dto)
        {
            var entretien = await _context.Entretiens.FindAsync(id);
            if (entretien == null)
            {
                return NotFound($"Entretien avec ID {id} non trouvé.");
            }

            // Mettre à jour le commentaire et le statut
            entretien.Commentaire = dto.Commentaire;
            entretien.Statut = dto.Statut;

            // Vérifier si le statut est valide
            if (!new[] { "Passé", "Echoué", "En cours" }.Contains(entretien.Statut))
            {
                return BadRequest("Statut invalide. Utilisez 'Passé', 'Echoué', ou 'En cours'.");
            }

            _context.Entretiens.Update(entretien);
            await _context.SaveChangesAsync();

            return Ok(entretien); // Retourne l'objet entretien mis à jour
        }



    }
    public class EntretienCreateDto
    {
        public int CandidatureId { get; set; }
        public string TypeEntretien { get; set; }
        public string ModeEntretien { get; set; }
        public DateTime DateEntretien { get; set; }
        public int ResponsableId { get; set; }
    }
    public class EntretienUpdateDto
    {
        public string Commentaire { get; set; }
        public string Statut { get; set; } // Accepté, Refusé, En cours
    }


}

