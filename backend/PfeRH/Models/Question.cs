using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Question
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string Intitule { get; set; } // Texte de la question

        [ForeignKey("Test")]
        public int TestId { get; set; }
        public virtual Test Test { get; set; }

        public virtual ICollection<OptionQuestion> Options { get; set; }
        public ICollection<ReponseCandidat> ReponseCandidats { get; set; }

        public Question()
        {
            Options = new List<OptionQuestion>();
            ReponseCandidats = new List<ReponseCandidat>();
        }

        // Constructeur avec paramètres
        public Question(string intitule, int testId)
        {
            Intitule = intitule;
            TestId = testId;
            Options = new List<OptionQuestion>();
            ReponseCandidats = new List<ReponseCandidat>();
        }

    }
}
