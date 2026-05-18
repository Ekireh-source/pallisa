from django.urls import path
from .views import (
    AssignUserPermissionAPIView,
    ForgotPasswordView,
    PermissionListView,
    RemoveDirectUserPermissionAPIView,
    ResetPasswordView,
    RoleDetailView,
    RoleListCreateView,
    RoleAssignPermissionsView,
    UserPermissionListAPIView,
    UserProfileListView,
    UserProfileDetailView,
    CurrentUserProfileView,
    PasswordResetRequestView,
    DocumentListCreateAPIView,
    DocumentDownloadAPIView,
    DocumentDetailAPIView,
    ProfileDocumentListAPIView,
)
from .auth_views import (
    UserRegistrationView,
    LoginView,
    LogoutView,
    VerifyEmailView,
    ResendVerificationEmailView,
    TokenRefreshView,
)

urlpatterns = [
    # Authentication endpoints (using refactored auth_views)
    path('register/', UserRegistrationView.as_view(), name='user-registration'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    
    # JWT Token endpoints
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # User management endpoints
    path('profiles/', UserProfileListView.as_view(), name='profile-list'),
    path('profiles/<int:pk>/', UserProfileDetailView.as_view(), name='profile-detail'),
    path('profile/', CurrentUserProfileView.as_view(), name='current-user-profile'),
    
    # Password reset endpoints
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    
    # Document endpoints
    path('documents/', DocumentListCreateAPIView.as_view(), name='user-documents'),
    path('documents/<int:pk>/', DocumentDetailAPIView.as_view, name='view-documents'),
    path('documents/<int:pk>/download/', DocumentDownloadAPIView.as_view(), name='document-download'),
    path('user-documents/', ProfileDocumentListAPIView.as_view()),
    
    # Role and permission endpoints
    path('roles/', RoleListCreateView.as_view(), name='role-list-create'),
    path('roles/<int:pk>/', RoleDetailView.as_view(), name='role-detail'),
    path('roles/<int:pk>/assign-permissions/', RoleAssignPermissionsView.as_view(), name='role-assign-permissions'),
    path('permissions/', PermissionListView.as_view()),
    path("user-permissions/assign/", AssignUserPermissionAPIView.as_view(), name="assign-user-permission"),
    path("user-permissions/remove/", RemoveDirectUserPermissionAPIView.as_view(), name="remove-user-permission"),
    path("user-permissions/", UserPermissionListAPIView.as_view(), name="user-permissions-list"),
]