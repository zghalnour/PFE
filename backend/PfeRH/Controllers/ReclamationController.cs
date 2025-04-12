using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReclamationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReclamationController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST: api/Reclamation
        [HttpPost("add")]
        public async Task<IActionResult> AjouterReclamation([FromBody] ReclamationRequest reclamationRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Vérifier que l'employé existe
            var employe = await _context.Utilisateurs
                .OfType<Employe>()
                .FirstOrDefaultAsync(e => e.Id == reclamationRequest.EmployeId);

            if (employe == null)
                return NotFound(new { message = "Employé non trouvé" });

            // Créer une nouvelle réclamation avec la description et l'ID de l'employé
            var reclamation = new Reclamation
            {
                EmployeId = reclamationRequest.EmployeId,
                Description = reclamationRequest.Description,
                DateReclamation = DateTime.Now.Date // Date automatiquement définie
            };

            _context.Reclamations.Add(reclamation);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Réclamation ajoutée avec succès",
                reclamation.Id,
                reclamation.Description,
                reclamation.DateReclamation
            });
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> ModifierReclamation(int id, [FromBody] ReclamationRequest reclamationRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Vérifier si la réclamation existe
            var reclamation = await _context.Reclamations.FindAsync(id);
            if (reclamation == null)
                return NotFound(new { message = "Réclamation non trouvée" });

            // Mettre à jour les champs de la réclamation
            reclamation.Description = reclamationRequest.Description;

            // Sauvegarder les modifications dans la base de données
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Réclamation modifiée avec succès",
                reclamation.Id,
                reclamation.Description,
                reclamation.DateReclamation
            });
        }

        public class ReclamationRequest
        {
            public int EmployeId { get; set; } // L'ID de l'employé
            public string Description { get; set; } // La description de la réclamation
        }

    }

}
