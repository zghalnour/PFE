using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PfeRH.Models
{
    public class Presence
    {
        [Key] // Clé primaire
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        [ForeignKey("Employe")]
        public int? EmployeId { get; set; }
        public Employe Employe { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan CheckIn { get; set; }
        public TimeSpan? CheckOut { get; set; }
        public Presence() { }
        public Presence(int id, int employeId, DateTime date, TimeSpan checkIn, TimeSpan? checkOut = null)
        {
            Id = id;
            EmployeId = employeId;
            Date = date;
            CheckIn = checkIn;
            CheckOut = checkOut;
        }
    }
}
