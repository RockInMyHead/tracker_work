# 🏗️ Task Manager - Архитектура и Технологии

## 📋 Обзор проекта

**Task Manager** - это полнофункциональная система управления задачами с современным веб-интерфейсом. Проект построен на микросервисной архитектуре с разделением на backend (Django REST API) и frontend (React SPA).

## 🏛️ Общая архитектура

### Архитектурный паттерн
Проект использует **REST API архитектуру** с разделением ответственности:

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   React SPA     │◄────────────────►│  Django REST    │
│   (Frontend)    │                  │   API Backend   │
│                 │                  │                 │
│ • Компоненты    │                  │ • ViewSets      │
│ • Сервисы       │                  │ • Сериализаторы │
│ • Хуки          │                  │ • Модели        │
│ • Роутинг       │                  │ • Миграции      │
└─────────────────┘                  └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                  ┌─────────────────┐
│   Browser       │                  │   Database      │
│   (LocalStorage)│                  │   (SQLite/PG)   │
└─────────────────┘                  └─────────────────┘
```

### Компонентная структура

```
Task Manager/
├── backend/                    # Django Backend
│   ├── task_manager/          # Настройки проекта
│   ├── tasks/                 # Основное приложение
│   └── requirements.txt       # Python зависимости
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # UI компоненты
│   │   ├── services/          # API сервисы
│   │   ├── types/            # TypeScript типы
│   │   └── hooks/            # React хуки
│   └── package.json          # Node.js зависимости
└── docker/                    # Контейнеризация
    ├── Dockerfile
    └── docker-compose.yml
