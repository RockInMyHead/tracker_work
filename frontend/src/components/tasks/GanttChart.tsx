import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { useIsManager } from '../../hooks/useRole';
import { AdminGanttChart } from './AdminGanttChart';
import type { GanttData, GanttTask, GanttLink } from '../../types';

interface GanttChartProps {
  className?: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({ className = '' }) => {
  const isManager = useIsManager();

  // Если пользователь - менеджер, показываем расширенную версию
  if (isManager) {
    return <AdminGanttChart className={className} />;
  }

  // Для обычных пользователей показываем обычную версию
  const [ganttData, setGanttData] = useState<GanttData>({ tasks: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGanttData();
  }, []);

  const loadGanttData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getGanttData();
      setGanttData(data);
    } catch (err) {
      console.error('Failed to load Gantt data:', err);
      setError('Не удалось загрузить данные диаграммы Ганта');
    } finally {
      setLoading(false);
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
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-2">⚠️ {error}</div>
          <button
            onClick={loadGanttData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (ganttData.tasks.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных для диаграммы Ганта</h3>
          <p className="text-gray-500">
            Добавьте даты начала и окончания к задачам, чтобы увидеть диаграмму
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Диаграмма Ганта</h2>
          <button
            onClick={loadGanttData}
            className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
          >
            Обновить
          </button>
        </div>
      </div>

      <div className="p-6">
        <div ref={chartRef} className="overflow-x-auto">
          <SimpleGanttChart
            tasks={ganttData.tasks}
            links={ganttData.links}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </div>
      </div>
    </div>
  );
};

// Простая реализация диаграммы Ганта без внешних зависимостей
interface SimpleGanttChartProps {
  tasks: GanttTask[];
  links: GanttLink[];
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

const SimpleGanttChart: React.FC<SimpleGanttChartProps> = ({
  tasks,
  links,
  getStatusColor,
  getStatusText
}) => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Группируем задачи по исполнителям
  const tasksByAssignee = tasks.reduce((acc, task) => {
    const assignee = task.assignee || 'Не назначен';
    if (!acc[assignee]) {
      acc[assignee] = [];
    }
    acc[assignee].push(task);
    return acc;
  }, {} as Record<string, GanttTask[]>);

  // Находим минимальную и максимальную даты
  const allDates = tasks.flatMap(task => [
    task.start_date ? new Date(task.start_date) : null,
    task.end_date ? new Date(task.end_date) : null
  ]).filter(date => date !== null) as Date[];

  if (allDates.length === 0) {
    return <div className="text-center text-gray-500 py-8">Нет дат для отображения</div>;
  }

  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Создаем временную шкалу (месяцы)
  const months: Date[] = [];
  let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  while (currentDate <= maxDate) {
    months.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const getTaskPosition = (task: GanttTask) => {
    if (!task.start_date || !task.end_date) return null;

    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
    const taskDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    const left = ((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
    const width = (taskDays / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  return (
    <div className="space-y-6">
      {Object.entries(tasksByAssignee).map(([assignee, assigneeTasks]) => (
        <div key={assignee} className="border rounded-lg p-4">
          <h3 className="text-md font-medium text-gray-900 mb-4">{assignee}</h3>

          {/* Временная шкала */}
          <div className="flex mb-2 text-xs text-gray-500 border-b pb-2">
            <div className="w-48 flex-shrink-0">Задача</div>
            <div className="flex-1 flex">
              {months.map((month, index) => (
                <div key={index} className="flex-1 text-center">
                  {month.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })}
                </div>
              ))}
            </div>
          </div>

          {/* Задачи */}
          <div className="space-y-2">
            {assigneeTasks.map((task) => {
              const position = getTaskPosition(task);
              const isSelected = selectedTask === task.id;

              return (
                <div
                  key={task.id}
                  className={`flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded ${
                    isSelected ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''
                  }`}
                  onClick={() => setSelectedTask(isSelected ? null : task.id)}
                >
                  {/* Название задачи */}
                  <div className="w-48 flex-shrink-0 pr-4">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {task.text}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getStatusText(task.status)}
                    </div>
                  </div>

                  {/* Диаграмма */}
                  <div className="flex-1 relative h-8 bg-gray-100 rounded">
                    {position && (
                      <div
                        className="absolute top-1 bottom-1 rounded flex items-center justify-center text-xs font-medium text-white"
                        style={{
                          left: position.left,
                          width: position.width,
                          backgroundColor: task.color,
                        }}
                        title={`${task.text} (${task.start_date} - ${task.end_date})`}
                      >
                        {task.progress > 0 && (
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-black bg-opacity-20 rounded"
                            style={{ width: `${task.progress}%` }}
                          />
                        )}
                        <span className="relative z-10 truncate px-1">
                          {task.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Легенда */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
          <span>Новая</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span>В работе</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span>Выполнена</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span>Отменена</span>
        </div>
      </div>

      {/* Детали выбранной задачи */}
      {selectedTask && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          {(() => {
            const task = tasks.find(t => t.id === selectedTask);
            if (!task) return null;

            return (
              <div>
                <h4 className="font-medium text-indigo-900 mb-2">{task.text}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Статус:</span>
                    <div className="font-medium">{getStatusText(task.status)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Прогресс:</span>
                    <div className="font-medium">{task.progress}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Начало:</span>
                    <div className="font-medium">
                      {task.start_date ? new Date(task.start_date).toLocaleDateString('ru-RU') : 'Не указано'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Окончание:</span>
                    <div className="font-medium">
                      {task.end_date ? new Date(task.end_date).toLocaleDateString('ru-RU') : 'Не указано'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
