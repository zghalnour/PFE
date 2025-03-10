using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class ReponseCandidat
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

      
        public int CandidatureId { get; set; }
        public virtual Candidature Candidature { get; set; }

       
        public int QuestionId { get; set; }
        public virtual Question Question { get; set; }


        public int OptionChoisieId { get; set; }

        // Cette propriété vérifie si la réponse choisie est correcte
        public bool EstCorrecte => OptionChoisieId == Question.ReponseCorrecte;
        public ReponseCandidat() { }

        // Constructeur avec paramètres pour initialiser les valeurs
        public ReponseCandidat(int candidatureId, int questionId, int optionChoisieId)
        {
            CandidatureId = candidatureId;
            QuestionId = questionId;
            OptionChoisieId = optionChoisieId;
        }

    }
}
