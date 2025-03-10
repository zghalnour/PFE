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

        public string Option1 { get; set; }
        public string Option2 { get; set; }
        public string Option3 { get; set; }
        public int ReponseCorrecte { get; set; }
        public ICollection<ReponseCandidat> ReponseCandidats { get; set; }

        public Question()
        {
            
            ReponseCandidats = new List<ReponseCandidat>();
        }

        // Constructeur avec paramètres
        public Question(string intitule, int testId, string option1, string option2, string option3, int reponseCorrecte)
        {
            Intitule = intitule;
            TestId = testId;
            Option1 = option1;
            Option2 = option2;
            Option3 = option3;
            ReponseCorrecte = reponseCorrecte;
            ReponseCandidats = new List<ReponseCandidat>();
        }
        public string GetOptionById(int optionId)
        {
            return optionId switch
            {
                1 => Option1,
                2 => Option2,
                3 => Option3,
                _ => "Option inconnue"
            };
        }


    }
}
