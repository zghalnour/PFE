using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Condidat 
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string? CVPath { get; set; }
        public string LinkedIn { get; set; }

        public string NomPrenom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public List<string> CompetencesExtraites { get; set; }

        public ICollection<Candidature> Candidatures { get; set; }
        public Condidat()
        {
            Candidatures = new List<Candidature>();
            CompetencesExtraites = new List<string>();
            LinkedIn = string.Empty;
            
        }

        // Constructeur avec paramètres
        public Condidat(string nomPrenom, string email, string role, string cvPath, string linkedIn = "", string telephone = "")
         
        {
            CVPath = cvPath;
            LinkedIn = linkedIn;
            NomPrenom = nomPrenom;
            Email = email;
            PhoneNumber = telephone;
            Candidatures = new List<Candidature>();
            CompetencesExtraites = new List<string>();
        }
    }
}
