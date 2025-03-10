using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Test
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Description { get; set; }
        // Relation avec l'entité Offre
        public int OffreId { get; set; }  // Clé étrangère vers Offre
        public Offre Offre { get; set; }
        public virtual ICollection<Question> Questions { get; set; }
       

        public Test()
        {
            Questions = new List<Question>();
        }

        // Constructeur avec paramètres (si vous souhaitez initialiser certaines propriétés)
        public Test(string description, int offreId, ICollection<Question> questions = null)
        {
            Description = description;
          
            Questions = questions ?? new List<Question>(); // Si aucune liste n'est fournie, une nouvelle liste est créée
        }

    }
}
