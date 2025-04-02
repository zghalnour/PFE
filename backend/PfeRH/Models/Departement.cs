using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Departement
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Nom { get; set; }

        // Relation avec le chef de département

        [ForeignKey("Responsable")]
        public int? ResponsableId { get; set; }
        public Responsable Responsable { get; set; } // Navigation vers le chef de département

        // Relation avec les employés du département
        public ICollection<Employe> Employes { get; set; }

        // Relation avec les projets du département
        public ICollection<Projet> Projets { get; set; }
        public Departement()
        {
            Employes = new List<Employe>();
            Projets = new List<Projet>();
        }

        // Constructeur avec paramètres
        public Departement(int id, string nom )
        {
            Id = id;
            Nom = nom;
           
            Employes = new List<Employe>(); // Initialisation des collections
            Projets = new List<Projet>();
        }
    }
}
