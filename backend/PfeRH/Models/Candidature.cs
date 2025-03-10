using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Candidature
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // Relation avec le candidat
        [ForeignKey("Condidat")]
        public int? CandidatId { get; set; }
        public Condidat Candidat { get; set; }

        [ForeignKey("Offre")]
        public int OffreId { get; set; }
        public virtual Offre Offre { get; set; }
        public DateTime DateCandidature { get; set; }
        public string Statut { get; set; }
        public double ScoreAI { get; set; }
        public double TestScore { get; set; }
        public string CompetencesExtraites { get; set; }

        public virtual ICollection<ReponseCandidat> ReponseCandidats { get; set; }
        public virtual ICollection<Entretien> Entretiens { get; set; }


        public Candidature()
        {
            Entretiens = new List<Entretien>();
            ReponseCandidats = new List<ReponseCandidat>();
            DateCandidature = DateTime.Now; // Date automatique à la création
            Statut = "En cours"; // Statut initial par défaut
            ScoreAI = 0.0;
            TestScore = 0.0;
            
        }

        // Constructeur avec paramètres
        public Candidature(int? candidatId, int offreId, string statut = "En cours", double scoreAI = 0.0, double testScore = 0.0)
        {
            CandidatId = candidatId;
            OffreId = offreId;
            Statut = statut;
            ScoreAI = scoreAI;
            TestScore = testScore;
            Entretiens = new List<Entretien>();
            ReponseCandidats = new List<ReponseCandidat>();
            DateCandidature = DateTime.Now;
          
        }
        public void CalculerTestScore(List<ReponseCandidat> reponsesCandidat)
        {
            // Logique pour calculer le score du test basé sur les réponses du candidat
            double score = 0.0;

            // Exemple : Calculer le score basé sur les réponses correctes
            foreach (var reponse in reponsesCandidat)
            {
                if (reponse.EstCorrecte)
                {
                    score += 1.0; // Ajout d'un point pour une réponse correcte
                }
            }

            // Mise à jour du score
            TestScore = score;
        }
    }
}