```

## 🛠️ Технологический стек

### Backend (Django REST Framework)

#### Основные технологии
| Компонент | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| **Язык** | Python | 3.11+ | Основной язык разработки |
| **Фреймворк** | Django | 5.x | Веб-фреймворк |
| **API** | Django REST Framework | 3.15+ | REST API разработка |
| **База данных** | SQLite/PostgreSQL | 15+ | Хранение данных |
| **Аутентификация** | JWT | - | Токеновая аутентификация |

#### Качество кода и разработка
| Инструмент | Назначение |
|------------|------------|
| **Black** | Форматирование кода |
| **isort** | Сортировка импортов |
| **flake8** | Линтинг Python кода |
| **mypy** | Статическая типизация |
| **pytest** | Unit и интеграционные тесты |
| **factory-boy** | Фабрики тестовых данных |
| **pre-commit** | Git хуки для качества кода |

#### API документация и инструменты
| Инструмент | Назначение |
|------------|------------|
| **drf-spectacular** | Автоматическая генерация OpenAPI схем |
| **Swagger UI** | Интерактивная API документация |
| **ReDoc** | Альтернативная документация |

### Frontend (React + TypeScript)

#### Основные технологии
| Компонент | Технология | Версия | Назначение |
|-----------|------------|--------|------------|
| **Язык** | TypeScript | 5.x | Типизированный JavaScript |
| **Фреймворк** | React | 19.x | UI библиотека |
| **Роутинг** | React Router | 7.x | Клиентский роутинг |
| **HTTP клиент** | Axios | 1.x | API запросы |
| **Сборка** | Vite | 7.x | Быстрая сборка и dev server |
| **Стилизация** | Tailwind CSS | 3.x | Utility-first CSS |

#### UI и UX компоненты
| Библиотека | Назначение |
|------------|------------|
| **Headless UI** | Доступные UI компоненты |
| **Heroicons** | Иконки для интерфейса |
| **React Hook Form** | Управление формами |
| **Zod** | Валидация форм |
| **Lucide React** | Дополнительные иконки |

#### Качество кода
| Инструмент | Назначение |
|------------|------------|
| **ESLint** | Линтинг JavaScript/TypeScript |
| **Prettier** | Форматирование кода |
| **TypeScript ESLint** | Проверка типов |

### DevOps и развертывание

#### Контейнеризация
| Инструмент | Назначение |
|------------|------------|
| **Docker** | Контейнеризация приложений |
| **Docker Compose** | Оркестрация сервисов |
| **PostgreSQL** | База данных для продакшена |
| **Redis** | Кеширование (опционально) |
| **pgAdmin** | Администрирование PostgreSQL |

## 🗂️ Структура проекта (детально)

### Backend структура

```
backend/
├── task_manager/              # Настройки Django проекта
│   ├── __init__.py
│   ├── asgi.py               # ASGI конфигурация
│   ├── wsgi.py               # WSGI конфигурация
│   ├── settings.py           # Основные настройки
│   ├── urls.py               # URL маршрутизация проекта
│   └── wsgi.py
├── tasks/                     # Основное Django приложение
│   ├── __init__.py
│   ├── admin.py              # Админка Django
│   ├── apps.py               # Конфигурация приложения
│   ├── auth.py               # Кастомная аутентификация
│   ├── filters.py            # Фильтры для API
│   ├── models.py             # Модели данных
│   ├── permissions.py        # Права доступа
│   ├── serializers.py        # Сериализаторы DRF
│   ├── tests/                # Тесты
│   │   ├── __init__.py
│   │   ├── factories.py      # Фабрики тестовых данных
│   │   └── test_api.py       # API тесты
│   ├── urls.py               # URL маршруты приложения
│   └── views.py              # ViewSets и контроллеры
├── manage.py                 # Django CLI
├── requirements.txt          # Python зависимости
├── pytest.ini               # Настройки pytest
├── conftest.py              # pytest fixtures
└── db.sqlite3               # SQLite база данных
```

### Frontend структура

```
frontend/
├── public/                   # Статические файлы
│   └── vite.svg
├── src/
│   ├── components/           # React компоненты
│   │   ├── auth/            # Компоненты аутентификации
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── common/          # Общие компоненты
│   │   │   └── Header.tsx
│   │   ├── dashboard/       # Компоненты дашборда
│   │   │   ├── Dashboard.tsx
│   │   │   └── WorkloadPage.tsx
│   │   ├── employee/        # Компоненты сотрудника
│   │   │   ├── EmployeeDashboard.tsx
│   │   │   └── EmployeeTasksPage.tsx
│   │   ├── employees/       # Управление сотрудниками
│   │   │   ├── EmployeesPage.tsx
│   │   │   └── EmployeeForm.tsx
│   │   └── tasks/           # Управление задачами
│   │       ├── TasksPage.tsx
│   │       ├── TaskDetailPage.tsx
│   │       ├── TaskForm.tsx
│   │       ├── GanttChart.tsx
│   │       ├── TaskGanttChart.tsx
│   │       └── AdminGanttChart.tsx
│   ├── services/            # API сервисы
│   │   ├── api.ts           # Основной API клиент
│   │   └── auth.tsx         # Сервис аутентификации
│   ├── types/               # TypeScript типы
│   │   └── index.ts
│   ├── hooks/               # React хуки
│   │   └── useRole.ts       # Хук для ролей
│   ├── utils/               # Утилиты
│   ├── App.tsx              # Главный компонент
│   ├── main.tsx             # Точка входа
│   └── index.css            # Глобальные стили
├── package.json             # Node.js зависимости
├── vite.config.ts           # Конфигурация Vite
├── tailwind.config.js       # Конфигурация Tailwind
└── tsconfig.json            # TypeScript конфигурация
```

## 🗃️ База данных

### Модели данных

#### Task (Задача)
```python
class Task(models.Model):
    title = models.CharField(_("title"), max_length=300)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', null=True, blank=True)
    assignee = models.ForeignKey(Employee, null=True, blank=True)
    due_date = models.DateField(_("due date"))  # Обязательное
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(choices=Status.choices, default=Status.NEW)
    priority = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Employee (Сотрудник)
```python
class Employee(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True)
    full_name = models.CharField(max_length=200)
    position = models.CharField(max_length=100)
    email = models.EmailField(unique=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### TaskDependency (Зависимости задач)
```python
class TaskDependency(models.Model):
    predecessor = models.ForeignKey(Task, related_name='successor_dependencies')
    successor = models.ForeignKey(Task, related_name='predecessor_dependencies')
    dependency_type = models.CharField(choices=[...], default='finish_to_start')
    lag_days = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Связи между моделями

```
Employee ──── 1:N ──── Task
   │                      │
   │                      │
   └── User ──── 1:1 ────┘

Task ──── N:1 ──── Task (parent/child)
   │
   │
   └── N:N ──── TaskDependency
```

