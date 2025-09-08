from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import Employee, Task, TaskDependency


class EmployeeSerializer(serializers.ModelSerializer):
    """Serializer for Employee model."""

    class Meta:
        model = Employee
        fields = [
            "id",
            "full_name",
            "position",
            "email",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_email(self, value):
        """Validate email format and uniqueness."""
        if value:
            # Check email format (this is handled by EmailField, but we can add custom validation)
            if '@' not in value or '.' not in value:
                raise serializers.ValidationError(_("Invalid email format."))

            # Check for duplicates (case-insensitive)
            queryset = Employee.objects.filter(email__iexact=value)
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError(_("Employee with this email already exists."))

        return value


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""

    parent = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(),
        required=False,
        allow_null=True,
    )
    assignee = EmployeeSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        source="assignee",
        write_only=True,
        required=False,
        allow_null=True,
    )
    is_overdue = serializers.ReadOnlyField()
    is_active = serializers.ReadOnlyField()
    is_critical = serializers.ReadOnlyField()
    subtasks_count = serializers.ReadOnlyField()
    all_subtasks_count = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "parent",
            "assignee",
            "assignee_id",
            "due_date",
            "start_date",
            "end_date",
            "status",
            "priority",
            "is_overdue",
            "is_active",
            "is_critical",
            "subtasks_count",
            "all_subtasks_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "is_overdue",
            "is_active",
            "is_critical",
            "subtasks_count",
            "all_subtasks_count",
        ]

    def validate_parent(self, value):
        """Validate parent task relationship."""
        if value and self.instance and value.id == self.instance.id:
            raise serializers.ValidationError(_("Task cannot be its own parent."))
        return value

    def validate_due_date(self, value):
        """Validate due date is not in the past."""
        from django.conf import settings
        from django.utils import timezone

        # Check if due_date validation is enabled (optional flag)
        if getattr(settings, 'TASK_VALIDATION_DUE_DATE_NOT_PAST', True):
            if value < timezone.now().date():
                raise serializers.ValidationError(_("Due date cannot be in the past."))

        return value

    def validate_status(self, value):
        """Validate status transition."""
        from django.conf import settings

        # Check if business validation is enabled (optional)
        if getattr(settings, 'TASK_VALIDATION_STATUS_BUSINESS_RULES', True):
            if value == Task.Status.DONE and self.instance:
                # Check if task has children in IN_PROGRESS status
                in_progress_children = self.instance.subtasks.filter(
                    status=Task.Status.IN_PROGRESS
                ).exists()
                if in_progress_children:
                    raise serializers.ValidationError(
                        _("Cannot mark task as DONE while it has subtasks in progress.")
                    )

        return value

    def validate(self, attrs):
        """Comprehensive validation for task data."""
        parent = attrs.get('parent')
        status = attrs.get('status')

        # Validate parent hierarchy for cycles using DFS
        if parent:
            self._validate_parent_cycle(parent)

        # Validate status business rules if status is being changed
        if status and self.instance and status != self.instance.status:
            # Temporarily set the status to validate business rules
            temp_instance = self.instance
            temp_instance.status = status
            try:
                self.validate_status(status)
            except serializers.ValidationError as e:
                raise serializers.ValidationError({"status": e.detail})

        return attrs

    def _validate_parent_cycle(self, parent):
        """Validate parent hierarchy doesn't create cycles using DFS."""
        if not self.instance:
            return

        visited = set()
        current = parent

        while current:
            if current.id in visited:
                raise serializers.ValidationError({
                    "parent": _("Parent hierarchy contains a cycle.")
                })
            if current.id == self.instance.id:
                raise serializers.ValidationError({
                    "parent": _("Cannot set task as its own ancestor.")
                })

            visited.add(current.id)
            current = current.parent


# Import additional models after TaskSerializer definition
from .models import TaskImage, TaskMessage, TaskDependency


class TaskImageSerializer(serializers.ModelSerializer):
    """Serializer for TaskImage model."""

    uploaded_by = EmployeeSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskImage
        fields = [
            "id",
            "task",
            "image",
            "image_url",
            "caption",
            "uploaded_by",
            "uploaded_at",
        ]
        read_only_fields = ["id", "uploaded_at", "uploaded_by"]

    def get_image_url(self, obj):
        """Return full URL for the image."""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class TaskMessageSerializer(serializers.ModelSerializer):
    """Serializer for TaskMessage model."""

    sender = EmployeeSerializer(read_only=True)

    class Meta:
        model = TaskMessage
        fields = [
            "id",
            "task",
            "sender",
            "message",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "sender"]


class TaskDependencySerializer(serializers.ModelSerializer):
    """Serializer for TaskDependency model."""

    predecessor_title = serializers.CharField(source='predecessor.title', read_only=True)
    successor_title = serializers.CharField(source='successor.title', read_only=True)
    predecessor_assignee = serializers.CharField(source='predecessor.assignee.full_name', read_only=True)
    successor_assignee = serializers.CharField(source='successor.assignee.full_name', read_only=True)

    class Meta:
        model = TaskDependency
        fields = [
            "id",
            "predecessor",
            "successor",
            "predecessor_title",
            "successor_title",
            "predecessor_assignee",
            "successor_assignee",
            "dependency_type",
            "lag_days",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
