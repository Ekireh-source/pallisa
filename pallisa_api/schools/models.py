import uuid
from django.db import models
from accounts.models import CustomUser


class Campus(models.Model):
    """
    Represents a campus within a school, used for school_id
    """
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)   
    name = models.CharField(max_length=255, default="MAIN CAMPUS")
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Campus'
        verbose_name_plural = 'Campuses'
        ordering = ['name']


class School(models.Model):
    """
    Represents a school with school_id, campus_id is optional
    """

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='schools')    
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    campus = models.ForeignKey(
        Campus, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='schools',
        help_text="Optional campus affiliation"
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.public_id})"

    class Meta:
        verbose_name = 'School'
        verbose_name_plural = 'Schools'
        ordering = ['name']


class SetupSteps(models.Model):
    """
    Tracks setup progress for each school
    """
    school = models.ForeignKey(
        School, 
        on_delete=models.CASCADE,
        related_name='setup_steps',
        help_text="School this setup belongs to"
    )
    setup_name = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "Completed" if self.completed else "Pending"
        return f"{self.setup_name} - {self.school.name} [{status}]"

    class Meta:
        verbose_name = 'Setup Step'
        verbose_name_plural = 'Setup Steps'
        ordering = ['-created_at']
        unique_together = ['school', 'setup_name']


class Document(models.Model):
    """
    Model for uploading documents (e.g., admit letter, photo, transcript)
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='documents')
    doc_file = models.FileField(upload_to='documents/%Y/%m/%d/', blank=True, null=True)
    doc_name = models.CharField(max_length=255)
    doc_type = models.CharField(max_length=100)
    doc_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.doc_name} - {self.user.email}"

    class Meta:
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
