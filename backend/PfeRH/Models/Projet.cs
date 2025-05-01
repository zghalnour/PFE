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
        public ICollection<EvaluationProjet> Evaluations { get; set; }

        public ICollection<Affectation> Affectations { get; set; }

        // Relation avec les tâches du projet
        public ICollection<Tache> Taches { get; set; }
        public Projet()

        {
            Evaluations = new List<EvaluationProjet>();
            Affectations = new List<Affectation>(); 
            Taches = new List<Tache>(); // Initialisation de la liste des tâches
        }

        // Constructeur avec paramètres pour initialiser un projet
        public Projet(int id, string nom, string description, DateTime dateDebut, DateTime dateFin)
        {
            Id = id;
            Nom = nom;
            Description = description;
            DateDebut = dateDebut;
            DateFin = dateFin;
            Evaluations= new List<EvaluationProjet>();
            Affectations = new List<Affectation>();
            Taches = new List<Tache>(); // Initialisation de la liste des tâches
        }
    }
}
