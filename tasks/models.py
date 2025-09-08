from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid


class Employee(models.Model):
    """Employee model for task management system."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        verbose_name=_("user"),
        null=True,
        blank=True
    )
    full_name = models.CharField(_("full name"), max_length=200, db_index=True)
    position = models.CharField(_("position"), max_length=100)
    email = models.EmailField(_("email"), unique=True, null=True, blank=True)
    is_active = models.BooleanField(_("is active"), default=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("employee")
        verbose_name_plural = _("employees")
        ordering = ["full_name"]
        indexes = [
            models.Index(fields=["is_active", "full_name"]),
        ]

    def __str__(self):
        return self.full_name


class Task(models.Model):
    """Task model for task management system."""

    class Status(models.TextChoices):
        NEW = "new", _("New")
        IN_PROGRESS = "in_progress", _("In Progress")
        DONE = "done", _("Done")
        CANCELLED = "cancelled", _("Cancelled")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(_("title"), max_length=300, db_index=True)
    description = models.TextField(_("description"), blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subtasks',
        verbose_name=_("parent task"),
    )
    assignee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        verbose_name=_("assignee"),
    )
    due_date = models.DateField(_("due date"))
    start_date = models.DateField(_("start date"), null=True, blank=True)
    end_date = models.DateField(_("end date"), null=True, blank=True)
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )
    priority = models.IntegerField(_("priority"), null=True, blank=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("task")
        verbose_name_plural = _("tasks")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["assignee", "status"]),
            models.Index(fields=["due_date"]),
            models.Index(fields=["start_date"]),
            models.Index(fields=["end_date"]),
            models.Index(fields=["parent"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(parent_id__isnull=True) | ~models.Q(parent_id=models.F('id')),
                name='task_no_self_reference'
            ),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        """Validate task data."""
        super().clean()
        self._validate_parent_hierarchy()

    def _validate_parent_hierarchy(self):
        """Validate that parent hierarchy doesn't create cycles using DFS."""
        if not self.parent:
            return

        visited = set()
        current = self.parent

        while current:
            if current.id in visited:
                raise ValidationError(_("Parent hierarchy contains a cycle."))
            if current.id == self.id:
                raise ValidationError(_("Cannot set task as its own parent."))

            visited.add(current.id)
            current = current.parent

    def save(self, *args, **kwargs):
        """Override save to run validation."""
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Check if task is overdue."""
        if self.status in [self.Status.DONE, self.Status.CANCELLED]:
            return False

        from django.utils import timezone
        return self.due_date < timezone.now().date()

    @property
    def subtasks_count(self):
        """Return number of direct subtasks."""
        return self.subtasks.count()

    @property
    def all_subtasks_count(self):
        """Return total number of all subtasks (recursive)."""
        count = 0
        for subtask in self.subtasks.all():
            count += 1 + subtask.all_subtasks_count
        return count

    @property
    def is_active(self):
        """Check if task is active for workload metrics."""
        return self.status.upper() in settings.TASK_CONFIG["ACTIVE_STATUSES"]

    @property
    def is_critical(self):
        """Check if task is critical (has NEW status and active subtasks)."""
        if self.status.upper() != settings.TASK_CONFIG["CRITICAL_PARENT_STATUS"]:
            return False

        # Check if any child task is in IN_PROGRESS status
        return self.subtasks.filter(
            status__iexact=settings.TASK_CONFIG["CRITICAL_CHILD_STATUS"]
        ).exists()

    @classmethod
    def get_active_tasks(cls):
        """Return queryset of active tasks for workload metrics."""
        return cls.objects.filter(
            status__in=[s.lower() for s in settings.TASK_CONFIG["ACTIVE_STATUSES"]]
        )

    @classmethod
    def get_critical_tasks(cls):
        """Return queryset of critical tasks."""
        # Tasks with NEW status that have children in IN_PROGRESS status
        return cls.objects.filter(
            status__iexact=settings.TASK_CONFIG["CRITICAL_PARENT_STATUS"]
        ).filter(
            subtasks__status__iexact=settings.TASK_CONFIG["CRITICAL_CHILD_STATUS"]
        ).distinct()

    @classmethod
    def get_employee_workload(cls, employee):
        """Get workload metrics for a specific employee."""
        from django.utils import timezone
        tasks = cls.objects.filter(assignee=employee)
        active_tasks = tasks.filter(status__in=[s.lower() for s in settings.TASK_CONFIG["ACTIVE_STATUSES"]])
        critical_tasks = tasks.filter(
            status__iexact=settings.TASK_CONFIG["CRITICAL_PARENT_STATUS"]
        ).filter(
            subtasks__status__iexact=settings.TASK_CONFIG["CRITICAL_CHILD_STATUS"]
        ).distinct()

        # Calculate overdue tasks manually
        overdue_tasks = tasks.filter(
            due_date__lt=timezone.now().date(),
            status__in=[s.lower() for s in settings.TASK_CONFIG["ACTIVE_STATUSES"]]
        ).exclude(status__in=['done', 'cancelled'])

        return {
            'total_tasks': tasks.count(),
            'active_tasks': active_tasks.count(),
            'critical_tasks': critical_tasks.count(),
            'overdue_tasks': overdue_tasks.count(),
        }

    @classmethod
    def get_workload_metrics(cls):
        """Get overall workload metrics."""
        from django.utils import timezone
        active_tasks = cls.get_active_tasks()
        critical_tasks = cls.get_critical_tasks()

        # Calculate overdue tasks manually since is_overdue is a property
        overdue_tasks = cls.objects.filter(
            due_date__lt=timezone.now().date(),
            status__in=[s.lower() for s in settings.TASK_CONFIG["ACTIVE_STATUSES"]]
        ).exclude(status__in=['done', 'cancelled'])

        return {
            'total_active_tasks': active_tasks.count(),
            'total_critical_tasks': critical_tasks.count(),
            'overdue_tasks': overdue_tasks.count(),
            'tasks_by_status': cls.objects.values('status').annotate(
                count=models.Count('id')
            ).order_by('status'),
            'tasks_by_employee': cls.objects.filter(assignee__isnull=False).values(
                'assignee__full_name'
            ).annotate(
                total=models.Count('id'),
                active=models.Count('id', filter=models.Q(
                    status__in=[s.lower() for s in settings.TASK_CONFIG["ACTIVE_STATUSES"]]
                )),
                critical=models.Count('id', filter=models.Q(
                    status__iexact=settings.TASK_CONFIG["CRITICAL_PARENT_STATUS"]
                ) & models.Q(
                    subtasks__status__iexact=settings.TASK_CONFIG["CRITICAL_CHILD_STATUS"]
                )),
            ).distinct().order_by('-active'),
        }


class TaskImage(models.Model):
    """Image attachment for tasks."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_("task"),
    )
    image = models.ImageField(_("image"), upload_to='task_images/')
    caption = models.CharField(_("caption"), max_length=200, blank=True, null=True)
    uploaded_by = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_images',
        verbose_name=_("uploaded by"),
    )
    uploaded_at = models.DateTimeField(_("uploaded at"), auto_now_add=True)

    class Meta:
        verbose_name = _("task image")
        verbose_name_plural = _("task images")
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Image for {self.task.title}"


