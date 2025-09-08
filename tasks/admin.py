from django.contrib import admin

from .models import Employee, Task


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    """Admin interface for Employee model."""

    list_display = ["full_name", "position", "email", "is_active", "created_at"]
    list_filter = ["is_active", "position", "created_at", "updated_at"]
    search_fields = ["full_name", "email", "position"]
    readonly_fields = ["created_at", "updated_at"]
    list_editable = ["is_active"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin interface for Task model."""

    list_display = [
        "title", "parent", "assignee", "status", "priority",
        "due_date", "is_overdue", "is_active", "is_critical", "subtasks_count"
    ]
    list_filter = ["status", "priority", "due_date", "created_at", "updated_at"]
    search_fields = ["title"]
    readonly_fields = [
        "created_at", "updated_at", "is_overdue", "is_active",
        "is_critical", "subtasks_count", "all_subtasks_count"
    ]
    list_editable = ["status", "priority"]
    raw_id_fields = ["parent", "assignee"]
