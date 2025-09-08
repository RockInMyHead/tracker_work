import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Task, TaskFormData, Employee } from '../../types';
import { apiService } from '../../services/api';

const taskSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  parent: z.string().optional(),
  assignee_id: z.string().optional(),
  due_date: z.string().min(1, 'Срок выполнения обязателен'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['new', 'in_progress', 'done', 'cancelled']),
  priority: z.number().optional(),
});

type TaskFormInputs = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TaskFormInputs>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      parent: task?.parent || '',
      assignee_id: task?.assignee?.id || '',
      due_date: task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      start_date: task?.start_date ? new Date(task.start_date).toISOString().split('T')[0] : '',
      end_date: task?.end_date ? new Date(task.end_date).toISOString().split('T')[0] : '',
      status: task?.status || 'new',
      priority: task?.priority || undefined,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesResponse, tasksResponse] = await Promise.all([
          apiService.getEmployees(),
          apiService.getTasks(),
        ]);

        setEmployees(employeesResponse.results);
        setTasks(tasksResponse.results.filter(t => t.id !== task?.id)); // Exclude current task
      } catch (error) {
        console.error('Failed to load form data:', error);
      }
    };

    loadData();
  }, [task]);

  const handleFormSubmit = async (data: TaskFormInputs) => {
    setIsLoading(true);
    try {
      const formData: TaskFormData = {
        ...data,
        parent: data.parent || undefined,
        assignee_id: data.assignee_id || undefined,
        priority: data.priority || undefined,
      };
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Название *
        </label>
        <input
          {...register('title')}
          type="text"
          id="title"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Введите название задачи"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Описание
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Опишите задачу подробно..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Статус *
        </label>
        <select
          {...register('status')}
          id="status"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="new">Новая</option>
          <option value="in_progress">В работе</option>
          <option value="done">Выполнена</option>
          <option value="cancelled">Отменена</option>
        </select>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="assignee_id" className="block text-sm font-medium text-gray-700">
            Исполнитель
          </label>
          <select
            {...register('assignee_id')}
            id="assignee_id"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Не назначена</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="parent" className="block text-sm font-medium text-gray-700">
            Родительская задача
          </label>
          <select
            {...register('parent')}
            id="parent"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Без родителя</option>
            {tasks.map((parentTask) => (
              <option key={parentTask.id} value={parentTask.id}>
                {parentTask.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Дата начала
          </label>
          <input
            {...register('start_date')}
            type="date"
            id="start_date"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            Дата окончания
          </label>
          <input
            {...register('end_date')}
            type="date"
            id="end_date"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
            Срок выполнения *
          </label>
          <input
            {...register('due_date')}
            type="date"
            id="due_date"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.due_date && (
            <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Приоритет
          </label>
          <input
            {...register('priority', { valueAsNumber: true })}
            type="number"
            id="priority"
            min="1"
            max="10"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="1-10"
          />
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Сохранение...' : (task ? 'Обновить задачу' : 'Создать задачу')}
        </button>
      </div>
    </form>
  );
};
