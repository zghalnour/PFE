using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Login
    {
        [Required]
        public string Email { get; set; } // Email de l'utilisateur

        [Required]
        public string Password { get; set; }
    }
}
