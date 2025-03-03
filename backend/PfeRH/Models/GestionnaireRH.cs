using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class GestionnaireRH: Utilisateur
    {
        // Auto-incrémentation


        // Relation avec les employés du département
        public ICollection<Employe> Employes { get; set; } // Navigation vers les employés

        // Relation avec les projets du département
        public ICollection<Projet> Projets { get; set; }
        public ICollection<Evaluation> Evaluations { get; set; }

        // Feedbacks donnés aux employés
        

        // Réunions organisées par le chef de département
      
        public GestionnaireRH()
        {
            // Initialisation des collections pour éviter les nulls
            Employes = new List<Employe>();
            Projets = new List<Projet>();
            Evaluations = new List<Evaluation>();
            
          
        }

        // Constructeur avec paramètres
        public GestionnaireRH( string nomPrenom, string email, string role, int departementId)
            : base( nomPrenom, email, role)
        {
            
            Employes = new List<Employe>(); // Initialisation des collections
            Projets = new List<Projet>();
            Evaluations = new List<Evaluation>();
           
        }
    }
}
