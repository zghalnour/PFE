using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ObjSmartController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ObjSmartController(ApplicationDbContext context)
        {
            _context = context;
        }
        [HttpPut("terminer/{id}")]
        public async Task<IActionResult> TerminerObj(int id)
        {
            var obj = await _context.Objectifs.FindAsync(id);

            if (obj == null)
            {
                return NotFound(new { message = "obj non trouvée." });
            }

            obj.Etat = true;

            _context.Entry(obj).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "obj terminée avec succès." });
        }
    }
}
