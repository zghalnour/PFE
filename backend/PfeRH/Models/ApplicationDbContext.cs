using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PfeRH.Models;

namespace PfeRH.Models
{
    public class ApplicationDbContext : IdentityDbContext<Utilisateur, IdentityRole<int>, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Utilisateur> Utilisateurs { get; set; }
        public DbSet<DemandeConge> DemandesConge { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Departement> Departements { get; set; }
        public DbSet<Evaluation> Evaluations { get; set; }
        public DbSet<Presence> Presences { get; set; }
        public DbSet<Projet> Projets { get; set; }
        public DbSet<Entretien> Entretiens { get; set; }
        public DbSet<Candidature> Candidatures { get; set; }
        public DbSet<OptionQuestion> OptionQuestions { get; set; }
        public DbSet<ReponseCandidat> ReponseCandidats { get; set; }
        public DbSet<Tache> Taches { get; set; }
        public DbSet<Test>Tests { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Offre>Offres { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // IdentityUserLogin, IdentityUserRole, and IdentityUserToken configurations
            modelBuilder.Entity<IdentityUserLogin<int>>()
                .HasKey(x => new { x.LoginProvider, x.ProviderKey });

            modelBuilder.Entity<IdentityUserRole<int>>()
                .HasKey(x => new { x.UserId, x.RoleId });

            modelBuilder.Entity<IdentityUserToken<int>>()
                .HasKey(x => new { x.UserId, x.LoginProvider, x.Name });

            // Cascade behavior configurations
            modelBuilder.Entity<ReponseCandidat>()
       .HasOne(rc => rc.Candidature)
       .WithMany(c => c.ReponseCandidats)
       .HasForeignKey(rc => rc.CandidatureId)
       .OnDelete(DeleteBehavior.Restrict); // Empêche la suppression en cascade

            modelBuilder.Entity<ReponseCandidat>()
                .HasOne(rc => rc.Question)
                .WithMany(q => q.ReponseCandidats)
                .HasForeignKey(rc => rc.QuestionId)
                .OnDelete(DeleteBehavior.NoAction); // Modification ici pour éviter les cycles de cascade

          
            modelBuilder.Entity<Entretien>()
               .HasOne(e => e.Candidature)
               .WithMany(c => c.Entretiens)
               .HasForeignKey(e => e.CandidatureId)
               .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Offre>()
           .HasOne(o => o.Test) // Offre a un Test
           .WithOne(t => t.Offre) // Test a une Offre
           .HasForeignKey<Offre>(o => o.TestId) // Spécifier la clé étrangère
           .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Offre>()
          .HasMany(o => o.Candidatures)
          .WithOne(c => c.Offre)
          .HasForeignKey(c => c.OffreId);

            modelBuilder.Entity<Test>()
                .HasMany(t => t.Questions)
                .WithOne(q => q.Test)
                .HasForeignKey(q => q.TestId);
            modelBuilder.Entity<Test>()
       .HasOne(t => t.Offre)  // La relation entre Test et Offre
       .WithOne(o => o.Test)  // Chaque Offre a un Test
       .OnDelete(DeleteBehavior.Cascade);


        }


    }

}
