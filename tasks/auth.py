from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Employee
from .serializers import EmployeeSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate user and return JWT tokens.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'error': 'User account is disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)

    # Get employee profile if exists
    employee_data = None
    if hasattr(user, 'employee_profile') and user.employee_profile:
        employee_data = EmployeeSerializer(user.employee_profile).data

    return Response({
        'refresh': str(refresh),
        'access': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'groups': list(user.groups.values_list('name', flat=True))
        },
        'employee_profile': employee_data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    Logout user by blacklisting the refresh token.
    """
    refresh_token = request.data.get('refresh')

    if not refresh_token:
        # If no refresh token provided, just return success
        # This handles cases where token expired or was cleared
        return Response({'message': 'Successfully logged out'})

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        # If token is invalid/expired, still return success
        # because the user is effectively logged out
        return Response({'message': 'Successfully logged out'})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register a new user and create employee profile.
    """
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    full_name = request.data.get('full_name', f'{first_name} {last_name}'.strip())
    position = request.data.get('position', 'Employee')

    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )

        # Create employee profile
        employee = Employee.objects.create(
            user=user,
            full_name=full_name,
            position=position,
            email=email
        )

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'User registered successfully',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'employee_profile': EmployeeSerializer(employee).data
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        # Clean up if something went wrong
        if 'user' in locals():
            user.delete()
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


class TokenRefreshView(generics.GenericAPIView):
    """
    Refresh access token using refresh token.
    """
    permission_classes = [AllowAny]

    serializer_class = None  # We don't need a serializer for this view

    def post(self, request):
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            return Response({
                'access': access_token
            })
        except Exception as e:
            return Response(
                {'error': 'Invalid refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )
