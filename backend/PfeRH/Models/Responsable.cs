using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;
namespace PfeRH.Models
{
    public class Responsable
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string NomPrenom { get; set; }

       
        // Constructeur par défaut (nécessaire pour Entity Framework)
        public Responsable()
        {
        }

        // Constructeur avec paramètres
        public Responsable(string nomPrenom, int departementId)
        {
            NomPrenom = nomPrenom;
           
        }

        // Constructeur avec navigation complète vers le département
        public Responsable(int id, string nomPrenom)
        {
            Id = id;
            NomPrenom = nomPrenom;
           
            
        }
    }
}
