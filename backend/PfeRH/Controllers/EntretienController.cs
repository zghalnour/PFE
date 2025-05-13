using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PfeRH.Hubs;
using PfeRH.Models;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EntretienController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public EntretienController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
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
            var entretien = await _context.Entretiens
     .Include(e => e.Candidature)
         .ThenInclude(c => c.Offre)
     .FirstOrDefaultAsync(e => e.Id == id);
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
            var candidatureId = entretien.CandidatureId;
            var totalEntretiens = entretien.Candidature.nbEntretiens;
            var totalTerminés = await _context.Entretiens
    .Where(e => e.CandidatureId == candidatureId && e.Statut != "En cours")
    .CountAsync();
            if (totalEntretiens == totalTerminés)
            {
                var candidature = entretien.Candidature;

                if (candidature != null && candidature.Offre != null)
                {
                    // Créer et envoyer la notification à l'admin (userId = 1)
                    var notification = new Notification(
                        contenu: $"Une nouvelle candidature pour le poste de {candidature.Offre.Titre} a été traitée.",
                        type: "Parcours Candidature",
                        utilisateurId: 1, // ID de l'administrateur
                        candidatureId: candidature.Id
                    );

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    // Envoyer via SignalR
                    await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
                    {
                        message = notification.Contenu
                    });
                }
            }
            var response = new EntretienResponseDto
            {
                Id = entretien.Id,
                Commentaire = entretien.Commentaire,
                Statut = entretien.Statut,
                candidatureId = entretien.CandidatureId,
               
            };

            return Ok(response);


        }
        [HttpGet("dates")]
        public async Task<ActionResult<IEnumerable<EntretienDateDto>>> GetAllDateEntretiens()
        {
            var dates = await _context.Entretiens
                .Select(e => new EntretienDateDto
                {
                    Id = e.Id,
                    DateEntretien = e.DateEntretien
                })
                .ToListAsync();

            return Ok(dates);
        }

        [HttpGet("by-responsable")]
        public async Task<ActionResult<IEnumerable<object>>> GetEntretiensByResponsableName([FromQuery] string nom)
        {
            if (string.IsNullOrWhiteSpace(nom))
            {
                return BadRequest("Le nom du responsable est requis.");
            }

            var entretiens = await _context.Entretiens
                .Include(e => e.Responsable)
                .Where(e => e.Responsable != null &&
                            (e.Responsable.NomPrenom).ToLower().Contains(nom.ToLower()))
                .Select(e => new
                {
                    Id = e.Id,
                    Commentaire = e.Commentaire,
                    Statut = e.Statut,
                    CandidatureId = e.CandidatureId,
                    NomPrenomResponsable = e.Responsable.NomPrenom
                })
                .ToListAsync();

            return Ok(entretiens);
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
        public string? Commentaire { get; set; }
        public string Statut { get; set; } // Accepté, Refusé, En cours
    }
    public class EntretienResponseDto
    {
        public int Id { get; set; }
        public string Commentaire { get; set; }
        public string Statut { get; set; }
        public int candidatureId { get; set; }
       
    }

    public class EntretienDateDto
    {
        public int Id { get; set; }
        public DateTime DateEntretien { get; set; }
    }


}

