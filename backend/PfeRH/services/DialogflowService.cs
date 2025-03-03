using Google.Apis.Auth.OAuth2;
using Google.Cloud.Dialogflow.V2;
using Google.Protobuf;
using Grpc.Auth;
using Grpc.Core;
using Grpc.Net.Client;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Channels;
using System.Threading.Tasks;
namespace PfeRH.services
{
    public class DialogflowService
    {
        private readonly SessionsClient _sessionsClient;
        private readonly string _projectId = "chatbotcandidat"; // Remplace par ton ID de projet Dialogflow

        public DialogflowService()
        {
           

            // Crée un builder pour SessionsClient
            var builder = new SessionsClientBuilder
            {
                // Assigner les credentials au builder
                CredentialsPath = "C:\\Users\\nourh\\Downloads\\chatbotcandidat.json"
            };

            // Crée un client SessionsClient à l'aide du builder
            _sessionsClient = builder.Build();
        }
        // Méthode pour détecter l'intention de l'utilisateur (requête envoyée à Dialogflow)
        public async Task<string> DetectIntent(string sessionId, string text)
        {
            var session = SessionName.FromProjectSession(_projectId, sessionId);

            var queryInput = new QueryInput
            {
                Text = new TextInput
                {
                    Text = text,
                    LanguageCode = "fr" // Langue du chatbot
                }
            };

            var response = await _sessionsClient.DetectIntentAsync(session, queryInput);
            return response.QueryResult.FulfillmentText;
        }
    }
}
