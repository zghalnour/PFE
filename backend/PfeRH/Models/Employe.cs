using System.ComponentModel.DataAnnotations.Schema;
using Newtonsoft.Json;

namespace PfeRH.Models
{
    public class Employe : Utilisateur
    {
        public string Poste { get; set; } // Exemple : "Développeur"
        public DateTime DateEmbauche { get; set; }
        public DateTime? DateDepart {  get; set; }
        public bool Etat { get; set; }
        public double Salaire {  get; set; }

        // Relation avec le département
        [ForeignKey("Departement")]
        public int? DepartementId { get; set; }
        public Departement Departement { get; set; } // Navigation vers le département

        // Relation avec les projets
        public ICollection<Affectation> Affectations { get; set; }
      

        // Relation avec les demandes de congé
        public ICollection<DemandeConge> DemandesConge { get; set; }
        public ICollection<Evaluation> EvaluationsRecues { get; set; }
        public ICollection<ObjectifSmart> ObjectifsSmarts { get; set; }

        public ICollection<Reclamation> Reclamations { get; set; }


        public Employe()
        {
            // Initialisation des collections pour éviter les nulls
            Affectations = new List<Affectation>();
            DemandesConge = new List<DemandeConge>();
            EvaluationsRecues = new List<Evaluation>();
            ObjectifsSmarts = new List<ObjectifSmart>();
            Reclamations = new List<Reclamation>();
            Etat = true;

        }

        // Constructeur avec paramètres
        public Employe( string nomPrenom, string email, string role, string poste, DateTime dateEmbauche, int departementId)
            : base( nomPrenom, email, role)
        {
            Poste = poste;
            DateEmbauche = dateEmbauche;
            DepartementId = departementId;
            Affectations = new List<Affectation>();// Initialisation des collections
            DemandesConge = new List<DemandeConge>();
            EvaluationsRecues = new List<Evaluation>();
            ObjectifsSmarts = new List<ObjectifSmart>();
            Reclamations = new List<Reclamation>();
            Etat = true;
        }
    }
}
