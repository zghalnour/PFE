using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PfeRH.Hubs;
using PfeRH.Models;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReclamationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<Utilisateur> _userManager;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ReclamationController(ApplicationDbContext context, UserManager<Utilisateur> userManager,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _userManager = userManager;
            _hubContext = hubContext;
        }

        // POST: api/Reclamation
        [HttpPost("add")]
        public async Task<IActionResult> AjouterReclamation([FromBody] ReclamationRequest reclamationRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Vérifier que l'employé existe
            var employe = await _context.Utilisateurs
                .OfType<Employe>()
                .FirstOrDefaultAsync(e => e.Id == reclamationRequest.EmployeId);

            if (employe == null)
                return NotFound(new { message = "Employé non trouvé" });

            // Créer une nouvelle réclamation avec la description et l'ID de l'employé
            var reclamation = new Reclamation
            {
                EmployeId = reclamationRequest.EmployeId,
                Description = reclamationRequest.Description,
                DateReclamation = DateTime.Now.Date // Date automatiquement définie
            };

            _context.Reclamations.Add(reclamation);
            await _context.SaveChangesAsync();
            var admin = (await _userManager.GetUsersInRoleAsync("Admin")).FirstOrDefault();
            var notification = new Notification(
                   contenu: $"Une nouvelle reclamation de l'employe {employe.NomPrenom} ",
                   type: "Reclamation",
                   utilisateurId: admin.Id
                   
               );

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Envoyer via SignalR
            await _hubContext.Clients.User(admin.Id.ToString()).SendAsync("ReceiveNotification", new
            {
                message = notification.Contenu
            });

            return Ok(new
            {
                message = "Réclamation ajoutée avec succès",
                reclamation.Id,
                reclamation.Description,
                reclamation.DateReclamation
            });
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> ModifierReclamation(int id, [FromBody] ReclamationRequest reclamationRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Vérifier si la réclamation existe
            var reclamation = await _context.Reclamations.FindAsync(id);
            if (reclamation == null)
                return NotFound(new { message = "Réclamation non trouvée" });

            // Mettre à jour les champs de la réclamation
            reclamation.Description = reclamationRequest.Description;

            // Sauvegarder les modifications dans la base de données
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Réclamation modifiée avec succès",
                reclamation.Id,
                reclamation.Description,
                reclamation.DateReclamation
            });
        }
        
        [HttpGet("all")]
        public async Task<IActionResult> GetAllReclamations()
        {
            var reclamations = await _context.Reclamations
                .Select(r => new
                {
                    r.Id,
                    r.Description,
                    r.DateReclamation,
                   
                })
                .ToListAsync();

            return Ok(reclamations);
        }

        // DELETE: api/Reclamation/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> SupprimerReclamation(int id)
        {
            var reclamation = await _context.Reclamations.FindAsync(id);
            if (reclamation == null)
                return NotFound(new { message = "Réclamation non trouvée" });

            _context.Reclamations.Remove(reclamation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Réclamation supprimée avec succès" });
        }



        public class ReclamationRequest
        {
            public int EmployeId { get; set; } // L'ID de l'employé
            public string Description { get; set; } // La description de la réclamation
        }

    }

}
