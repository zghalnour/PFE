using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TacheController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TacheController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpPut("terminer/{id}")]
        public async Task<IActionResult> TerminerTache(int id)
        {
            var tache = await _context.Taches.FindAsync(id);

            if (tache == null)
            {
                return NotFound(new { message = "Tâche non trouvée." });
            }

            tache.DateFinir = DateTime.Now;
            tache.Statut = "Terminée";

            _context.Entry(tache).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tâche terminée avec succès." });
        }
    }
}
