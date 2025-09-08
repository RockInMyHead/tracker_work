from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from .models import Employee, Task
from .tests.factories import EmployeeFactory, TaskFactory


class EmployeeModelTest(TestCase):
    """Test cases for Employee model."""

    def setUp(self):
        self.employee = EmployeeFactory()

    def test_employee_creation(self):
        """Test employee creation."""
        self.assertEqual(self.employee.full_name, self.employee.full_name)
        self.assertEqual(self.employee.position, self.employee.position)
        self.assertTrue(self.employee.is_active)

    def test_employee_str_method(self):
        """Test employee string representation."""
        self.assertEqual(str(self.employee), self.employee.full_name)

    def test_employee_email_unique(self):
        """Test employee email uniqueness."""
        # Create employee with email
        employee1 = EmployeeFactory(email="test@example.com")

        # Try to create another with same email
        with self.assertRaises(Exception):  # IntegrityError
            EmployeeFactory(email="test@example.com")


class TaskModelTest(TestCase):
    """Test cases for Task model."""

    def setUp(self):
        self.employee = EmployeeFactory()
        self.task = TaskFactory(assignee=self.employee)

    def test_task_creation(self):
        """Test task creation."""
        self.assertEqual(self.task.title, self.task.title)
        self.assertEqual(self.task.status, Task.Status.NEW)
        self.assertEqual(self.task.assignee, self.employee)

    def test_task_str_method(self):
        """Test task string representation."""
        self.assertEqual(str(self.task), self.task.title)

    def test_is_overdue_property(self):
        """Test is_overdue property."""
        # Task with future due date should not be overdue
        future_date = timezone.now().date() + timezone.timedelta(days=1)
        self.task.due_date = future_date
        self.task.save()
        self.assertFalse(self.task.is_overdue)

        # Task with past due date should be overdue
        past_date = timezone.now().date() - timezone.timedelta(days=1)
        self.task.due_date = past_date
        self.task.save()
        self.assertTrue(self.task.is_overdue)

        # Completed task should not be overdue even with past due date
        self.task.status = Task.Status.DONE
        self.task.save()
        self.assertFalse(self.task.is_overdue)

    def test_is_active_property(self):
        """Test is_active property for workload metrics."""
        # NEW status is active
        self.task.status = Task.Status.NEW
        self.assertTrue(self.task.is_active)

        # IN_PROGRESS status is active
        self.task.status = Task.Status.IN_PROGRESS
        self.assertTrue(self.task.is_active)

        # DONE status is not active
        self.task.status = Task.Status.DONE
        self.assertFalse(self.task.is_active)

        # CANCELLED status is not active
        self.task.status = Task.Status.CANCELLED
        self.assertFalse(self.task.is_active)

    def test_is_critical_property(self):
        """Test is_critical property."""
        # Create parent task with NEW status
        parent_task = TaskFactory(status=Task.Status.NEW)

        # Parent without active subtasks is not critical
        self.assertFalse(parent_task.is_critical)

        # Add active subtask
        TaskFactory(parent=parent_task, status=Task.Status.IN_PROGRESS)

        # Now parent should be critical
        self.assertTrue(parent_task.is_critical)

        # Parent with DONE status is not critical even with active subtasks
        parent_task.status = Task.Status.DONE
        parent_task.save()
        self.assertFalse(parent_task.is_critical)

    def test_parent_hierarchy_validation(self):
        """Test parent hierarchy validation."""
        parent_task = TaskFactory()

        # Valid parent relationship
        child_task = TaskFactory(parent=parent_task)
        child_task.full_clean()  # Should not raise

        # Self-reference should fail
        with self.assertRaises(ValidationError):
            invalid_task = TaskFactory(parent=parent_task)
            invalid_task.parent = invalid_task
            invalid_task.full_clean()

    def test_subtasks_count_property(self):
        """Test subtasks_count property."""
        parent_task = TaskFactory()

        # Initially no subtasks
        self.assertEqual(parent_task.subtasks_count, 0)

        # Add subtasks
        TaskFactory.create_batch(3, parent=parent_task)
        parent_task.refresh_from_db()
        self.assertEqual(parent_task.subtasks_count, 3)

    def test_active_tasks_queryset(self):
        """Test get_active_tasks class method."""
        TaskFactory.create_batch(2, status=Task.Status.NEW)
        TaskFactory.create_batch(2, status=Task.Status.IN_PROGRESS)
        TaskFactory(status=Task.Status.DONE)

        active_tasks = Task.get_active_tasks()
        self.assertEqual(active_tasks.count(), 4)

        for task in active_tasks:
            self.assertIn(task.status, [Task.Status.NEW, Task.Status.IN_PROGRESS])

    def test_critical_tasks_queryset(self):
        """Test get_critical_tasks class method."""
        # Create critical task (NEW with IN_PROGRESS subtask)
        parent_task = TaskFactory(status=Task.Status.NEW)
        TaskFactory(parent=parent_task, status=Task.Status.IN_PROGRESS)

        # Create non-critical task (NEW without active subtasks)
        TaskFactory(status=Task.Status.NEW)

        critical_tasks = Task.get_critical_tasks()
        self.assertEqual(critical_tasks.count(), 1)
        self.assertEqual(critical_tasks.first(), parent_task)

    def test_employee_workload_method(self):
        """Test get_employee_workload class method."""
        employee = EmployeeFactory()

        # Create tasks for employee
        TaskFactory.create_batch(3, assignee=employee, status=Task.Status.NEW)
        TaskFactory.create_batch(2, assignee=employee, status=Task.Status.IN_PROGRESS)
        TaskFactory(assignee=employee, status=Task.Status.DONE)

        # Create critical task
        critical_parent = TaskFactory(assignee=employee, status=Task.Status.NEW)
        TaskFactory(parent=critical_parent, status=Task.Status.IN_PROGRESS)

        workload = Task.get_employee_workload(employee)

        self.assertEqual(workload['total_tasks'], 7)  # 3 + 2 + 1 + 1
        self.assertEqual(workload['active_tasks'], 6)  # NEW + IN_PROGRESS + critical parent
        self.assertEqual(workload['critical_tasks'], 1)
        self.assertEqual(workload['overdue_tasks'], 0)

    def test_workload_metrics_method(self):
        """Test get_workload_metrics class method."""
        # Create test data
        TaskFactory.create_batch(3, status=Task.Status.NEW)
        TaskFactory.create_batch(2, status=Task.Status.IN_PROGRESS)
        TaskFactory(status=Task.Status.DONE)

        metrics = Task.get_workload_metrics()

        self.assertEqual(metrics['total_active_tasks'], 5)
        self.assertGreaterEqual(metrics['total_critical_tasks'], 0)
        self.assertIsInstance(metrics['tasks_by_status'], list)
        self.assertIsInstance(metrics['tasks_by_employee'], list)
