# Менеджер Задач

Комплексная система управления задачами с Django REST API backend и React frontend.

## 🚀 Возможности

### Backend (Django REST Framework)
- **Управление задачами**: Создание, обновление, удаление и отслеживание задач с иерархической структурой
- **Управление сотрудниками**: Работа с членами команды и ролями
- **JWT аутентификация**: Безопасная аутентификация с обновлением токенов
- **RBAC**: Контроль доступа на основе ролей (роли Менеджер/Сотрудник)
- **Мониторинг нагрузки**: Аналитика нагрузки команды в реальном времени
- **Важные задачи**: Критические задачи с умными рекомендациями сотрудников
- **REST API**: Полный REST API с подробной документацией
- **База данных**: SQLite/PostgreSQL с правильными миграциями

### Frontend (React + TypeScript)
- **Современный UI**: Чистый, адаптивный интерфейс с Tailwind CSS
- **Управление задачами**: Полные CRUD операции с формами и валидацией
- **Дашборд**: Обзор со статистикой и быстрой навигацией
- **Представления нагрузки**: Визуальное распределение нагрузки и важные задачи
- **Аутентификация**: Вход/регистрация с управлением JWT токенами
- **Обновления в реальном времени**: Динамическая загрузка данных и обработка ошибок
- **Мобильная адаптивность**: Работает на всех размерах устройств

## 📖 Документация

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Детальная архитектура и технологии проекта
- **[USAGE.md](USAGE.md)** - Руководство пользователя
- **[API Документация](http://localhost:8000/api/schema/swagger-ui/)** - Интерактивная API документация

## 🛠️ Технологический стек

- **Python 3.11**
- **Django 5.x** с **Django REST Framework**
- **PostgreSQL 15+** с **psycopg[binary]**
- **Docker** & **Docker Compose**
- **drf-spectacular** для API документации
- **pytest** с **factory-boy** для тестирования
- **Black**, **isort**, **flake8**, **mypy** для качества кода
- **pre-commit** для git хуков

## 📋 Необходимые компоненты

- Python 3.11+
- Docker & Docker Compose (для контейнеризированного развертывания)
- PostgreSQL 15+ (для продакшена)

## 🚀 Быстрый старт

### Локальная разработка

1. **Клонируйте репозиторий**
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Настройка backend**
   ```bash
   # Создайте виртуальное окружение
   python -m venv venv
   source venv/bin/activate  # На Windows: venv\Scripts\activate

   # Установите Python зависимости
   pip install -r requirements.txt

   # Выполните миграции
   python manage.py migrate

   # Создайте суперпользователя (опционально)
   python manage.py createsuperuser
   ```

3. **Настройка frontend**
   ```bash
   # Установите Node.js зависимости
   cd frontend
   npm install
   cd ..
   ```

4. **Запустите оба сервера**
   ```bash
   # Скрипт быстрого старта (запускает backend и frontend)
   ./start.sh

   # Или вручную:
   # Терминал 1 - Backend
   source venv/bin/activate
   python manage.py runserver 127.0.0.1:8000

   # Терминал 2 - Frontend
   cd frontend
   npm run dev
   ```

### Docker развертывание

1. **Соберите и запустите с Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Доступ к приложению**
   - **Frontend**: http://localhost:3001
   - **Backend API**: http://127.0.0.1:8000
   - **API Docs**: http://127.0.0.1:8000/api/schema/swagger-ui/
   - **Админ панель**: http://127.0.0.1:8000/admin/
   - **pgAdmin**: http://localhost:8080 (если используете Docker)

## 📚 API Документация

После запуска посетите:
- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/

## 👤 Тестовые учетные данные

Приложение поставляется с преднастроенными тестовыми пользователями:

- **Администратор**: `admin` / `admin123` (роль Менеджер - полный доступ)
- **Сотрудник**: `employee1` / `emp123` (роль Сотрудник - ограниченный доступ)

Используйте эти учетные данные для тестирования различных уровней разрешений.

## 🧪 Тестирование

Запустите набор тестов:

```bash
# Запустите все тесты с покрытием
python -m pytest --cov

# Запустите конкретный файл тестов
python -m pytest tasks/tests/test_api.py

# Запустите с подробным выводом
python -m pytest -v
```

## 🔧 Разработка

### Качество кода

Этот проект использует несколько инструментов для поддержания качества кода:

```bash
# Форматируйте код с Black
black .

# Сортируйте импорты с isort
isort .

# Проверяйте с flake8
flake8 .

# Проверяйте типы с mypy
mypy .

# Запустите все проверки качества
pre-commit run --all-files
```

### Pre-commit хуки

Pre-commit хуки настроены для автоматического запуска при коммите:

```bash
# Установите pre-commit хуки
pre-commit install

# Запустите вручную
pre-commit run --all-files
```

## 📁 Структура проекта

```
task-manager/
├── backend/
│   ├── task_manager/     # Настройки Django проекта
│   ├── tasks/           # Основное Django приложение
│   │   ├── migrations/  # Миграции базы данных
│   │   ├── tests/      # Файлы тестов
│   │   └── fixtures/   # Тестовые данные
│   ├── requirements.txt # Python зависимости
│   ├── Dockerfile      # Docker образ
│   └── pytest.ini     # Конфигурация тестов
├── frontend/
│   ├── src/            # Исходный код React
│   │   ├── components/ # React компоненты
│   │   ├── services/   # API сервисы
│   │   ├── types/      # TypeScript типы
│   │   └── utils/      # Вспомогательные функции
│   ├── package.json    # Node.js зависимости
│   ├── vite.config.ts  # Конфигурация Vite
│   └── README.md       # Frontend документация
├── docker-compose.yml  # Docker сервисы
├── start.sh           # Скрипт быстрого старта
└── README.md          # Основная документация
```

## 🔐 Переменные окружения

Создайте файл `.env` с содержимым:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/taskmanager
ALLOWED_HOSTS=localhost,127.0.0.1
```

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для функциональности
3. Внесите изменения
4. Добавьте тесты
5. Убедитесь, что все тесты проходят
6. Отправьте pull request

## 📄 Лицензия

Этот проект лицензирован под MIT License - подробности в файле LICENSE.

## 🆘 Поддержка

По вопросам или проблемам:
- Проверьте API документацию
- Посмотрите существующие issues
- Создайте новый issue с подробной информацией

---

Создано с ❤️ с использованием Django REST Framework

