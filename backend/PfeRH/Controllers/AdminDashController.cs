using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PfeRH.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminDashController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminDashController(ApplicationDbContext context)
        {
            _context = context;
        }
       
        [HttpGet("overview")]
        public async Task<IActionResult> GetEmployeeOverview()
        {
            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;

            var totalEmployees = await _context.Users
                .Where(u => u.Role != "Admin")
                .CountAsync();

            var newHires = await _context.Users
                .OfType<Personnel>()
                .Where(e => e.DateEmbauche.Month == currentMonth && e.DateEmbauche.Year == currentYear)
                .CountAsync();

            var departures = await _context.Users
                .OfType<Personnel>()
                .Where(e => e.DateDepart != null)
                .CountAsync();
            var openJobOffers = (await _context.Offres.ToListAsync())
         .Where(o => o.Statut == "Ouverte")
         .Count();


            return Ok(new
            {
                TotalEmployees = totalEmployees,
                NewHiresThisMonth = newHires,
                Departures = departures,
                OpenJobOffers = openJobOffers
            });
        }
       
        [HttpGet("stats")]
        public async Task<IActionResult> GetYearlyEmployeeStats([FromQuery] int year)
        {
            if (year < 1900 || year > 2100)
                return BadRequest("Année invalide.");

            var stats = new List<object>();

            for (int month = 1; month <= 12; month++)
            {
                var newHires = await _context.Users
                    .OfType<Personnel>()
                    .Where(e => e.DateEmbauche.Month == month && e.DateEmbauche.Year == year)
                    .CountAsync();

                var departures = await _context.Users
                    .OfType<Personnel>()
                    .Where(e => e.DateDepart != null &&
                                e.DateDepart.Value.Month == month &&
                                e.DateDepart.Value.Year == year)
                    .CountAsync();

                stats.Add(new
                {
                    Month = month,
                    NewHires = newHires,
                    Departures = departures
                });
            }

            return Ok(new
            {
                Year = year,
                MonthlyStats = stats
            });
        }
      
        [HttpGet("departements-employes")]
        public async Task<IActionResult> GetEmployeeCountByDepartment()
        {
            var result = await _context.Departements
                .Select(d => new
                {
                    NomDepartement = d.Nom,
                    NombreEmployes = d.Employes.Count
                })
                .ToListAsync();

            return Ok(result);
        }
     
        [HttpGet("classifiedProjectByYear")]
        public async Task<IActionResult> GetProjetsClassifiesParAnnee([FromQuery] int annee)
        {
            var dateAujourdhui = DateTime.Today;

            // Récupérer les projets avec leurs tâches
            var projets = await _context.Projets
                .Include(p => p.Taches)
                .Where(p => p.DateDebut.Year == annee) // Filtrer par année
                .ToListAsync();

            if (!projets.Any())
                return NotFound($"Aucun projet trouvé pour l'année {annee}.");

            var projetsClassifies = projets.Select(p =>
            {
                int totalTaches = p.Taches.Count;
                int tachesTerminees = p.Taches.Count(t => t.Statut == "Terminée");
                int progression = totalTaches == 0 ? 0 : (int)Math.Round((double)tachesTerminees / totalTaches * 100);

                string statut = progression == 100 && p.DateFin >= dateAujourdhui
                    ? "Terminé"
                    : progression < 100 && p.DateFin < dateAujourdhui
                        ? "Non terminé"
                        : "En cours";

                return new ProjetClassifieDto
                {
                    Id = p.Id,
                    Nom = p.Nom,
                    DateDebut = p.DateDebut,
                    DateFin = p.DateFin,
                    Progression = progression,
                    Statut = statut
                };
            }).ToList();

            // Compter les projets par statut
            int nbTermines = projetsClassifies.Count(p => p.Statut == "Terminé");
            int nbNonTermines = projetsClassifies.Count(p => p.Statut == "Non terminé");
            int nbEnCours = projetsClassifies.Count(p => p.Statut == "En cours");

            return Ok(new
            {
                annee = annee,
                projets = projetsClassifies,
                enCours = nbEnCours,
                termines = nbTermines,
                nonTermines = nbNonTermines
            });
        }



    }
    public class ProjetClassifieDto
    {
        public int Id { get; set; }
        public string Nom { get; set; }
        public DateTime DateDebut { get; set; }
        public DateTime DateFin { get; set; }
        public int Progression { get; set; } // en pourcentage
        public string Statut { get; set; }   // "Terminé", "Non terminé", "En cours"
    }

}
