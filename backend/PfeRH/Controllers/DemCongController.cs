﻿using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PfeRH.Models;
using Microsoft.EntityFrameworkCore;
using static iText.StyledXmlParser.Jsoup.Select.Evaluator;

using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using PfeRH.Hubs;
namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DemCongController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<Utilisateur> _userManager;
        private readonly IHubContext<NotificationHub> _hubContext;
        public DemCongController(ApplicationDbContext context, UserManager<Utilisateur> userManager , IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _userManager = userManager;
            _hubContext = hubContext;
        }
        [HttpPost("ajouter/{idEmploye}")]
        public async Task<IActionResult> AjouterDemandeConge(int idEmploye, [FromBody] DemandeCongeDto dto)
        {
            var employe = await _context.Users.FindAsync(idEmploye);
            if (employe == null)
            {
                return NotFound(new { message = "Employé introuvable." });
            }
            if (!Enum.TryParse(dto.Type.ToString(), out TypeConge typeConge))
            {
                return BadRequest(new { message = "Type de congé invalide." });
            }
            var demande = new DemandeConge
            {
                EmployeId = idEmploye,
               
                DateDebut = dto.DateDebut,
                DateFin = dto.DateFin,
                Raison = dto.Raison,
                Type= typeConge,
                Statut = "En Attente",
                DateDemande = DateTime.Today
            };

            _context.DemandesConge.Add(demande);
            await _context.SaveChangesAsync();
            var rh = (await _userManager.GetUsersInRoleAsync("Gestionnaire RH")).FirstOrDefault();
            if (rh == null)
            {
                return BadRequest(new { message = "Aucun gestionnaire RH trouvé pour envoyer la notification." });
            }

         var notification = new Notification(
         contenu: $"Nouvelle demande de congé de l'employé {employe.NomPrenom}.",
         type: "Demande de Congé",
         utilisateurId: rh!.Id
         
     );


            try
            {
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Erreur lors de l'enregistrement de la notification : " + ex.Message);
            }


            // Envoyer via SignalR
            await _hubContext.Clients.User(rh.Id.ToString()).SendAsync("ReceiveNotification", new
            {
                message = notification.Contenu
            });

            return Ok(new { message = "Demande de congé ajoutée avec succès." });
        }
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<GetCongeAvecEmployeDto>>> GetAllDemandes()
        {
            var demandes = await _context.DemandesConge
                .Include(d => d.Employe) // Charger l'employé
                .OrderByDescending(d => d.DateDemande)
                .Select(d => new GetCongeAvecEmployeDto
                {
                    Id = d.Id,
                    EmployeId = d.Employe.Id,
                    NomEmploye = d.Employe.NomPrenom, // supposer que tu as un champ NomPrenom
                    DateDebut = d.DateDebut,
                    DateFin = d.DateFin,
                    DateDemande = d.DateDemande,
                    Raison = d.Raison,
                    Type = d.Type.ToString(),
                    Statut = d.Statut
                })
                .ToListAsync();

            return Ok(demandes);
        }


        // GET: api/DemCong/Employe/5
        [HttpGet("GetByEmployeId/{idEmploye}")]
        public async Task<ActionResult<IEnumerable<DemandeConge>>> GetDemandesByEmployeId(int idEmploye)
        {
            var employe = await _context.Users.FindAsync(idEmploye);
            if (employe == null)
            {
                return NotFound(new { message = "Employé introuvable." });
            }

            var demandes = await _context.DemandesConge
       .Where(d => d.EmployeId == idEmploye)
       .OrderByDescending(d => d.DateDemande)
       .Select(d => new GetCongeDto
       {
           Id = d.Id,
           DateDemande = d.DateDemande,
           DateDebut = d.DateDebut,
           DateFin = d.DateFin,
           Raison = d.Raison,
           Type = d.Type.ToString(),
           Statut=d.Statut
       })
       .ToListAsync();


            return Ok(demandes);
        }
        // DELETE: api/DemCong/Supprimer/5
        [HttpDelete("Supprimer/{id}")]
        public async Task<IActionResult> SupprimerDemandeConge(int id)
        {
            var demande = await _context.DemandesConge.FindAsync(id);
            if (demande == null)
            {
                return NotFound(new { message = "Demande de congé introuvable." });
            }

            _context.DemandesConge.Remove(demande);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Demande de congé supprimée avec succès." });
        }
        // PUT: api/DemCong/ModifierStatut/5
        [HttpPut("ModifierStatut/{id}")]
        public async Task<IActionResult> ModifierStatutDemandeConge(int id, [FromBody] ModifierStatutDto dto)
        {
            var demande = await _context.DemandesConge.FindAsync(id);
            if (demande == null)
            {
                return NotFound(new { message = "Demande de congé introuvable." });
            }

            demande.Statut = dto.NouveauStatut;
            await _context.SaveChangesAsync();
            var employe = await _userManager.FindByIdAsync(demande.EmployeId.ToString());

            if (employe != null)
            {
                string contenuNotif;

                switch (dto.NouveauStatut.ToLower())
                {
                    case "approuvée":
                        contenuNotif = "Votre demande de congé a été acceptée.";
                        break;
                    case "refusée":
                        contenuNotif = "Votre demande de congé a été refusée.";
                        break;
                    default:
                        contenuNotif = $"Le statut de votre demande de congé a été {dto.NouveauStatut}.";
                        break;
                }
                var notification = new Notification(
                    contenu: contenuNotif,
                    type: "Rep Congé",
                    utilisateurId: employe.Id
                  
                );

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                await _hubContext.Clients.User(employe.Id.ToString()).SendAsync("ReceiveNotification", new
                {
                    message = notification.Contenu
                });
            }

            return Ok(new { message = "Statut de la demande de congé mis à jour avec succès." });
        }
        [HttpGet("GetAbsences")]
        public async Task<ActionResult<IEnumerable<GetAbsenceDto>>> GetAbsences()
        {
            var absences = await _context.DemandesConge
                .Where(d => d.Statut == "Approuvée")
                .Include(d => d.Employe) 
                .OrderByDescending(d => d.DateDemande)
                .Select(d => new GetAbsenceDto
                {
                    Id = d.Id,
                    DateDebut = d.DateDebut,
                    DateFin = d.DateFin,
                    NomEmploye = d.Employe.NomPrenom 
                })
                .ToListAsync();

            return Ok(absences);
        }
   


    }
    public class DemandeCongeDto
    {
        public DateTime DateDebut { get; set; }
        public DateTime DateFin { get; set; }
        public string Raison { get; set; }
        public string Type { get; set; }
    }
    public class GetCongeDto
    {
        public int Id { get; set; }
        public DateTime DateDemande { get; set; }
        public DateTime DateDebut { get; set; }
        public DateTime DateFin { get; set; }
        public string Raison { get; set; }
        public string Type { get; set; }
        public string Statut { get; set; }
    }
    public class GetCongeAvecEmployeDto
    {
        public int Id { get; set; }
        public int EmployeId { get; set; }
        public string NomEmploye { get; set; } 
        public DateTime DateDebut { get; set; }
        public DateTime DateFin { get; set; }
        public DateTime DateDemande { get; set; }
        public string Raison { get; set; }
        public string Type { get; set; }
        public string Statut { get; set; }
    }
    public class ModifierStatutDto
    {
        public string NouveauStatut { get; set; }
    }
    public class GetAbsenceDto
    {
        public int Id { get; set; }
        public DateTime DateDebut { get; set; }
        public DateTime DateFin { get; set; }
        public string NomEmploye { get; set; }
    }


}
