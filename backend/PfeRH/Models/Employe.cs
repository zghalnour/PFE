using System.ComponentModel.DataAnnotations.Schema;
using iText.StyledXmlParser.Jsoup.Select;
using Newtonsoft.Json;

namespace PfeRH.Models
{
    public class Employe : Personnel
    {
      

        // Relation avec le département
        [ForeignKey("Departement")]
        public int? DepartementId { get; set; }
        public Departement Departement { get; set; } // Navigation vers le département

        // Relation avec les projets
        public ICollection<Affectation> Affectations { get; set; }
      

        // Relation avec les demandes de congé
        public ICollection<DemandeConge> DemandesConge { get; set; }
     
        public ICollection<ObjectifSmart> ObjectifsSmarts { get; set; }

        public ICollection<Reclamation> Reclamations { get; set; }


        public Employe()
        {
            // Initialisation des collections pour éviter les nulls
            Affectations = new List<Affectation>();
            DemandesConge = new List<DemandeConge>();
        
            ObjectifsSmarts = new List<ObjectifSmart>();
            Reclamations = new List<Reclamation>();
            Etat = true;

        }

        // Constructeur avec paramètres
        public Employe(string nomPrenom, string email, string role, DateTime dateEmbauche, double salaire, int departementId)
                : base(nomPrenom, email, role, dateEmbauche, salaire)
        {
            DepartementId = departementId;
            Affectations = new List<Affectation>();
            DemandesConge = new List<DemandeConge>();
            ObjectifsSmarts = new List<ObjectifSmart>();
            Reclamations = new List<Reclamation>();
            Etat = true;
        }
    }
}
