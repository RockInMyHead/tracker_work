# Task Manager

A comprehensive task management system with Django REST API backend and React frontend.

## 🚀 Features

### Backend (Django REST Framework)
- **Task Management**: Create, update, delete, and track tasks with hierarchical structure
- **Employee Management**: Manage team members and roles
- **JWT Authentication**: Secure authentication with token refresh
- **RBAC**: Role-based access control (Manager/Employee roles)
- **Workload Monitoring**: Real-time team workload analytics
- **Important Tasks**: Critical tasks with smart employee recommendations
- **REST API**: Full REST API with comprehensive documentation
- **Database**: SQLite/PostgreSQL with proper migrations

### Frontend (React + TypeScript)
- **Modern UI**: Clean, responsive interface with Tailwind CSS
- **Task Management**: Full CRUD operations with forms and validation
- **Dashboard**: Overview with statistics and quick navigation
- **Workload Views**: Visual workload distribution and important tasks
- **Authentication**: Login/register with JWT token management
- **Real-time Updates**: Dynamic data loading and error handling
- **Mobile Responsive**: Works on all device sizes

## 📖 Документация

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Детальная архитектура и технологии проекта
- **[USAGE.md](USAGE.md)** - Руководство пользователя
- **[API Documentation](http://localhost:8000/api/schema/swagger-ui/)** - Интерактивная API документация

## 🛠️ Tech Stack

- **Python 3.11**
- **Django 5.x** with **Django REST Framework**
- **PostgreSQL 15+** with **psycopg[binary]**
- **Docker** & **Docker Compose**
- **drf-spectacular** for API documentation
- **pytest** with **factory-boy** for testing
- **Black**, **isort**, **flake8**, **mypy** for code quality
- **pre-commit** for git hooks

## 📋 Prerequisites

- Python 3.11+
- Docker & Docker Compose (for containerized deployment)
- PostgreSQL 15+ (for production)

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-manager
   ```

2. **Backend Setup**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install Python dependencies
   pip install -r requirements.txt

   # Run migrations
   python manage.py migrate

   # Create superuser (optional)
   python manage.py createsuperuser
   ```

3. **Frontend Setup**
   ```bash
   # Install Node.js dependencies
   cd frontend
   npm install
   cd ..
   ```

4. **Start Both Servers**
   ```bash
   # Quick start script (starts both backend and frontend)
   ./start.sh

   # Or manually:
   # Terminal 1 - Backend
   source venv/bin/activate
   python manage.py runserver 127.0.0.1:8000

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - **Frontend**: http://localhost:3001
   - **Backend API**: http://127.0.0.1:8000
   - **API Docs**: http://127.0.0.1:8000/api/schema/swagger-ui/
   - **Admin Panel**: http://127.0.0.1:8000/admin/
   - **pgAdmin**: http://localhost:8080 (if using Docker)

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/

## 👤 Test Credentials

The application comes with pre-configured test users:

- **Admin User**: `admin` / `admin123` (Manager role - full access)
- **Employee User**: `employee1` / `emp123` (Employee role - limited access)

Use these credentials to test different permission levels.

## 🧪 Testing

Run the test suite:

```bash
# Run all tests with coverage
python -m pytest --cov

# Run specific test file
python -m pytest tasks/tests/test_api.py

# Run with verbose output
python -m pytest -v
```

## 🔧 Development

### Code Quality

This project uses several tools to maintain code quality:

```bash
# Format code with Black
black .

# Sort imports with isort
isort .

# Lint with flake8
flake8 .

# Type check with mypy
mypy .

# Run all quality checks
pre-commit run --all-files
```

### Pre-commit Hooks

Pre-commit hooks are configured to run automatically on commit:

```bash
# Install pre-commit hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

## 📁 Project Structure

```
task-manager/
├── backend/
│   ├── task_manager/     # Django project settings
│   ├── tasks/           # Main Django application
│   │   ├── migrations/  # Database migrations
│   │   ├── tests/      # Test files
│   │   └── fixtures/   # Test data
│   ├── requirements.txt # Python dependencies
│   ├── Dockerfile      # Docker image
│   └── pytest.ini     # Test configuration
├── frontend/
│   ├── src/            # React source code
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   ├── types/      # TypeScript types
│   │   └── utils/      # Utility functions
│   ├── package.json    # Node.js dependencies
│   ├── vite.config.ts  # Vite configuration
│   └── README.md       # Frontend documentation
├── docker-compose.yml  # Docker services
├── start.sh           # Quick start script
└── README.md          # Main documentation
```

## 🔐 Environment Variables

Create a `.env` file with:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/taskmanager
ALLOWED_HOSTS=localhost,127.0.0.1
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
- Check the API documentation
- Review existing issues
- Create a new issue with detailed information

---

Built with ❤️ using Django REST Framework

