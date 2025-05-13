using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RessourceController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private const string FastApiBaseUrl = "http://127.0.0.1:8000"; // Remplacez par l'URL de votre API FastAPI

        public RessourceController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("rechercher")]
        public async Task<IActionResult> RechercherDocumentation([FromBody] TaskRequest request)
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.PostAsJsonAsync($"{FastApiBaseUrl}/rechercher", request);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<RechercheResult>(content);
                    return Ok(result);
                }

                return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(500, $"Erreur de connexion à l'API FastAPI: {ex.Message}");
            }
        }
    }

    // Classes pour la sérialisation/désérialisation
    public class TaskRequest
    {
        public string task_description { get; set; }
    }

    public class RechercheResult
    {
        public string tache { get; set; }
        public string[] mots_cles { get; set; }
        public string requete { get; set; }
        public Resultat[] resultats { get; set; }
        public string message { get; set; }
    }

    public class Resultat
    {
        public string titre { get; set; }
        public string lien { get; set; }
    }
}