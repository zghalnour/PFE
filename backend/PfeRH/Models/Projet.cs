using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Projet
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Nom { get; set; }
        public string Description { get; set; }
        public DateTime DateDebut { get; set; }
        public DateTime DateFin { get; set; }

        // Relation avec le département
        [ForeignKey("Departement")]
        public int? DepartementId { get; set; } // Clé étrangère vers le département
        public Departement Departement { get; set; } // Navigation vers le département
        public ICollection<Employe> Employes { get; set; } // Liste des employés affectés au projet

        // Relation avec les tâches du projet
        public ICollection<Tache> Taches { get; set; }
        public Projet()
        {
            Employes = new List<Employe>(); // Initialisation de la liste des employés
            Taches = new List<Tache>(); // Initialisation de la liste des tâches
        }

        // Constructeur avec paramètres pour initialiser un projet
        public Projet(int id, string nom, string description, DateTime dateDebut, DateTime dateFin, int departementId)
        {
            Id = id;
            Nom = nom;
            Description = description;
            DateDebut = dateDebut;
            DateFin = dateFin;
            DepartementId = departementId;
            Employes = new List<Employe>(); // Initialisation de la liste des employés
            Taches = new List<Tache>(); // Initialisation de la liste des tâches
        }
    }
}
