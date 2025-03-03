using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Test
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public virtual ICollection<Question> Questions { get; set; }

        public Test()
        {
            Questions = new List<Question>();
        }

        // Constructeur avec paramètres (si vous souhaitez initialiser certaines propriétés)
        public Test(ICollection<Question> questions)
        {
            Questions = questions ?? new List<Question>(); // Si aucune liste n'est fournie, une nouvelle liste est créée
        }

    }
}
