﻿namespace PfeRH.Models
{
    public class Jwt
    {
        public string SecretKey { get; set; }
        public string Issuer { get; set; }
        public string Audience { get; set; }
    }
}
