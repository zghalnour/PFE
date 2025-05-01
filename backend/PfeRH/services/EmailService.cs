using System.Net.Mail;
using System.Net;
using System.Threading.Tasks;

namespace PfeRH.services
{
    public class EmailService
    {
        private const string smtpServer = "smtp.gmail.com";
        private const int smtpPort = 587;
        private const string smtpUser = "nourhoudazghal@gmail.com";
        private const string smtpPassword = "gecx jjfc phph fhpu"; // mot de passe d'application

        public async Task EnvoyerEmailConfirmationAsync(string destinataire, string nomPrenom, string email, string motDePasse)
        {
            var mailMessage = new MailMessage
            {
                From = new MailAddress(smtpUser, "Service RH"),
                Subject = "🎉 Bienvenue chez nous - Accès à votre compte RH",
                IsBodyHtml = true,
                Body = $@"
<html>
  <body style='font-family: Arial, sans-serif; color: #333;'>
    <h2 style='color: #2c3e50;'>Bonjour {nomPrenom},</h2>
    <p>Nous avons le plaisir de vous informer que votre candidature a été <strong>acceptée</strong> pour le poste au sein de notre entreprise.</p>
    <p>Voici vos identifiants de connexion à votre espace employé :</p>
    <ul>
      <li><strong>Email :</strong> {email}</li>
      <li><strong>Code d'accès :</strong> {motDePasse}</li>
    </ul>
    <p>Merci de vous connecter dès que possible pour compléter votre profil.</p>
    <br/>
    <p>— <em>Service Ressources Humaines</em></p>
    <hr/>
    <p style='font-size: 0.9em; color: gray;'>Ceci est un message automatique. Pour toute question, contactez <a href='mailto:{smtpUser}'>{smtpUser}</a>.</p>
  </body>
</html>"
            };

            // Destinataire
            mailMessage.To.Add(destinataire);

            // Ajout d'un Reply-To (important pour ne pas être marqué comme spam)
            mailMessage.ReplyToList.Add(new MailAddress(smtpUser));

            using (var smtpClient = new SmtpClient(smtpServer, smtpPort))
            {
                smtpClient.Credentials = new NetworkCredential(smtpUser, smtpPassword);
                smtpClient.EnableSsl = true;

                try
                {
                    await smtpClient.SendMailAsync(mailMessage);
                    Console.WriteLine("✅ Email envoyé avec succès !");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Erreur lors de l'envoi de l'email : {ex.Message}");
                }
            }
        }
    }
}
