import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { Task, TaskFilters, TaskFormData } from '../../types';
import { TaskForm } from './TaskForm';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTasks({
        ...filters,
        q: searchQuery || undefined,
      });
      setTasks(response.results);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: TaskFormData) => {
    try {
      await apiService.createTask(taskData);
      setShowForm(false);
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  };

  const handleUpdateTask = async (taskData: Partial<TaskFormData>) => {
    if (!editingTask) return;

    try {
      await apiService.updateTask(editingTask.id, taskData);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
      await apiService.deleteTask(taskId);
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Debounce search
    setTimeout(() => {
      loadTasks();
    }, 300);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новая';
      case 'in_progress': return 'В работе';
      case 'done': return 'Выполнена';
      case 'cancelled': return 'Отменена';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-8 sm:px-0">
          <div className="text-center mb-12">
            <h1 className="mb-4">Управление задачами</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Создавайте, редактируйте и отслеживайте все задачи в системе с современным интерфейсом
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 group"
            >
              <PlusIcon className="w-6 h-6 mr-3 group-hover:animate-bounce" />
              Создать новую задачу
            </button>
          </div>

          {/* Search and Filters */}
          <div className="card mb-8">
            <div className="px-6 py-8 sm:px-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Поиск задач..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters({...filters, status: e.target.value as any || undefined})}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Все статусы</option>
                    <option value="new">Новая</option>
                    <option value="in_progress">В работе</option>
                    <option value="done">Выполнена</option>
                    <option value="cancelled">Отменена</option>
                  </select>

                  <button
                    onClick={() => setFilters({})}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FunnelIcon className="w-4 h-4 mr-1" />
                    Очистить
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Task Form Modal */}
          {(showForm || editingTask) && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingTask ? 'Редактировать задачу' : 'Создать новую задачу'}
                  </h3>
                  <TaskForm
                    task={editingTask || undefined}
                    onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                    onCancel={() => {
                      setShowForm(false);
                      setEditingTask(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tasks List */}
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
              ) : tasks.length > 0 ? (
                tasks.map((task) => (
                  <li key={task.id} className="px-4 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </p>
                          {task.is_critical && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Критическая
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-500">
                            {task.assignee?.full_name || 'Не назначена'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Срок: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Без срока'}
                          </p>
                          {task.priority && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Приоритет: {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                        {task.is_overdue && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Просрочена
                          </span>
                        )}
                        <div className="flex space-x-2">
                          <Link
                            to={`/tasks/${task.id}`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Просмотреть
                          </Link>
                          <button
                            onClick={() => setEditingTask(task)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center text-gray-500">
                  <p>Задачи не найдены</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Создать первую задачу
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
