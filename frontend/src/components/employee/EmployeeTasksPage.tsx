import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../services/auth';
import type { Task } from '../../types';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// Types
interface TaskFilters {
  status?: string;
  q?: string;
  due_date_after?: string;
  due_date_before?: string;
}

// Constants
const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'new', label: 'Новые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Выполненные' },
  { value: 'cancelled', label: 'Отмененные' },
];

const STATUS_TEXT_MAP = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
} as const;

const STATUS_COLOR_MAP = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
} as const;

// Sub-components
const TaskItem: React.FC<{
  task: Task;
  onStatusChange: (taskId: string, newStatus: string) => void;
}> = ({ task, onStatusChange }) => {
  const statusText = STATUS_TEXT_MAP[task.status as keyof typeof STATUS_TEXT_MAP] || task.status;
  const statusColor = STATUS_COLOR_MAP[task.status as keyof typeof STATUS_COLOR_MAP] || 'bg-gray-100 text-gray-800';

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    onStatusChange(task.id, newStatus);
  };

  return (
    <li className="px-4 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
              task.status === 'new' ? 'bg-blue-500' :
              task.status === 'in_progress' ? 'bg-yellow-500' :
              task.status === 'done' ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <div className="flex-1 min-w-0">
              <Link to={`/tasks/${task.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block">
                {task.title}
              </Link>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : 'Без срока'}</span>
                </div>
                {task.priority && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    task.priority >= 8 ? 'bg-red-100 text-red-800' :
                    task.priority >= 5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Приоритет: {task.priority}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {task.is_overdue && task.status !== 'done' && task.status !== 'cancelled' && (
            <div className="flex items-center space-x-1 text-red-500">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Просрочена</span>
            </div>
          )}
          <select
            value={task.status}
            onChange={handleStatusChange}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-0 ${
              task.status === 'new' ? 'bg-blue-100 text-blue-800' :
              task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              task.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            <option value="new">Новая</option>
            <option value="in_progress">В работе</option>
            <option value="done">Выполнена</option>
            <option value="cancelled">Отменена</option>
          </select>
        </div>
      </div>
    </li>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="px-4 py-4">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

export const EmployeeTasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!user?.employee_profile) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.getTasks({
        assignee: user.employee_profile.id,
        ...filters,
      });
      setTasks(response.results);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      await apiService.updateTask(taskId, { status: newStatus as any });
      await loadTasks(); // Reload tasks to reflect changes
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Не удалось обновить статус задачи. Попробуйте еще раз.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleFilterChange = (key: keyof TaskFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Мои задачи</h1>
              <p className="mt-2 text-sm text-gray-600">
                Управление задачами, назначенными на вас
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Фильтры
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Статус
                    </label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Поиск
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Название задачи..."
                        value={filters.q || ''}
                        onChange={(e) => handleFilterChange('q', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Due Date From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Срок с
                    </label>
                    <input
                      type="date"
                      value={filters.due_date_after || ''}
                      onChange={(e) => handleFilterChange('due_date_after', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Due Date To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Срок по
                    </label>
                    <input
                      type="date"
                      value={filters.due_date_before || ''}
                      onChange={(e) => handleFilterChange('due_date_before', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Очистить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <li key={index}>
                    <LoadingSkeleton />
                  </li>
                ))
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <li className="px-4 py-8 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium">Задачи не найдены</p>
                  <p className="text-sm mt-1">
                    {Object.keys(filters).some(key => filters[key as keyof TaskFilters]) ?
                      'Попробуйте изменить фильтры' :
                      'Вам пока не назначены задачи'
                    }
                  </p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
