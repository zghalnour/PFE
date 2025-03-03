using System.ComponentModel.DataAnnotations.Schema;

namespace PfeRH.Models
{
    public class Employe : Utilisateur
    {
        public string Poste { get; set; } // Exemple : "Développeur"
        public DateTime DateEmbauche { get; set; }

        // Relation avec le département
        [ForeignKey("Departement")]
        public int? DepartementId { get; set; } // Clé étrangère vers le département
        public Departement Departement { get; set; } // Navigation vers le département

        // Relation avec les projets
        public ICollection<Projet> Projets { get; set; } // Navigation vers les projets

        // Relation avec les demandes de congé
        public ICollection<DemandeConge> DemandesConge { get; set; }
        public ICollection<Evaluation> EvaluationsRecues { get; set; }

        // Feedbacks reçus
       
        // Réunions auxquelles l'employé participe


        // Présences (Check-in / Check-out)
        public ICollection<Presence> Presences { get; set; }
        public Employe()
        {
            // Initialisation des collections pour éviter les nulls
            Projets = new List<Projet>();
            DemandesConge = new List<DemandeConge>();
            EvaluationsRecues = new List<Evaluation>();
            
        
            Presences = new List<Presence>();
        }

        // Constructeur avec paramètres
        public Employe( string nomPrenom, string email, string role, string poste, DateTime dateEmbauche, int departementId)
            : base( nomPrenom, email, role)
        {
            Poste = poste;
            DateEmbauche = dateEmbauche;
            DepartementId = departementId;
            Projets = new List<Projet>(); // Initialisation des collections
            DemandesConge = new List<DemandeConge>();
            EvaluationsRecues = new List<Evaluation>();
         
            Presences = new List<Presence>();
        }
    }
}
