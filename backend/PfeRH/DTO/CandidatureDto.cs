using System;
using System.Collections.Generic;
namespace PfeRH.DTO
{
    public class CandidatureDto
    {
        public int Id { get; set; }
        public string Statut { get; set; }
        public double Score { get; set; }
        public double scoreAI {  get; set; }
        public DateTime DateSoumission { get; set; }
        public List<string> CompetencesExtraites { get; set; }
        public CandidatDTO Candidat { get; set; }
        public List<ReponseCandidatDTO> Reponses { get; set; }
    }
}
