import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../services/auth';
import type { Task, EmployeeWorkload } from '../../types';
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

// Types
interface EmployeeStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  hoverColorClass: string;
  isLoading: boolean;
}

// Constants
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

const EMPLOYEE_STAT_CARDS = [
  {
    key: 'totalTasks' as keyof EmployeeStats,
    title: 'Всего задач',
    icon: ClipboardDocumentListIcon,
    colorClass: 'from-blue-500 to-blue-600',
    hoverColorClass: 'text-blue-600',
  },
  {
    key: 'activeTasks' as keyof EmployeeStats,
    title: 'Активные задачи',
    icon: ClockIcon,
    colorClass: 'from-yellow-500 to-yellow-600',
    hoverColorClass: 'text-yellow-600',
  },
  {
    key: 'completedTasks' as keyof EmployeeStats,
    title: 'Выполненные',
    icon: CheckCircleIcon,
    colorClass: 'from-green-500 to-green-600',
    hoverColorClass: 'text-green-600',
  },
  {
    key: 'overdueTasks' as keyof EmployeeStats,
    title: 'Просроченные',
    icon: ExclamationTriangleIcon,
    colorClass: 'from-red-500 to-red-600',
    hoverColorClass: 'text-red-600',
  },
];

// Sub-components
const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, hoverColorClass, isLoading }) => (
  <div className="stat-card p-6 group">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
      <div className="ml-6 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-600 truncate mb-2">
            {title}
          </dt>
          <dd className={`text-4xl font-bold text-gray-900 group-hover:${hoverColorClass} transition-all duration-300`}>
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              value.toLocaleString()
            )}
          </dd>
        </dl>
      </div>
    </div>
  </div>
);

const TaskItem: React.FC<{ task: Task; onStatusChange: (taskId: string, newStatus: string) => void }> = ({ task, onStatusChange }) => {
  const statusText = STATUS_TEXT_MAP[task.status as keyof typeof STATUS_TEXT_MAP] || task.status;
  const statusColor = STATUS_COLOR_MAP[task.status as keyof typeof STATUS_COLOR_MAP] || 'bg-gray-100 text-gray-800';

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    onStatusChange(task.id, newStatus);
  };

  return (
    <li className="px-6 py-5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              task.status === 'new' ? 'bg-blue-500' :
              task.status === 'in_progress' ? 'bg-yellow-500' :
              task.status === 'done' ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {task.title}
              </p>
              <p className="text-sm text-gray-600">
                {task.due_date || 'Без срока'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
          {task.is_overdue && (
            <div className="flex items-center space-x-1 text-red-500">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Просрочена</span>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

const LoadingSkeleton: React.FC = () => (
  <li className="px-4 py-4">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </li>
);

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmployeeStats>({
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const loadEmployeeData = useCallback(async () => {
    if (!user?.employee_profile) return;

    try {
      setIsLoading(true);
      const [tasksResponse, workloadResponse] = await Promise.all([
        apiService.getTasks({ assignee: user.employee_profile.id }),
        apiService.getEmployeeWorkload(user.employee_profile.id),
      ]);

      const tasks = tasksResponse.results;
      setMyTasks(tasks);

      // Calculate stats
      const totalTasks = tasks.length;
      const activeTasks = tasks.filter(task => task.status === 'new' || task.status === 'in_progress').length;
      const completedTasks = tasks.filter(task => task.status === 'done').length;
      const overdueTasks = tasks.filter(task => task.is_overdue && (task.status === 'new' || task.status === 'in_progress')).length;

      setStats({
        totalTasks,
        activeTasks,
        completedTasks,
        overdueTasks,
      });
    } catch (error) {
      console.error('Failed to load employee data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      await apiService.updateTask(taskId, { status: newStatus as any });
      await loadEmployeeData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Не удалось обновить статус задачи. Попробуйте еще раз.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="px-4 py-8 sm:px-0">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="mb-6 text-4xl font-bold text-gray-900">
              Добро пожаловать, {user?.first_name || user?.username}!
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Здесь вы можете отслеживать свои задачи и управлять их статусом
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-16">
            {EMPLOYEE_STAT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <StatCard
                  key={card.key}
                  title={card.title}
                  value={stats[card.key]}
                  icon={Icon}
                  colorClass={card.colorClass}
                  hoverColorClass={card.hoverColorClass}
                  isLoading={isLoading}
                />
              );
            })}
          </div>

          {/* My Tasks */}
          <div className="card">
            <div className="px-8 py-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Мои задачи
                  </h3>
                  <p className="text-gray-600">
                    Задачи, назначенные на вас
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <ul className="divide-y divide-gray-200">
              {isLoading ? (
                <LoadingSkeleton />
              ) : myTasks.length > 0 ? (
                myTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                  />
                ))
              ) : (
                <li className="px-8 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClipboardDocumentListIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">У вас нет задач</p>
                  <p className="text-sm text-gray-400 mt-1">Ваши задачи появятся здесь, когда менеджер их назначит</p>
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};
