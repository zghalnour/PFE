using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Tache
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; } 
        public string Nom { get; set; }
        public string Description { get; set; } 
        public DateTime? DateFinir {  get; set; }
        public string Statut { get; set; } 

       
        [ForeignKey("Projet")]
        public int? ProjetId { get; set; } 
        public Projet Projet { get; set; } 
        [ForeignKey("Employe")]
        public int? EmployeId { get; set; }  
        public Employe Employe { get; set; }

        // Constructeur par défaut
        public Tache()
        {
           
        }

        // Constructeur avec paramètres
        public Tache(int id, string nom, string description, string statut, int projetId, int employeId, DateTime? dateFinir = null)
        {
            Id = id;
            Nom = nom;
            Description = description;
            Statut = statut;
            ProjetId = projetId;
            EmployeId = employeId;
            DateFinir = dateFinir;
            Statut = dateFinir == null ? "En cours" : "Terminée";
        }
    }
}
