using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class GestionnaireRH: Personnel
    {

        public bool Etat { get; set; }

        public GestionnaireRH()
        {
            Etat = true;
        }

        public GestionnaireRH(string nomPrenom, string email, string role, DateTime dateEmbauche, double salaire)
            : base(nomPrenom, email, role, dateEmbauche, salaire)
        {
        }
    }
}
