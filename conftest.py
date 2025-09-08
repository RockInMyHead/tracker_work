import pytest
from django.test import RequestFactory
from rest_framework.test import APIClient

from tasks.models import Employee, Task
from tasks.tests.factories import EmployeeFactory, TaskFactory


@pytest.fixture
def api_client():
    """Return an API client instance."""
    return APIClient()


@pytest.fixture
def employee():
    """Return a test employee."""
    return EmployeeFactory()


@pytest.fixture
def task(employee):
    """Return a test task."""
    return TaskFactory(assignee=employee)


@pytest.fixture
def request_factory():
    """Return a Django request factory."""
    return RequestFactory()
