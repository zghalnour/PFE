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
    public class NotifController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotifController(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }
        [HttpPost("createNotificationForAdmin")]
        // Exemple de création d'une notification
        public async Task<IActionResult> CreateNotificationForAdmin([FromBody] CreateNotificationRequest request)
        {
            var candidature = await _context.Candidatures
      .Include(c => c.Offre) // Assurez-vous d'inclure l'Offre associée
      .FirstOrDefaultAsync(c => c.Id == request.CandidatureId);


            // Vérifier si la candidature existe
            if (candidature == null)
            {
                return NotFound(new { Message = "Candidature non trouvée" });
            }
            if (candidature.Offre != null)
            {
                var contenuNotification = $"Une nouvelle candidature pour le poste de {candidature.Offre.Titre} a été reçue.";
            }
            else
            {
                // Gérer l'absence de l'offre ici, par exemple avec un message d'erreur
                return NotFound(new { Message = "Offre associée à la candidature non trouvée." });
            }


            // Créer la notification
            var notification = new Notification(
                contenu: $"Une nouvelle candidature pour le poste de {candidature.Offre.Titre} a été traité.",
                type: "Parcours Candidature ", // Type de notification
                utilisateurId: request.UtilisateurId,
                candidatureId: request.CandidatureId
               
            );

            // Ajouter la notification à la base de données
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Envoyer la notification via SignalR
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new
            {
                message = notification.Contenu,
               
            });

            return Ok(new { Message = "Notification envoyée avec succès !" });
        }
        [HttpGet("getUnreadForUser/{utilisateurId}")]
        public async Task<IActionResult> GetUnreadForUser(int utilisateurId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UtilisateurId == utilisateurId && !n.IsRead)  // Filtre pour notifications non lues
                .OrderByDescending(n => n.DateCreation)  // Trie les notifications par date décroissante
                .ToListAsync();

            if (notifications == null || notifications.Count == 0)
            {
                return Ok(); 
            }

            return Ok(notifications);  // Retourne la liste des notifications non lues
        }
        [HttpPut("markAsRead/{notificationId}")]
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId);

            if (notification == null)
            {
                return NotFound(new { Message = "Notification non trouvée." });
            }

            notification.IsRead = true;
            _context.Notifications.Update(notification);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Notification marquée comme lue." });
        }
        [HttpDelete("deleteAllForUser/{utilisateurId}")]
        public async Task<IActionResult> DeleteAllNotificationsForUser(int utilisateurId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UtilisateurId == utilisateurId)
                .ToListAsync();

            if (!notifications.Any())
            {
                return NotFound(new { Message = "Aucune notification à supprimer." });
            }

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Toutes les notifications ont été supprimées." });
        }
        [HttpDelete("delete/{notificationId}")]
        public async Task<IActionResult> DeleteNotification(int notificationId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId);

            if (notification == null)
            {
                return NotFound(new { Message = "Notification non trouvée." });
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Notification supprimée avec succès." });
        }


        [HttpGet("getAllForUser/{utilisateurId}")]
        public async Task<IActionResult> GetAllForUser(int utilisateurId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UtilisateurId == utilisateurId)
                .OrderByDescending(n => n.DateCreation)
                .ToListAsync();

            return Ok(notifications);
        }



    }
    public class CreateNotificationRequest
    {
        public int UtilisateurId { get; set; } // ID de l'utilisateur destinataire (admin)
        public int CandidatureId { get; set; } // ID de la candidature concernée
    }

}
