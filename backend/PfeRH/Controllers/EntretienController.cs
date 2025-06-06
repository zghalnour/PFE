using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PfeRH.Hubs;
using PfeRH.Models;
using PfeRH.services;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EntretienController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<Utilisateur> _userManager;
        private readonly EmailService _emailService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public EntretienController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext, UserManager<Utilisateur> userManager, EmailService emailService)
        {
            _context = context;
            _hubContext = hubContext;
            _userManager = userManager;
            _emailService = emailService;
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
       .OfType<Personnel>() 
       .FirstOrDefaultAsync(u => u.Id == dto.ResponsableId); 

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
                Commentaire = "", 
                Statut = "En cours" 
            };

            _context.Entretiens.Add(entretien);
            await _context.SaveChangesAsync();
            var resp = await _userManager.FindByIdAsync(dto.ResponsableId.ToString());

            if (resp != null)
            {
                var notification = new Notification(
                    contenu: $"Un nouvel entretien a été programmé.",
                    type: "Entretien Planifié",
                    utilisateurId: resp.Id,
                    candidatureId: entretien.CandidatureId
                );

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                await _hubContext.Clients.User(resp.Id.ToString()).SendAsync("ReceiveNotification", new
                {
                    message = notification.Contenu
                });
            }

            return Ok(entretien.Id);


        }
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateEntretien(int id, [FromBody] EntretienUpdateDto dto)
        {
            var entretien = await _context.Entretiens
     .Include(e => e.Candidature)
         .ThenInclude(c => c.Offre)
       .Include(e => e.Candidature)
            .ThenInclude(c => c.Candidat)
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
            var candidature = entretien.Candidature;
            var candidatureId = entretien.CandidatureId;
            var totalEntretiens = entretien.Candidature.nbEntretiens;
            var totalTerminés = await _context.Entretiens
    .Where(e => e.CandidatureId == candidatureId && e.Statut != "En cours")
    .CountAsync();
            if (dto.Statut == "Echoué")
            {
                if (candidature?.Candidat != null)
                {
                  
                    await _emailService.EnvoyerEmailRefusAsync(
                        candidature.Candidat.Email,
                        candidature.Candidat.NomPrenom
                    );
                }
                else
                {
                    Console.WriteLine("Candidat est null !");
                }
            }
            var hasEchec = await _context.Entretiens
    .AnyAsync(e => e.CandidatureId == candidatureId && e.Statut == "Echoué");

            if (totalEntretiens == totalTerminés && !hasEchec)


                if (totalEntretiens == totalTerminés)
            {
                
                var admin = (await _userManager.GetUsersInRoleAsync("Admin")).FirstOrDefault();
                if (admin == null)
                {
                    return BadRequest(new { message = "Aucun administrateur trouvé" });
                }

                if (candidature != null && candidature.Offre != null)
                {
                    // Créer et envoyer la notification à l'admin (userId = 1)
                    var notification = new Notification(
                        contenu: $"Une nouvelle candidature pour le poste de {candidature.Offre.Titre} a été traitée.",
                        type: "Parcours Candidature",
                        utilisateurId: admin.Id, // ID de l'administrateur
                        candidatureId: candidature.Id
                    );

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    // Envoyer via SignalR
                    await _hubContext.Clients.User(admin.Id.ToString()).SendAsync("ReceiveNotification", new
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
        [HttpGet("by-responsable-id")]
        public async Task<ActionResult<IEnumerable<object>>> GetEntretiensByResponsableId([FromQuery] int id)
        {
            if (id <= 0)
            {
                return BadRequest("L'identifiant du responsable est requis.");
            }

            var entretiens = await _context.Entretiens
                .Include(e => e.Responsable)
                .Include(e => e.Candidature)
                    .ThenInclude(c => c.Offre)
                .Include(e => e.Candidature)
                    .ThenInclude(c => c.Candidat) // Inclure le candidat
                .Where(e => e.ResponsableId == id && e.Statut=="En cours")
                .Select(e => new
                {
                    IdEntretien = e.Id,
                    TypeEntretien = e.TypeEntretien,
                    ModeEntretien = e.ModeEntretien,
                    DateEntretien=e.DateEntretien,
                    StatutEntretien = e.Statut,
                    NomPrenom = e.Candidature != null && e.Candidature.Candidat != null
                                ? e.Candidature.Candidat.NomPrenom
                                : null,
                    NomOffre = e.Candidature != null && e.Candidature.Offre != null
                               ? e.Candidature.Offre.Titre
                               : null
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

