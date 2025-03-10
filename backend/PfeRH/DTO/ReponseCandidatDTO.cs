namespace PfeRH.DTO
{
    public class ReponseCandidatDTO
    {
        public string Intitule { get; set; }  // Enoncé de la question
        public string OptionChoisie { get; set; }  // Réponse du candidat (texte)
        public bool EstCorrecte { get; set; }
    }
}
