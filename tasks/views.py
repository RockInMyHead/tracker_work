import django_filters
from django.db.models import Count, Q, Min, Prefetch, Exists, OuterRef
from .models import TaskImage, TaskMessage, TaskDependency
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .filters import EmployeeFilter, TaskFilter
from .models import Employee, Task, TaskImage, TaskMessage
from .permissions import IsManager, IsEmployee, IsManagerOrReadOnly, IsOwnerOrManager
from .serializers import EmployeeSerializer, TaskSerializer, TaskImageSerializer, TaskMessageSerializer, TaskDependencySerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing employees."""

    serializer_class = EmployeeSerializer
    queryset = Employee.objects.all()
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = EmployeeFilter
    search_fields = ['full_name', 'position', 'email']
    ordering_fields = ['full_name', 'created_at']
    ordering = ['full_name']
    permission_classes = [IsAuthenticated, IsManagerOrReadOnly]

    def get_queryset(self):
        """Return employees ordered by name."""
        return Employee.objects.filter(is_active=True).order_by('full_name')

    @action(detail=False, methods=['get'])
    def workload(self, request):
        """Get workload metrics for employees with active tasks using optimized ORM."""
        # Define active query based on TASK_CONFIG
        from django.conf import settings
        active_statuses = [s.upper() for s in settings.TASK_CONFIG["ACTIVE_STATUSES"]]
        active_q = Q(tasks__status__in=active_statuses)

        # Optimized query with annotations and prefetch
        qs = (Employee.objects
              .filter(is_active=True)
              .annotate(active_tasks_count=Count('tasks', filter=active_q))
              .prefetch_related('tasks')
              .order_by('-active_tasks_count', 'full_name'))

        result = []
        for employee in qs:
            # Get active tasks for this employee (already prefetched)
            active_tasks = [task for task in employee.tasks.all()]

            task_data = []
            for task in active_tasks[:10]:  # Limit to 10 tasks for performance
                task_data.append({
                    'id': str(task.id),
                    'title': task.title,
                    'status': task.status,
                    'due_date': task.due_date.isoformat() if task.due_date else None,
                })

            result.append({
                'employee_id': str(employee.id),
                'full_name': employee.full_name,
                'active_tasks_count': employee.active_tasks_count,
                'tasks': task_data,
            })

        return Response(result)

    @action(detail=True, methods=['get'])
    def workload_detail(self, request, pk=None):
        """Get detailed workload metrics for a specific employee."""
        employee = self.get_object()
        metrics = Task.get_employee_workload(employee)
        return Response(metrics)


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tasks."""

    serializer_class = TaskSerializer
    queryset = Task.objects.all()
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = TaskFilter
    search_fields = ['title']
    ordering_fields = ['due_date', 'priority', 'created_at', 'title']
    ordering = ['-due_date', 'priority']
    permission_classes = [IsAuthenticated, IsOwnerOrManager]

    def get_queryset(self):
        """Return tasks with related data."""
        return Task.objects.select_related("parent", "assignee").prefetch_related(
            "subtasks",
            Prefetch("images", queryset=TaskImage.objects.select_related("uploaded_by")),
            Prefetch("messages", queryset=TaskMessage.objects.select_related("sender"))
        )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active tasks for workload metrics."""
        queryset = Task.get_active_tasks().select_related("parent", "assignee")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def critical(self, request):
        """Get critical tasks."""
        queryset = Task.get_critical_tasks().select_related("parent", "assignee")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def important(self, request):
        """Get important tasks with employee recommendations."""
        # Find important tasks: NEW status with IN_PROGRESS subtasks
        important = (Task.objects
                     .filter(status__iexact='NEW')
                     .filter(Exists(Task.objects.filter(parent=OuterRef('pk'), status__iexact='IN_PROGRESS')))
                     .select_related('parent', 'assignee')
                     .order_by('due_date', '-priority'))  # due_date ASC, priority DESC

        result = []
        for task in important:
            # Get recommended employees
            recommended_employees = self._get_recommended_employees(task)

            result.append({
                'id': str(task.id),
                'title': task.title,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'recommended_employees': recommended_employees,
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """Get workload metrics."""
        metrics = Task.get_workload_metrics()
        return Response(metrics)

    def _get_recommended_employees(self, task):
        """Get recommended employees for a task based on workload and parent assignee rules."""
        from django.conf import settings

        # Define active query based on TASK_CONFIG
        active_statuses = [s.upper() for s in settings.TASK_CONFIG["ACTIVE_STATUSES"]]
        active_q = Q(tasks__status__in=active_statuses)

        # Find minimum load among active employees
        min_load_result = Employee.objects.filter(is_active=True).annotate(
            cnt=Count('tasks', filter=active_q)
        ).aggregate(Min('cnt'))
        min_load = min_load_result['cnt__min'] or 0

        # Get all active employees with their load
        employees_with_load = Employee.objects.filter(is_active=True).annotate(
            active_tasks_count=Count('tasks', filter=active_q)
        )

        candidates = []

        # Candidate 1: Least loaded employees
        least_loaded = employees_with_load.filter(active_tasks_count=min_load)
        for employee in least_loaded:
            candidates.append({
                'id': str(employee.id),
                'full_name': employee.full_name,
                'reason': 'least_loaded'
            })

        # Candidate 2: Parent task assignee (if exists and within threshold)
        if task.parent and task.parent.assignee:
            parent_assignee = task.parent.assignee
            parent_load = employees_with_load.filter(id=parent_assignee.id).first()

            if parent_load and parent_load.active_tasks_count <= min_load + 2:
                # Check if not already in candidates
                if not any(c['id'] == str(parent_assignee.id) for c in candidates):
                    candidates.append({
                        'id': str(parent_assignee.id),
                        'full_name': parent_assignee.full_name,
                        'reason': 'parent_assignee_within_threshold'
                    })

        return candidates

    @action(detail=False, methods=['get'])
    def gantt_data(self, request):
        """Get data for Gantt chart visualization."""
        # Get all tasks with their dependencies
        tasks = Task.objects.select_related('assignee').prefetch_related(
            'predecessor_dependencies__predecessor',
            'successor_dependencies__successor'
        ).filter(
            start_date__isnull=False,
            end_date__isnull=False
        ).order_by('start_date')

        # Build Gantt chart data
        gantt_data = []
        task_map = {}

        for task in tasks:
            task_data = {
                'id': str(task.id),
                'text': task.title,
                'start_date': task.start_date.isoformat() if task.start_date else None,
                'end_date': task.end_date.isoformat() if task.end_date else None,
                'duration': (task.end_date - task.start_date).days + 1 if task.start_date and task.end_date else 0,
                'progress': self._calculate_progress(task),
                'assignee': task.assignee.full_name if task.assignee else 'Не назначен',
                'status': task.status,
                'priority': task.priority,
                'color': self._get_task_color(task),
                'parent': str(task.parent.id) if task.parent else None,
            }
            gantt_data.append(task_data)
            task_map[task.id] = task_data

        # Add dependencies
        dependencies = []
        for task in tasks:
            for dep in task.successor_dependencies.all():
                dependencies.append({
                    'id': str(dep.id),
                    'source': str(dep.predecessor.id),
                    'target': str(dep.successor.id),
                    'type': dep.dependency_type,
                    'lag': dep.lag_days,
                })

        return Response({
            'tasks': gantt_data,
            'links': dependencies,
        })

    def _calculate_progress(self, task):
        """Calculate task progress based on status."""
        status_progress = {
            'new': 0,
            'in_progress': 50,
            'done': 100,
            'cancelled': 0,
        }
        return status_progress.get(task.status, 0)

    def _get_task_color(self, task):
        """Get color for task based on status and priority."""
        if task.status == 'done':
            return '#10B981'  # green
        elif task.status == 'in_progress':
            return '#3B82F6'  # blue
        elif task.status == 'cancelled':
            return '#EF4444'  # red
        else:  # new
            if task.priority and task.priority >= 8:
                return '#F59E0B'  # yellow for high priority
            else:
                return '#6B7280'  # gray


class TaskImageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task images."""

    serializer_class = TaskImageSerializer
    queryset = TaskImage.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter images by task if task_id is provided."""
        queryset = TaskImage.objects.select_related('task', 'uploaded_by')
        task_id = self.request.query_params.get('task_id')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset.order_by('-uploaded_at')

    def perform_create(self, serializer):
        """Set the uploaded_by field to current user."""
        # Get employee profile from current user
        employee = getattr(self.request.user, 'employee_profile', None)
        serializer.save(uploaded_by=employee)


class TaskMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task messages."""

    serializer_class = TaskMessageSerializer
    queryset = TaskMessage.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter messages by task if task_id is provided."""
        queryset = TaskMessage.objects.select_related('task', 'sender')
        task_id = self.request.query_params.get('task_id')
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset.order_by('created_at')

    def perform_create(self, serializer):
        """Set the sender field to current user."""
        # Get employee profile from current user
        employee = getattr(self.request.user, 'employee_profile', None)
        serializer.save(sender=employee)


class TaskDependencyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task dependencies."""

    serializer_class = TaskDependencySerializer
    queryset = TaskDependency.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter dependencies by task if task_id is provided."""
        queryset = TaskDependency.objects.select_related(
            'predecessor__assignee',
            'successor__assignee'
        )
        predecessor_id = self.request.query_params.get('predecessor_id')
        successor_id = self.request.query_params.get('successor_id')

        if predecessor_id:
            queryset = queryset.filter(predecessor_id=predecessor_id)
        if successor_id:
            queryset = queryset.filter(successor_id=successor_id)

        return queryset.order_by('predecessor__title', 'successor__title')
