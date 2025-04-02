using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PfeRH.Models
{
    public class Reclamation
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Description { get; set; }
        public DateTime DateReclamation { get; set; }

        // Relation avec l'employé
        [ForeignKey("Employe")]
        public int EmployeId { get; set; }
        public Employe Employe { get; set; }

        public Reclamation()
        {
            DateReclamation = DateTime.Now.Date; // Prend seulement la date, sans l'heure
        }

        // Constructeur avec paramètres
        public Reclamation(string description, int employeId)
        {
            Description = description;
            EmployeId = employeId;
            DateReclamation = DateTime.Now.Date; // Prend seulement la date, sans l'heure
        }
    }
}
