using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CvScoringController : ControllerBase
    {
        [HttpPost("score-pdf")]
        public async Task<IActionResult> ScoreCVPdf(IFormFile cv, [FromQuery] string jobOfferText)
        {
            if (cv == null || string.IsNullOrEmpty(jobOfferText))
            {
                return BadRequest("Le fichier CV ou l'offre d'emploi ne peut pas être vide.");
            }

            // Extraire le texte du fichier PDF
            var cvText = await ExtractTextFromPdfAsync(cv);

            if (string.IsNullOrEmpty(cvText))
            {
                return BadRequest("Le texte du CV n'a pas pu être extrait.");
            }

            // Appeler le modèle Python pour calculer le score
            var result = await ExecutePythonScriptAsync(cvText, jobOfferText);

            return Ok(result);
        }

        private async Task<string> ExtractTextFromPdfAsync(IFormFile file)
        {
            using (var stream = file.OpenReadStream())
            using (var pdfReader = new PdfReader(stream))
            using (var pdfDoc = new PdfDocument(pdfReader))
            {
                StringBuilder text = new StringBuilder();
                for (int page = 1; page <= pdfDoc.GetNumberOfPages(); page++)
                {
                    var strategy = new LocationTextExtractionStrategy();
                    var pageContent = PdfTextExtractor.GetTextFromPage(pdfDoc.GetPage(page), strategy);
                    text.Append(pageContent);
                }
                return text.ToString();
            }
        }

        private async Task<IActionResult> ExecutePythonScriptAsync(string cvText, string jobOfferText)
        {
            var fastApiUrl = "http://localhost:8000/calculate_score";  // Replace with your FastAPI server URL

            // Prepare the request body
            var requestBody = new
            {
                cv_text = cvText,
                offer_text = jobOfferText
            };

            // Send POST request to FastAPI
            using (var httpClient = new HttpClient())
            {
                try
                {
                    var jsonContent = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json");
                    var response = await httpClient.PostAsync(fastApiUrl, jsonContent);

                    if (!response.IsSuccessStatusCode)
                    {
                        return BadRequest($"Erreur dans la communication avec le serveur FastAPI: {response.ReasonPhrase}");
                    }

                    var result = await response.Content.ReadAsStringAsync();

                    // Convertir le résultat JSON en objet
                    var jsonResult = JsonConvert.DeserializeObject<Dictionary<string, object>>(result);

                    var extractedSkills = jsonResult.ContainsKey("Extracted Skills")
                        ? JsonConvert.DeserializeObject<List<string>>(jsonResult["Extracted Skills"].ToString())
                        : new List<string>();

                    var scoringResult = new
                    {
                        CvText = cvText,
                        ScoreAI = jsonResult.ContainsKey("Score AI") ? jsonResult["Score AI"] : null,
                        ExtractedSkills = extractedSkills
                    };

                    return Ok(scoringResult);
                }
                catch (Exception ex)
                {
                    return BadRequest($"Erreur lors de la communication avec le serveur FastAPI : {ex.Message}");
                }
            }
        }


    }
}
