import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../services/auth';

// Constants
const loginSchema = z.object({
  username: z.string().min(1, 'Имя пользователя обязательно'),
  password: z.string().min(1, 'Пароль обязателен'),
});

const TEST_CREDENTIALS = [
  { role: 'Администратор', username: 'admin', password: 'admin123' },
  { role: 'Сотрудник', username: 'employee1', password: 'employee123' },
];

const INPUT_CLASSES = 'block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors';

const BUTTON_CLASSES = 'w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200';

type LoginFormData = z.infer<typeof loginSchema>;

// Background animation component
const AnimatedBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full opacity-30"></div>
    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400 rounded-full opacity-30"></div>
    <div className="absolute top-40 left-40 w-72 h-72 bg-indigo-400 rounded-full opacity-30"></div>
  </div>
);

// Test credentials component
const TestCredentials: React.FC = () => (
  <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
    <div className="flex items-center mb-4">
      <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">Тестовые учетные данные</p>
        <p className="text-xs text-gray-600">Используйте для демонстрации</p>
      </div>
    </div>
    <div className="space-y-3">
      {TEST_CREDENTIALS.map((cred, index) => (
        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${cred.role === 'Администратор' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
            <span className="text-sm font-medium text-gray-700">{cred.role}:</span>
          </div>
          <code className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {cred.username} / {cred.password}
          </code>
        </div>
      ))}
    </div>
  </div>
);

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = useCallback(async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Ошибка входа в систему');
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
            {/* Logo and branding */}
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Добро пожаловать
              </h2>
              <p className="text-gray-600">
                Войдите в свою учетную запись
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Имя пользователя
                  </label>
                <input
                  {...register('username')}
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={INPUT_CLASSES}
                  placeholder="Введите имя пользователя"
                />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Пароль
                  </label>
                <input
                  {...register('password')}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={INPUT_CLASSES}
                  placeholder="Введите пароль"
                />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                </div>
              )}

              <div>
              <button
                type="submit"
                disabled={isLoading}
                className={BUTTON_CLASSES}
              >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Вход в систему...
                    </div>
                  ) : (
                    'Войти'
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Нет аккаунта?{' '}
                  <a href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Зарегистрироваться
                  </a>
                </p>
              </div>

            <TestCredentials />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
