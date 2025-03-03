using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Evaluation
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        [ForeignKey("Employe")]
        public int? EmployeId { get; set; }
        public Employe Employe { get; set; }

        [ForeignKey("GestionnaireRH")]
        public int GestionnaireRhId { get; set; }
        public GestionnaireRH GestionnaireRh { get; set; }
        public int Qualite { get; set; } // Note sur la qualité du travail
        public int RespectDeadline { get; set; } // Note sur le respect des délais
        public int Ponctualite { get; set; } // Note sur la ponctualité
        public DateTime DateEvaluation { get; set; }
        public string Commentaire { get; set; }
        public Evaluation() { }
        public Evaluation(int id, int employeId, int qualite, int respectDeadline, int ponctualite, string commentaire)
        {
            Id = id;
            EmployeId = employeId;
            Qualite = qualite;
            RespectDeadline = respectDeadline;
            Ponctualite = ponctualite;
            Commentaire = commentaire;
        }
    }
}
