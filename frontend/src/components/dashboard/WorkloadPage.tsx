import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { EmployeeWorkload } from '../../types';
import { ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';

export const WorkloadPage: React.FC = () => {
  const [workload, setWorkload] = useState<EmployeeWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkload = async () => {
      try {
        setLoading(true);
        const data = await apiService.getWorkload();
        setWorkload(data);
      } catch (error) {
        console.error('Failed to load workload:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkload();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkloadLevel = (count: number) => {
    if (count === 0) return { level: 'Свободен', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (count <= 2) return { level: 'Легкая', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (count <= 5) return { level: 'Средняя', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Высокая', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Обзор нагрузки команды</h1>
            <p className="mt-2 text-sm text-gray-600">
              Мониторинг текущей нагрузки сотрудников и распределения активных задач
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white shadow rounded-lg p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : workload.length > 0 ? (
            <div className="space-y-6">
              {workload.map((employee) => {
                const workloadInfo = getWorkloadLevel(employee.active_tasks_count);
                return (
                  <div key={employee.employee_id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {employee.full_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {employee.active_tasks_count} активных задач
                            </p>
                          </div>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${workloadInfo.bgColor} ${workloadInfo.color}`}>
                          <ChartBarIcon className="w-4 h-4 mr-1" />
                          {workloadInfo.level} нагрузка
                        </div>
                      </div>
                    </div>

                    {employee.tasks.length > 0 && (
                      <div className="px-6 py-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Активные задачи</h4>
                        <div className="space-y-2">
                          {employee.tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {task.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Срок: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Без срока'}
                                </p>
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)} ml-3`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Нет данных о нагрузке</h3>
              <p className="mt-1 text-sm text-gray-500">
                В настоящее время нет сотрудников с активными задачами.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
