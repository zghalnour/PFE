namespace PfeRH.DTO
{
    public class OffreCreateDto
    {
        public string Titre { get; set; }
        public string Description { get; set; }
        public string Competences { get; set; }
        public String DateLimitePostulation { get; set; }
        

        // Propriétés pour créer un Test associé
        
        public string TestDescription { get; set; }

        // Liste des questions à ajouter au test
        public List<QuestionCreateDto> Questions { get; set; }
    }

    public class QuestionCreateDto
    {
        public string Enonce { get; set; }
        public string Option1 { get; set; }
        public string Option2 { get; set; }
        public string Option3 { get; set; }
        public int ReponseCorrecte { get; set; }
    }

}
