using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PfeRH.Models;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options; // Ajoute cette ligne pour utiliser IOptions

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<Utilisateur> _userManager;
        private readonly SignInManager<Utilisateur> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly Jwt _jwtSettings;
        private readonly RoleManager<IdentityRole<int>> _roleManager;

        public AuthController(
            UserManager<Utilisateur> userManager, 
            SignInManager<Utilisateur> signInManager, 
            IConfiguration configuration, 
            IOptions<Jwt> jwtSettings,
              RoleManager<IdentityRole<int>> roleManager) // Injection de IOptions<Jwt>
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _jwtSettings = jwtSettings.Value;
            _roleManager = roleManager;

        }

        // ✅ Inscription d'un utilisateur
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] Utilisateur model)
        {
            if (await _userManager.FindByEmailAsync(model.Email) != null)
                return BadRequest("Cet email est déjà utilisé.");
            if (string.IsNullOrEmpty(model.Password))
                return BadRequest("Le mot de passe est requis.");

            var user = new Utilisateur
            {
                UserName = model.Email.Split('@')[0],
                Email = model.Email,
                NomPrenom = model.NomPrenom,
                Role = model.Role,
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
                return BadRequest(result.Errors);
            var roleExists = await _roleManager.RoleExistsAsync(model.Role);
            if (!roleExists)
            {
                // Si le rôle n'existe pas, le créer
                var role = new IdentityRole<int>(model.Role);
                var createRoleResult = await _roleManager.CreateAsync(role);
                if (!createRoleResult.Succeeded)
                {
                    return BadRequest("Erreur lors de la création du rôle.");
                }
            }

            // Assigner le rôle à l'utilisateur
            var addRoleResult = await _userManager.AddToRoleAsync(user, model.Role);
            if (!addRoleResult.Succeeded)
            {
                return BadRequest("Erreur lors de l'assignation du rôle à l'utilisateur.");
            }

            // Retourner la réponse
            return Ok(new { message = "Utilisateur inscrit avec succès." });
        }

        // ✅ Connexion et génération du token JWT
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Login model)
        {
            var user = await _userManager.Users
                .Where(u => u.Email.ToUpper() == model.Email.ToUpper())  // Recherche par Email (non normalisé)
                .FirstOrDefaultAsync();

            if (user == null)
            {
                Console.WriteLine("Utilisateur non trouvé.");
                return Unauthorized("Identifiants incorrects.");
            }

           

            bool isPasswordValid = await _userManager.CheckPasswordAsync(user, model.Password);
            if (!isPasswordValid)
            {
                Console.WriteLine("Mot de passe incorrect.");
                return Unauthorized("Identifiants incorrects.");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Utilisateur"; // Si aucun rôle n'est trouvé, définir "Utilisateur" par défaut

            // Générer le token JWT
            var token = GenerateJwtToken(user, role);

            return Ok(new
            {
                token = token,
                role = role // Retourner le rôle dans la réponse
            });
        }

        // ✅ Génération du token JWT
        private string GenerateJwtToken(Utilisateur user, string role)
        {
            if (user == null)
                throw new ArgumentNullException(nameof(user), "L'utilisateur ne peut pas être null.");

            // ✅ Ajouter les revendications (claims) avec le rôle
            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.UserName),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, role) // ✅ Ajout du rôle
    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),  // ✅ Expiration après 1 jour
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync(); // Déconnecter l'utilisateur
            return Ok(new { message = "Déconnexion réussie" });
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                // Rechercher l'utilisateur par ID
                var user = await _userManager.FindByIdAsync(id.ToString());
                if (user == null)
                {
                    return NotFound(new { message = "Utilisateur non trouvé." });
                }

                // Supprimer l'utilisateur
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = "Erreur lors de la suppression de l'utilisateur." });
                }

                // Retourner une réponse réussie
                return Ok(new { message = "Utilisateur supprimé avec succès." });
            }
            catch (Exception ex)
            {
                // Retourner l'erreur en cas d'exception
                return StatusCode(500, new { message = "Une erreur est survenue : " + ex.Message });
            }
        }


    }
}
