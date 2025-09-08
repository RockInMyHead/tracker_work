import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  Employee,
  Task,
  TaskImage,
  TaskMessage,
  TaskDependency,
  GanttData,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshRequest,
  TaskFormData,
  EmployeeFormData,
  TaskFilters,
  EmployeeFilters,
  EmployeeWorkload,
  ImportantTask,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// API Endpoints
const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/refresh/',
  },
  TASKS: {
    LIST: '/tasks/',
    CRITICAL: '/tasks/critical/',
    ACTIVE: '/tasks/active/',
    IMPORTANT: '/tasks/important/',
    GANTT_DATA: '/tasks/gantt_data/',
  },
  TASK_IMAGES: '/task-images/',
  TASK_MESSAGES: '/task-messages/',
  TASK_DEPENDENCIES: '/task-dependencies/',
  EMPLOYEES: {
    LIST: '/employees/',
    WORKLOAD: '/employees/workload/',
  },
} as const;

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken && refreshToken.trim() !== '') {
              const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              localStorage.setItem('access_token', access);

              // Retry the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.authorization = `Bearer ${access}`;
              }
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Refresh failed, redirect to login
            this.clearAuthData();
            window.location.href = '/login';
          }
        }

        // Don't retry logout requests that fail with 400 (invalid token)
        if (error.response?.status === 400 && originalRequest.url?.includes('/auth/logout/')) {
          console.log('Logout with invalid token - ignoring error');
          this.clearAuthData();
          return Promise.resolve({ data: { message: 'Logged out' } });
        }

        return Promise.reject(error);
      }
    );
  }

  // Helper methods
  private clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private storeAuthData(data: AuthResponse): void {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post(ENDPOINTS.AUTH.LOGIN, credentials);
    const data = response.data;

    this.storeAuthData(data);
    return data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post(ENDPOINTS.AUTH.REGISTER, userData);
    const data = response.data;

    this.storeAuthData(data);
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken && refreshToken.trim() !== '') {
      try {
        await this.api.post(ENDPOINTS.AUTH.LOGOUT, { refresh: refreshToken });
      } catch (error) {
        // Ignore logout errors - token might be expired or invalid
        // This is expected behavior and shouldn't be logged as an error
        console.log('Logout completed (token may have been expired)');
      }
    }

    this.clearAuthData();
  }

  async refreshToken(refreshData: TokenRefreshRequest): Promise<{ access: string }> {
    const response = await this.api.post(ENDPOINTS.AUTH.REFRESH, refreshData);
    const data = response.data;

    localStorage.setItem('access_token', data.access);
    return data;
  }

  // Task methods
  async getTasks(filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
    const response = await this.api.get(ENDPOINTS.TASKS.LIST, { params: filters });
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.api.get(`${ENDPOINTS.TASKS.LIST}${id}/`);
    return response.data;
  }

  async createTask(taskData: TaskFormData): Promise<Task> {
    const response = await this.api.post(ENDPOINTS.TASKS.LIST, taskData);
    return response.data;
  }

  async updateTask(id: string, taskData: Partial<TaskFormData>): Promise<Task> {
    const response = await this.api.patch(`${ENDPOINTS.TASKS.LIST}${id}/`, taskData);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.api.delete(`${ENDPOINTS.TASKS.LIST}${id}/`);
  }

  async getActiveTasks(): Promise<Task[]> {
    const response = await this.api.get(ENDPOINTS.TASKS.ACTIVE);
    return response.data;
  }

  async getCriticalTasks(): Promise<Task[]> {
    const response = await this.api.get(ENDPOINTS.TASKS.CRITICAL);
    return response.data;
  }

  async getImportantTasks(): Promise<ImportantTask[]> {
    const response = await this.api.get(ENDPOINTS.TASKS.IMPORTANT);
    return response.data;
  }

  // Employee methods
  async getEmployees(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    const response = await this.api.get(ENDPOINTS.EMPLOYEES.LIST, { params: filters });
    return response.data;
  }

  async getEmployee(id: string): Promise<Employee> {
    const response = await this.api.get(`${ENDPOINTS.EMPLOYEES.LIST}${id}/`);
    return response.data;
  }

  async createEmployee(employeeData: EmployeeFormData): Promise<Employee> {
    const response = await this.api.post(ENDPOINTS.EMPLOYEES.LIST, employeeData);
    return response.data;
  }

  async updateEmployee(id: string, employeeData: Partial<EmployeeFormData>): Promise<Employee> {
    const response = await this.api.put(`${ENDPOINTS.EMPLOYEES.LIST}${id}/`, employeeData);
    return response.data;
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.api.delete(`${ENDPOINTS.EMPLOYEES.LIST}${id}/`);
  }

  async getEmployeeWorkload(id: string): Promise<EmployeeWorkload> {
    const response = await this.api.get(`${ENDPOINTS.EMPLOYEES.LIST}${id}/workload_detail/`);
    return response.data;
  }

  async getWorkload(): Promise<EmployeeWorkload[]> {
    const response = await this.api.get(ENDPOINTS.EMPLOYEES.WORKLOAD);
    return response.data;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      // Simple JWT decode (you might want to use jwt-decode library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.user_id,
        username: payload.username || '',
        email: '',
        first_name: '',
        last_name: '',
        is_staff: false,
        groups: [],
      };
    } catch {
      return null;
    }
  }

  // Task Image methods
  async getTaskImages(taskId?: string): Promise<PaginatedResponse<TaskImage>> {
    const params = taskId ? { task_id: taskId } : {};
    const response = await this.api.get(ENDPOINTS.TASK_IMAGES, { params });
    return response.data;
  }

  async createTaskImage(taskId: string, imageData: FormData): Promise<TaskImage> {
    const response = await this.api.post(ENDPOINTS.TASK_IMAGES, imageData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteTaskImage(imageId: string): Promise<void> {
    await this.api.delete(`${ENDPOINTS.TASK_IMAGES}${imageId}/`);
  }

  // Task Message methods
  async getTaskMessages(taskId?: string): Promise<PaginatedResponse<TaskMessage>> {
    const params = taskId ? { task_id: taskId } : {};
    const response = await this.api.get(ENDPOINTS.TASK_MESSAGES, { params });
    return response.data;
  }

  async createTaskMessage(taskId: string, message: string): Promise<TaskMessage> {
    const response = await this.api.post(ENDPOINTS.TASK_MESSAGES, {
      task: taskId,
      message: message,
    });
    return response.data;
  }

  async updateTaskMessage(messageId: string, message: string): Promise<TaskMessage> {
    const response = await this.api.patch(`${ENDPOINTS.TASK_MESSAGES}${messageId}/`, {
      message: message,
    });
    return response.data;
  }

  async deleteTaskMessage(messageId: string): Promise<void> {
    await this.api.delete(`${ENDPOINTS.TASK_MESSAGES}${messageId}/`);
  }

  // Gantt Chart methods
  async getGanttData(): Promise<GanttData> {
    const response = await this.api.get(ENDPOINTS.TASKS.GANTT_DATA);
    return response.data;
  }

  // Task Dependency methods
  async getTaskDependencies(predecessorId?: string, successorId?: string): Promise<PaginatedResponse<TaskDependency>> {
    const params: any = {};
    if (predecessorId) params.predecessor_id = predecessorId;
    if (successorId) params.successor_id = successorId;

    const response = await this.api.get(ENDPOINTS.TASK_DEPENDENCIES, { params });
    return response.data;
  }

  async createTaskDependency(predecessorId: string, successorId: string, dependencyType: string, lagDays: number): Promise<TaskDependency> {
    const response = await this.api.post(ENDPOINTS.TASK_DEPENDENCIES, {
      predecessor: predecessorId,
      successor: successorId,
      dependency_type: dependencyType,
      lag_days: lagDays,
    });
    return response.data;
  }

  async updateTaskDependency(dependencyId: string, data: Partial<{ dependency_type: string; lag_days: number }>): Promise<TaskDependency> {
    const response = await this.api.patch(`${ENDPOINTS.TASK_DEPENDENCIES}${dependencyId}/`, data);
    return response.data;
  }

  async deleteTaskDependency(dependencyId: string): Promise<void> {
    await this.api.delete(`${ENDPOINTS.TASK_DEPENDENCIES}${dependencyId}/`);
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
