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
        public string Commentaire { get; set; }

        
        public string TypeEntretien { get; set; } // Ex: "RH", "Technique", "Écrit", "Oral"

        public string ModeEntretien { get; set; }

       
        public int AdminId { get; set; }
        public virtual Admin Admin { get; set; }

        // Relation avec Candidature (Une candidature peut avoir plusieurs entretiens)
        [ForeignKey("Candidature")]
        public int CandidatureId { get; set; }
        public virtual Candidature Candidature { get; set; }
        public Entretien()
        {
            Commentaire = string.Empty;
            TypeEntretien = "RH";
            ModeEntretien = "Présentiel";
        }
        public Entretien( int candidatureId, string typeEntretien, string modeEntretien, string commentaire)
        {
           
            CandidatureId = candidatureId;
            TypeEntretien = typeEntretien;
            ModeEntretien = modeEntretien;
            Commentaire = commentaire;
        }
    
    }
}
