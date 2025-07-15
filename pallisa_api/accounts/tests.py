from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core import mail
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
from django.core.cache import cache
import factory

from .models import CustomUser, UserProfile, EmailVerificationToken, PasswordResetToken, Role, Permission, School, Campus, SetupSteps
from .services import AuthenticationService, UserService, PasswordResetService, SchoolService
from .serializers import UserRegistrationSerializer, LoginSerializer
from .factories import UserFactory, UserProfileFactory, SchoolFactory, CampusFactory

User = get_user_model()


class CustomUserModelTest(TestCase):
    """Test cases for CustomUser model"""
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
    
    def test_create_user(self):
        """Test creating a user with email and password"""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.email, self.user_data['email'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertFalse(user.email_verified)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(**self.user_data)
        
        self.assertEqual(user.email, self.user_data['email'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
    
    def test_create_user_without_email(self):
        """Test creating user without email raises error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='testpass123')
    
    def test_get_by_natural_key_with_email(self):
        """Test getting user by email using natural key"""
        user = User.objects.create_user(**self.user_data)
        found_user = User.objects.get_by_natural_key(self.user_data['email'])
        self.assertEqual(user, found_user)
    
    def test_get_by_natural_key_with_student_id(self):
        """Test getting user by student_id using natural key"""
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            student_id='STU001'
        )
        found_user = User.objects.get_by_natural_key('STU001')
        self.assertEqual(user, found_user)


class EmailVerificationTokenModelTest(TestCase):
    """Test cases for EmailVerificationToken model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_for_user(self):
        """Test creating verification token for user"""
        token_obj, otp = EmailVerificationToken.create_for_user(self.user)
        
        self.assertEqual(token_obj.user, self.user)
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())
        self.assertTrue(token_obj.is_valid())
    
    def test_verify_otp_success(self):
        """Test successful OTP verification"""
        token_obj, otp = EmailVerificationToken.create_for_user(self.user)
        
        verified_token = EmailVerificationToken.verify_otp(self.user.email, otp)
        self.assertEqual(verified_token, token_obj)
    
    def test_verify_otp_invalid(self):
        """Test OTP verification with invalid OTP"""
        EmailVerificationToken.create_for_user(self.user)
        
        with self.assertRaises(EmailVerificationToken.DoesNotExist):
            EmailVerificationToken.verify_otp(self.user.email, '000000')
    
    def test_verify_otp_expired(self):
        """Test OTP verification with expired token"""
        token_obj, otp = EmailVerificationToken.create_for_user(self.user)
        
        # Manually expire the token
        token_obj.expires_at = timezone.now() - timedelta(minutes=1)
        token_obj.save()
        
        with self.assertRaises(ValueError):
            EmailVerificationToken.verify_otp(self.user.email, otp)
    
    def test_replace_existing_token(self):
        """Test that creating new token replaces existing one"""
        # Create first token
        token_obj1, otp1 = EmailVerificationToken.create_for_user(self.user)
        
        # Create second token
        token_obj2, otp2 = EmailVerificationToken.create_for_user(self.user)
        
        # First token should be deleted
        self.assertFalse(EmailVerificationToken.objects.filter(id=token_obj1.id).exists())
        self.assertTrue(EmailVerificationToken.objects.filter(id=token_obj2.id).exists())


class AuthenticationServiceTest(TestCase):
    """Test cases for AuthenticationService"""
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        self.profile_data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'user_type': 'student'
        }
    
    @patch('accounts.services.send_verification_email')
    def test_register_user_success(self, mock_send_email):
        """Test successful user registration"""
        mock_send_email.return_value = True
        
        profile, otp, school, campus = AuthenticationService.register_user(
            self.user_data['email'],
            self.user_data['password'],
            self.profile_data
        )
        
        self.assertIsInstance(profile, UserProfile)
        self.assertEqual(profile.user.email, self.user_data['email'])
        self.assertEqual(profile.first_name, self.profile_data['first_name'])
        self.assertFalse(profile.user.email_verified)
        self.assertIsNone(school)  # No school data provided
        self.assertIsNone(campus)  # No campus data provided
        mock_send_email.assert_called_once()
    
    def test_register_user_duplicate_email(self):
        """Test registration with duplicate email"""
        User.objects.create_user(**self.user_data)
        
        with self.assertRaises(Exception):
            AuthenticationService.register_user(
                self.user_data['email'],
                self.user_data['password'],
                self.profile_data
            )
    
    def test_authenticate_user_success(self):
        """Test successful user authentication"""
        user = User.objects.create_user(**self.user_data)
        
        authenticated_user = AuthenticationService.authenticate_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        self.assertEqual(authenticated_user, user)
    
    def test_authenticate_user_invalid_credentials(self):
        """Test authentication with invalid credentials"""
        User.objects.create_user(**self.user_data)
        
        authenticated_user = AuthenticationService.authenticate_user(
            email=self.user_data['email'],
            password='wrongpassword'
        )
        
        self.assertIsNone(authenticated_user)
    
    def test_generate_tokens(self):
        """Test JWT token generation"""
        user = User.objects.create_user(**self.user_data)
        
        tokens = AuthenticationService.generate_tokens(user)
        
        self.assertIn('refresh', tokens)
        self.assertIn('access', tokens)
        self.assertIsInstance(tokens['refresh'], str)
        self.assertIsInstance(tokens['access'], str)
    
    def test_verify_email_otp_success(self):
        """Test successful email OTP verification"""
        user = User.objects.create_user(**self.user_data)
        token_obj, otp = EmailVerificationToken.create_for_user(user)
        
        verified_user = AuthenticationService.verify_email_otp(user.email, otp)
        
        self.assertEqual(verified_user, user)
        self.assertTrue(verified_user.email_verified)
        self.assertFalse(EmailVerificationToken.objects.filter(user=user).exists())
    
    @patch('accounts.services.send_verification_email')
    def test_resend_verification_otp_success(self, mock_send_email):
        """Test successful OTP resend"""
        mock_send_email.return_value = True
        
        # Create user with profile to avoid profile errors
        user = User.objects.create_user(**self.user_data)
        UserProfile.objects.create(user=user, **self.profile_data)
        
        otp = AuthenticationService.resend_verification_otp(user.email)
        
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())
        mock_send_email.assert_called_once()
    
    def test_resend_verification_otp_already_verified(self):
        """Test OTP resend for already verified user"""
        user = User.objects.create_user(**self.user_data)
        user.email_verified = True
        user.save()
        
        with self.assertRaises(Exception):
            AuthenticationService.resend_verification_otp(user.email)


