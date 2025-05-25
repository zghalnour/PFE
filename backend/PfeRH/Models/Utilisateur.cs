using Microsoft.AspNetCore.Identity;
using Microsoft.Identity.Client;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace PfeRH.Models
{
    public class Utilisateur :IdentityUser<int>
    {
       
      
        public string NomPrenom { get; set; }
        
        public string Email { get; set; }  // Email de l'utilisateur
        
        public string Role { get; set; }
        public string? SecurityToken { get; set; }
        [NotMapped] // Ne sera pas stocké dans la base de données
        public string Password { get; set; }
        public Utilisateur() { }

        // Constructeur avec paramètres pour initialiser les propriétés
        public Utilisateur( string nomPrenom, string email, string role)
        {
            
            NomPrenom = nomPrenom;
            Email = email;
            Role = role;
            
        }
    }
  


}