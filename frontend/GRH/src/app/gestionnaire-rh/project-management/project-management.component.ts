import { Component,OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, switchMap, of } from 'rxjs'; 
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

export interface Project {
  id: number;
  nom: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  taches?: Task[];
  employesAssignes?: SimpleEmployee[]; // employés assignés au projet
  departement?: string; // nom du département lié
  progressPercentage?: number;
  reunions?: Reunion[];
}
export interface Reunion {
  id: number;
  dateEvaluation: Date;
  titre:String;
  lieu: string;
  pointsADiscuter: string;
}
export interface Task {
  id: number;
  nom: string;
  description?: string;
  statut: string;
  employeId:number;
}

export interface SimpleEmployee {
  id: number;
  nomPrenom: string;
}

export interface Employee extends SimpleEmployee {
  poste?: string;
  departement?: string;
  projects?: Project[];
}



export interface Department {
  id: number;
  nom: string;
  employes: SimpleEmployee[];
  projets: Project[];
}

@Component({
  selector: 'app-project-management',
  templateUrl: './project-management.component.html',
  styleUrl: './project-management.component.css'
})
export class ProjectManagementComponent implements OnInit {
  
  allDepartments: Department[] = [];
  filteredDepartments: Department[] = [];
  selectedDepartmentFilter: string = '';
  projectSearchTerm: string = '';
  searchTerm: string = '';
  progress: number = 0;
  allEmployees: Employee[] = [];
  departmentEmployeesForModal: Employee[] = [];

  // Filtres
  selectedTeamFilter: string = '';
  selectedProjectFilter: string = '';
 // --- Add Project Modal State ---
 isAddProjectModalVisible = false;
 departmentForNewProject: Department | null = null;
 projectForm!: FormGroup; // The form group for the new project
 isSubmittingProject = false;
 apiBaseUrl = 'http://localhost:5053/api/Employe'; // Your API base URL
 apiProjectBaseUrl = 'http://localhost:5053/api/Project'; // Base URL for Project actions
  apiDepartmentBaseUrl = 'http://localhost:5053/api/Departement'; // Base URL for Department actions


  // Indicateurs de visibilité des modales
  isAssignProjectModalVisible = false;
  isAddEmployeeModalVisible = false;
  isCreateTeamModalVisible = false;

  // Données pour les modales
  targetEmployee: Employee | null = null;

  availableProjects: Project[] = [];
  availableEmployeesForTeam: Employee[] = [];
  selectedProjectToAssign: string | null = null;
  selectedEmployeeToAdd: string | null = null;
  newTeamName: string = '';
  isEditProjectModalVisible = false;
  projectToEdit: Project | null = null;
  editProjectForm!: FormGroup;
  
  isEvaluationModalVisible = false;
  projectForEvaluation: any = null; // Use a specific Project type/interface if available
  evaluationForm!: FormGroup; // Use definite assignment assertion or initialize in constructor
  isSubmittingEvaluation = false;
  today: Date = new Date();

  constructor(
    private fb: FormBuilder, // Inject FormBuilder
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Initialize the project form
    this.projectForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''], // Description du projet
      dateDebut: [null, Validators.required],
      dateFin: [null, Validators.required],
      taches: this.fb.array([]), // <-- ADDED: Initialize FormArray for tasks
    
    });
    this.initializeEditForm();
  }
  initializeEditForm(): void {
    this.editProjectForm = this.fb.group({
      nom: [this.projectToEdit?.nom || ''],
      description: [this.projectToEdit?.description || ''],
      dateFin: [this.projectToEdit?.dateFin || ''],
      taches: this.fb.array([])
    });
    
  }

  ngOnInit(): void {
  
    this.loadInitialData();
    this.initializeEvaluationForm();
  }
  initializeEvaluationForm(): void {
    this.evaluationForm = this.fb.group({
      dateEvaluation: ['', Validators.required],
      titre: ['', Validators.required],
      lieu: ['', Validators.required],
    
    });
    
  }
  // Getter for easy access to the taches FormArray in the template
get taches(): FormArray {
  return this.projectForm.get('taches') as FormArray;
}