### Миграции
Проект использует Django migrations для управления изменениями схемы БД:

```
migrations/
├── 0001_initial.py              # Начальная структура
├── 0002_remove_project_...py   # Удаление неиспользуемых полей
├── 0003_add_user_to_employee.py # Добавление связи с User
├── 0004_task_description...py  # Добавление описаний и изображений
└── 0005_taskdependency...py    # Добавление зависимостей задач
```

## 🔐 Аутентификация и авторизация

### JWT Аутентификация

#### Архитектура токенов
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───►│  Access     │───►│   API       │
│   Request   │    │   Token     │    │   Request   │
└─────────────┘    └─────────────┘    └─────────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │  Refresh    │
                 │   Token     │
                 └─────────────┘
```

#### Токены
- **Access Token**: Короткоживущий (15 мин), используется для API запросов
- **Refresh Token**: Долгоживущий (7 дней), используется для обновления access token

### Ролевая модель

#### Роли пользователей
| Роль | Описание | Права |
|------|----------|-------|
| **Manager** | Администратор | Полный доступ ко всем функциям |
| **Employee** | Сотрудник | Доступ только к своим задачам |

#### Права доступа
```python
class TaskPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.groups.filter(name='manager').exists():
            return True  # Manager имеет полный доступ
        return obj.assignee == request.user.employee_profile
```

## 🌐 API Архитектура

### REST API Endpoints

#### Аутентификация
```typescript
POST /api/v1/auth/login/      // JWT токены
POST /api/v1/auth/logout/     // Выход
POST /api/v1/auth/register/   // Регистрация
POST /api/v1/auth/refresh/    // Обновление токена
```

#### Задачи (CRUD)
```typescript
GET    /api/v1/tasks/         // Список задач с фильтрацией
POST   /api/v1/tasks/         // Создание задачи
GET    /api/v1/tasks/{id}/    // Детали задачи
PUT    /api/v1/tasks/{id}/    // Обновление задачи
DELETE /api/v1/tasks/{id}/    // Удаление задачи
```

#### Специализированные endpoints
```typescript
GET /api/v1/tasks/active/     // Активные задачи пользователя
GET /api/v1/tasks/critical/   // Критические задачи
GET /api/v1/tasks/important/  // Важные задачи с рекомендациями
GET /api/v1/tasks/gantt_data/ // Данные для диаграммы Ганта
```

#### Сотрудники
```typescript
GET    /api/v1/employees/           // Список сотрудников
POST   /api/v1/employees/           // Создание сотрудника
GET    /api/v1/employees/{id}/      // Детали сотрудника
PUT    /api/v1/employees/{id}/      // Обновление сотрудника
DELETE /api/v1/employees/{id}/      // Удаление сотрудника
GET    /api/v1/employees/workload/  // Нагрузка команды
```

### API Клиент (Frontend)

#### Структура сервиса
```typescript
class ApiService {
  private api: AxiosInstance;

