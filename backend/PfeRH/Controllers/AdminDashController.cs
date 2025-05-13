using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PfeRH.Models;
using Microsoft.EntityFrameworkCore;

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
        [HttpGet("stats")]
        public async Task<IActionResult> GetEmployeeStats()
        {
            var totalEmployees = await _context.Users
                .Where(u => u.Role == "Employe") 
                .CountAsync();

            var currentMonth = DateTime.Now.Month;
            var currentYear = DateTime.Now.Year;

            var newHiresThisMonth = await _context.Users
    .OfType<Employe>()
    .Where(e => e.DateEmbauche.Month == currentMonth && e.DateEmbauche.Year == currentYear)
    .CountAsync();

            return Ok(new
            {
                TotalEmployees = totalEmployees,
                NewHiresThisMonth = newHiresThisMonth
            });
        }
    }
}
