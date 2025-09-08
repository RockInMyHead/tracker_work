import django_filters
from django.db.models import Q

from .models import Employee, Task


class EmployeeFilter(django_filters.FilterSet):
    """Filter for Employee model."""

    q = django_filters.CharFilter(method='search_full_name', label='Search')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = Employee
        fields = ['q', 'is_active']

    def search_full_name(self, queryset, name, value):
        """Search by full_name, position, or email."""
        if not value:
            return queryset
        return queryset.filter(
            Q(full_name__icontains=value) |
            Q(position__icontains=value) |
            Q(email__icontains=value)
        )


class TaskFilter(django_filters.FilterSet):
    """Filter for Task model."""

    status = django_filters.ChoiceFilter(choices=Task.Status.choices)
    assignee = django_filters.UUIDFilter(field_name='assignee_id')
    due_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    parent_isnull = django_filters.BooleanFilter(field_name='parent', lookup_expr='isnull')
    q = django_filters.CharFilter(method='search_title', label='Search')

    class Meta:
        model = Task
        fields = [
            'status', 'assignee', 'due_before', 'due_after',
            'parent_isnull', 'q'
        ]

    def search_title(self, queryset, name, value):
        """Search by title."""
        if not value:
            return queryset
        return queryset.filter(title__icontains=value)

