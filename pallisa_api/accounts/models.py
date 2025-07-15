from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.utils import timezone
import uuid
from datetime import timedelta
import hashlib
import random
import secrets
import string
from django.db import transaction
from django.db.models import Q




class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)

    def get_by_natural_key(self, username):
        """
        Enable authentication with either email or student_id
        """
        try:
            return self.get(email=username)
        except self.model.DoesNotExist:
            try:
                return self.get(student_id=username)
            except self.model.DoesNotExist:
                raise


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, blank=True, db_index=True)
    student_id = models.CharField(max_length=100, unique=True, blank=True, null=True, db_index=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)
    email_verified = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"

    # Fix related_name conflicts with Django's built-in User model
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="customuser_set",
        related_query_name="customuser",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="customuser_set",
        related_query_name="customuser",
    )

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['student_id']),
            models.Index(fields=['email_verified']),
        ]

    @property
    def profile(self):
        try:
            return self.userprofile
        except AttributeError:
            return None


class EmailVerificationToken(models.Model):
    user = models.OneToOneField('CustomUser', on_delete=models.CASCADE, related_name='verification_token')
    otp = models.CharField(max_length=6, editable=False, db_index=True)  # Store the 6-digit OTP
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['otp']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['user', 'otp']),
        ]

    def save(self, *args, **kwargs):
        # Set expiration date if not already set
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=30)
        super().save(*args, **kwargs)

    def is_valid(self):
        return timezone.now() <= self.expires_at

    @classmethod
    def create_for_user(cls, user):
        """
        Create a new verification OTP for the given user.

        Returns:
        - token_obj: The saved token object
        - otp: The generated OTP code
        """
        # Delete any existing tokens for this user
        cls.objects.filter(user=user).delete()

        # Generate a 6-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])

        # Create and save the token object
        token_obj = cls.objects.create(
            user=user,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=30)
        )

        return token_obj, otp

    @classmethod
    def verify_otp(cls, email, otp):
        """
        Verify an OTP code for a specific user email.

        Args:
        - email: The user's email address
        - otp: The OTP code to verify

        Returns:
        - The EmailVerificationToken instance if valid

        Raises:
        - EmailVerificationToken.DoesNotExist: If the token is not found
        - ValueError: If OTP is invalid or expired
        """
        try:
            # Find the token by the user's email with optimized query
            token_obj = cls.objects.select_related('user').get(user__email=email, otp=otp)

            if not token_obj.is_valid():
                raise ValueError("OTP has expired")
            return token_obj
        except cls.DoesNotExist:
            raise

    def __str__(self):
        return f"Verification OTP for {self.user.email}"

class PermissionCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Permission(models.Model):
    category = models.ForeignKey(
        PermissionCategory, on_delete=models.CASCADE, related_name="permissions"
    )
    code = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

class Role(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    permissions = models.ManyToManyField(Permission, related_name="role_perms")
    is_superadmin = models.BooleanField(default=False)
    school = models.ForeignKey(
        'School', 
        on_delete=models.CASCADE, 
        related_name='roles',
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['school']),
            models.Index(fields=['is_superadmin']),
        ]

    def __str__(self):
        if self.school:
            return f"{self.name} - {self.school.name}"
        return self.name

    @classmethod
    def create_superadmin_role(cls):
        """Create the superadmin role with all permissions if it doesn't exist."""
        superadmin, created = cls.objects.get_or_create(
            name="SuperAdmin",
            is_superadmin=True,
            defaults={"description": "Superadmin role with all system permissions"}
        )

        # Add all available permissions to the superadmin role
        all_permissions = Permission.objects.all()
        superadmin.permissions.set(all_permissions)
        superadmin.save()

        return superadmin
    
    def sync_users_permissions(self):
        """Sync permissions for all users with this role"""
        role_permission_ids = set(self.permissions.values_list('id', flat=True))

        for user_profile in UserProfile.objects.filter(role=self).distinct():
            existing_perms = set(
                UserPermission.objects.filter(user=user_profile, is_role_based=True)
                .values_list('permission_id', flat=True)
            )

            missing_perms = role_permission_ids - existing_perms

            if missing_perms:
                # Prepare list of new UserPermission objects only for missing perms
                new_permissions = [
                    UserPermission(
                        user=user_profile,
                        permission_id=perm_id,
                        is_role_based=True
                    ) for perm_id in missing_perms
                ]

                UserPermission.objects.bulk_create(new_permissions, ignore_conflicts=True)


