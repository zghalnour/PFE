using System;
using System.Collections.Generic;
namespace PfeRH.DTO
{
    public class CandidatureSubmissionDto
    {
       
            public int OffreId { get; set; } // ID de l'offre à laquelle le candidat postule

            public string NomPrenom { get; set; } // Nom complet du candidat
            public string Email { get; set; } // Email du candidat
            public string Telephone { get; set; }
      
        public IFormFile? CVFile { get; set; } // Chemin du CV (peut être une URL ou un fichier stocké)
        public string LinkedIn { get; set; } // Lien du profil LinkedIn (optionnel)

           
        public string ReponsesJson { get; set; }
       
    }

    public class ReponseCandidatDto
    {
        public int QuestionId { get; set; } // ID de la question
        public int OptionChoisieId { get; set; } // ID de l'option choisie par le candidat
    }
}

