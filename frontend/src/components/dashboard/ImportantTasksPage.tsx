import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import * as Types from '../../types';
import { ExclamationTriangleIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

export const ImportantTasksPage: React.FC = () => {
  const [importantTasks, setImportantTasks] = useState<Types.ImportantTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImportantTasks = async () => {
      try {
        setLoading(true);
        const data = await apiService.getImportantTasks();
        setImportantTasks(data);
      } catch (error) {
        console.error('Failed to load important tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImportantTasks();
  }, []);

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'least_loaded':
        return 'bg-green-100 text-green-800';
      case 'parent_assignee_within_threshold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatReason = (reason: string) => {
    switch (reason) {
      case 'least_loaded':
        return 'Наименее загружен';
      case 'parent_assignee_within_threshold':
        return 'Исполнитель родителя';
      default:
        return reason.replace('_', ' ');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Критические задачи</h1>
            <p className="mt-2 text-sm text-gray-600">
              Задачи, требующие немедленного внимания, с интеллектуальными рекомендациями исполнителей
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white shadow rounded-lg p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : importantTasks.length > 0 ? (
            <div className="space-y-6">
              {importantTasks.map((task) => (
                <div key={task.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {task.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-sm text-gray-500">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              Срок: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Без срока'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Критическая
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Рекомендованные исполнители ({task.recommended_employees.length})
                    </h4>
                    {task.recommended_employees.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {task.recommended_employees.map((employee, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {employee.full_name}
                              </p>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getReasonColor(employee.reason)}`}>
                                {formatReason(employee.reason)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Рекомендации недоступны</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Нет важных задач</h3>
              <p className="mt-1 text-sm text-gray-500">
                Нет критических задач, требующих немедленного внимания.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
