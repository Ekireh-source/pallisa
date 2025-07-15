# Accounts App Refactoring Documentation

## Overview

The accounts app has been significantly refactored to improve efficiency, maintainability, and testing coverage. This document outlines the changes made and how to use the improved system.

## Key Improvements

### 1. **Code Structure & Architecture**

#### Before:
- Monolithic `views.py` (1055 lines) handling all responsibilities
- Mixed concerns within single views
- No service layer abstraction
- Duplicate code in models

#### After:
- **Separated Views**: Split into `auth_views.py` for authentication and kept `views.py` for other operations
- **Service Layer**: Created `services.py` with dedicated service classes:
  - `AuthenticationService`: Handles login, registration, email verification
  - `UserService`: Manages user profile operations
  - `PasswordResetService`: Handles password reset functionality
- **Clean Architecture**: Better separation of concerns

### 2. **Database Optimizations**

#### Improvements Made:
- Added database indexes on frequently queried fields (`email`, `student_id`, `otp`, `expires_at`)
- Implemented `select_related()` and `prefetch_related()` for optimized queries
- Added composite indexes for common query patterns
- Updated model Meta classes with proper indexing

#### Performance Impact:
- Faster user authentication lookups
- Optimized OTP verification queries
- Reduced N+1 query problems in user profile retrievals

### 3. **Security Enhancements**

#### New Security Features:
- **Rate Limiting**: Login attempts limited to 5 per hour per user
- **OTP Rate Limiting**: Resend OTP limited to once per minute
- **Improved Error Handling**: Consistent error responses without information leakage
- **Proper Logging**: Security events are logged for monitoring

### 4. **Comprehensive Testing**

#### Test Coverage:
- **Model Tests**: Full coverage of CustomUser and EmailVerificationToken models
- **Service Layer Tests**: All business logic thoroughly tested
- **API Integration Tests**: Complete end-to-end testing of all authentication flows
- **Edge Cases**: Invalid data, expired tokens, rate limiting, etc.

#### Test Organization:
- **Factories**: Using factory_boy for clean test data generation
- **Fast Test Configuration**: Optimized settings for quick test execution
- **Mocking**: External dependencies properly mocked

## New File Structure

```
accounts/
├── models.py              # Enhanced with optimizations and fixed duplications
├── services.py            # NEW: Business logic layer
├── auth_views.py          # NEW: Authentication-specific views
├── views.py               # Refactored: Non-auth views only
├── tests.py               # NEW: Comprehensive test suite
├── factories.py           # NEW: Test data factories
├── serializers.py         # Enhanced validation
├── urls.py                # Updated routing
└── utils.py               # Utility functions
```

## Running Tests

### Prerequisites
```bash
pip install -r requirements.txt
```

### Run All Tests
```bash
# Using Django's test runner
python manage.py test accounts --settings=test_settings

# Using the custom test runner
python run_tests.py

# With coverage report
coverage run --source='.' manage.py test accounts --settings=test_settings
coverage report -m
```

### Run Specific Test Classes
```bash
# Test only authentication
python manage.py test accounts.tests.LoginAPITest --settings=test_settings

# Test only models
python manage.py test accounts.tests.CustomUserModelTest --settings=test_settings

# Test only services
python manage.py test accounts.tests.AuthenticationServiceTest --settings=test_settings
```

## API Usage Examples

### User Registration
```python
POST /accounts/register/
{
    "email": "user@example.com",
    "password": "securepass123",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "student",
    "phone": "+1234567890"
}

Response (201):
{
    "message": "Registration successful. Please check your email for verification code.",
    "user": {...},
    "requires_verification": true
}
```

### Email Verification
```python
POST /accounts/verify-email/
{
    "email": "user@example.com",
    "otp": "123456"
}

Response (200):
{
    "message": "Email verified successfully. You are now logged in.",
    "access": "jwt-access-token",
    "refresh": "jwt-refresh-token",
    "user_profile": {...}
}
```

### Login
```python
POST /accounts/login/
{
    "email": "user@example.com",  # or "student_id": "STU001"
    "password": "securepass123"
}

Response (200):
{
    "access": "jwt-access-token",
    "refresh": "jwt-refresh-token",
    "user_profile": {...},
    "user_info": {...}
}
```

## Database Migrations

After the refactoring, you'll need to create and apply migrations for the database optimizations:

```bash
python manage.py makemigrations accounts
python manage.py migrate
```

## Performance Monitoring

### Key Metrics to Monitor:
1. **Authentication Response Times**: Should be < 200ms
2. **Database Query Count**: Reduced N+1 queries
3. **Failed Login Attempts**: Rate limiting effectiveness
4. **OTP Verification Success Rate**: Email delivery monitoring

### Logging
Authentication events are logged at appropriate levels:
- **INFO**: Successful operations
- **WARNING**: Failed authentication attempts, rate limiting
- **ERROR**: System errors, email sending failures

## Configuration

### Required Settings
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

# Email configuration for OTP sending
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'your-smtp-host'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email'
EMAIL_HOST_PASSWORD = 'your-password'
DEFAULT_FROM_EMAIL = 'noreply@yourdomain.com'
```

## Error Handling

The refactored system provides consistent error responses:

### Validation Errors (400)
```json
{
    "email": ["This field is required."],
    "password": ["This field is required."]
}
```

### Authentication Errors (401)
```json
{
    "error": "Invalid credentials"
}
```

### Rate Limiting (429)
```json
{
    "error": "Too many login attempts. Please try again later."
}
```

## Migration Guide

### For Existing Deployments:
1. **Backup Database**: Always backup before applying changes
2. **Install Dependencies**: Update requirements.txt packages
3. **Apply Migrations**: Run database migrations
4. **Update URLs**: Ensure URL routing is updated
5. **Test Thoroughly**: Run the full test suite
6. **Monitor**: Watch logs for any issues after deployment

### Breaking Changes:
- None - All existing API endpoints maintain backward compatibility
- Database schema changes are additive (new indexes only)

## Future Improvements

### Planned Enhancements:
1. **Two-Factor Authentication**: SMS/App-based 2FA
2. **Social Login**: OAuth integration
3. **Password Policies**: Configurable password requirements
4. **Account Lockout**: Temporary account suspension after repeated failures
5. **Audit Logging**: Detailed user activity tracking

## Support

For questions or issues related to the refactored accounts app, please:
1. Check the test cases for usage examples
2. Review the service layer documentation
3. Check logs for detailed error information 