class UserProfile(models.Model):
    GENDER_CHOICES = (
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    )
    USER_TYPE_CHOICES = (
        ("admin", "Admin"),
        ("school_owner", "School Owner"),
        ("staff", "Staff"),
        ("student", "Student"),
        ("parent", "Parent"),
    )
    user_type = models.CharField(
        max_length=20, choices=USER_TYPE_CHOICES, default="school_owner"
    )
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="profile",
        blank=True,
        null=True,
    )
    gender = models.CharField(
        max_length=1, choices=GENDER_CHOICES, blank=True, null=True
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    other_name = models.CharField(max_length=100, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_address = models.CharField(max_length=255, blank=True, null=True)
    emergency_contact_email = models.EmailField(blank=True, null=True)
    role = models.ForeignKey(Role, blank=True, null=True, on_delete=models.SET_NULL)
    

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}"
        if self.other_name:
            full_name = f"{full_name} {self.other_name}"
        return full_name

    def get_short_name(self):
        return self.first_name

    def has_permission(self, permission_code):
        """
        Check if the user has a specific permission by code.

        Args:
            permission_code (str): The code of the permission to check

        Returns:
            bool: True if the user has the permission, False otherwise
        """
        # SuperAdmin role has all permissions
        if self.role and self.role.is_superadmin:
            return True

        # Check if user has the specific permission
        return self.user_permissions.filter(permission__code=permission_code).exists()

    def save(self, *args, **kwargs):
        # Store previous state before saving
        is_new = self.pk is None
        old_role_id = None
        
        if not is_new:
            try:
                old_instance = UserProfile.objects.get(pk=self.pk)
                old_role_id = old_instance.role_id
            except UserProfile.DoesNotExist:
                pass

        # Handle school_owner automatic superadmin assignment
        if self.user_type == 'school_owner' and (not self.role or not self.role.is_superadmin):
            try:
                superadmin_role = Role.objects.get(name="SuperAdmin", is_superadmin=True)
                self.role = superadmin_role
            except Role.DoesNotExist:
                # Create the superadmin role if it doesn't exist
                self.role = Role.create_superadmin_role()

        # Save the instance
        super().save(*args, **kwargs)
        
        
        # Update permissions after saving
        self._update_permissions(old_role_id, is_new)

    def _update_permissions(self, old_role_id, is_new):
        """Update user permissions based on role changes"""
        current_role_id = self.role_id if self.role else None
        
        
        # For new users with a role, always add permissions
        if is_new and current_role_id:
            self._add_role_based_permissions()
        # For existing users, check if role changed
        elif old_role_id != current_role_id:
            # Remove old role-based permissions
            if old_role_id:
                print(f"DEBUG: Removing old role permissions")
                self._remove_role_based_permissions(old_role_id)
            
            # Add new role-based permissions
            if current_role_id:
                print(f"DEBUG: Adding new role permissions")
                self._add_role_based_permissions()
        else:
            print(f"DEBUG: No role change detected, skipping permission update")

    def _add_role_based_permissions(self):
        """Add all permissions from the current role"""
        if not self.role:
            print("DEBUG: No role assigned, skipping permission addition")
            return
            
        role_permissions = self.role.permissions.all()
        print(f"DEBUG: Role {self.role.name} has {role_permissions.count()} permissions")
        
        if not role_permissions.exists():
            print("DEBUG: Role has no permissions assigned")
            return
        
        # Create UserPermission objects for each role permission
        permissions_to_create = []
        existing_permissions = set(
            UserPermission.objects.filter(user=self).values_list('permission_id', flat=True)
        )
        
        for permission in role_permissions:
            # Check if permission already exists to avoid duplicates
            if permission.id not in existing_permissions:
                permissions_to_create.append(
                    UserPermission(
                        user=self,
                        permission=permission,
                        is_role_based=True
                    )
                )
                print(f"DEBUG: Queuing permission {permission.name} for creation")
            else:
                print(f"DEBUG: Permission {permission.name} already exists, skipping")
        
        # Bulk create new permissions
        if permissions_to_create:
            created_perms = UserPermission.objects.bulk_create(permissions_to_create, ignore_conflicts=True)
            print(f"DEBUG: Created {len(created_perms)} user permissions")
        else:
            print("DEBUG: No new permissions to create")

    def _remove_role_based_permissions(self, old_role_id):
        """Remove permissions that were assigned from the old role"""
        try:
            old_role = Role.objects.get(id=old_role_id)
            old_role_permission_ids = list(old_role.permissions.values_list('id', flat=True))
            
            # Remove only role-based permissions from the old role
            UserPermission.objects.filter(
                user=self,
                permission_id__in=old_role_permission_ids,
                is_role_based=True
            ).delete()
            
        except Role.DoesNotExist:
            # If the old role doesn't exist anymore, remove all role-based permissions
            UserPermission.objects.filter(user=self, is_role_based=True).delete()

    def assign_role(self, role, assigned_by=None):
        """
        Manually assign a role to this user profile.
        This method can be used when you want to explicitly assign a role.
        
        Args:
            role (Role): The role to assign
            assigned_by (UserProfile, optional): Who assigned this role
        """
        old_role_id = self.role_id if self.role else None
        self.role = role
        self.save()
        
        # Optionally track who assigned the role
        if assigned_by and role:
            # You could extend this to track role assignments in a separate model
            pass

    def remove_role(self):
        """Remove the current role and all associated role-based permissions"""
        if self.role:
            old_role_id = self.role_id
            self.role = None
            self.save()


class UserPermission(models.Model):
    user = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name="user_permissions"
    )
    permission = models.ForeignKey(
        Permission, on_delete=models.CASCADE, related_name="user_permissions"
    )
    is_role_based = models.BooleanField(default=False)
    assigned_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_permissions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "permission"]

    def __str__(self):
        return f"{self.user} - {self.permission}"


