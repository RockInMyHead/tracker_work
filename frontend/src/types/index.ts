// User and Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  groups: string[];
  employee_profile?: EmployeeProfile;
}

export interface Employee {
  id: string;
  full_name: string;
  position: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: number;
}

export interface EmployeeProfile extends Employee {
  user: number;
}

// Task Types
export type TaskStatus = 'new' | 'in_progress' | 'done' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  parent: string | null;
  assignee: EmployeeProfile | null;
  assignee_id?: string;
  due_date: string | null;
  status: TaskStatus;
  priority: number | null;
  is_overdue: boolean;
  is_active: boolean;
  is_critical: boolean;
  subtasks_count: number;
  all_subtasks_count: number;
  images: TaskImage[];
  messages: TaskMessage[];
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position?: string;
}

export interface AuthResponse {
  refresh: string;
  access: string;
  user: User;
  employee_profile: EmployeeProfile | null;
}

export interface TokenRefreshRequest {
  refresh: string;
}

// Workload Types
export interface EmployeeWorkload {
  employee_id: string;
  full_name: string;
  active_tasks_count: number;
  tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    due_date: string | null;
  }>;
}

// Important Tasks Types
export interface RecommendedEmployee {
  id: string;
  full_name: string;
  reason: 'least_loaded' | 'parent_assignee_within_threshold';
}

export interface ImportantTask {
  id: string;
  title: string;
  due_date: string | null;
  recommended_employees: RecommendedEmployee[];
}

// Form Types
export interface TaskFormData {
  title: string;
  description?: string;
  parent?: string;
  assignee_id?: string;
  due_date?: string | null;
  start_date?: string;
  end_date?: string;
  status: TaskStatus;
  priority?: number;
}

// Task Image Types
export interface TaskImage {
  id: string;
  task: string;
  image: string;
  image_url: string;
  caption: string | null;
  uploaded_by: EmployeeProfile | null;
  uploaded_at: string;
}

// Task Message Types
export interface TaskMessage {
  id: string;
  task: string;
  sender: EmployeeProfile | null;
  message: string;
  created_at: string;
  updated_at: string;
}

// Task Detail Types
export interface TaskDetail extends Task {
  images: TaskImage[];
  messages: TaskMessage[];
}

// Gantt Chart Types
export interface GanttTask {
  id: string;
  text: string;
  start_date: string | null;
  end_date: string | null;
  duration: number;
  progress: number;
  assignee: string;
  status: TaskStatus;
  priority: number | null;
  color: string;
  parent: string | null;
}

export interface GanttLink {
  id: string;
  source: string;
  target: string;
  type: string;
  lag: number;
}

export interface GanttData {
  tasks: GanttTask[];
  links: GanttLink[];
}

// Task Dependency Types
export interface TaskDependency {
  id: string;
  predecessor: string;
  successor: string;
  predecessor_title: string;
  successor_title: string;
  predecessor_assignee: string | null;
  successor_assignee: string | null;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag_days: number;
  created_at: string;
}

export interface EmployeeFormData {
  full_name: string;
  position: string;
  email?: string;
  is_active?: boolean;
}

// Filter Types
export interface TaskFilters {
  status?: TaskStatus;
  assignee?: string;
  q?: string;
  due_date_after?: string;
  due_date_before?: string;
}

export interface EmployeeFilters {
  q?: string;
  is_active?: boolean;
  position?: string;
}

// Error Types
export interface ApiError {
  detail?: string;
  [key: string]: any;
}
