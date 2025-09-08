import factory
from django.utils import timezone

from tasks.models import Employee, Task


class EmployeeFactory(factory.django.DjangoModelFactory):
    """Factory for Employee model."""

    class Meta:
        model = Employee

    full_name = factory.Faker("name")
    position = factory.Faker("job")
    email = factory.LazyAttribute(lambda obj: f"{obj.full_name.lower().replace(' ', '.')}@example.com")


class TaskFactory(factory.django.DjangoModelFactory):
    """Factory for Task model."""

    class Meta:
        model = Task

    title = factory.Faker("sentence", nb_words=4)
    due_date = factory.LazyFunction(lambda: timezone.now().date() + timezone.timedelta(days=7))
    status = Task.Status.NEW
    priority = factory.Faker("random_int", min=1, max=10)
    assignee = factory.SubFactory(EmployeeFactory)
