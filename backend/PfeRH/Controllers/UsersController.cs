using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using PfeRH.Models;
using PfeRH.DTO;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<Utilisateur> _userManager;
        private readonly RoleManager<IdentityRole<int>> _roleManager;

        public UsersController (ApplicationDbContext context, UserManager<Utilisateur> userManager, RoleManager<IdentityRole<int>> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }


        // 🔹 Récupérer nomPrenom, email, téléphone et rôle des utilisateurs
        [HttpGet("allUsers")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllUsers()
        {
            var users = await _userManager.Users.ToListAsync();
            var userList = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userList.Add(new
                {   Id=user.Id,
                    NomPrenom = user.NomPrenom,
                    Email = user.Email,
                    Telephone = user.PhoneNumber,
                    Role = user.Role
                });
            }

            return Ok(userList);
        }
        // 🔹 Supprimer un utilisateur par ID
        [HttpDelete("supprimer/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(new { message = "Utilisateur non trouvé" });
            }

            // Démarrer la transaction
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Récupérer les candidatures de l'utilisateur
                var candidatures = await _context.Candidatures.Where(c => c.CandidatId == id).ToListAsync();
                if (candidatures.Any())
                {
                    // Supprimer les réponses aux candidatures
                    foreach (var candidature in candidatures)
                    {
                        var entretiens = await _context.Entretiens
                                   .Where(e => e.CandidatureId == candidature.Id)
                                   .ToListAsync();
                        if (entretiens.Any())
                        {
                            _context.Entretiens.RemoveRange(entretiens);
                        }
                        var reponses = await _context.ReponseCandidats
                                                       .Where(r => r.CandidatureId == candidature.Id)
                                                       .ToListAsync();
                        if (reponses.Any())
                        {
                            _context.ReponseCandidats.RemoveRange(reponses);
                        }
                    }

                    // Supprimer les candidatures après les réponses
                    _context.Candidatures.RemoveRange(candidatures);
                    await _context.SaveChangesAsync();
                }
                var affectations = await _context.Affectations.Where(a => a.EmployeId == id).ToListAsync();
                if (affectations.Any())
                {
                    _context.Affectations.RemoveRange(affectations);
                }

            

                // 3. Supprimer les objectifs SMART
                var objectifs = await _context.Objectifs.Where(o => o.EmployeId == id).ToListAsync();
                if (objectifs.Any())
                {
                    _context.Objectifs.RemoveRange(objectifs);
                }

                // 4. Supprimer les réclamations
                var reclamations = await _context.Reclamations.Where(r => r.EmployeId == id).ToListAsync();
                if (reclamations.Any())
                {
                    _context.Reclamations.RemoveRange(reclamations);
                }

                // 5. Supprimer les demandes de congé (déjà présent mais gardé ici pour cohérence)
                var demandesConges = await _context.DemandesConge.Where(d => d.EmployeId == id).ToListAsync();
                if (demandesConges.Any())
                {
                    _context.DemandesConge.RemoveRange(demandesConges);
                }
                var taches = await _context.Taches.Where(t => t.EmployeId == id).ToListAsync();
                if (taches.Any())
                {
                    _context.Taches.RemoveRange(taches);

                }


                await _context.SaveChangesAsync();


                // Supprimer l'utilisateur
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return BadRequest(new { message = "Erreur lors de la suppression de l'utilisateur" });
                }

                // Commit de la transaction si tout s'est bien passé
                await transaction.CommitAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                // En cas d'erreur, rollback de la transaction
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Une erreur est survenue", details = ex.Message });
            }
        }

        [HttpPut("modifier/{id}")]
        public async Task<IActionResult> EditUser(int id, [FromBody] EditUserDto updatedUser)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(new { message = "Utilisateur non trouvé" });
            }

            bool isUpdated = false;

            if (!string.IsNullOrWhiteSpace(updatedUser.Email) && updatedUser.Email != "string" && updatedUser.Email != user.Email)
            {
                user.Email = updatedUser.Email;
                user.UserName = updatedUser.Email.Split('@')[0]; // Mise à jour du UserName
                isUpdated = true;
            }

            if (!string.IsNullOrWhiteSpace(updatedUser.phoneNumber) && updatedUser.phoneNumber != "string" && updatedUser.phoneNumber != user.PhoneNumber)
            {
                user.PhoneNumber = updatedUser.phoneNumber;
                isUpdated = true;
            }

            if (updatedUser.Etat.HasValue)
            {
                if (user is Personnel employe)
                {
                    employe.Etat = updatedUser.Etat.Value;

                    if (!employe.Etat)
                    {
                        // Désactiver le compte : bloquer l'utilisateur jusqu'à une date lointaine
                        employe.LockoutEnabled = true;
                        employe.LockoutEnd = DateTimeOffset.MaxValue;
                        employe.DateDepart = DateTime.Now;
                    }
                    else
                    {
                        // Réactiver le compte
                        employe.LockoutEnd = null;
                        employe.DateDepart = null;
                    }

                    isUpdated = true;
                }
            }

            if (isUpdated)
            {
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = "Erreur lors de la mise à jour de l'utilisateur", errors = result.Errors });
                }
            }

            return Ok(new
            {
                user.Id,
                user.Email,
                user.PhoneNumber,
                Etat = (user is Personnel e) ? e.Etat : (bool?)null
            });
        }


        // 🔹 Récupérer un utilisateur par ID
        [HttpGet("user/{id}")]
        public async Task<ActionResult<object>> GetUserById(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
            {
                return NotFound(new { message = "Utilisateur non trouvé" });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var userDetails = new
            {
                user.Id,
                user.NomPrenom,
                user.Email,
                user.PhoneNumber,
                Role = roles.FirstOrDefault() ?? "Aucun rôle"
            };

            return Ok(userDetails);
        }

    }
}
