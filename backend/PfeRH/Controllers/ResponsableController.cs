using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResponsableController : ControllerBase
    {

        private readonly ApplicationDbContext _context;

        public ResponsableController(ApplicationDbContext context)
        {
            _context = context;
        }

        // API pour ajouter un nouveau responsable (seulement NomPrenom)
        [HttpPost("add")]
        public async Task<IActionResult> AddResponsable([FromBody] ResponsableRequest request)
        {
            if (string.IsNullOrEmpty(request.NomPrenom))
            {
                return BadRequest("Le nom et prénom du responsable sont requis.");
            }

            // Créer un nouveau responsable sans département
            var responsable = new Responsable
            {
                NomPrenom = request.NomPrenom
            };

            _context.Responsables.Add(responsable);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Responsable ajouté avec succès", ResponsableId = responsable.Id });
        }
        [HttpGet("getAll")]
        public async Task<ActionResult<IEnumerable<Responsable>>> GetAllResponsables()
        {
            var responsables = await _context.Responsables.ToListAsync();
            return Ok(responsables);
        }
    }

    // Modèle pour la requête d'ajout de responsable
    public class ResponsableRequest
    {
        public string NomPrenom { get; set; }
    }
}

