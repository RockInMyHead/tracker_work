import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../../services/api';
import { useIsManager } from '../../hooks/useRole';
import type { GanttData, GanttTask, GanttLink, Task } from '../../types';

interface AdminGanttChartProps {
  className?: string;
}

interface EditTaskData {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
}

export const AdminGanttChart: React.FC<AdminGanttChartProps> = ({ className = '' }) => {
  const isManager = useIsManager();
  const [ganttData, setGanttData] = useState<GanttData>({ tasks: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditTaskData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    assignee: '',
    priority: ''
  });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    due_date: '',
    status: 'new',
    priority: 1
  });
  const [showCreateDependency, setShowCreateDependency] = useState(false);
  const [dependencyData, setDependencyData] = useState({
    predecessor: '',
    successor: '',
    dependency_type: 'finish_to_start',
    lag_days: 0
  });

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isManager) {
      loadGanttData();
    }
  }, [isManager]);

  const loadGanttData = useCallback(async () => {
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
  }, []);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      setSaving(true);

      // Очищаем пустые строки дат, заменяя их на null или undefined
      const cleanUpdates: any = { ...updates };

      if (cleanUpdates.start_date === '') {
        cleanUpdates.start_date = null;
      }

      if (cleanUpdates.end_date === '') {
        cleanUpdates.end_date = null;
      }

      console.log('Updating task with data:', cleanUpdates);

      await apiService.updateTask(taskId, cleanUpdates);
      await loadGanttData(); // Перезагрузка данных
    } catch (err: any) {
      console.error('Failed to update task:', err);
      if (err.response?.data) {
        console.error('Server error details:', err.response.data);
        setError(`Не удалось обновить задачу: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('Не удалось обновить задачу');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

    try {
      await apiService.deleteTask(taskId);
      await loadGanttData();
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Не удалось удалить задачу');
    }
  };

  const handleCreateTask = async () => {
    try {
      setSaving(true);

      // Подготавливаем данные для отправки
      const taskData: any = {
        title: newTaskData.title,
        description: newTaskData.description || '',
        status: newTaskData.status,
        priority: newTaskData.priority
      };

      // Добавляем даты только если они заполнены
      if (newTaskData.start_date) {
        taskData.start_date = newTaskData.start_date;
      }

      if (newTaskData.end_date) {
        taskData.end_date = newTaskData.end_date;
      }

      // due_date - обязательное поле, устанавливаем его
      if (newTaskData.end_date) {
        taskData.due_date = newTaskData.end_date;
      } else if (newTaskData.start_date) {
        // Если есть только start_date, устанавливаем due_date на неделю позже
        const startDate = new Date(newTaskData.start_date);
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + 7);
        taskData.due_date = dueDate.toISOString().split('T')[0];
      } else {
        // Если нет дат вообще, устанавливаем due_date на неделю вперед от сегодня
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 7);
        taskData.due_date = dueDate.toISOString().split('T')[0];
      }

      console.log('Creating task with data:', taskData);

      await apiService.createTask(taskData);

      setNewTaskData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        due_date: '',
        status: 'new',
        priority: 1
      });
      setShowCreateTask(false);
      await loadGanttData();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      if (err.response?.data) {
        console.error('Server error details:', err.response.data);
        setError(`Не удалось создать задачу: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('Не удалось создать задачу');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDependency = async () => {
    try {
      setSaving(true);
      await apiService.createTaskDependency(
        dependencyData.predecessor,
        dependencyData.successor,
        dependencyData.dependency_type,
        dependencyData.lag_days
      );

      setDependencyData({
        predecessor: '',
        successor: '',
        dependency_type: 'finish_to_start',
        lag_days: 0
      });
      setShowCreateDependency(false);
      await loadGanttData();
    } catch (err) {
      console.error('Failed to create dependency:', err);
      setError('Не удалось создать зависимость');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (task: GanttTask) => {
    setEditingTask(task.id);
    setEditData({
      id: task.id,
      start_date: task.start_date ? task.start_date.split('T')[0] : '',
      end_date: task.end_date ? task.end_date.split('T')[0] : '',
      status: task.status
    });
  };

  const saveEditing = async () => {
    if (!editData) return;

    const updates: any = {
      status: editData.status
    };

    if (editData.start_date) {
      updates.start_date = editData.start_date;
    }

    if (editData.end_date) {
      updates.end_date = editData.end_date;
    }

    await handleTaskUpdate(editData.id, updates);
    setEditingTask(null);
    setEditData(null);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditData(null);
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

  // Фильтрация задач
  const filteredTasks = ganttData.tasks.filter(task => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.assignee && task.assignee !== filters.assignee) return false;
    return true;
  });

  const allTasks = ganttData.tasks;

  // Группировка задач по исполнителям
  const tasksByAssignee = filteredTasks.reduce((acc, task) => {
    const assignee = task.assignee || 'Не назначен';
    if (!acc[assignee]) {
      acc[assignee] = [];
    }
    acc[assignee].push(task);
    return acc;
  }, {} as Record<string, GanttTask[]>);

  // Если пользователь не менеджер, показываем обычную диаграмму
  if (!isManager) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">
          Расширенные возможности диаграммы Ганта доступны только администраторам
        </div>
      </div>
    );
  }

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

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header с инструментами администратора */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Управление диаграммой Ганта</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md"
            >
              Фильтры
            </button>
            <button
              onClick={() => setShowCreateTask(!showCreateTask)}
              className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md"
            >
              + Задача
            </button>
            <button
              onClick={() => setShowCreateDependency(!showCreateDependency)}
              className="px-3 py-1 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md"
            >
              + Связь
            </button>
            <button
              onClick={loadGanttData}
              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
              disabled={saving}
            >
              {saving ? 'Обновление...' : 'Обновить'}
            </button>
          </div>
        </div>

        {/* Фильтры */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Все статусы</option>
                  <option value="new">Новая</option>
                  <option value="in_progress">В работе</option>
                  <option value="done">Выполнена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
                <input
                  type="text"
                  value={filters.assignee}
                  onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                  placeholder="Имя исполнителя"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Все приоритеты</option>
                  <option value="1">Низкий</option>
                  <option value="2">Средний</option>
                  <option value="3">Высокий</option>
                  <option value="4">Критический</option>
                  <option value="5">Экстренный</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Форма создания новой задачи */}
        {showCreateTask && (
          <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
            <h3 className="text-md font-medium text-green-900 mb-3">Создание новой задачи</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Название задачи"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <input
                  type="text"
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Описание задачи"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
                <input
                  type="date"
                  value={newTaskData.start_date}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                <input
                  type="date"
                  value={newTaskData.end_date}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                <select
                  value={newTaskData.status}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="new">Новая</option>
                  <option value="in_progress">В работе</option>
                  <option value="done">Выполнена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                <select
                  value={newTaskData.priority}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value={1}>Низкий</option>
                  <option value={2}>Средний</option>
                  <option value={3}>Высокий</option>
                  <option value={4}>Критический</option>
                  <option value={5}>Экстренный</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateTask(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTask}
                disabled={saving || !newTaskData.title.trim()}
                className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Создание...' : 'Создать задачу'}
              </button>
            </div>
          </div>
        )}

        {/* Форма создания зависимости */}
        {showCreateDependency && (
          <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
            <h3 className="text-md font-medium text-purple-900 mb-3">Создание связи между задачами</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Предыдущая задача</label>
                <select
                  value={dependencyData.predecessor}
                  onChange={(e) => setDependencyData(prev => ({ ...prev, predecessor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Выберите задачу</option>
                  {allTasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.text}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Следующая задача</label>
                <select
                  value={dependencyData.successor}
                  onChange={(e) => setDependencyData(prev => ({ ...prev, successor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Выберите задачу</option>
                  {allTasks.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.text}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип связи</label>
                <select
                  value={dependencyData.dependency_type}
                  onChange={(e) => setDependencyData(prev => ({ ...prev, dependency_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="finish_to_start">Конец → Начало</option>
                  <option value="start_to_start">Начало → Начало</option>
                  <option value="finish_to_finish">Конец → Конец</option>
                  <option value="start_to_finish">Начало → Конец</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Задержка (дни)</label>
                <input
                  type="number"
                  value={dependencyData.lag_days}
                  onChange={(e) => setDependencyData(prev => ({ ...prev, lag_days: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  min="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateDependency(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateDependency}
                disabled={saving || !dependencyData.predecessor || !dependencyData.successor}
                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Создание...' : 'Создать связь'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div ref={chartRef} className="overflow-x-auto">
          <AdminSimpleGanttChart
            tasksByAssignee={tasksByAssignee}
            selectedTask={selectedTask}
            editingTask={editingTask}
            editData={editData}
            onTaskSelect={setSelectedTask}
            onTaskEdit={startEditing}
            onTaskDelete={handleTaskDelete}
            onEditSave={saveEditing}
            onEditCancel={cancelEditing}
            onEditDataChange={setEditData}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </div>
      </div>
    </div>
  );
};

// Расширенная версия SimpleGanttChart для администраторов
interface AdminSimpleGanttChartProps {
  tasksByAssignee: Record<string, GanttTask[]>;
  selectedTask: string | null;
  editingTask: string | null;
  editData: EditTaskData | null;
  onTaskSelect: (taskId: string | null) => void;
  onTaskEdit: (task: GanttTask) => void;
  onTaskDelete: (taskId: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditDataChange: (data: EditTaskData | null) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

const AdminSimpleGanttChart: React.FC<AdminSimpleGanttChartProps> = ({
  tasksByAssignee,
  selectedTask,
  editingTask,
  editData,
  onTaskSelect,
  onTaskEdit,
  onTaskDelete,
  onEditSave,
  onEditCancel,
  onEditDataChange,
  getStatusColor,
  getStatusText
}) => {
  // Собираем все даты для временной шкалы
  const allTasks = Object.values(tasksByAssignee).flat();
  const allDates = allTasks.flatMap(task => [
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
          <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center justify-between">
            <span>{assignee}</span>
            <span className="text-sm text-gray-500">({assigneeTasks.length} задач)</span>
          </h3>

          {/* Временная шкала */}
          <div className="flex mb-2 text-xs text-gray-500 border-b pb-2">
            <div className="w-64 flex-shrink-0">Задача</div>
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
              const isEditing = editingTask === task.id;

              return (
                <div
                  key={task.id}
                  className={`group ${isSelected ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'hover:bg-gray-50'} rounded p-2`}
                >
                  <div className="flex items-center">
                    {/* Название и статус задачи */}
                    <div className="w-64 flex-shrink-0 pr-4">
                      {isEditing && editData ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={task.text}
                            readOnly
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100"
                          />
                          <select
                            value={editData.status}
                            onChange={(e) => onEditDataChange({ ...editData, status: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="new">Новая</option>
                            <option value="in_progress">В работе</option>
                            <option value="done">Выполнена</option>
                            <option value="cancelled">Отменена</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {task.text}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center space-x-2">
                            <span>{getStatusText(task.status)}</span>
                            {task.priority && (
                              <span className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                                Приоритет: {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Диаграмма */}
                    <div className="flex-1 relative h-8 bg-gray-100 rounded">
                      {position && (
                        <div
                          className="absolute top-1 bottom-1 rounded flex items-center justify-center text-xs font-medium text-white cursor-pointer"
                          style={{
                            left: position.left,
                            width: position.width,
                            backgroundColor: getStatusColor(task.status),
                          }}
                          onClick={() => onTaskSelect(isSelected ? null : task.id)}
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

                      {/* Кнопки действий для администраторов */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onTaskEdit(task)}
                            className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onTaskDelete(task.id)}
                            className="p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Детали выбранной задачи */}
                  {isSelected && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
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
                  )}

                  {/* Форма редактирования дат */}
                  {isEditing && editData && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Редактирование дат</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-blue-700 mb-1">Дата начала</label>
                          <input
                            type="date"
                            value={editData.start_date}
                            onChange={(e) => onEditDataChange({ ...editData, start_date: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-blue-700 mb-1">Дата окончания</label>
                          <input
                            type="date"
                            value={editData.end_date}
                            onChange={(e) => onEditDataChange({ ...editData, end_date: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={onEditCancel}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={onEditSave}
                          className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Легенда */}
      <div className="flex flex-wrap gap-4 text-sm mt-6 p-4 bg-gray-50 rounded-lg">
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
    </div>
  );
};
