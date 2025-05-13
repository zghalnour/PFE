using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class GestionnaireRH: Utilisateur
    {

        public bool Etat { get; set; }

        public GestionnaireRH()
        {
            Etat = true;

    }

        // Constructeur avec paramètres
        public GestionnaireRH( string nomPrenom, string email, string role)
            : base( nomPrenom, email, role)
        {
            Etat = true;
        }
    }
}
