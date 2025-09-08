import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Employee, EmployeeFormData } from '../../types';

const employeeSchema = z.object({
  full_name: z.string().min(1, 'Полное имя обязательно'),
  position: z.string().min(1, 'Должность обязательна'),
  email: z.string().email('Неверный адрес электронной почты').optional().or(z.literal('')),
  is_active: z.boolean().optional(),
});

type EmployeeFormInputs = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSubmit, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormInputs>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: employee?.full_name || '',
      position: employee?.position || '',
      email: employee?.email || '',
      is_active: employee?.is_active ?? true,
    },
  });

  const handleFormSubmit = async (data: EmployeeFormInputs) => {
    setIsLoading(true);
    try {
      const formData: EmployeeFormData = {
        ...data,
        email: data.email || undefined,
        is_active: data.is_active ?? true,
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
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Полное имя *
        </label>
        <input
          {...register('full_name')}
          type="text"
          id="full_name"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Введите полное имя"
        />
        {errors.full_name && (
          <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
          Должность *
        </label>
        <input
          {...register('position')}
          type="text"
          id="position"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Введите должность"
        />
        {errors.position && (
          <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Введите адрес электронной почты"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          {...register('is_active')}
          type="checkbox"
          id="is_active"
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Активный сотрудник
        </label>
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
          {isLoading ? 'Сохранение...' : (employee ? 'Обновить сотрудника' : 'Создать сотрудника')}
        </button>
      </div>
    </form>
  );
};
