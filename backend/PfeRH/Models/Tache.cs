using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Tache
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; } // Identifiant unique de la tâche
        public string Nom { get; set; } // Nom de la tâche
        public string Description { get; set; } // Description de la tâche
        public DateTime DateDebut { get; set; } // Date de début de la tâche
        public DateTime DateFin { get; set; } // Date de fin de la tâche
        public string Statut { get; set; } // Statut de la tâche (par exemple "En cours", "Terminé", "Non commencé")

        // Relation avec le projet auquel appartient la tâche
        [ForeignKey("Projet")]
        public int? ProjetId { get; set; } // Clé étrangère vers le projet
        public Projet Projet { get; set; } // Navigation vers le projet

        // Constructeur par défaut
        public Tache()
        {
        }

        // Constructeur avec paramètres
        public Tache(int id, string nom, string description, DateTime dateDebut, DateTime dateFin, string statut, int projetId)
        {
            Id = id;
            Nom = nom;
            Description = description;
            DateDebut = dateDebut;
            DateFin = dateFin;
            Statut = statut;
            ProjetId = projetId;
        }
    }
}
