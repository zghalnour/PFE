namespace PfeRH.Models
{
    public class Admin: Utilisateur
    {
        public ICollection<Candidature> Candidatures { get; set; }

        // Liste des employés gérés par l'admin
        public ICollection<Employe> Employes { get; set; }

        // Liste des départements gérés par l'admin
        public ICollection<Departement> Departements { get; set; }

        public ICollection<Entretien> Entretiens { get; set; }

        public Admin()
        {
            Candidatures = new List<Candidature>();
            Employes = new List<Employe>();
            Departements = new List<Departement>();
            Entretiens = new List<Entretien>();

        }

        // Constructeur avec paramètres pour initialiser l'Admin
        public Admin( string nomPrenom, string email, string role)
            : base( nomPrenom, email, role)
        {
            Candidatures = new List<Candidature>();
            Employes = new List<Employe>();
            Departements = new List<Departement>();
            Entretiens = new List<Entretien>();

        }
    }
}
