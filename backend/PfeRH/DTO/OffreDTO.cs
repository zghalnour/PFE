namespace PfeRH.DTO
{
    public class OffreDTO
    {
        public int ID { get; set; }
        public string Titre { get; set; }
        public string TypeContrat {  get; set; }
        public string Description { get; set; }
        public string Competences { get; set; }
        public int NombreCandidatures { get; set; }
        public string Statut { get; set; }
        public string DateLimite { get; set; }
        public int TestId { get; set; }
        public string descTest {  get; set; }
        public List<QuestionDTO> Questions { get; set; } = new List<QuestionDTO>(); // Liste des questions associées
    }

    public class QuestionDTO
    {
        public int Id { get; set; }
        public string Intitule { get; set; }
        public string Option1 { get; set; }
        public string Option2 { get; set; }
        public string Option3 { get; set; }
        public int ReponseCorrecte { get; set; } // Stocke l'index de la bonne réponse (1, 2 ou 3)
    }
}
