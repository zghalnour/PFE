using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace PfeRH.Models
{
    public class Entretien
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public DateTime DateEntretien { get; set; }
        public string Commentaire { get; set; }

        
        public string TypeEntretien { get; set; } // Ex: "RH", "Technique", "Écrit", "Oral"
        public string Statut { get; set; }
        public string ModeEntretien { get; set; }

       

        // Relation avec Candidature (Une candidature peut avoir plusieurs entretiens)
        [ForeignKey("Candidature")]
        public int CandidatureId { get; set; }
        public virtual Candidature Candidature { get; set; }
        [ForeignKey("Responsable")]
        public int? ResponsableId { get; set; }
        public virtual Employe Responsable { get; set; }
        public Entretien()
        {
            Commentaire = string.Empty;
            TypeEntretien = "RH";
            ModeEntretien = "Présentiel";
            DateEntretien = DateTime.Now;
            Statut = "En cours";

        }
        public Entretien( int candidatureId, string typeEntretien, string modeEntretien, string commentaire, DateTime date, DateTime dateEntretien, string statut, int responsableId)
        {
           
            CandidatureId = candidatureId;
            TypeEntretien = typeEntretien;
            ModeEntretien = modeEntretien;
            Commentaire = commentaire;
            DateEntretien = dateEntretien;
            Statut = statut;
            ResponsableId = responsableId;
        }
    
    }
}
