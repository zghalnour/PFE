using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Offre
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Titre {  get; set; }
        public string Description { get; set; }
        public string Competences { get; set; }
        public DateTime DatePublication { get; set; }
        public DateTime DateLimitePostulation { get; set; }
        [ForeignKey("Admin")]
        public int? AdminId { get; set; }
        
        public virtual Utilisateur? Admin { get; set; }

        // Liste des candidatures associées à cette offre
        [NotMapped]
        public virtual ICollection<Candidature> Candidatures { get; set; }
        public int TestId { get; set; } // TestId nullable
        public virtual Test Test { get; set; }
        public string? Statut
        {
            get => DateTime.Today > DateLimitePostulation ? "Fermée" : "Ouverte";
        }
        public Offre()
        {
            Candidatures = new List<Candidature>();
            DatePublication = DateTime.Today; // Initialiser la date de publication par défaut
        }

        // ✅ Constructeur avec paramètres (corrigé)
        public Offre(string titre, string description, string competences, DateTime dateLimitePostulation, int adminId)
        {
            Titre = titre;
            Description = description;
            Competences = competences;
            DatePublication = DateTime.Now; // Toujours initialisé à la date actuelle
            DateLimitePostulation = dateLimitePostulation;
            AdminId = adminId;
            Candidatures = new List<Candidature>();
        }
    }
}
