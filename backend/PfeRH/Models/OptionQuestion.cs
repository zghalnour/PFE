using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class OptionQuestion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string Texte { get; set; } // Texte de l'option
        public bool EstCorrecte { get; set; } // Indique si c'est la bonne réponse

      
      
        public OptionQuestion()
        {
           // Initialiser la collection pour éviter les erreurs de nullité
        }

        // Constructeur avec paramètres
        public OptionQuestion(string texte, bool estCorrecte, int questionId)
        {
            Texte = texte;
            EstCorrecte = estCorrecte;
           
           // Initialiser la collection
        }
    }
}