  // Перехватчики для JWT
  constructor() {
    this.api = axios.create({ baseURL: API_BASE_URL });

    // Request interceptor - добавляет токен
    this.api.interceptors.request.use(config => {
      const token = localStorage.getItem('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Response interceptor - обновляет токен
    this.api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Попытка обновить токен
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const newToken = await this.refreshToken({ refresh: refreshToken });
              localStorage.setItem('access_token', newToken.access);
              // Повторяем запрос
              return this.api(error.config);
            } catch {
              // Перенаправляем на логин
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }
}
```

## ⚛️ Frontend архитектура

### Компонентная иерархия

```
App
├── AuthProvider
│   └── AppRoutes
│       ├── Header (Manager/Employee)
│       ├── Routes
│       │   ├── Public Routes
│       │   │   ├── LoginForm
│       │   │   └── RegisterForm
│       │   └── Protected Routes
│       │       ├── Manager Routes
│       │       │   ├── Dashboard
│       │       │   ├── TasksPage
│       │       │   ├── TaskDetailPage
│       │       │   │   ├── TaskGanttChart
│       │       │   │   └── AdminGanttChart
│       │       │   ├── EmployeesPage
│       │       │   ├── WorkloadPage
│       │       │   └── ImportantTasksPage
│       │       └── Employee Routes
│       │           ├── EmployeeDashboard
│       │           └── EmployeeTasksPage
```

### Кастомные хуки

#### useAuth
```typescript
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Методы: login, logout, refresh
}
```

#### useRole
```typescript
const useRole = (): UserRole => {
  const { user } = useAuth();
  // Логика определения роли на основе групп пользователя
}
```

### Управление состоянием

#### Локальное состояние
- **Компонентное состояние**: useState для локальных данных
- **Глобальное состояние**: Контекст AuthProvider для аутентификации
- **Серверное состояние**: API запросы для актуальных данных

#### Кеширование
```typescript
// React Query может быть добавлен для кеширования
// Пока используется localStorage для JWT токенов
const storeAuthData = (data: AuthResponse) => {
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
};
```

## 🔒 Безопасность

### Уровни безопасности

#### 1. Транспортный уровень
- **HTTPS**: Шифрование данных в транзите
- **CORS**: Контроль доменов для API запросов

#### 2. Аутентификация
- **JWT токены**: Стандартная реализация
- **Refresh токены**: Автоматическое обновление
- **Secure storage**: localStorage для токенов

#### 3. Авторизация
- **RBAC**: Ролевая модель доступа
- **Object permissions**: Права на уровне объектов
- **API permissions**: DRF permission classes

#### 4. Валидация данных
- **Frontend**: Zod схемы для форм
- **Backend**: Django сериализаторы
- **Database**: Модельные constraints

### Безопасные практики

#### CSRF защита
```python
# Django settings
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
```

#### XSS защита
```javascript
// React автоматически экранирует контент
// Дополнительная защита через DOMPurify для rich text
```

#### SQL Injection
```python
# Django ORM автоматически параметризует запросы
Task.objects.filter(title__icontains=search_term)
```

## 📊 Мониторинг и логирование

### Логирование

#### Backend логи
```python
import logging

logger = logging.getLogger(__name__)
logger.info("Task created: %s", task.title)
```

#### Frontend логи
```typescript
// Development логи
if (process.env.NODE_ENV === 'development') {
  console.log('API Request:', config);
}

// Error tracking (можно добавить Sentry)
console.error('API Error:', error);
```

### Метрики

#### Производительность
- **API Response Time**: Middleware для замера времени ответов
- **Database Queries**: Django Debug Toolbar
- **Frontend Bundle Size**: Webpack Bundle Analyzer

#### Бизнес метрики
- **User Activity**: Трекинг действий пользователей
- **Task Completion Rate**: Процент выполненных задач
- **System Load**: Мониторинг нагрузки сервера

## 🚀 Развертывание и масштабируемость

### Docker контейнеризация

#### Dockerfile (Backend)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://...

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: taskmanager
      POSTGRES_USER: taskuser
      POSTGRES_PASSWORD: taskpass
```

### Производственное развертывание

#### Переменные окружения
```env
DEBUG=False
SECRET_KEY=production-secret-key
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```

#### Nginx конфигурация
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 Расширение и развитие

### Возможные улучшения

#### Backend
- **GraphQL API**: Более гибкие запросы данных
- **WebSockets**: Real-time обновления
- **Celery**: Асинхронные задачи
- **Redis**: Кеширование и сессии
- **Elasticsearch**: Полнотекстовый поиск

#### Frontend
- **React Query**: Кеширование API запросов
- **React Testing Library**: Более полное тестирование
- **PWA**: Progressive Web App возможности
- **i18n**: Интернационализация

#### DevOps
- **CI/CD**: GitHub Actions или GitLab CI
- **Monitoring**: Prometheus + Grafana
- **Load Balancing**: Nginx + Gunicorn
- **Backup**: Автоматическое резервное копирование

### API versioning
```python
# URL patterns для версионирования
urlpatterns = [
    path('api/v1/', include('tasks.urls')),
    path('api/v2/', include('tasks.urls_v2')),
]
```

## 📚 Документация

### API документация
- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/
- **OpenAPI Schema**: Автоматически генерируется drf-spectacular

### Кодовая документация
- **Docstrings**: Python функции документированы
- **TypeScript**: Типы и интерфейсы документированы
- **README**: Основная документация проекта
- **ARCHITECTURE.md**: Детальная архитектура (этот файл)

---

