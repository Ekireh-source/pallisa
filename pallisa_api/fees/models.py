from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from accounts.models import UserProfile
from members.models import Class, Stream
from expenses.models import AcademicYear, Term


class FeeCategory(models.Model):
    """Defines different types of fees (e.g., Tuition, Uniform, Library, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Fee Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class FeeStructure(models.Model):
    """Defines expected fees per class, term, and academic year"""
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name='fee_structures')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='fee_structures')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='fee_structures')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='fee_structures')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['category', 'class_obj', 'academic_year', 'term']
        ordering = ['academic_year', 'term', 'class_obj', 'category']

    def __str__(self):
        return f"{self.category.name} - {self.class_obj.name} - {self.term.name} ({self.academic_year.name})"


class Scholarship(models.Model):
    """Stores fee discounts for students"""
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed_amount', 'Fixed Amount'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.discount_type})"

    def calculate_discount(self, base_amount):
        """Calculate the discount amount for a given base amount"""
        if self.discount_type == 'percentage':
            discount = (base_amount * self.discount_value) / 100
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
            return discount
        else:  # fixed_amount
            return min(self.discount_value, base_amount)


class StudentFeeOverride(models.Model):
    """Handles student-specific custom fees"""
    student = models.ForeignKey('members.Student', on_delete=models.CASCADE, related_name='fee_overrides')
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name='student_overrides')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='student_fee_overrides')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='student_fee_overrides')
    custom_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    reason = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'category', 'academic_year', 'term']
        ordering = ['student', 'academic_year', 'term', 'category']

    def __str__(self):
        return f"{self.student.full_name} - {self.category.name} - {self.term.name}"


class StudentFeeBalance(models.Model):
    """Tracks real-time fee balance for each student per academic year and term"""
    student = models.ForeignKey('members.Student', on_delete=models.CASCADE, related_name='fee_balances')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='student_fee_balances')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='student_fee_balances')
    
    # Calculated amounts
    total_expected = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_discounts = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_pending = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # Balance status
    BALANCE_STATUS_CHOICES = [
        ('paid', 'Fully Paid'),
        ('partial', 'Partially Paid'),
        ('unpaid', 'Unpaid'),
        ('overpaid', 'Overpaid'),
    ]
    balance_status = models.CharField(max_length=20, choices=BALANCE_STATUS_CHOICES, default='unpaid')
    
    # Last calculation timestamp
    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'academic_year', 'term']
        ordering = ['student', 'academic_year', 'term']
        indexes = [
            models.Index(fields=['student', 'academic_year', 'term']),
            models.Index(fields=['balance_status']),
            models.Index(fields=['total_pending']),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.term.name} ({self.academic_year.name})"

    def calculate_balance(self):
        """Calculate and update the fee balance for this student"""
        from django.db.models import Sum
        
        # Get student's class
        if not self.student.current_stream:
            return
        
        class_obj = self.student.current_stream.class_obj
        
        # Calculate expected fees from fee structures
        fee_structures = FeeStructure.objects.filter(
            class_obj=class_obj,
            academic_year=self.academic_year,
            term=self.term,
            is_active=True
        )
        
        total_expected = Decimal('0.00')
        
        for structure in fee_structures:
            # Check for student-specific override
            override = StudentFeeOverride.objects.filter(
                student=self.student,
                category=structure.category,
                academic_year=self.academic_year,
                term=self.term,
                is_active=True
            ).first()
            
            if override:
                total_expected += override.custom_amount
            else:
                total_expected += structure.amount
        
        # Calculate total paid and discounts
        payments = FeePayment.objects.filter(
            student=self.student,
            academic_year=self.academic_year,
            term=self.term,
            payment_status='completed'
        )
        
        total_paid = payments.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0.00')
        total_discounts = payments.aggregate(total=Sum('discount_amount'))['total'] or Decimal('0.00')
        
        # Calculate pending amount
        total_pending = total_expected - total_paid
        
        # Update the model
        self.total_expected = total_expected
        self.total_paid = total_paid
        self.total_discounts = total_discounts
        self.total_pending = total_pending
        
        # Determine balance status
        if total_pending <= 0:
            self.balance_status = 'paid' if total_pending == 0 else 'overpaid'
        elif total_paid > 0:
            self.balance_status = 'partial'
        else:
            self.balance_status = 'unpaid'
        
        self.save()

    @property
    def payment_percentage(self):
        """Calculate the percentage of fees paid"""
        if self.total_expected <= 0:
            return 0
        return (self.total_paid / self.total_expected) * 100


class FeePayment(models.Model):
    """Logs payments made by each student"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
        ('mobile_money', 'Mobile Money'),
        ('credit_card', 'Credit Card'),
        ('other', 'Other'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    student = models.ForeignKey('members.Student', on_delete=models.CASCADE, related_name='fee_payments')
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name='payments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='fee_payments')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='fee_payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='completed')
    receipt_number = models.CharField(max_length=50, unique=True, blank=True)
    payment_date = models.DateField()
    due_date = models.DateField()
    scholarship = models.ForeignKey(Scholarship, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='recorded_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.category.name} - {self.amount_paid} ({self.payment_date})"

    def save(self, *args, **kwargs):
        # Generate receipt number if not provided
        if not self.receipt_number:
            import uuid
            self.receipt_number = f"RCPT-{uuid.uuid4().hex[:8].upper()}"
        
        # Save the payment
        super().save(*args, **kwargs)
        
        # Update the student's fee balance
        if self.payment_status == 'completed':
            self._update_student_balance()

    def _update_student_balance(self):
        """Update the student's fee balance after payment"""
        balance, created = StudentFeeBalance.objects.get_or_create(
            student=self.student,
            academic_year=self.academic_year,
            term=self.term
        )
        balance.calculate_balance()
        
        # Also update the term fee collection summary
        update_term_fee_collection_summary(self.academic_year.id, self.term.id)

    @property
    def original_amount(self):
        """Get the original fee amount before discount"""
        return self.amount_paid + self.discount_amount

    @property
    def is_overdue(self):
        """Check if payment is overdue"""
        from django.utils import timezone
        return self.due_date < timezone.now().date() and self.payment_status != 'completed'


class TermFeeCollectionSummary(models.Model):
    """Tracks overall fee collection for all students in a given term"""
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='fee_collection_summaries')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='fee_collection_summaries')
    
    # Total amounts based on fee structures (what should be collected)
    total_expected_from_structures = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    total_expected_with_overrides = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    
    # Actual collection amounts
    total_collected = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    total_discounts_given = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    total_pending_collection = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    
    # Student counts and statistics
    total_students = models.PositiveIntegerField(default=0)
    students_with_fees = models.PositiveIntegerField(default=0)
    fully_paid_students = models.PositiveIntegerField(default=0)
    partially_paid_students = models.PositiveIntegerField(default=0)
    unpaid_students = models.PositiveIntegerField(default=0)
    overpaid_students = models.PositiveIntegerField(default=0)
    
    # Collection performance metrics
    collection_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    average_payment_per_student = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Last calculation timestamp
    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['academic_year', 'term']
        ordering = ['academic_year', 'term']
        verbose_name_plural = "Term Fee Collection Summaries"
        indexes = [
            models.Index(fields=['academic_year', 'term']),
            models.Index(fields=['collection_rate']),
            models.Index(fields=['total_pending_collection']),
        ]

    def __str__(self):
        return f"Fee Collection Summary - {self.term.name} ({self.academic_year.name})"

    def calculate_collection_summary(self):
        """Calculate and update the fee collection summary for this term"""
        from django.db.models import Sum, Count, Q
        from members.models import Student
        
        # Get all active students
        students = Student.objects.filter(is_active=True, enrollment_status='enrolled')
        
        total_expected_from_structures = Decimal('0.00')
        total_expected_with_overrides = Decimal('0.00')
        total_collected = Decimal('0.00')
        total_discounts = Decimal('0.00')
        
        students_with_fees = 0
        fully_paid = 0
        partially_paid = 0
        unpaid = 0
        overpaid = 0
        
        # Calculate for each student
        for student in students:
            if not student.current_stream:
                continue
                
            class_obj = student.current_stream.class_obj
            
            # Get fee structures for this student's class
            fee_structures = FeeStructure.objects.filter(
                class_obj=class_obj,
                academic_year=self.academic_year,
                term=self.term,
                is_active=True
            )
            
            student_expected_from_structures = Decimal('0.00')
            student_expected_with_overrides = Decimal('0.00')
            
            # Calculate expected fees
            for structure in fee_structures:
                student_expected_from_structures += structure.amount
                
                # Check for student-specific override
                override = StudentFeeOverride.objects.filter(
                    student=student,
                    category=structure.category,
                    academic_year=self.academic_year,
                    term=self.term,
                    is_active=True
                ).first()
                
                if override:
                    student_expected_with_overrides += override.custom_amount
                else:
                    student_expected_with_overrides += structure.amount
            
            # Get student's payments
            payments = FeePayment.objects.filter(
                student=student,
                academic_year=self.academic_year,
                term=self.term,
                payment_status='completed'
            )
            
            student_paid = payments.aggregate(total=Sum('amount_paid'))['total'] or Decimal('0.00')
            student_discounts = payments.aggregate(total=Sum('discount_amount'))['total'] or Decimal('0.00')
            
            # Add to totals
            total_expected_from_structures += student_expected_from_structures
            total_expected_with_overrides += student_expected_with_overrides
            total_collected += student_paid
            total_discounts += student_discounts
            
            # Count students with fees
            if student_expected_with_overrides > 0:
                students_with_fees += 1
                
                # Determine payment status
                student_pending = student_expected_with_overrides - student_paid
                if student_pending <= 0:
                    if student_pending == 0:
                        fully_paid += 1
                    else:
                        overpaid += 1
                elif student_paid > 0:
                    partially_paid += 1
                else:
                    unpaid += 1
        
        # Calculate pending amount
        total_pending = total_expected_with_overrides - total_collected
        
        # Calculate collection rate
        collection_rate = Decimal('0.00')
        if total_expected_with_overrides > 0:
            collection_rate = (total_collected / total_expected_with_overrides) * 100
        
        # Calculate average payment per student
        average_payment = Decimal('0.00')
        if students_with_fees > 0:
            average_payment = total_collected / students_with_fees
        
        # Update the model
        self.total_expected_from_structures = total_expected_from_structures
        self.total_expected_with_overrides = total_expected_with_overrides
        self.total_collected = total_collected
        self.total_discounts_given = total_discounts
        self.total_pending_collection = total_pending
        self.total_students = students.count()
        self.students_with_fees = students_with_fees
        self.fully_paid_students = fully_paid
        self.partially_paid_students = partially_paid
        self.unpaid_students = unpaid
        self.overpaid_students = overpaid
        self.collection_rate = collection_rate
        self.average_payment_per_student = average_payment
        
        self.save()

    @property
    def collection_percentage(self):
        """Get collection rate as a formatted percentage"""
        return f"{self.collection_rate:.1f}%"

    @property
    def is_collection_complete(self):
        """Check if all fees have been collected"""
        return self.unpaid_students == 0 and self.partially_paid_students == 0

    @property
    def outstanding_amount(self):
        """Get the total outstanding amount"""
        return self.total_pending_collection

    @property
    def collection_efficiency(self):
        """Get collection efficiency rating"""
        if self.collection_rate >= 95:
            return 'Excellent'
        elif self.collection_rate >= 85:
            return 'Good'
        elif self.collection_rate >= 70:
            return 'Fair'
        else:
            return 'Poor'


