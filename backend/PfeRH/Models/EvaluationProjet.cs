using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class EvaluationProjet
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [ForeignKey("Projet")]
        public int ProjetId { get; set; }

        public Projet Projet { get; set; }

        public DateTime DateEvaluation { get; set; }
        public string Titre {  get; set; }

        public string Lieu { get; set; }

        public string PointsADiscuter { get; set; }

        // 🔹 Constructeur sans paramètre (obligatoire pour EF)
        public EvaluationProjet() { }

        // 🔹 Constructeur avec paramètres
        public EvaluationProjet(int projetId, DateTime dateEvaluation, string lieu, string titre, string pointsADiscuter)
        {
            ProjetId = projetId;
            DateEvaluation = dateEvaluation;
            Lieu = lieu;
            Titre = titre;
            PointsADiscuter = pointsADiscuter;
        }
    }
}
