import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from .factories import EmployeeFactory, TaskFactory


@pytest.mark.django_db
class TestEmployeeAPI:
    """Test cases for Employee API."""

    def test_list_employees(self, api_client):
        """Test listing employees."""
        EmployeeFactory.create_batch(3)

        url = reverse("employee-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 3

    def test_create_employee(self, api_client):
        """Test creating an employee."""
        url = reverse("employee-list")
        data = {
            "full_name": "John Doe",
            "position": "Developer",
            "email": "john.doe@example.com",
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["full_name"] == "John Doe"
        assert response.data["position"] == "Developer"

    def test_employee_workload_detail(self, api_client):
        """Test getting employee workload metrics."""
        employee = EmployeeFactory()
        TaskFactory.create_batch(3, assignee=employee)

        url = reverse("employee-workload-detail", kwargs={"pk": employee.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "total_tasks" in response.data
        assert "active_tasks" in response.data
        assert "critical_tasks" in response.data


@pytest.mark.django_db
class TestTaskAPI:
    """Test cases for Task API."""

    def test_list_tasks(self, api_client):
        """Test listing tasks."""
        TaskFactory.create_batch(3)

        url = reverse("task-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 3

    def test_create_task(self, api_client):
        """Test creating a task."""
        employee = EmployeeFactory()
        url = reverse("task-list")
        data = {
            "title": "Test Task",
            "due_date": (timezone.now().date() + timezone.timedelta(days=7)).isoformat(),
            "status": "new",
            "priority": 5,
            "assignee_id": str(employee.id),
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Test Task"
        assert response.data["assignee"]["id"] == str(employee.id)

    def test_create_task_with_parent(self, api_client):
        """Test creating a task with parent."""
        parent_task = TaskFactory()
        employee = EmployeeFactory()

        url = reverse("task-list")
        data = {
            "title": "Child Task",
            "parent": str(parent_task.id),
            "due_date": (timezone.now().date() + timezone.timedelta(days=7)).isoformat(),
            "status": "new",
            "assignee_id": str(employee.id),
        }

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert str(response.data["parent"]) == str(parent_task.id)

    def test_update_task_status(self, api_client):
        """Test updating task status."""
        task = TaskFactory()
        url = reverse("task-detail", kwargs={"pk": task.pk})
        data = {
            "title": task.title,
            "due_date": task.due_date.isoformat(),
            "status": "in_progress",
        }

        response = api_client.put(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "in_progress"

    def test_get_active_tasks(self, api_client):
        """Test getting active tasks."""
        TaskFactory.create_batch(2, status="new")
        TaskFactory.create_batch(2, status="in_progress")
        TaskFactory(status="done")

        url = reverse("task-active")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 4  # 2 NEW + 2 IN_PROGRESS

        for task_data in response.data:
            assert task_data["status"] in ["new", "in_progress"]

    def test_get_critical_tasks(self, api_client):
        """Test getting critical tasks."""
        parent_task = TaskFactory(status="new")
        TaskFactory(parent=parent_task, status="in_progress")
        TaskFactory(status="new")  # Not critical - no active subtasks

        url = reverse("task-critical")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["id"] == str(parent_task.id)

    def test_get_workload_metrics(self, api_client):
        """Test getting workload metrics."""
        TaskFactory.create_batch(3, status="new")
        TaskFactory.create_batch(2, status="in_progress")
        TaskFactory(status="done")

        url = reverse("task-metrics")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "total_active_tasks" in response.data
        assert "total_critical_tasks" in response.data
        assert "tasks_by_status" in response.data
        assert "tasks_by_employee" in response.data

    def test_task_business_rules(self, api_client):
        """Test task business rules properties."""
        task = TaskFactory(status="new")
        url = reverse("task-detail", kwargs={"pk": task.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        task_data = response.data

        assert "is_active" in task_data
        assert "is_critical" in task_data
        assert task_data["is_active"] is True  # NEW status is active
        assert task_data["is_critical"] is False  # No active subtasks

    def test_task_filters(self, api_client):
        """Test task filtering."""
        employee = EmployeeFactory()
        task1 = TaskFactory(status="new", assignee=employee)
        task2 = TaskFactory(status="in_progress", assignee=employee)

        # Test status filter
        response = api_client.get(reverse("task-list"), {"status": "new"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert len(response.data['results']) == 1

        # Test assignee filter
        response = api_client.get(reverse("task-list"), {"assignee": str(employee.id)})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2
        assert len(response.data['results']) == 2

        # Test search
        response = api_client.get(reverse("task-list"), {"q": task1.title[:5]})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_employee_filters(self, api_client):
        """Test employee filtering."""
        employee1 = EmployeeFactory(full_name="John Doe")
        employee2 = EmployeeFactory(full_name="Jane Smith")

        # Test search filter
        response = api_client.get(reverse("employee-list"), {"q": "John"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

        # Test is_active filter
        response = api_client.get(reverse("employee-list"), {"is_active": "true"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 2

    def test_workload_endpoint(self, api_client):
        """Test workload endpoint."""
        employee = EmployeeFactory()
        TaskFactory.create_batch(3, assignee=employee, status="in_progress")

        response = api_client.get(reverse("employee-workload"))
        assert response.status_code == status.HTTP_200_OK

        # Should return employees with active tasks
        assert len(response.data) >= 1

        employee_data = response.data[0]
        assert "employee_id" in employee_data
        assert "full_name" in employee_data
        assert "active_tasks_count" in employee_data
        assert "tasks" in employee_data

    def test_important_tasks_endpoint(self, api_client):
        """Test important tasks endpoint with recommendations."""
        # Create critical task (NEW with IN_PROGRESS subtask)
        parent_task = TaskFactory(status="new")
        TaskFactory(parent=parent_task, status="in_progress")

        # Create non-critical task
        TaskFactory(status="new")

        response = api_client.get(reverse("task-important"))
        assert response.status_code == status.HTTP_200_OK

        # Should return only critical tasks
        assert len(response.data) == 1

        task_data = response.data[0]
        assert "task_id" in task_data
        assert "title" in task_data
        assert "recommended_employees" in task_data

        # Check recommendations structure
        recommendations = task_data["recommended_employees"]
        assert len(recommendations) > 0

        rec = recommendations[0]
        assert "employee_id" in rec
        assert "full_name" in rec
        assert "reason" in rec
