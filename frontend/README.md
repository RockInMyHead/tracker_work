# Task Manager Frontend

Modern React frontend application for Task Manager with JWT authentication and RBAC.

## 🚀 Features

- **JWT Authentication** - Secure login/logout with token management
- **RBAC (Role-Based Access Control)** - Manager and Employee roles
- **Task Management** - Create, edit, delete tasks with hierarchical structure
- **Employee Management** - Manage team members and their information
- **Workload Monitoring** - View team workload distribution
- **Important Tasks** - Critical tasks with smart employee recommendations
- **Responsive Design** - Mobile-friendly interface

## 🛠 Tech Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **React Hook Form + Zod** - Form validation
- **Heroicons** - Beautiful icons
- **Vite** - Fast build tool

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

   The development server will start on `http://localhost:3001` by default.

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🔧 Configuration

The frontend is configured to connect to the Django backend at `http://127.0.0.1:8000/api/v1/`.

To change the API endpoint, update `API_BASE_URL` in `src/services/api.ts`.

## 🎯 Usage

### Authentication

The app supports JWT-based authentication with the following endpoints:

- **Login**: `POST /api/v1/auth/login/`
- **Register**: `POST /api/v1/auth/register/`
- **Refresh**: `POST /api/v1/auth/refresh/`
- **Logout**: `POST /api/v1/auth/logout/`

### Test Credentials

- **Admin**: `admin` / `admin123` (Manager role)
- **Employee**: `employee1` / `emp123` (Employee role)

### Main Features

#### Dashboard
- Overview of tasks, employees, and critical items
- Quick navigation to all sections
- Real-time statistics

#### Tasks Management
- Create, edit, delete tasks
- Hierarchical task structure (parent/child)
- Status management (New, In Progress, Done, Cancelled)
- Priority assignment
- Due date tracking
- Search and filtering

#### Employees Management
- Add, edit, delete employees
- Role assignment
- Contact information management
- Search functionality

#### Workload Monitoring
- View team workload distribution
- Active tasks per employee
- Load level indicators (Free, Light, Moderate, Heavy)

#### Important Tasks
- Critical tasks requiring attention
- Smart employee recommendations based on:
  - Least loaded employees
  - Parent task assignees (within threshold)
- Due date and priority sorting

## 🔐 Security Features

### JWT Token Management
- Automatic token refresh
- Secure token storage
- Token expiration handling

### Role-Based Access Control
- **Manager**: Full CRUD access to all resources
- **Employee**: Read access + manage own tasks
- Object-level permissions

### Form Validation
- Client-side validation with Zod schemas
- Server-side validation integration
- Real-time error feedback

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Ready for theme implementation
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages
- **Accessibility**: ARIA labels and keyboard navigation

## 📱 API Integration

The frontend integrates with the Django REST API:

- **Tasks**: Full CRUD operations
- **Employees**: Full CRUD operations
- **Authentication**: JWT token management
- **Workload**: Real-time load monitoring
- **Important Tasks**: Smart recommendations

## 🚀 Deployment

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Serve static files:**
   The `dist/` folder contains the production build.

3. **Environment Variables:**
   Create `.env` file for custom configuration:
   ```
   VITE_API_BASE_URL=http://your-api-url.com/api/v1
   ```

## 📋 Development

### Project Structure
```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── common/        # Shared components
│   ├── dashboard/     # Dashboard pages
│   ├── employees/     # Employee management
│   └── tasks/         # Task management
├── services/          # API services and auth
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── App.tsx          # Main app component
```

### Key Components

- **AuthContext**: Manages authentication state
- **ApiService**: Handles all API communications
- **ProtectedRoute**: Guards authenticated routes
- **TaskForm/EmployeeForm**: Reusable form components

### State Management

- React hooks for local state
- Context API for global auth state
- Axios interceptors for token management

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for type safety
3. Write descriptive commit messages
4. Test your changes thoroughly

## 📄 License

This project is part of the Task Manager application.