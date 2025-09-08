import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/auth';
import { Header } from './components/common/Header';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Dashboard } from './components/dashboard/Dashboard';
import { TasksPage } from './components/tasks/TasksPage';
import { TaskDetailPage } from './components/tasks/TaskDetailPage';
import { EmployeesPage } from './components/employees/EmployeesPage';
import { WorkloadPage } from './components/dashboard/WorkloadPage';
import { ImportantTasksPage } from './components/dashboard/ImportantTasksPage';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { EmployeeTasksPage } from './components/employee/EmployeeTasksPage';
import { EmployeeHeader } from './components/employee/EmployeeHeader';
import { useRole } from './hooks/useRole';

// Simple test component
const TestComponent: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="bg-green-500 text-white p-8 rounded-xl text-center max-w-md w-full shadow-lg">
      <h1 className="text-3xl font-bold mb-4">✅ React работает!</h1>
      <p className="mb-4">Компоненты загружаются корректно</p>
      <div className="bg-blue-500 text-white p-4 rounded-lg">
        Tailwind CSS и стили функционируют
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-purple-500 text-white p-3 rounded">Фиолетовый</div>
        <div className="bg-red-500 text-white p-3 rounded">Красный</div>
      </div>
    </div>
  </div>
);

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <TestComponent />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// App Routes component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const role = useRole();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Choose header based on role
  const HeaderComponent = role === 'manager' ? Header : EmployeeHeader;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Simple background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 -z-10"></div>

      <div className="relative z-10">
        <HeaderComponent
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      <div className="relative z-10">
        <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterForm />}
        />
        <Route
          path="/test-styles"
          element={<TestComponent />}
        />
        <Route
          path="/style-test"
          element={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full space-y-6">
                <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
                  Тест стилей Tailwind CSS
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-500 text-white p-6 rounded-xl shadow-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">Синий блок</h3>
                    <p>bg-blue-500 с белым текстом</p>
                  </div>

                  <div className="bg-green-500 text-white p-6 rounded-xl shadow-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">Зеленый блок</h3>
                    <p>bg-green-500 с белым текстом</p>
                  </div>

                  <div className="bg-purple-500 text-white p-6 rounded-xl shadow-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">Фиолетовый блок</h3>
                    <p>bg-purple-500 с белым текстом</p>
                  </div>

                  <div className="bg-red-500 text-white p-6 rounded-xl shadow-lg text-center">
                    <h3 className="text-xl font-semibold mb-2">Красный блок</h3>
                    <p>bg-red-500 с белым текстом</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Кнопки и интерактивные элементы</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors">
                      Синяя кнопка (hover эффект)
                    </button>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-all transform hover:scale-105">
                      Зеленая кнопка (hover + scale)
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Формы</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Текстовое поле"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <textarea
                      placeholder="Текстовое поле"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-600">
                    Если все элементы выше отображаются корректно со стилями, значит Tailwind CSS работает правильно!
                  </p>
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/test-api"
          element={
            <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc'}}>
              <div style={{backgroundColor: '#ffffff', padding: '2rem', borderRadius: '1rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
                <h1 style={{color: '#1e293b', marginBottom: '1rem'}}>Тест API подключения</h1>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          username: 'admin',
                          password: 'admin123'
                        })
                      });
                      alert(`Статус: ${response.status}\nCORS работает!`);
                    } catch (error) {
                      alert(`Ошибка: ${error.message}`);
                    }
                  }}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Тестировать API
                </button>
              </div>
            </div>
          }
        />

        {/* Protected routes - Manager only */}
        {role === 'manager' && (
          <>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:taskId"
              element={
                <ProtectedRoute>
                  <TaskDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <EmployeesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workload"
              element={
                <ProtectedRoute>
                  <WorkloadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/important"
              element={
                <ProtectedRoute>
                  <ImportantTasksPage />
                </ProtectedRoute>
              }
            />
          </>
        )}

        {/* Protected routes - Employee only */}
        {role === 'employee' && (
          <>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-tasks"
              element={
                <ProtectedRoute>
                  <EmployeeTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:taskId"
              element={
                <ProtectedRoute>
                  <TaskDetailPage />
                </ProtectedRoute>
              }
            />
          </>
        )}

        {/* Redirect root to dashboard or login */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;