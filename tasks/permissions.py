from rest_framework import permissions
from django.contrib.auth.models import User


class IsManager(permissions.BasePermission):
    """
    Custom permission to only allow managers to access.
    Manager can perform CRUD operations on all resources.
    """

    def has_permission(self, request, view):
        # Check if user has manager role
        # For now, we'll use a simple group-based approach
        # In production, you might want to use a proper role model
        return (
            request.user and
            request.user.is_authenticated and
            request.user.groups.filter(name='manager').exists()
        )


class IsEmployee(permissions.BasePermission):
    """
    Custom permission to only allow employees to access their own resources.
    """

    def has_permission(self, request, view):
        # Allow all authenticated users to see the list
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # For object-level permissions
        if request.user.groups.filter(name='manager').exists():
            # Managers can access all objects
            return True

        # Employees can only access their own objects
        if hasattr(obj, 'assignee') and obj.assignee:
            return obj.assignee == request.user.employee_profile
        elif hasattr(obj, 'user'):
            return obj.user == request.user

        return False


class IsManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission for manager full access, others read-only.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to managers
        return (
            request.user and
            request.user.groups.filter(name='manager').exists()
        )


class IsOwnerOrManager(permissions.BasePermission):
    """
    Custom permission for object owners or managers.
    """

    def has_object_permission(self, request, view, obj):
        # Managers have full access
        if request.user.groups.filter(name='manager').exists():
            return True

        # Object owners have access
        if hasattr(obj, 'assignee') and obj.assignee:
            return obj.assignee == request.user.employee_profile

        return False