class UserRegistrationAPITest(APITestCase):
    """Test cases for user registration API"""
    
    def setUp(self):
        try:
            cache.clear()  # Clear cache before each test
        except Exception:
            pass  # Skip cache clear if Redis not available
        self.client = APIClient()
        self.register_url = reverse('user-registration')
        self.valid_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_type': 'student'
        }
    
    def tearDown(self):
        try:
            cache.clear()  # Clear cache after each test
        except Exception:
            pass  # Skip cache clear if Redis not available
    
    @patch('accounts.services.send_verification_email')
    def test_register_user_success(self, mock_send_email):
        """Test successful user registration via API"""
        mock_send_email.return_value = True
        
        response = self.client.post(self.register_url, self.valid_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        self.assertTrue(response.data['requires_verification'])
        
        # Check user was created
        user = User.objects.get(email=self.valid_data['email'])
        self.assertFalse(user.email_verified)
        self.assertTrue(user.is_active)
        
        # Verify email was sent
        mock_send_email.assert_called_once()
    
    def test_register_user_invalid_email(self):
        """Test registration with invalid email"""
        invalid_data = self.valid_data.copy()
        invalid_data['email'] = 'invalid-email'
        
        response = self.client.post(self.register_url, invalid_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_register_user_missing_required_fields(self):
        """Test registration with missing required fields"""
        incomplete_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
            # Missing first_name, last_name
        }
        
        response = self.client.post(self.register_url, incomplete_data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
    
    def test_register_user_duplicate_email(self):
        """Test registration with duplicate email"""
        User.objects.create_user(
            email=self.valid_data['email'],
            password='somepassword'
        )
        
        response = self.client.post(self.register_url, self.valid_data)
        
        # Should return a 400 error when duplicate email is used (validation error)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(APITestCase):
    """Test cases for login API"""
    
    def setUp(self):
        try:
            cache.clear()  # Clear cache before each test to prevent rate limiting interference
        except Exception:
            pass  # Skip cache clear if Redis not available
        self.client = APIClient()
        self.login_url = reverse('login')
        self.user = User.objects.create_user(
            email='logintest@example.com',  # Use unique email
            password='testpass123',
            email_verified=True
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            first_name='John',
            last_name='Doe',
            user_type='student'
        )
    
    def tearDown(self):
        try:
            cache.clear()  # Clear cache after each test
        except Exception:
            pass  # Skip cache clear if Redis not available
    
    def test_login_success(self):
        """Test successful login"""
        data = {
            'email': 'logintest@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user_profile', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'logintest@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
    
    def test_login_unverified_email(self):
        """Test login with unverified email"""
        # Create unverified user
        unverified_user = User.objects.create_user(
            email='unverified@example.com',
            password='testpass123',
            email_verified=False
        )
        
        data = {
            'email': 'unverified@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(response.data['email_verification_required'])
    
    def test_login_with_student_id(self):
        """Test login with student ID"""
        self.user.student_id = 'STU001'
        self.user.save()
        
        data = {
            'student_id': 'STU001',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    @patch('django.core.cache.cache.get')
    @patch('django.core.cache.cache.set')
    def test_login_rate_limiting(self, mock_cache_set, mock_cache_get):
        """Test login rate limiting after multiple failed attempts"""
        try:
            cache.clear()  # Ensure clean state
        except Exception:
            pass  # Skip cache clear if Redis not available
        
        # Mock cache behavior to simulate rate limiting
        attempt_counts = [0]  # Use list to modify from inner function
        
        def mock_get(key, default=0):
            if key.startswith('login_attempts_'):
                return attempt_counts[0]
            return default
        
        def mock_set(key, value, timeout):
            if key.startswith('login_attempts_'):
                attempt_counts[0] = value
        
        mock_cache_get.side_effect = mock_get
        mock_cache_set.side_effect = mock_set
        
        data = {
            'email': 'logintest@example.com',
            'password': 'wrongpassword'
        }
        
        # Make 5 failed attempts
        for i in range(5):
            response = self.client.post(self.login_url, data)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # 6th attempt should be rate limited
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class EmailVerificationAPITest(APITestCase):
    """Test cases for email verification API"""
    
    def setUp(self):
        try:
            cache.clear()  # Clear cache before each test
        except Exception:
            pass  # Skip cache clear if Redis not available
        self.client = APIClient()
        self.verify_url = reverse('verify-email')
        self.resend_url = reverse('resend-verification')
        
        self.user = User.objects.create_user(
            email='verifytest@example.com',  # Use unique email
            password='testpass123',
            email_verified=False
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            first_name='John',
            last_name='Doe',
            user_type='student'
        )
        self.token_obj, self.otp = EmailVerificationToken.create_for_user(self.user)
    
    def tearDown(self):
        try:
            cache.clear()  # Clear cache after each test
        except Exception:
            pass  # Skip cache clear if Redis not available
    
    def test_verify_email_success(self):
        """Test successful email verification"""
        data = {
            'email': self.user.email,
            'otp': self.otp
        }
        
        response = self.client.post(self.verify_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('message', response.data)
        
        # Check user is now verified
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)
    
    def test_verify_email_invalid_otp(self):
        """Test email verification with invalid OTP"""
        data = {
            'email': self.user.email,
            'otp': '000000'
        }
        
        response = self.client.post(self.verify_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_verify_email_expired_otp(self):
        """Test email verification with expired OTP"""
        # Expire the token
        self.token_obj.expires_at = timezone.now() - timedelta(minutes=1)
        self.token_obj.save()
        
        data = {
            'email': self.user.email,
            'otp': self.otp
        }
        
        response = self.client.post(self.verify_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    @patch('accounts.services.send_verification_email')
    def test_resend_verification_success(self, mock_send_email):
        """Test successful OTP resend"""
        mock_send_email.return_value = True
        
        response = self.client.post(self.resend_url, {
            'email': self.user.email
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Verify email was sent
        mock_send_email.assert_called_once()
    
    def test_resend_verification_already_verified(self):
        """Test OTP resend for already verified user"""
        self.user.email_verified = True
        self.user.save()
        
        data = {'email': self.user.email}
        
        response = self.client.post(self.resend_url, data)
        
        # Should return 400 for already verified user, not 500
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutAPITest(APITestCase):
    """Test cases for logout API"""
    
    def setUp(self):
        try:
            cache.clear()  # Clear cache before each test
        except Exception:
            pass  # Skip cache clear if Redis not available
        self.client = APIClient()
        self.logout_url = reverse('logout')
        
        self.user = User.objects.create_user(
            email='logouttest@example.com',  # Use unique email
            password='testpass123',
            email_verified=True
        )
        
        # Generate tokens
        self.refresh = RefreshToken.for_user(self.user)
        self.access_token = str(self.refresh.access_token)
        self.refresh_token = str(self.refresh)
    
    def tearDown(self):
        try:
            cache.clear()  # Clear cache after each test
        except Exception:
            pass  # Skip cache clear if Redis not available
    
    def test_logout_success(self):
        """Test successful logout"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        data = {'refresh': self.refresh_token}
        response = self.client.post(self.logout_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
        self.assertIn('message', response.data)
    
    def test_logout_missing_token(self):
        """Test logout without refresh token"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        response = self.client.post(self.logout_url, {})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_logout_unauthenticated(self):
        """Test logout without authentication"""
        data = {'refresh': self.refresh_token}
        response = self.client.post(self.logout_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserServiceTest(TestCase):
    """Test cases for UserService"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='servicetest@example.com',  # Use unique email
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            first_name='John',
            last_name='Doe',
            user_type='student'
        )
    
    def test_get_user_profiles_optimized(self):
        """Test optimized user profiles query"""
        profiles = UserService.get_user_profiles_optimized()
        
        # Check that the query is optimized (select_related/prefetch_related)
        self.assertIsNotNone(profiles)
        self.assertEqual(profiles.count(), 1)
        
        # This would cause additional queries if not optimized
        profile = profiles.first()
        self.assertEqual(profile.user.email, self.user.email)
    
    def test_get_user_profile_by_id(self):
        """Test getting user profile by ID with optimization"""
        profile = UserService.get_user_profile_by_id(self.profile.id)
        
        self.assertEqual(profile, self.profile)
        self.assertEqual(profile.user.email, self.user.email)


class SchoolServiceTestCase(TestCase):
    """Test cases for SchoolService"""
    
    def setUp(self):
        """Set up test data"""
        try:
            cache.clear()
        except Exception:
            pass  # Skip cache clear if Redis not available
        self.school_owner = UserProfileFactory(user_type='school_owner')
        self.school = SchoolFactory(owner=self.school_owner)
        # Create SetupSteps manually since factory doesn't create it anymore
        SetupSteps.objects.create(school=self.school, basic_info_completed=True)
        self.campus = CampusFactory(school=self.school)
    
    def test_get_schools_for_owner(self):
        """Test getting schools for an owner"""
        schools = SchoolService.get_schools_for_owner(self.school_owner)
        self.assertEqual(schools.count(), 1)
        self.assertEqual(schools.first(), self.school)
    
    def test_get_school_with_campuses(self):
        """Test getting school with campuses"""
        school = SchoolService.get_school_with_campuses(self.school.id, self.school_owner)
        self.assertIsNotNone(school)
        self.assertEqual(school.campuses.count(), 1)
    
    def test_get_school_with_campuses_unauthorized(self):
        """Test getting school with campuses for unauthorized user"""
        other_owner = UserProfileFactory(user_type='school_owner')
        school = SchoolService.get_school_with_campuses(self.school.id, other_owner)
        self.assertIsNone(school)
    
    def test_get_setup_progress(self):
        """Test getting setup progress for school"""
        progress = SchoolService.get_setup_progress(self.school)
        self.assertEqual(progress['completion_percentage'], 20.0)  # Only basic_info_completed
        self.assertTrue(progress['basic_info_completed'])
        self.assertFalse(progress['campus_setup_completed'])
    
    def test_update_school_setup_step(self):
        """Test updating a setup step"""
        SchoolService.update_school_setup_step(self.school, 'campus_setup_completed', True)
        progress = SchoolService.get_setup_progress(self.school)
        self.assertTrue(progress['campus_setup_completed'])
        self.assertEqual(progress['completion_percentage'], 40.0)  # 2 out of 5 steps


class UserRegistrationWithSchoolTestCase(APITestCase):
    """Test cases for user registration with school and campus creation"""
    
    def setUp(self):
        """Set up test data"""
        try:
            cache.clear()
        except Exception:
            pass  # Skip cache clear if Redis not available
        self.registration_url = reverse('user-registration')
    
    def tearDown(self):
        """Clean up after each test"""
        try:
            cache.clear()
        except Exception:
            pass  # Skip cache clear if Redis not available
    
    def test_school_owner_registration_with_school_data(self):
        """Test school owner registration with school and campus data"""
        registration_data = {
            'email': 'owner@testschool.edu',
            'password': 'testpassword123',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_type': 'school_owner',
            'phone': '+1234567890',
            'school_data': {
                'school_name': 'Test Academy',
                'school_address': '123 Education St, City, State',
                'school_phone': '+1987654321',
                'school_email': 'info@testacademy.edu',
                'school_website': 'https://testacademy.edu',
                'campus_name': 'Main Campus',
                'campus_address': '123 Education St, City, State',
                'campus_phone': '+1987654321'
            }
        }
        
        response = self.client.post(self.registration_url, registration_data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('school', response.data)
        self.assertIn('campus', response.data)
        self.assertTrue(response.data['requires_verification'])
        
        # Check user creation
        user = CustomUser.objects.get(email='owner@testschool.edu')
        self.assertFalse(user.email_verified)
        self.assertEqual(user.profile.user_type, 'school_owner')
        
        # Check school creation
        school = School.objects.get(name='Test Academy')
        self.assertEqual(school.owner, user.profile)
        self.assertEqual(school.address, '123 Education St, City, State')
        self.assertEqual(school.email, 'info@testacademy.edu')
        
        # Check campus creation
        campus = Campus.objects.get(name='Main Campus')
        self.assertEqual(campus.school, school)
        self.assertEqual(campus.address, '123 Education St, City, State')
        
        # Check setup steps creation
        setup_steps = SetupSteps.objects.get(school=school)
        self.assertTrue(setup_steps.basic_info_completed)
        self.assertEqual(setup_steps.completion_percentage, 20.0)
        
        # Check email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Verify Your Email', mail.outbox[0].subject)
    
    def test_school_owner_registration_without_school_data_fails(self):
        """Test that school owner registration fails without school data"""
        registration_data = {
            'email': 'owner@testschool.edu',
            'password': 'testpassword123',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_type': 'school_owner',
            'phone': '+1234567890',
            # Missing school_data
        }
        
        response = self.client.post(self.registration_url, registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('school_data', response.data)
    
    def test_student_registration_without_school_data_succeeds(self):
        """Test that student registration succeeds without school data"""
        registration_data = {
            'email': 'student@example.com',
            'password': 'testpassword123',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'user_type': 'student',
            'phone': '+1234567890',
            # No school_data needed for students
        }
        
        response = self.client.post(self.registration_url, registration_data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertNotIn('school', response.data)  # No school should be created
        self.assertNotIn('campus', response.data)  # No campus should be created
        
        # Check user creation
        user = CustomUser.objects.get(email='student@example.com')
        self.assertEqual(user.profile.user_type, 'student')
        
        # Check no school or campus created
        self.assertEqual(School.objects.count(), 0)
        self.assertEqual(Campus.objects.count(), 0)
    
    def test_registration_with_invalid_school_data(self):
        """Test registration with invalid school data"""
        registration_data = {
            'email': 'owner@testschool.edu',
            'password': 'testpassword123',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_type': 'school_owner',
            'school_data': {
                'school_name': '',  # Empty school name should fail
                'campus_name': 'Main Campus',
            }
        }
        
        response = self.client.post(self.registration_url, registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('school_data', response.data)
    
    def test_registration_response_includes_school_campus_data(self):
        """Test that registration response includes complete school and campus information"""
        registration_data = {
            'email': 'owner@testschool.edu',
            'password': 'testpassword123',
            'first_name': 'John',
            'last_name': 'Doe',
            'user_type': 'school_owner',
            'school_data': {
                'school_name': 'Test Academy',
                'school_address': '123 Education St',
                'school_phone': '+1987654321',
                'school_email': 'info@testacademy.edu',
                'school_website': 'https://testacademy.edu',
                'campus_name': 'Main Campus',
                'campus_address': '456 Campus Ave',
                'campus_phone': '+1555123456'
            }
        }
        
        response = self.client.post(self.registration_url, registration_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check school data in response
        school_data = response.data['school']
        self.assertEqual(school_data['name'], 'Test Academy')
        self.assertEqual(school_data['address'], '123 Education St')
        self.assertEqual(school_data['phone'], '+1987654321')
        self.assertEqual(school_data['email'], 'info@testacademy.edu')
        self.assertEqual(school_data['website'], 'https://testacademy.edu')
        
        # Check campus data in response
        campus_data = response.data['campus']
        self.assertEqual(campus_data['name'], 'Main Campus')
        self.assertEqual(campus_data['address'], '456 Campus Ave')
        self.assertEqual(campus_data['phone'], '+1555123456')


class SchoolModelTestCase(TestCase):
    """Test cases for School model"""
    
    def test_school_creation(self):
        """Test school model creation"""
        owner = UserProfileFactory(user_type='school_owner')
        school = School.objects.create(
            name='Test School',
            address='123 Test St',
            phone='+1234567890',
            email='info@testschool.edu',
            website='https://testschool.edu',
            owner=owner
        )
        
        self.assertEqual(str(school), 'Test School')
        self.assertEqual(school.owner, owner)
        self.assertTrue(school.is_active)
    
    def test_school_without_optional_fields(self):
        """Test school creation with only required fields"""
        owner = UserProfileFactory(user_type='school_owner')
        school = School.objects.create(
            name='Minimal School',
            owner=owner
        )
        
        self.assertEqual(school.name, 'Minimal School')
        self.assertEqual(school.owner, owner)
        self.assertIsNone(school.address)
        self.assertIsNone(school.phone)


class CampusModelTestCase(TestCase):
    """Test cases for Campus model"""
    
    def test_campus_creation(self):
        """Test campus model creation"""
        owner = UserProfileFactory(user_type='school_owner')
        school = SchoolFactory(owner=owner)
        campus = Campus.objects.create(
            name='Test Campus',
            school=school,
            address='456 Campus Ave',
            phone='+1987654321'
        )
        
        self.assertEqual(str(campus), 'Test Campus - Test School')
        self.assertEqual(campus.school, school)
        self.assertTrue(campus.is_active)
    
    def test_campus_deletion_when_school_deleted(self):
        """Test that campus is deleted when school is deleted"""
        owner = UserProfileFactory(user_type='school_owner')
        school = SchoolFactory(owner=owner)
        campus = CampusFactory(school=school)
        
        campus_id = campus.id
        school.delete()
        
        # Campus should be deleted due to CASCADE
        with self.assertRaises(Campus.DoesNotExist):
            Campus.objects.get(id=campus_id)


class SetupStepsModelTestCase(TestCase):
    """Test cases for SetupSteps model"""
    
    def test_setup_steps_creation(self):
        """Test setup steps model creation"""
        owner = UserProfileFactory(user_type='school_owner')
        school = SchoolFactory(owner=owner)
        
        setup_steps = SetupSteps.objects.create(
            school=school,
            basic_info_completed=True
        )
        
        self.assertEqual(setup_steps.school, school)
        self.assertTrue(setup_steps.basic_info_completed)
        self.assertFalse(setup_steps.campus_setup_completed)
        self.assertEqual(setup_steps.completion_percentage, 20.0)
    
    def test_completion_percentage_calculation(self):
        """Test completion percentage calculation"""
        owner = UserProfileFactory(user_type='school_owner')
        school = SchoolFactory(owner=owner)
        
        setup_steps = SetupSteps.objects.create(
            school=school,
            basic_info_completed=True,
            campus_setup_completed=True,
            staff_setup_completed=True
        )
        
        # 3 out of 5 steps completed = 60%
        self.assertEqual(setup_steps.completion_percentage, 60.0)
    
    def test_setup_steps_string_representation(self):
        """Test setup steps string representation"""
        owner = UserProfileFactory(user_type='school_owner')
        school = SchoolFactory(owner=owner)
        setup_steps = SetupSteps.objects.create(school=school)
        
        expected_str = f'Setup Steps for {school.name}'
        self.assertEqual(str(setup_steps), expected_str)
