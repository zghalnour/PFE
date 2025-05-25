using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Personnel: Utilisateur
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public DateTime DateEmbauche { get; set; }
        public DateTime? DateDepart { get; set; }
        public bool Etat { get; set; }
        public double Salaire { get; set; }

        public Personnel()
        {
            Etat = true;
        }
        public Personnel(string nomPrenom, string email, string role, DateTime dateEmbauche, double salaire)
            : base(nomPrenom, email, role)
        {
            DateEmbauche = dateEmbauche;
            Salaire = salaire;
            Etat = true;
        }
    }
}