def update_term_fee_collection_summary(academic_year_id, term_id):
    """
    Update the term fee collection summary for a specific academic year and term.
    This function should be called whenever a payment is made or fee structure changes.
    """
    try:
        summary, created = TermFeeCollectionSummary.objects.get_or_create(
            academic_year_id=academic_year_id,
            term_id=term_id
        )
        summary.calculate_collection_summary()
        return summary
    except Exception as e:
        print(f"Error updating term fee collection summary: {e}")
        return None


def update_all_collection_summaries():
    """
    Update all term fee collection summaries in the system.
    This can be run as a periodic task or manually.
    """
    from expenses.models import AcademicYear, Term
    
    summaries_updated = 0
    for academic_year in AcademicYear.objects.filter(is_active=True):
        for term in Term.objects.filter(is_active=True):
            summary = update_term_fee_collection_summary(academic_year.id, term.id)
            if summary:
                summaries_updated += 1
    
    return summaries_updated


def get_school_fee_collection_overview():
    """
    Get an overview of fee collection across all terms and academic years.
    Returns a comprehensive summary for the entire school.
    """
    from expenses.models import AcademicYear, Term
    
    overview = {
        'total_academic_years': AcademicYear.objects.filter(is_active=True).count(),
        'total_terms': Term.objects.filter(is_active=True).count(),
        'total_expected': Decimal('0.00'),
        'total_collected': Decimal('0.00'),
        'total_pending': Decimal('0.00'),
        'total_discounts': Decimal('0.00'),
        'overall_collection_rate': Decimal('0.00'),
        'total_students': 0,
        'by_academic_year': {},
        'by_term': {},
        'collection_trends': {}
    }
    
    # Get all collection summaries
    summaries = TermFeeCollectionSummary.objects.select_related('academic_year', 'term')
    
    for summary in summaries:
        # Add to totals
        overview['total_expected'] += summary.total_expected_with_overrides
        overview['total_collected'] += summary.total_collected
        overview['total_pending'] += summary.total_pending_collection
        overview['total_discounts'] += summary.total_discounts_given
        overview['total_students'] += summary.total_students
        
        # Group by academic year
        year_name = summary.academic_year.name
        if year_name not in overview['by_academic_year']:
            overview['by_academic_year'][year_name] = {
                'total_expected': Decimal('0.00'),
                'total_collected': Decimal('0.00'),
                'total_pending': Decimal('0.00'),
                'collection_rate': Decimal('0.00'),
                'terms': []
            }
        
        overview['by_academic_year'][year_name]['total_expected'] += summary.total_expected_with_overrides
        overview['by_academic_year'][year_name]['total_collected'] += summary.total_collected
        overview['by_academic_year'][year_name]['total_pending'] += summary.total_pending_collection
        
        # Group by term
        term_name = summary.term.name
        if term_name not in overview['by_term']:
            overview['by_term'][term_name] = {
                'total_expected': Decimal('0.00'),
                'total_collected': Decimal('0.00'),
                'total_pending': Decimal('0.00'),
                'collection_rate': Decimal('0.00'),
                'academic_years': []
            }
        
        overview['by_term'][term_name]['total_expected'] += summary.total_expected_with_overrides
        overview['by_term'][term_name]['total_collected'] += summary.total_collected
        overview['by_term'][term_name]['total_pending'] += summary.total_pending_collection
    
    # Calculate overall collection rate
    if overview['total_expected'] > 0:
        overview['overall_collection_rate'] = (overview['total_collected'] / overview['total_expected']) * 100
    
    # Calculate collection rates for grouped data
    for year_data in overview['by_academic_year'].values():
        if year_data['total_expected'] > 0:
            year_data['collection_rate'] = (year_data['total_collected'] / year_data['total_expected']) * 100
    
    for term_data in overview['by_term'].values():
        if term_data['total_expected'] > 0:
            term_data['collection_rate'] = (term_data['total_collected'] / term_data['total_expected']) * 100
    
    return overview
