using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PfeRH.services;

namespace PfeRH.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatbotController : ControllerBase
    {
        private readonly DialogflowService _dialogflowService;

        public ChatbotController(DialogflowService dialogflowService)
        {
            _dialogflowService = dialogflowService;
        }
        [HttpPost("send-message")]
        public async Task<IActionResult> SendMessage([FromBody] string message)
        {
            var sessionId = Guid.NewGuid().ToString();
            var responseMessage = await _dialogflowService.DetectIntent(sessionId, message);
            return Ok(new { reply = responseMessage });
        }

    }
}
