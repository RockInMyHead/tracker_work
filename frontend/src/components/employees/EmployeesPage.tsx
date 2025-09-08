import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { Employee, EmployeeFormData } from '../../types';
import { EmployeeForm } from './EmployeeForm';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEmployees({ q: searchQuery || undefined });
      setEmployees(response.results);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (employeeData: EmployeeFormData) => {
    try {
      await apiService.createEmployee(employeeData);
      setShowForm(false);
      loadEmployees();
    } catch (error) {
      console.error('Failed to create employee:', error);
      throw error;
    }
  };

  const handleUpdateEmployee = async (employeeData: Partial<EmployeeFormData>) => {
    if (!editingEmployee) return;

    try {
      await apiService.updateEmployee(editingEmployee.id, employeeData);
      setEditingEmployee(null);
      loadEmployees();
    } catch (error) {
      console.error('Failed to update employee:', error);
      throw error;
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;

    setDeletingEmployeeId(employeeId);

    try {
      await apiService.deleteEmployee(employeeId);
      loadEmployees();
      alert('Сотрудник успешно удален!');
    } catch (error: any) {
      console.error('Failed to delete employee:', error);

      // Показываем пользователю понятное сообщение об ошибке
      let errorMessage = 'Не удалось удалить сотрудника. ';

      if (error.response?.status === 401) {
        errorMessage += 'Пожалуйста, войдите в систему заново.';
      } else if (error.response?.status === 403) {
        errorMessage += 'У вас нет прав для удаления сотрудников.';
      } else if (error.response?.status === 404) {
        errorMessage += 'Сотрудник не найден.';
      } else if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else {
        errorMessage += 'Проверьте подключение к интернету и попробуйте еще раз.';
      }

      alert(errorMessage);
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Debounce search
    setTimeout(() => {
      loadEmployees();
    }, 300);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Управление сотрудниками</h1>
              <p className="mt-2 text-sm text-gray-600">
                Управление членами команды и их контактной информацией
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Добавить сотрудника
            </button>
          </div>

          {/* Search */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск сотрудников..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Employee Form Modal */}
          {(showForm || editingEmployee) && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingEmployee ? 'Редактировать сотрудника' : 'Добавить нового сотрудника'}
                  </h3>
                  <EmployeeForm
                    employee={editingEmployee || undefined}
                    onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingEmployee(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Employees List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <li key={index} className="px-4 py-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </li>
                ))
              ) : employees.length > 0 ? (
                employees.map((employee) => (
                  <li key={employee.id} className="px-4 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {employee.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {employee.full_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {employee.position || 'Должность не указана'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {employee.email || 'Email не указан'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {employee.is_active ? 'Активен' : 'Неактивен'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingEmployee(employee)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            disabled={deletingEmployeeId === employee.id}
                            className={`text-sm font-medium ${
                              deletingEmployeeId === employee.id
                                ? 'text-red-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900'
                            }`}
                          >
                            {deletingEmployeeId === employee.id ? 'Удаление...' : 'Удалить'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center text-gray-500">
                  <p>Сотрудники не найдены</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Добавить первого сотрудника
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
