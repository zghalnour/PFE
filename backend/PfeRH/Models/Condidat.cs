namespace PfeRH.Models
{
    public class Condidat : Utilisateur
    {
       
        public string CVPath { get; set; }
        public string LinkedIn { get; set; }
       
        public string Telephone { get; set; }


        public List<string> CompetencesExtraites { get; set; }

        public ICollection<Candidature> Candidatures { get; set; }
        public Condidat()
        {
            Candidatures = new List<Candidature>();
            CompetencesExtraites = new List<string>();
            LinkedIn = string.Empty;
            Telephone = string.Empty;
        }

        // Constructeur avec paramètres
        public Condidat(string nomPrenom, string email, string role, string cvPath, string linkedIn = "", string telephone = "")
            : base(nomPrenom, email, role)
        {
            CVPath = cvPath;
            LinkedIn = linkedIn;
            Telephone = telephone;
            Candidatures = new List<Candidature>();
            CompetencesExtraites = new List<string>();
        }
    }
}
