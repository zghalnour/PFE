using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace PfeRH.Models
{
    public class Notification
    {
        public int Id { get; set; } // Identifiant unique de la notification

        [Required]
        public string Contenu { get; set; } // Le contenu du message de la notification

       
        public DateTime DateCreation { get; set; }
        public bool IsRead { get; set; } // Statut de lecture (vérifie si l'admin a lu la notification)
       

        public string Type { get; set; } // Type de notification (Congé accepté, projet en retard, etc.)

        // Clé étrangère vers l'utilisateur destinataire
        [ForeignKey("Utilisateur")]
        public int? UtilisateurId { get; set; }
        public Utilisateur Utilisateur { get; set; }
        [ForeignKey("Candidature")]
        public int? CandidatureId { get; set; }
        public Candidature? Candidature { get; set; }
        public Notification() { }

        public Notification(string contenu, string type, int utilisateurId, int candidatureId, string? link = null)
        {
            Contenu = contenu;
            DateCreation = DateTime.Now;
            IsRead = false; // Par défaut, la notification n'est pas lue
            Type = type;
            UtilisateurId = utilisateurId;
            CandidatureId = candidatureId;
           
        }
        public Notification(string contenu, string type, int utilisateurId)
        {
            Contenu = contenu;
            DateCreation = DateTime.Now;
            IsRead = false; // Par défaut, la notification n'est pas lue
            Type = type;
            UtilisateurId = utilisateurId;
            

        }
    }
}
