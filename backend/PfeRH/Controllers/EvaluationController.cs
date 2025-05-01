using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EvaluationController : ControllerBase

    {
        private readonly ApplicationDbContext _context;

        public EvaluationController(ApplicationDbContext context)
        {
            _context = context;
        }

        // DELETE: api/evaluation/evaluations/5/delete
        [HttpDelete("evaluations/{evaluationId}/delete")]
        public async Task<IActionResult> SupprimerEvaluation(int evaluationId)
        {
            var evaluation = await _context.EvaluationProjets
                .FirstOrDefaultAsync(e => e.Id == evaluationId);

            if (evaluation == null)
            {
                return NotFound(new { message = "Évaluation non trouvée." });
            }

            _context.EvaluationProjets.Remove(evaluation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Évaluation supprimée avec succès." });
        }

    }
}