class TaskMessage(models.Model):
    """Message in task chat."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name=_("task"),
    )
    sender = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_messages',
        verbose_name=_("sender"),
    )
    message = models.TextField(_("message"))
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("task message")
        verbose_name_plural = _("task messages")
        ordering = ["created_at"]

    def __str__(self):
        sender_name = self.sender.full_name if self.sender else "Unknown"
        return f"Message from {sender_name} in {self.task.title}"


class TaskDependency(models.Model):
    """Dependency between tasks for Gantt chart."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    predecessor = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='successor_dependencies',
        verbose_name=_("predecessor"),
        help_text=_("Task that must be completed before the successor")
    )
    successor = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='predecessor_dependencies',
        verbose_name=_("successor"),
        help_text=_("Task that depends on the predecessor")
    )
    dependency_type = models.CharField(
        _("dependency type"),
        max_length=20,
        choices=[
            ('finish_to_start', _('Finish to Start')),
            ('start_to_start', _('Start to Start')),
            ('finish_to_finish', _('Finish to Finish')),
            ('start_to_finish', _('Start to Finish')),
        ],
        default='finish_to_start',
    )
    lag_days = models.IntegerField(
        _("lag days"),
        default=0,
        help_text=_("Number of days to add to the dependency")
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        verbose_name = _("task dependency")
        verbose_name_plural = _("task dependencies")
        ordering = ["predecessor__title", "successor__title"]
        unique_together = ['predecessor', 'successor']
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(predecessor=models.F('successor')),
                name='task_dependency_no_self_reference'
            ),
        ]

    def __str__(self):
        return f"{self.predecessor.title} → {self.successor.title}"

    def clean(self):
        """Validate dependency data."""
        super().clean()
        if self.predecessor_id == self.successor_id:
            raise ValidationError(_("Task cannot depend on itself."))

        # Check for circular dependencies
        self._validate_no_circular_dependency()

    def _validate_no_circular_dependency(self):
        """Validate that this dependency doesn't create circular dependencies."""
        visited = set()
        current = self.successor

        while current:
            if current.id in visited:
                raise ValidationError(_("This dependency would create a circular dependency."))
            if current.id == self.predecessor_id:
                raise ValidationError(_("This dependency would create a circular dependency."))

            visited.add(current.id)

            # Find next successor that this current task depends on
            try:
                dependency = TaskDependency.objects.filter(
                    predecessor=current
                ).exclude(successor=self.predecessor).first()
                current = dependency.successor if dependency else None
            except TaskDependency.DoesNotExist:
                current = None

    def save(self, *args, **kwargs):
        """Override save to run validation."""
        self.full_clean()
        super().save(*args, **kwargs)
