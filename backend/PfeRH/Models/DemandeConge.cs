using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class DemandeConge
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; } // Identifiant unique de la demande de congé
        [ForeignKey("Employe")]
        public int? EmployeId { get; set; } // Clé étrangère vers l'employé qui fait la demande
        public Employe Employe { get; set; } // Navigation vers l'employé

        public DateTime DateDebut { get; set; } // Date de début du congé
        public DateTime DateFin { get; set; } // Date de fin du congé

        public string Raison { get; set; } // Motif de la demande de congé (optionnel)

        public string Statut { get; set; } // Statut de la demande : "En Attente", "Acceptée", "Refusée"

        // Constructeur par défaut
        public DemandeConge()
        {
            Statut = "En Attente"; // Par défaut, la demande est en attente
        }

        // Constructeur avec paramètres
        public DemandeConge(int id, int employeId, DateTime dateDebut, DateTime dateFin, string motif, string statut)
        {
            Id = id;
            EmployeId = employeId;
            DateDebut = dateDebut;
            DateFin = dateFin;
            Raison = motif;
            Statut = statut ?? "En Attente"; // Si le statut est null, on met "En Attente"
        }
    }
}
