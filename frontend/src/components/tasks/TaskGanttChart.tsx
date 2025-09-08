import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../services/auth';
import { useIsManager } from '../../hooks/useRole';
import type { Task } from '../../types';

interface TaskGanttChartProps {
  taskId: string;
  className?: string;
}

export const TaskGanttChart: React.FC<TaskGanttChartProps> = ({ taskId, className = '' }) => {
  const { user } = useAuth();
  const isManager = useIsManager();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const loadTaskData = useCallback(async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      setError(null);

      // Загружаем основную задачу
      const taskData = await apiService.getTask(taskId);
      setTask(taskData);

      // Инициализируем значения для редактирования
      if (taskData.start_date) {
        setEditStartDate(taskData.start_date.split('T')[0]);
      }
      if (taskData.end_date) {
        setEditEndDate(taskData.end_date.split('T')[0]);
      }
      if (taskData.due_date) {
        setEditDueDate(taskData.due_date.split('T')[0]);
      }
    } catch (err) {
      console.error('Failed to load task data for Gantt:', err);
      setError('Не удалось загрузить данные задачи');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTaskData();
  }, [loadTaskData]);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Восстанавливаем исходные значения
    if (task?.start_date) {
      setEditStartDate(task.start_date.split('T')[0]);
    }
    if (task?.end_date) {
      setEditEndDate(task.end_date.split('T')[0]);
    }
    if (task?.due_date) {
      setEditDueDate(task.due_date.split('T')[0]);
    }
  };

  const handleSaveChanges = async () => {
    if (!task) return;

    try {
      setSaving(true);

      const updateData: any = {};

      if (editStartDate) {
        updateData.start_date = new Date(editStartDate).toISOString().split('T')[0];
      } else {
        updateData.start_date = null;
      }

      if (editEndDate) {
        updateData.end_date = new Date(editEndDate).toISOString().split('T')[0];
      } else {
        updateData.end_date = null;
      }

      if (editDueDate) {
        updateData.due_date = new Date(editDueDate).toISOString().split('T')[0];
      } else {
        updateData.due_date = null;
      }

      await apiService.updateTask(task.id, updateData);

      // Перезагружаем данные
      await loadTaskData();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save task dates:', err);
      setError('Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return '#10B981'; // green
      case 'in_progress':
        return '#3B82F6'; // blue
      case 'cancelled':
        return '#EF4444'; // red
      case 'new':
      default:
        return '#6B7280'; // gray
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Новая';
      case 'in_progress':
        return 'В работе';
      case 'done':
        return 'Выполнена';
      case 'cancelled':
        return 'Отменена';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="text-center text-sm text-red-600">
          ⚠️ {error}
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="text-center text-sm text-gray-500">
          Задача не найдена
        </div>
      </div>
    );
  }

  // Проверяем, есть ли даты для отображения диаграммы
  const hasDates = task.start_date && task.end_date;

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Диаграмма Ганта</h4>
        <div className="flex items-center space-x-2">
          {isManager && !isEditing && (
            <button
              onClick={handleStartEdit}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
            >
              Редактировать
            </button>
          )}
          {isEditing && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-2 py-1 rounded disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          )}
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded"
          >
            {showChart ? 'Скрыть' : 'Показать'}
          </button>
        </div>
      </div>

      {showChart && (
        <div className="space-y-3">
          {!hasDates && !isEditing ? (
            <div className="text-center py-8 text-sm text-gray-500">
              <div className="mb-2">Диаграмма Ганта недоступна</div>
              <div className="text-xs text-gray-400">
                Добавьте даты начала и окончания к задаче
              </div>
            </div>
          ) : (
            (() => {
              // Определяем прогресс на основе статуса
              let progress = 0;
              if (task.status === 'done') progress = 100;
              else if (task.status === 'in_progress') progress = 50;
              else if (task.status === 'cancelled') progress = 0;

              // Определяем цвет задачи
              const taskColor = getStatusColor(task.status);

              return (
                <div className="bg-white rounded p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: taskColor }}
                      ></div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {getStatusText(task.status)}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Дата начала</label>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Дата окончания</label>
                          <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Дедлайн</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : hasDates ? (
                    <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                      <span>Начало: {new Date(task.start_date!).toLocaleDateString('ru-RU')}</span>
                      <span>Окончание: {new Date(task.end_date!).toLocaleDateString('ru-RU')}</span>
                      {task.due_date && (
                        <span>Дедлайн: {new Date(task.due_date).toLocaleDateString('ru-RU')}</span>
                      )}
                    </div>
                  ) : null}

                  {/* Прогресс бар */}
                  {hasDates && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: taskColor
                          }}
                        ></div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Прогресс: {progress}%
                      </div>
                    </>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
};
