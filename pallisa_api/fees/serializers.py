from rest_framework import serializers
from .models import (
    FeeCategory, FeeStructure, Scholarship, StudentFeeOverride, 
    FeePayment, StudentFeeBalance, TermFeeCollectionSummary
)
from members.serializers import StudentSerializer, ClassSerializer
from expenses.serializers import AcademicYearSerializer, TermSerializer
from accounts.serializers import UserProfileSerializer
from decimal import Decimal


class FeeCategorySerializer(serializers.ModelSerializer):
    """Serializer for FeeCategory model"""
    
    class Meta:
        model = FeeCategory
        fields = [
            'id', 'name', 'description', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for FeeStructure model"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'category', 'category_name', 'class_obj', 'class_name',
            'academic_year', 'academic_year_name', 'term', 'term_name',
            'amount', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeeStructureDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for FeeStructure with nested objects"""
    category = FeeCategorySerializer(read_only=True)
    class_obj = ClassSerializer(read_only=True)
    academic_year = AcademicYearSerializer(read_only=True)
    term = TermSerializer(read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = [
            'id', 'category', 'class_obj', 'academic_year', 'term',
            'amount', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ScholarshipSerializer(serializers.ModelSerializer):
    """Serializer for Scholarship model"""
    
    class Meta:
        model = Scholarship
        fields = [
            'id', 'name', 'description', 'discount_type', 'discount_value',
            'max_discount_amount', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentFeeOverrideSerializer(serializers.ModelSerializer):
    """Serializer for StudentFeeOverride model"""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    
    class Meta:
        model = StudentFeeOverride
        fields = [
            'id', 'student', 'student_name', 'category', 'category_name',
            'academic_year', 'academic_year_name', 'term', 'term_name',
            'custom_amount', 'reason', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentFeeOverrideDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for StudentFeeOverride with nested objects"""
    student = StudentSerializer(read_only=True)
    category = FeeCategorySerializer(read_only=True)
    academic_year = AcademicYearSerializer(read_only=True)
    term = TermSerializer(read_only=True)
    
    class Meta:
        model = StudentFeeOverride
        fields = [
            'id', 'student', 'category', 'academic_year', 'term',
            'custom_amount', 'reason', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentFeeBalanceSerializer(serializers.ModelSerializer):
    """Serializer for StudentFeeBalance model"""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    class_name = serializers.CharField(source='student.current_stream.class_obj.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    payment_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = StudentFeeBalance
        fields = [
            'id', 'student', 'student_name', 'student_id', 'class_name',
            'academic_year', 'academic_year_name', 'term', 'term_name',
            'total_expected', 'total_paid', 'total_discounts', 'total_pending',
            'balance_status', 'payment_percentage', 'last_calculated',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_expected', 'total_paid', 'total_discounts', 
            'total_pending', 'balance_status', 'payment_percentage',
            'last_calculated', 'created_at', 'updated_at'
        ]


class StudentFeeBalanceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for StudentFeeBalance with nested objects"""
    student = StudentSerializer(read_only=True)
    academic_year = AcademicYearSerializer(read_only=True)
    term = TermSerializer(read_only=True)
    payment_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = StudentFeeBalance
        fields = [
            'id', 'student', 'academic_year', 'term',
            'total_expected', 'total_paid', 'total_discounts', 'total_pending',
            'balance_status', 'payment_percentage', 'last_calculated',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'total_expected', 'total_paid', 'total_discounts', 
            'total_pending', 'balance_status', 'payment_percentage',
            'last_calculated', 'created_at', 'updated_at'
        ]


class FeePaymentSerializer(serializers.ModelSerializer):
    """Serializer for FeePayment model"""
    student_name = serializers.CharField(source='student.student_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    scholarship_name = serializers.CharField(source='scholarship.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.first_name', read_only=True)
    original_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FeePayment
        fields = [
            'id', 'student', 'student_name', 'category', 'category_name',
            'academic_year', 'academic_year_name', 'term', 'term_name',
            'amount_paid', 'payment_method', 'payment_status', 'receipt_number',
            'payment_date', 'due_date', 'scholarship', 'scholarship_name',
            'discount_amount', 'notes', 'recorded_by', 'recorded_by_name',
            'original_amount', 'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'receipt_number', 'original_amount', 'is_overdue', 
            'created_at', 'updated_at'
        ]

    def validate(self, data):
        """Validate payment data"""
        if data['payment_date'] > data['due_date']:
            # Allow overdue payments but mark them appropriately
            pass
        
        if data.get('scholarship') and data.get('discount_amount', 0) <= 0:
            # Calculate discount if scholarship is provided but no discount amount
            scholarship = data['scholarship']
            base_amount = data['amount_paid']
            data['discount_amount'] = scholarship.calculate_discount(base_amount)
        
        return data


class FeePaymentDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for FeePayment with nested objects"""
    student = StudentSerializer(read_only=True)
    category = FeeCategorySerializer(read_only=True)
    academic_year = AcademicYearSerializer(read_only=True)
    term = TermSerializer(read_only=True)
    scholarship = ScholarshipSerializer(read_only=True)
    recorded_by = UserProfileSerializer(read_only=True)
    original_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FeePayment
        fields = [
            'id', 'student', 'category', 'academic_year', 'term',
            'amount_paid', 'payment_method', 'payment_status', 'receipt_number',
            'payment_date', 'due_date', 'scholarship', 'discount_amount',
            'notes', 'recorded_by', 'original_amount', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'receipt_number', 'original_amount', 'is_overdue', 
            'created_at', 'updated_at'
        ]


class FeePaymentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating fee payments with automatic calculations"""
    
    class Meta:
        model = FeePayment
        fields = [
            'student', 'category', 'academic_year', 'term', 'amount_paid',
            'payment_method', 'payment_status', 'payment_date', 'due_date',
            'scholarship', 'discount_amount', 'notes'
        ]

    def validate(self, data):
        """Validate and calculate discount if scholarship is provided"""
        print(f"Validating fee payment data: {data}")
        
        # Ensure discount_amount is not None
        if data.get('discount_amount') is None:
            data['discount_amount'] = Decimal('0.00')
        
        # Validate and calculate discount if scholarship is provided
        if data.get('scholarship') and not data.get('discount_amount'):
            scholarship = data['scholarship']
            base_amount = data['amount_paid']
            data['discount_amount'] = scholarship.calculate_discount(base_amount)
        
        print(f"Validated data: {data}")
        return data


class FeeSummarySerializer(serializers.Serializer):
    """Serializer for fee summary statistics"""
    total_expected = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_discounts = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_count = serializers.IntegerField()
    overdue_count = serializers.IntegerField()
    by_category = serializers.DictField()
    by_status = serializers.DictField()
    by_month = serializers.DictField()


class StudentFeeSummarySerializer(serializers.Serializer):
    """Serializer for individual student fee summary"""
    student_id = serializers.IntegerField()
    student_name = serializers.CharField()
    class_name = serializers.CharField()
    total_expected = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_discounts = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_count = serializers.IntegerField()
    overdue_count = serializers.IntegerField()
    last_payment_date = serializers.DateField(allow_null=True)
    payment_status = serializers.CharField()  # 'paid', 'partial', 'unpaid' 


class TermFeeCollectionSummarySerializer(serializers.ModelSerializer):
    """Serializer for TermFeeCollectionSummary model"""
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    collection_percentage = serializers.CharField(read_only=True)
    is_collection_complete = serializers.BooleanField(read_only=True)
    outstanding_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    collection_efficiency = serializers.CharField(read_only=True)

    class Meta:
        model = TermFeeCollectionSummary
        fields = [
            'id', 'academic_year', 'academic_year_name', 'term', 'term_name',
            'total_expected_from_structures', 'total_expected_with_overrides',
            'total_collected', 'total_discounts_given', 'total_pending_collection',
            'total_students', 'students_with_fees', 'fully_paid_students', 
            'partially_paid_students', 'unpaid_students', 'overpaid_students',
            'collection_rate', 'collection_percentage', 'average_payment_per_student',
            'is_collection_complete', 'outstanding_amount', 'collection_efficiency',
            'last_calculated', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_calculated']


class SchoolFeeCollectionOverviewSerializer(serializers.Serializer):
    """Serializer for school-wide fee collection overview"""
    total_academic_years = serializers.IntegerField()
    total_terms = serializers.IntegerField()
    total_expected = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_collected = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_discounts = serializers.DecimalField(max_digits=15, decimal_places=2)
    overall_collection_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_students = serializers.IntegerField()
    by_academic_year = serializers.DictField()
    by_term = serializers.DictField()
    collection_trends = serializers.DictField() 