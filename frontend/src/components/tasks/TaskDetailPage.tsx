import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { useAuth } from '../../services/auth';
import { useIsManager } from '../../hooks/useRole';
import { GanttChart } from './GanttChart';
import { TaskGanttChart } from './TaskGanttChart';
import { AdminGanttChart } from './AdminGanttChart';
import type { Task, TaskImage, TaskMessage } from '../../types';

interface TaskDetailPageProps {}

export const TaskDetailPage: React.FC<TaskDetailPageProps> = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = useIsManager();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'chat' | 'gantt'>('details');
  const [adminMode, setAdminMode] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<TaskImage[]>([]);
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadTask = useCallback(async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const taskData = await apiService.getTask(taskId);
      setTask(taskData);
    } catch (error) {
      console.error('Failed to load task:', error);
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate]);

  const loadImages = useCallback(async () => {
    if (!taskId) return;

    try {
      setLoadingImages(true);
      const imagesData = await apiService.getTaskImages(taskId);
      setImages(imagesData.results);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoadingImages(false);
    }
  }, [taskId]);

  const loadMessages = useCallback(async () => {
    if (!taskId) return;

    try {
      setLoadingMessages(true);
      const messagesData = await apiService.getTaskMessages(taskId);
      setMessages(messagesData.results);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  useEffect(() => {
    if (activeTab === 'images' && images.length === 0) {
      loadImages();
    }
  }, [activeTab, images.length, loadImages]);

  useEffect(() => {
    if (activeTab === 'chat' && messages.length === 0) {
      loadMessages();
    }
  }, [activeTab, messages.length, loadMessages]);

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      await apiService.updateTask(task.id, { status: newStatus as any });
      await loadTask(); // Reload task data
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Не удалось обновить статус задачи');
    }
  };

  const handleSendMessage = async () => {
    if (!task || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const newMessageData = await apiService.createTaskMessage(task.id, newMessage.trim());
      setMessages(prev => [...prev, newMessageData]); // Add new message to local state
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Не удалось отправить сообщение');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!task || !file) return;

    const formData = new FormData();
    formData.append('task', task.id);
    formData.append('image', file);
    formData.append('caption', ''); // Can be extended to allow user input

    try {
      setUploadingImage(true);
      const newImageData = await apiService.createTaskImage(task.id, formData);
      setImages(prev => [...prev, newImageData]); // Add new image to local state
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Не удалось загрузить изображение');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это изображение?')) return;

    try {
      await apiService.deleteTaskImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId)); // Remove from local state
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Не удалось удалить изображение');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новая';
      case 'in_progress': return 'В работе';
      case 'done': return 'Выполнена';
      case 'cancelled': return 'Отменена';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Задача не найдена</h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Вернуться к списку задач
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/tasks')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{task.title}</h1>
                <p className="text-sm text-gray-500">Задача #{task.id.slice(-8)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {task.is_overdue && task.status !== 'done' && task.status !== 'cancelled' && (
                <div className="flex items-center text-red-600">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Просрочена</span>
                </div>
              )}

              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getStatusColor(task.status)}`}
              >
                <option value="new">Новая</option>
                <option value="in_progress">В работе</option>
                <option value="done">Выполнена</option>
                <option value="cancelled">Отменена</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Детали
                  </button>
                  <button
                    onClick={() => setActiveTab('images')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'images'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <PhotoIcon className="h-4 w-4 inline mr-1" />
                    Изображения ({images.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'chat'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                    Чат ({messages.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('gantt')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === 'gantt'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <ChartBarIcon className="h-4 w-4 inline mr-1" />
                    Диаграмма Ганта
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Описание</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        {task.description ? (
                          <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                        ) : (
                          <p className="text-gray-500 italic">Описание не указано</p>
                        )}
                      </div>
                    </div>

                    {/* Task Gantt Chart */}
                    <TaskGanttChart taskId={task.id} />

                    {/* Task Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Информация о задаче</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">Создано:</span>
                            <span className="ml-2 text-gray-900">
                              {new Date(task.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">Обновлено:</span>
                            <span className="ml-2 text-gray-900">
                              {new Date(task.updated_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center text-sm">
                              <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">Дедлайн:</span>
                              <span className={`ml-2 ${task.is_overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                {new Date(task.due_date).toLocaleDateString('ru-RU')}
                                {task.is_overdue && ' (просрочено)'}
                              </span>
                            </div>
                          )}
                          {task.priority && (
                            <div className="flex items-center text-sm">
                              <span className="text-gray-600">Приоритет:</span>
                              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                                {task.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Статистика</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Подзадач:</span>
                            <span className="text-gray-900">{task.subtasks_count}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Всего подзадач:</span>
                            <span className="text-gray-900">{task.all_subtasks_count}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Изображений:</span>
                            <span className="text-gray-900">{images.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Сообщений:</span>
                            <span className="text-gray-900">{messages.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'images' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Изображения</h3>
                      <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        {uploadingImage ? 'Загрузка...' : 'Добавить изображение'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>

                    {images.length === 0 ? (
                      <div className="text-center py-12">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Нет изображений</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Добавьте изображения для визуализации задачи
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {images.map((image) => (
                          <div key={image.id} className="relative group">
                            <img
                              src={image.image_url}
                              alt={image.caption || 'Task image'}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                              <button
                                onClick={() => handleDeleteImage(image.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-opacity"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 rounded-b-lg">
                              <p className="text-white text-sm">
                                {new Date(image.uploaded_at).toLocaleDateString('ru-RU')}
                              </p>
                              {image.uploaded_by && (
                                <p className="text-white text-xs opacity-75">
                                  {image.uploaded_by.full_name}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Чат задачи</h3>

                    {/* Messages */}
                    <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Нет сообщений</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Начните обсуждение задачи
                          </p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {message.sender?.full_name || 'Неизвестный пользователь'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.created_at).toLocaleString('ru-RU')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{message.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New Message Form */}
                    <div className="border-t pt-4">
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Напишите сообщение..."
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            rows={3}
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingMessage ? 'Отправка...' : 'Отправить'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'gantt' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Диаграмма Ганта</h3>
                      {isManager && (
                        <button
                          onClick={() => setAdminMode(!adminMode)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            adminMode
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {adminMode ? 'Режим просмотра' : 'Режим управления'}
                        </button>
                      )}
                    </div>

                    {adminMode && isManager ? (
                      <AdminGanttChart />
                    ) : (
                      <GanttChart />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Информация</h3>

              <div className="space-y-4">
                {/* Assignee */}
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Исполнитель
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {task.assignee?.full_name || 'Не назначен'}
                  </div>
                  {task.assignee && (
                    <div className="text-xs text-gray-500">{task.assignee.position}</div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <div className="text-sm text-gray-600 mb-1">Статус</div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                </div>

                {/* Priority */}
                {task.priority && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Приоритет</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(task.priority / 10) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{task.priority}/10</div>
                  </div>
                )}

                {/* Critical/Active indicators */}
                <div className="space-y-2">
                  {task.is_critical && (
                    <div className="flex items-center text-yellow-600">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm">Критическая задача</span>
                    </div>
                  )}
                  {task.is_active && (
                    <div className="flex items-center text-green-600">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm">Активная задача</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
