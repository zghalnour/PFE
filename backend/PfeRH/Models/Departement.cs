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

        public string? NomResponsable { get; set; }


        public ICollection<Employe> Employes { get; set; }

        // Relation avec les projets du département
      
        public Departement()
        {
            Employes = new List<Employe>();
           
         
        }

        // Constructeur avec paramètres
        public Departement(int id, string nom )
        {
            Id = id;
            Nom = nom;
          
            Employes = new List<Employe>(); // Initialisation des collections
           
        }
    }
}
