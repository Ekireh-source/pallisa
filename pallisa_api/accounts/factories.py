import factory
from django.contrib.auth import get_user_model
from factory.django import DjangoModelFactory
from factory import Faker, SubFactory, LazyAttribute

from .models import UserProfile, EmailVerificationToken, Role, Permission, PermissionCategory, CustomUser, School, Campus, SetupSteps

User = get_user_model()


class UserFactory(DjangoModelFactory):
    """Factory for creating CustomUser instances"""
    
    class Meta:
        model = CustomUser
    
    email = Faker('email')
    is_active = True
    is_staff = False
    is_superuser = False
    email_verified = True
    
    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        if not create:
            return
        
        password = extracted or 'testpass123'
        self.set_password(password)
        self.save()


class UnverifiedUserFactory(UserFactory):
    """Factory for creating unverified users"""
    email_verified = False


class SuperUserFactory(UserFactory):
    """Factory for creating superusers"""
    is_staff = True
    is_superuser = True
    email_verified = True


class PermissionCategoryFactory(DjangoModelFactory):
    """Factory for creating PermissionCategory instances"""
    
    class Meta:
        model = PermissionCategory
    
    name = Faker('word')
    code = LazyAttribute(lambda obj: obj.name.upper())
    description = Faker('sentence')
    is_admin = False


class PermissionFactory(DjangoModelFactory):
    """Factory for creating Permission instances"""
    
    class Meta:
        model = Permission
    
    category = SubFactory(PermissionCategoryFactory)
    code = Faker('word')
    name = Faker('sentence', nb_words=3)
    description = Faker('sentence')


class RoleFactory(DjangoModelFactory):
    """Factory for creating Role instances"""
    
    class Meta:
        model = Role
    
    name = Faker('job')
    description = Faker('sentence')
    is_superadmin = False
    
    @factory.post_generation
    def permissions(self, create, extracted, **kwargs):
        if not create:
            return
        
        if extracted:
            for permission in extracted:
                self.permissions.add(permission)


class UserProfileFactory(DjangoModelFactory):
    """Factory for creating UserProfile instances"""
    
    class Meta:
        model = UserProfile
    
    user = SubFactory(UserFactory)
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    user_type = 'student'
    gender = 'M'
    phone = Faker('phone_number')


class StudentProfileFactory(UserProfileFactory):
    """Factory for creating student profiles"""
    user_type = 'student'
    user = SubFactory(UserFactory, student_id=factory.Sequence(lambda n: f'STU{n:06d}'))


class StaffProfileFactory(UserProfileFactory):
    """Factory for creating staff profiles"""
    user_type = 'staff'


class EmailVerificationTokenFactory(DjangoModelFactory):
    """Factory for creating EmailVerificationToken instances"""
    
    class Meta:
        model = EmailVerificationToken
    
    user = SubFactory(UserFactory)
    otp = '123456'
    
    def save(self, *args, **kwargs):
        """Override save to set expiration date"""
        if not self.expires_at:
            from django.utils import timezone
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(minutes=30)
            self.save()


class SchoolFactory(DjangoModelFactory):
    """Factory for creating School instances"""
    
    class Meta:
        model = School
    
    name = 'Test School'  # Use a predictable name
    address = Faker('address')
    phone = Faker('phone_number')
    email = Faker('email')
    website = Faker('url')
    owner = SubFactory(UserProfileFactory, user_type='school_owner')
    is_active = True


class CampusFactory(DjangoModelFactory):
    """Factory for creating Campus instances"""
    
    class Meta:
        model = Campus
    
    name = Faker('city')
    school = SubFactory(SchoolFactory)
    address = Faker('address')
    phone = Faker('phone_number')
    is_active = True


class SetupStepsFactory(DjangoModelFactory):
    """Factory for creating SetupSteps instances"""
    
    class Meta:
        model = SetupSteps
    
    school = SubFactory(SchoolFactory)
    basic_info_completed = True
    campus_setup_completed = False
    staff_setup_completed = False
    student_setup_completed = False
    permissions_setup_completed = False 