get editTaches(): FormArray {
  return this.editProjectForm.get('taches') as FormArray;
}
openEvaluationModal(project: any): void { // Use specific Project type
  this.projectForEvaluation = project;
  this.evaluationForm.reset(); // Reset form when opening
  // Optionally pre-fill data if needed:
  // this.evaluationForm.patchValue({ /* initial values */ });
  this.isEvaluationModalVisible = true;
}

// Function to close the modal
closeEvaluationModal(): void {
  this.isEvaluationModalVisible = false;
  this.projectForEvaluation = null; // Clear the selected project
}

// Function to handle the submission
private formatDateToDdMmYyyy(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) { // Check if the date is valid
      console.error("Invalid date provided for formatting:", date);
      return ''; // Return empty or throw error
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

submitEvaluationMeeting(): void {
  // --- 1. Form Validation Check ---
  if (this.evaluationForm.invalid) {
    this.evaluationForm.markAllAsTouched(); // Mark fields to show validation errors in HTML
    this.snackBar.open('Veuillez remplir tous les champs obligatoires.', 'Fermer', {
      duration: 3000,
      panelClass: ['warn-snackbar'] // Optional: Add custom class for styling
    });
    return;
  }

  if (!this.projectForEvaluation) {
      console.error("Project context is missing for scheduling evaluation.");
      this.snackBar.open('Erreur: Projet non sélectionné.', 'Fermer', { duration: 4000, panelClass: ['error-snackbar'] });
      return;
  }

  this.isSubmittingEvaluation = true;
  const formData = this.evaluationForm.value;
  console.log(formData);
  const projectId = this.projectForEvaluation.id;
  

  // --- 2. Construct API Payload ---
  const payload = {
    // Format the date from the form value to dd/MM/yyyy string
    dateEvaluation: this.formatDateToDdMmYyyy(formData.dateEvaluation),
    lieu: formData.lieu,
    titre:formData.titre,
    pointsADiscuter: formData.pointsADiscuter
  };

  // --- 3. Construct API URL ---
  const apiUrl = `${this.apiProjectBaseUrl}/${projectId}/ajouter-evaluation`;

  console.log('Submitting Evaluation Meeting Payload:', payload);
  console.log('API URL:', apiUrl);

  // --- 4. Make API Call ---
  this.http.post<{ message: string, evaluationId: number }>(apiUrl, payload)
    .subscribe({
      next: (response) => {
        console.log('Evaluation scheduled successfully:', response);

        this.loadInitialData();

        this.closeEvaluationModal();
        // Optionally: Refresh project data if the evaluation status needs to be shown immediately
        // this.loadInitialData();
      },
      error: () => {
        console.error('Error scheduling evaluation:');
      },
      complete: () => {
        // Runs after next() or error()
        this.isSubmittingEvaluation = false; // Ensure this resets in both cases
      }
    });
}



// --- Task Creation for Forms (Modify to handle existing tasks) ---
createTaskGroup(task: Task | null = null): FormGroup {

  return this.fb.group({
    id: [task ? task.id : 0, Validators.required], // Stocker l'ID original, 0 pour les nouvelles tâches
    nom: [task ? task.nom : '', Validators.required],
    description: [task ? task.description : ''], // La description est modifiable pour les tâches
    employeId: [task ? task.employeId : null, Validators.required]
  });
}

// Adds a new task FormGroup to the FormArray
addTask(): void {
  this.taches.push(this.createTaskGroup());
}

// Removes a task FormGroup from the FormArray at a given index
removeTask(index: number): void {
  this.taches.removeAt(index);
}
addTaskToEditForm(): void {
  // Ajoute un nouveau groupe de tâche vide (id sera 0)
  this.editTaches.push(this.createTaskGroup());
}

removeTaskFromEditForm(index: number): void {
  const taskControl = this.editTaches.at(index);

      this.editTaches.removeAt(index);

}



// --- Edit Project Modal Logic ---
openEditProjectModal(project: Project, department: Department): void {
  // Check if tasks are already loaded (exist and array is not empty)
  if (project.taches && project.taches.length > 0) {
    console.log(`Tasks already loaded for project ${project.id}. Opening modal directly.`);
    this.proceedToOpenEditModal(project, department);
  } else {
    // Tasks are not loaded, fetch them from the API
    console.log(`Tasks not loaded for project ${project.id}. Fetching from API...`);
  
    const tasksApiUrl = `${this.apiProjectBaseUrl}/${project.id}/taches`;

    this.http.get<Task[]>(tasksApiUrl).subscribe({
      next: (fetchedTasks) => {
        console.log(`Successfully fetched ${fetchedTasks.length} tasks for project ${project.id}.`);
        // IMPORTANT: Update the original project object within the allDepartments array
        // Find the department and project to update
        const deptIndex = this.allDepartments.findIndex(d => d.id === department.id);
        if (deptIndex > -1) {
            const projIndex = this.allDepartments[deptIndex].projets.findIndex(p => p.id === project.id);
            if (projIndex > -1) {
                // Update the tasks array on the actual object in our data source
                this.allDepartments[deptIndex].projets[projIndex].taches = fetchedTasks;
                // Now use this updated project object to open the modal
                this.proceedToOpenEditModal(this.allDepartments[deptIndex].projets[projIndex], department);
            } else {
               console.error(`Project with ID ${project.id} not found in department ${department.nom} after fetching tasks.`);
               this.snackBar.open('Erreur interne: Projet non trouvé après chargement des tâches.', 'Fermer', { duration: 4000 });
            }
        } else {
           console.error(`Department with ID ${department.id} not found after fetching tasks.`);
           this.snackBar.open('Erreur interne: Département non trouvé après chargement des tâches.', 'Fermer', { duration: 4000 });
        }
        
      },
      error: (err) => {
        console.error(`Error fetching tasks for project ${project.id}:`, err);
        this.snackBar.open(`Erreur lors du chargement des tâches pour le projet ${project.nom}.`, 'Fermer', { duration: 4000 });
      
        // Do not open the modal if tasks failed to load
      }
    });
  }
}

// --- NEW: Helper function to actually open and populate the modal ---
private proceedToOpenEditModal(projectWithTasks: Project, department: Department): void {
  this.projectToEdit = { ...projectWithTasks }; // Use the project that now definitely has tasks
  this.initializeEditForm();

  this.editProjectForm.patchValue({
    nom: this.projectToEdit.nom,
    dateFin: this.projectToEdit.dateFin,
    // description: this.projectToEdit.description, // Uncomment if description becomes editable
  });

  this.editTaches.clear();
  // Use the tasks from the potentially updated project object
  this.projectToEdit.taches?.forEach(task => {
    // Check if the task object from API has 'nom'. If not, adapt 'createTaskGroup' or API response.
    if (task.nom === undefined) {
        console.warn(`Task with ID ${task.id} fetched from API is missing the 'nom' property. Using description or placeholder.`);
      
    }
    this.editTaches.push(this.createTaskGroup(task));
  });

  
  this.departmentEmployeesForModal = department.employes as Employee[]; 
  if (!this.departmentEmployeesForModal || this.departmentEmployeesForModal.length === 0) {
      console.warn(`No employees found for department ${department.nom} to populate dropdown.`);
      // Potentially load them here if needed: this.loadEmployeesForDepartment(department.id);
  } else if (!this.departmentEmployeesForModal[0].nomPrenom) {
      console.warn(`Employees for department ${department.nom} seem to be SimpleEmployee[], missing 'nomPrenom'. Check data loading or interfaces.`);
  }


  console.log(`Proceeding to open edit modal for ${projectWithTasks.nom}. Employees:`, this.departmentEmployeesForModal);
  this.isEditProjectModalVisible = true;
}



closeEditProjectModal(): void {
  this.isEditProjectModalVisible = false;
  this.projectToEdit = null;
  this.departmentEmployeesForModal = []; // Vider la liste des employés
  // Pas besoin de reset le form ici, initializeEditForm le fait à l'ouverture
}

submitEditProject(): void {
  if (!this.editProjectForm || this.editProjectForm.invalid || !this.projectToEdit) {
    this.snackBar.open('Veuillez corriger les erreurs dans le formulaire.', 'Fermer', { duration: 3000 });
    this.editProjectForm.markAllAsTouched();
    return;
  }

  this.isSubmittingProject = true;

  const formData = this.editProjectForm.value;
  console.log('Form data:', formData);

  // Convertir la date au format "dd/MM/yyyy"
  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const updatePayload = {
    nom: formData.nom,
    description: formData.description,
    dateFin: formData.dateFin ? formatDate(new Date(formData.dateFin)) : null,
    taches: formData.taches.map((taskData: any) => ({
      id: taskData.id,
      nom: taskData.nom,
      description: taskData.description,
      employeId: taskData.employeId
    }))
  };

  const projectId = this.projectToEdit.id;
  const apiUrl = `http://localhost:5053/api/Project/${projectId}/update`;

  console.log('Submitting update project payload:', updatePayload);
  console.log('API URL:', apiUrl);

  this.http.put(apiUrl, updatePayload, { responseType: 'text' })
    .subscribe({
      next: (response) => {
        console.log('API Update Response:', response);
      
        this.closeEditProjectModal();
        this.loadInitialData();
        this.isSubmittingProject = false;
      },
      error: (error) => {
        console.error('API Update Error:', error);
      
        this.isSubmittingProject = false;
      }
    });
}


  openAddProjectModal(department: Department): void {
    this.departmentForNewProject = department;
    // Filter employees for the dropdown based on the selected department
    // Adjust the filtering logic based on your Employee model (e.g., departmentId)
    // Assigner directement les employés du département passé en argument
     this.departmentEmployeesForModal = department.employes;

    console.log(`Opening add project modal for ${department.nom}. Employees:`, this.departmentEmployeesForModal);
    this.projectForm.reset(); // Clear previous form data
    this.isAddProjectModalVisible = true;
  }

  closeAddProjectModal(): void {
    this.isAddProjectModalVisible = false;
    this.departmentEmployeesForModal = []; // Clear employee list
    this.projectForm.reset(); // Also reset form on cancel
    this.taches.clear();
  }

  

  submitAddProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.snackBar.open('Veuillez remplir tous les champs obligatoires.', 'Fermer', { duration: 3000 });
      return;
    }
    if (!this.departmentForNewProject) {
        console.error("Department context is missing for adding project.");
        this.snackBar.open('Erreur: Département non sélectionné.', 'Fermer', { duration: 4000, panelClass: ['error-snackbar'] });
        return;
    }

    this.isSubmittingProject = true;
    const formData = this.projectForm.value;

    // Format dates
    const formattedStartDate = formData.dateDebut ? new Date(formData.dateDebut).toISOString() : null;
    const formattedEndDate = formData.dateFin ? new Date(formData.dateFin).toISOString() : null;
    // Format employee IDs
    const employeeIds = formData.employes; 

    const tasksPayload = Array.isArray(formData.taches)
    ? formData.taches.map((task: { nom: string; description: string; employeId: number }) => ({
        nom: task.nom,
        description: task.description,
        employeId: task.employeId
      }))
    : [];
    const payload = {
      nom: formData.nom,
      description: formData.description, // Project description
      dateDebut: formattedStartDate,
      dateFin: formattedEndDate,
      taches: tasksPayload, // <-- ADDED: Include tasks in the payload
      
      // departmentId: this.departmentForNewProject.id // Include if needed
    };
  

    console.log('Submitting new project payload:', payload);

    this.http.post<any>(`${this.apiBaseUrl}/ajouter-projet`, payload)
      .subscribe({
        next: (response) => {
          this.isSubmittingProject = false;
          console.log('API Response:', response);
        
          this.closeAddProjectModal();
          // Refresh data to show the new project
          this.loadInitialData(); // Or implement partial update
        },
        error: (error) => {
          this.isSubmittingProject = false;
          console.error('API Error:', error);
          const errorMessage = error.error?.message || error.message || 'Erreur lors de l\'ajout du projet.';
        
        }
      });
  }
  removeEmployeeFromProject(project: Project, employee: SimpleEmployee) {
    // Logique de suppression ici
  }
  deleteProject(projectId: number): void {
    // Construct the API URL - ensure this matches your backend route
    const apiUrl = `http://localhost:5053/api/Project/${projectId}/delete`;

    this.http.delete<{ message: string }>(apiUrl).subscribe({
      next: (response) => {
        console.log('Delete response:', response);
        // --- Reload all data instead of removing locally ---
        this.loadInitialData();

      },
      error: (err) => {
        console.error('Error deleting project:', err);  
      }
    });
  }
  
  loadInitialData(): void {
    this.http.get<Department[]>('http://localhost:5053/api/Departement/getAllDepartements').pipe(
      switchMap(departmentsData => {
        // If there are no departments, return an empty array immediately
        if (!departmentsData || departmentsData.length === 0) {
          return of([]); // Use 'of' to return an observable of an empty array
        }

        // Create an array of observables to fetch progress for each project
        const progressRequests = departmentsData.flatMap(dept =>
          dept.projets.map(proj =>
            this.http.get<number>(`http://localhost:5053/api/Project/${proj.id}/progress`).pipe(
              map(progress => ({ // Map the progress result to include projectId
                projectId: proj.id,
                progressPercentage: progress
              }))
              // Optional: Add error handling for individual progress requests if needed
              // catchError(err => {
              //   console.error(`Error fetching progress for project ${proj.id}:`, err);
              //   return of({ projectId: proj.id, progressPercentage: 0 }); // Default value on error
              // })
            )
          )
        );

        // If there are no projects across all departments, return the original data
        if (progressRequests.length === 0) {
            // Map departments without fetching progress as there are no projects
            return of(departmentsData.map(dept => ({
                ...dept,
                projets: dept.projets.map(proj => ({
                    ...proj,
                    progressPercentage: 0 ,
                    reunions: proj.reunions?.filter(r => new Date(r.dateEvaluation) > new Date()) ?? []// Default or indicate not applicable
                }))
            })));
        }


        // Use forkJoin to wait for all progress requests to complete
        return forkJoin(progressRequests).pipe(
          map(progressResults => {
            // Create a map for easy lookup of progress by projectId
            const progressMap = new Map<number, number>();
            progressResults.forEach(result => {
              progressMap.set(result.projectId, result.progressPercentage);
            });

            // Map the original department data and merge the progress percentages
            return departmentsData.map(dept => ({
              ...dept, // Spread existing department properties
              projets: dept.projets.map(proj => ({
                ...proj, // Spread existing project properties
                // Get progress from the map, default to 0 if not found (or handle as needed)
                progressPercentage: progressMap.get(proj.id) ?? 0,
              
                reunions: proj.reunions?.filter(r => new Date(r.dateEvaluation) > new Date()) ?? []
              }))
            }));
          })
        );
      })
      // Optional: Add error handling for the main department fetch
      // catchError(err => {
      //   console.error('Error fetching departments:', err);
      //   return of([]); // Return empty array on error
      // })
    ).subscribe(processedDepartments => {
      this.allDepartments = processedDepartments;
      console.log('Departments with progress:', this.allDepartments);
      // Apply filters after loading and processing the departments
      this.applyFilters();
    });
  }
  applyFilters(): void {
    this.filteredDepartments = this.allDepartments
      .filter(dept => 
        this.selectedDepartmentFilter === '' || dept.nom === this.selectedDepartmentFilter
      )
      .map(dept => {
        const filteredProjets = dept.projets.filter(proj => 
          proj.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        return { ...dept, projets: filteredProjets };
      });
    
    console.log('Filtered departments:', this.filteredDepartments);
  }
  
  


  // --- Logique des Modales ---

  

  closeAssignProjectModal(): void {
    this.isAssignProjectModalVisible = false;
    this.targetEmployee = null;
  
  }

  confirmAssignProject(): void {
    
  }

  removeProjectAssignment(employee: Employee, project: Project): void {
     if (!employee || !project) return;

     console.log(`Retrait du projet ${project.id} de l'employé ${employee.id}`);
     // --- TODO: Appel Service ---
     // this.projectService.removeProjectFromEmployee(project.id, employee.id).subscribe({
     //   next: () => {
     //     // Mise à jour optimiste
     if (employee.projects) {
         employee.projects = employee.projects.filter(p => p.id !== project.id);
     }
     //     this.notificationService.showSuccess('Projet retiré avec succès.');
     //   },
     //   error: (err) => this.notificationService.showError('Erreur lors du retrait du projet.')
     // });
  }




  closeAddEmployeeModal(): void {
    this.isAddEmployeeModalVisible = false;
  
  }

  confirmAddEmployeeToTeam(): void {
  
  }

  openCreateTeamModal(): void {
      this.newTeamName = '';
      this.isCreateTeamModalVisible = true;
  }

  closeCreateTeamModal(): void {
      this.isCreateTeamModalVisible = false;
  }

  confirmCreateTeam(): void {
    
  }

}
