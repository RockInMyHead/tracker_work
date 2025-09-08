"""
URLs for tasks app
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .auth import login_view, logout_view, register_view, TokenRefreshView

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r"tasks", views.TaskViewSet)
router.register(r"employees", views.EmployeeViewSet)
router.register(r"task-images", views.TaskImageViewSet)
router.register(r"task-messages", views.TaskMessageViewSet)
router.register(r"task-dependencies", views.TaskDependencyViewSet)

# The API URLs are now determined automatically by the router
urlpatterns = [
    path("", include(router.urls)),

    # Authentication endpoints
    path("auth/login/", login_view, name="auth-login"),
    path("auth/logout/", logout_view, name="auth-logout"),
    path("auth/register/", register_view, name="auth-register"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
]
