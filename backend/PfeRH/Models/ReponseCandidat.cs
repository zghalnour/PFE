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
        public virtual OptionQuestion OptionChoisie { get; set; }

        public bool EstCorrecte => OptionChoisie.EstCorrecte;
       

    }
}
