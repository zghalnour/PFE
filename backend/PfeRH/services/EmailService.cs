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
            string body = $@"
        Nous avons le plaisir de vous informer que votre candidature a été <strong>acceptée</strong> pour le poste au sein de notre entreprise.<br/><br/>
        Voici vos identifiants de connexion à votre espace employé :
        <ul>
            <li><strong>Email :</strong> {email}</li>
            <li><strong>Code d'accès :</strong> {motDePasse}</li>
        </ul>
        Merci de vous connecter dès que possible.";

            string htmlContent = "<html>"
                + "<body style='font-family: Arial, sans-serif; background-color: #f0f0f0;'>"
                + "<div style='max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; "
                + "box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);'>"

                // Logo
                + "<div style='text-align: center;'>"
                + "<img src='https://www.farojob.net/wp-content/uploads/2016/12/unilog.png' alt='Logo Unilog' style='width: 200px; height: auto; margin-bottom: 20px;'/>"
                + "</div>"

                // Titre & contenu
                + $"<h2 style='color: #2c3e50;'>Bonjour {nomPrenom},</h2>"
                + $"<p style='font-size: 16px; color: #2c3e50;'>{body}</p>"

                + "<p style='color: #2c3e50; font-size: 14px; margin-top: 40px;'>"
                + "Cordialement,<br/><strong>La Direction Ressources Humaines</strong>"
                + "</p>"

                + "<hr style='margin-top: 30px; border: none; border-top: 1px solid #ccc;'/>"
                + $"<p style='font-size: 0.9em; color: gray;'>"
                + $"Ceci est un message automatique. Pour toute question, veuillez nous contacter à "
                + $"<a href='mailto:{smtpUser}' style='color: #2c3e50;'>{smtpUser}</a>.</p>"

                + "</div>"
                + "</body>"
                + "</html>";

            var mailMessage = new MailMessage
            {
                From = new MailAddress(smtpUser, "Service RH"),
                Subject = " Bienvenue chez Unilog - Accès à votre compte",
                IsBodyHtml = true,
                Body = htmlContent
            };

            mailMessage.To.Add(destinataire);
            mailMessage.ReplyToList.Add(new MailAddress(smtpUser));

            using var smtpClient = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPassword),
                EnableSsl = true
            };

            try
            {
                await smtpClient.SendMailAsync(mailMessage);
                Console.WriteLine("✅ Email de confirmation envoyé avec succès !");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Erreur lors de l'envoi de l'email de confirmation : {ex.Message}");
            }
        }

        public async Task EnvoyerEmailRefusAsync(string destinataire, string nomPrenom)
        {
            string body = "Nous vous remercions pour l'intérêt que vous avez porté à notre entreprise.<br/><br/>"
                        + "Après une étude attentive de votre candidature, nous sommes au regret de vous informer que votre profil n’a pas été retenu pour le poste.<br/><br/>"
                        + "Nous vous souhaitons plein succès dans vos démarches professionnelles futures.";

            string htmlContent = GenererContenuHtml(nomPrenom, body);

            await EnvoyerEmailAsync(destinataire, "Résultat de votre candidature", htmlContent);
        }

        public async Task EnvoyerEmailPreselectionAsync(string destinataire, string nomPrenom)
        {
            string body = "Suite à l’analyse de votre candidature, nous avons le plaisir de vous informer que vous avez été retenu(e) lors de la phase de présélection.<br/><br/>"
                        + "Nous reviendrons vers vous très prochainement afin de vous communiquer les détails relatifs aux entretiens à venir.";

            string htmlContent = GenererContenuHtml(nomPrenom, body);

            await EnvoyerEmailAsync(destinataire, " Présélection - Suivi de votre candidature", htmlContent);
        }

        public async Task EnvoyerEmailEntretienProgrammeAsync(
       string destinataire,
       string nomPrenom,
       string typeEntretien,
       string modeEntretien,
       DateTime dateEntretien)
        {
            string body = $"Nous avons le plaisir de vous informer que vous êtes convoqué(e) pour un entretien <strong>{typeEntretien}</strong>.<br/><br/>"
                        + $"<strong> Date :</strong> {dateEntretien:dddd dd MMMM yyyy à HH:mm}<br/>"
                        + $"<strong> Mode :</strong> {modeEntretien}<br/><br/>"
                        + "Merci de bien vouloir confirmer votre disponibilité dans les plus brefs délais.";

            string htmlContent = GenererContenuHtml(nomPrenom, body);

            await EnvoyerEmailAsync(destinataire, " Convocation à l'entretien", htmlContent);
        }
        public async Task EnvoyerEmailEntretienReussiEtEnAttenteAsync(
    string destinataire,
    string nomPrenom,
    string typeEntretien,
    DateTime dateEntretien)
        {
            string body = $"Nous avons le plaisir de vous informer que vous avez <strong>réussi</strong> votre entretien <strong>{typeEntretien}</strong> "
                        + $"qui a eu lieu le <strong>{dateEntretien:dddd dd MMMM yyyy à HH:mm}</strong>.<br/><br/>"
                        + "Nous reviendrons vers vous très prochainement concernant la suite du processus de recrutement.";

            string htmlContent = GenererContenuHtml(nomPrenom, body);

            await EnvoyerEmailAsync(destinataire, " Entretien réussi - Suite du processus", htmlContent);
        }
        public async Task EnvoyerEmailEntretienRefuseEtProchainAsync(
    string destinataire,
    string nomPrenom,
    string typeEntretienRate,
    DateTime dateEntretienRate
   )
        {
            string body = $"Nous vous informons que vous n'avez malheureusement pas réussi l'entretien <strong>{typeEntretienRate}</strong> "
             + $"du <strong>{dateEntretienRate:dddd dd MMMM yyyy à HH:mm}</strong>.<br/><br/>"
             + $"Cependant, le processus de recrutement se poursuit, et il vous reste encore un entretien à effectuer.<br/><br/>"
             + "Nous vous tiendrons informé(e) des prochaines étapes dans les plus brefs délais.";


            string htmlContent = GenererContenuHtml(nomPrenom, body);

            await EnvoyerEmailAsync(destinataire, " Prochain entretien après refus", htmlContent);
        }
        public async Task EnvoyerEmailConfirmationCandidatureAsync(string destinataire, string nomPrenom)
        {
            string body = "Nous vous confirmons que votre candidature a bien été <strong>enregistrée</strong> avec succès.<br/><br/>"
                        + "Notre équipe de recrutement procédera à l’examen de votre profil dans les plus brefs délais.<br/><br/>"
                        + "Vous recevrez une notification par email à chaque étape du processus.";

            string htmlContent = GenererContenuHtml(nomPrenom, body);

            await EnvoyerEmailAsync(destinataire, " Confirmation de réception de votre candidature", htmlContent);
        }



        private async Task EnvoyerEmailAsync(string destinataire, string sujet, string htmlContent)
        {
            var mailMessage = new MailMessage
            {
                From = new MailAddress(smtpUser, "Service RH"),
                Subject = sujet,
                IsBodyHtml = true,
                Body = htmlContent
            };

            mailMessage.To.Add(destinataire);
            mailMessage.ReplyToList.Add(new MailAddress(smtpUser));

            using var smtpClient = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPassword),
                EnableSsl = true
            };

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

        private string GenererContenuHtml(string nomPrenom, string body)
        {
            return "<html>"
                 + "<body style='font-family: Arial, sans-serif; background-color: #f0f0f0;'>"
                 + "<div style='max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; "
                 + "box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);'>"

                 + "<div style='text-align: center;'>"
                 + "<img src='https://www.farojob.net/wp-content/uploads/2016/12/unilog.png' alt='Logo' style='width: 200px; height: auto; margin-bottom: 20px;'/>"
                 + "</div>"

                 + $"<h2 style='color: #2c3e50;'>Bonjour {nomPrenom},</h2>"
                 + $"<p style='font-size: 16px; color: #2c3e50;'>{body}</p>"

                 + "<p style='color: #2c3e50; font-size: 14px; margin-top: 40px;'>"
                 + "Cordialement,<br/><strong>La Direction Ressources Humaines</strong>"
                 + "</p>"

                 + "</div>"
                 + "</body>"
                 + "</html>";
        }

    }
}
