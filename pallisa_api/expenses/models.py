from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ExpenseCategory(models.Model):
    """Model for categorizing expenses like salaries, utilities, maintenance, etc."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Expense Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class AcademicYear(models.Model):
    """Model for academic years like 2024/2025, 2025/2026, etc."""
    name = models.CharField(max_length=9, unique=True)  # e.g. "2024/2025"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name_plural = "Academic Years"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Ensure only one academic year is marked as current"""
        if self.is_current:
            # Set all other academic years as not current
            AcademicYear.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)


class Term(models.Model):
    """Model for academic terms/semesters"""
    name = models.CharField(max_length=50)  # e.g. "Term 1", "Semester 1"
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.CASCADE,
        related_name='terms'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('name', 'academic_year')
        ordering = ['-academic_year__start_date', 'name']

    def __str__(self):
        return f"{self.name} ({self.academic_year.name})"

    def save(self, *args, **kwargs):
        """Ensure only one term is marked as current"""
        if self.is_current:
            # Set all other terms as not current
            Term.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)


class Department(models.Model):
    """Model for school departments like Administration, Academics, Sports, etc."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Vendor(models.Model):
    """Model for vendors/suppliers the school does business with"""
    name = models.CharField(max_length=150)
    contact = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Expense(models.Model):
    """Main expense model to track all school expenditures"""
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(
        ExpenseCategory, 
        on_delete=models.PROTECT,
        related_name='expenses'
    )
    department = models.ForeignKey(
        Department, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='expenses'
    )
    vendor = models.ForeignKey(
        Vendor, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='expenses'
    )
    term = models.ForeignKey(
        Term, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='expenses'
    )
    incurred_on = models.DateField()
    recorded_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='recorded_expenses'
    )
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    receipt_image = models.ImageField(
        upload_to='expenses/receipts/', 
        blank=True, 
        null=True
    )
    invoice_number = models.CharField(max_length=100, blank=True)
    payment_method = models.CharField(
        max_length=50,
        choices=[
            ('cash', 'Cash'),
            ('bank_transfer', 'Bank Transfer'),
            ('cheque', 'Cheque'),
            ('mobile_money', 'Mobile Money'),
            ('credit_card', 'Credit Card'),
            ('other', 'Other'),
        ],
        default='cash'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-incurred_on', '-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['department']),
            models.Index(fields=['incurred_on']),
            models.Index(fields=['approved']),
            models.Index(fields=['recorded_by']),
            models.Index(fields=['term']),
        ]

    def __str__(self):
        return f"{self.title} - {self.amount}"

    @property
    def status(self):
        """Return human-readable status"""
        return "Approved" if self.approved else "Pending Approval"

    def save(self, *args, **kwargs):
        """Override save to set approval timestamp"""
        if self.approved and not self.approved_at:
            from django.utils import timezone
            self.approved_at = timezone.now()
        super().save(*args, **kwargs)
