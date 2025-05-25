namespace PfeRH.Models
{
    public class Admin: Utilisateur
    {
        public ICollection<Candidature> Candidatures { get; set; }

        // Liste des employés gérés par l'admin
        public ICollection<Employe> Employes { get; set; }

        // Liste des départements gérés par l'admin
        public ICollection<Departement> Departements { get; set; }

        

        public Admin()
        {
            Candidatures = new List<Candidature>();
            Employes = new List<Employe>();
            Departements = new List<Departement>();
            

        }

        // Constructeur avec paramètres pour initialiser l'Admin
        public Admin( string nomPrenom, string email)
            : base( nomPrenom, email, "Admin")
        {
            Candidatures = new List<Candidature>();
            Employes = new List<Employe>();
            Departements = new List<Departement>();
            

        }
    }
}
