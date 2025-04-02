using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PfeRH.Models
{
    public class ObjectifSmart
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Description { get; set; }
        public bool Etat { get; set; } // true = atteint, false = non atteint

        // Relation avec l'employé
        [ForeignKey("Employe")]
        public int EmployeId { get; set; }
        public Employe Employe { get; set; }
        public ObjectifSmart()
        {
            Etat = false; // Par défaut, l'objectif est non atteint
        }

        // Constructeur avec paramètres
        public ObjectifSmart(string description, int employeId)
        {
            Description = description;
            EmployeId = employeId;
            Etat = false; // Par défaut, l'objectif est non atteint
        }
    }
}
