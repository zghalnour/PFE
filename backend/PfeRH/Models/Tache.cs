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
        public DateTime? DateFinir {  get; set; }
        public string Statut { get; set; } // Statut de la tâche (par exemple "En cours", "Terminé", "Non commencé")

        // Relation avec le projet auquel appartient la tâche
        [ForeignKey("Projet")]
        public int? ProjetId { get; set; } // Clé étrangère vers le projet
        public Projet Projet { get; set; } // Navigation vers le projet
        [ForeignKey("Employe")]
        public int? EmployeId { get; set; }  // Clé étrangère vers l'employé
        public Employe Employe { get; set; }

        // Constructeur par défaut
        public Tache()
        {
           
        }

        // Constructeur avec paramètres
        public Tache(int id, string nom, string description, string statut, int projetId, int employeId, DateTime? dateFinir = null)
        {
            Id = id;
            Nom = nom;
            Description = description;
            Statut = statut;
            ProjetId = projetId;
            EmployeId = employeId;
            DateFinir = dateFinir;
            Statut = dateFinir == null ? "En cours" : "Terminée";
        }
    }
}
