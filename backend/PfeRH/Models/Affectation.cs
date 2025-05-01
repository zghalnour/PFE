using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PfeRH.Models
{
    public class Affectation

    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        // Clé étrangère vers Employe
        [ForeignKey("Employe")]
        public int EmployeId { get; set; }
        public Employe Employe { get; set; }

        // Clé étrangère vers Projet
        [ForeignKey("Projet")]
        public int ProjetId { get; set; }
        public Projet Projet { get; set; }

        public DateTime DateAffectation { get; set; } = DateTime.Now;
    }
}