class Document(models.Model):
    profile = models.ForeignKey(
        UserProfile, on_delete=models.CASCADE, related_name="documents"
    )
    name = models.CharField(max_length=100)
    doc = models.FileField(upload_to="documents/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class PasswordResetToken(models.Model):
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_tokens'

    @classmethod
    def create_for_user(cls, user):
        with transaction.atomic():
            # Delete any existing tokens for this user
            cls.objects.filter(user=user).delete()

            # Generate a secure token
            token = secrets.token_urlsafe(32)

            # Create new token with 1 hour expiry
            reset_token = cls.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=1)  # Corrected here
            )

            return reset_token

    @classmethod
    def verify_token(cls, token):
        try:
            reset_token = cls.objects.get(token=token)
            if reset_token.is_used:
                raise ValueError("Token already used")
            if reset_token.is_used:
                raise ValueError("Token already used")
            if reset_token.expires_at <= timezone.now():  # Fixed
                raise ValueError("Token expired")
                raise ValueError("Token expired")
            return reset_token
        except cls.DoesNotExist:
            raise ValueError("Token not found")

    def mark_as_used(self):
        self.is_used = True
        self.save(update_fields=['is_used'])  # Only update the is_used field

# Add the missing models that were supposed to be in core.models

class School(models.Model):
    """Model representing a school institution"""
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    owner = models.ForeignKey(
        'UserProfile', 
        on_delete=models.CASCADE, 
        related_name='owned_schools',
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name


class Campus(models.Model):
    """Model representing a campus within a school"""
    name = models.CharField(max_length=200)
    school = models.ForeignKey(
        School, 
        on_delete=models.CASCADE, 
        related_name='campuses'
    )
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['school']),
            models.Index(fields=['is_active']),
        ]
        verbose_name_plural = "Campuses"

    def __str__(self):
        return f"{self.name} - {self.school.name}"


class SetupSteps(models.Model):
    """Model to track setup steps completion for schools"""
    school = models.OneToOneField(
        School, 
        on_delete=models.CASCADE, 
        related_name='setup_steps'
    )
    basic_info_completed = models.BooleanField(default=False)
    campus_setup_completed = models.BooleanField(default=False)
    staff_setup_completed = models.BooleanField(default=False)
    student_setup_completed = models.BooleanField(default=False)
    permissions_setup_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Setup Steps"
        indexes = [
            models.Index(fields=['school']),
        ]

    def __str__(self):
        return f"Setup Steps for {self.school.name}"

    @property
    def completion_percentage(self):
        """Calculate the percentage of setup steps completed"""
        total_steps = 5
        completed_steps = sum([
            self.basic_info_completed,
            self.campus_setup_completed,
            self.staff_setup_completed,
            self.student_setup_completed,
            self.permissions_setup_completed,
        ])
        return (completed_steps / total_steps) * 100
