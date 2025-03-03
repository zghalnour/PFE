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

       
        public DateTime DateCreation { get; set; } // Date de création de la notification

        public string Type { get; set; } // Type de notification (Congé accepté, projet en retard, etc.)

        // Clé étrangère vers l'utilisateur destinataire
        [ForeignKey("Utilisateur")]
        public int? UtilisateurId { get; set; }
        public Utilisateur Utilisateur { get; set; }
        public Notification() { }

        public Notification(string contenu, string type, int utilisateurId)
        {
            Contenu = contenu;
            DateCreation = DateTime.Now;
             
            Type = type;
            UtilisateurId = utilisateurId;
        }
    }
}
