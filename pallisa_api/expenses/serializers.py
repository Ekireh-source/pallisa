from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ExpenseCategory, AcademicYear, Term, Department, Vendor, Expense

User = get_user_model()


class ExpenseCategorySerializer(serializers.ModelSerializer):
    """Serializer for ExpenseCategory model"""
    expense_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ExpenseCategory
        fields = [
            'id', 'name', 'description', 'is_active', 
            'created_at', 'updated_at', 'expense_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'expense_count']

    def get_expense_count(self, obj):
        """Return count of expenses in this category"""
        return obj.expenses.count()


class AcademicYearSerializer(serializers.ModelSerializer):
    """Serializer for AcademicYear model"""
    term_count = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()
    
    class Meta:
        model = AcademicYear
        fields = [
            'id', 'name', 'start_date', 'end_date', 'is_current',
            'is_active', 'created_at', 'updated_at', 'term_count', 'duration_days'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'term_count', 'duration_days']

    def get_term_count(self, obj):
        """Return count of terms in this academic year"""
        return obj.terms.count()

    def get_duration_days(self, obj):
        """Return academic year duration in days"""
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days
        return None

    def validate(self, data):
        """Validate that end_date is after start_date"""
        if data.get('start_date') and data.get('end_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError("End date must be after start date.")
        return data


class TermSerializer(serializers.ModelSerializer):
    """Serializer for Term model"""
    expense_count = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    
    class Meta:
        model = Term
        fields = [
            'id', 'name', 'academic_year', 'academic_year_name', 'start_date', 'end_date',
            'is_current', 'is_active', 'created_at', 'updated_at', 'expense_count', 'duration_days'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'expense_count', 'duration_days', 'academic_year_name']

    def get_expense_count(self, obj):
        """Return count of expenses in this term"""
        return obj.expenses.count()

    def get_duration_days(self, obj):
        """Return term duration in days"""
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days
        return None

    def validate(self, data):
        """Validate that end_date is after start_date and within academic year"""
        if data.get('start_date') and data.get('end_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError("End date must be after start date.")
        
        # Validate that term dates are within academic year dates
        academic_year = data.get('academic_year')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if academic_year and start_date and end_date:
            if start_date < academic_year.start_date or end_date > academic_year.end_date:
                raise serializers.ValidationError(
                    f"Term dates must be within academic year ({academic_year.start_date} to {academic_year.end_date})"
                )
        
        return data


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model"""
    expense_count = serializers.SerializerMethodField()
    total_expenses = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'description', 'is_active', 
            'created_at', 'updated_at', 'expense_count', 'total_expenses'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'expense_count', 'total_expenses']

    def get_expense_count(self, obj):
        """Return count of expenses for this department"""
        return obj.expenses.count()

    def get_total_expenses(self, obj):
        """Return total amount of expenses for this department"""
        return sum(expense.amount for expense in obj.expenses.all())


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor model"""
    expense_count = serializers.SerializerMethodField()
    total_expenses = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'name', 'contact', 'email', 'phone', 'address', 
            'is_active', 'created_at', 'updated_at', 'expense_count', 'total_expenses'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'expense_count', 'total_expenses']

    def get_expense_count(self, obj):
        """Return count of expenses for this vendor"""
        return obj.expenses.count()

    def get_total_expenses(self, obj):
        """Return total amount of expenses for this vendor"""
        return sum(expense.amount for expense in obj.expenses.all())


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for nested representation"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name']

    def get_full_name(self, obj):
        """Return user's full name from profile"""
        if hasattr(obj, 'profile') and obj.profile:
            return f"{obj.profile.first_name} {obj.profile.last_name}"
        return obj.email


class ExpenseSerializer(serializers.ModelSerializer):
    """Comprehensive serializer for Expense model"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    term_name = serializers.SerializerMethodField(read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.profile.first_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.profile.first_name', read_only=True)
    status = serializers.CharField(read_only=True)
    receipt_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'description', 'amount', 'category', 'department', 
            'vendor', 'term', 'incurred_on', 'recorded_by', 'approved', 
            'approved_by', 'approved_at', 'receipt_image', 'receipt_url',
            'invoice_number', 'payment_method', 'created_at', 'updated_at',
            'category_name', 'department_name', 'vendor_name', 'term_name',
            'recorded_by_name', 'approved_by_name', 'status'
        ]
        read_only_fields = [
            'id', 'recorded_by', 'approved_by', 'approved_at', 
            'created_at', 'updated_at', 'status', 'receipt_url',
            'category_name', 'department_name', 'vendor_name', 'term_name',
            'recorded_by_name', 'approved_by_name'
        ]

    def get_term_name(self, obj):
        """Return term name with academic year"""
        if obj.term:
            return f"{obj.term.name} ({obj.term.academic_year.name})"
        return None

    def get_receipt_url(self, obj):
        """Return the URL of the receipt image if it exists"""
        if obj.receipt_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt_image.url)
            return obj.receipt_image.url
        return None

    def validate_amount(self, value):
        """Validate that amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_incurred_on(self, value):
        """Validate that incurred_on is not in the future"""
        from django.utils import timezone
        if value > timezone.now().date():
            raise serializers.ValidationError("Expense date cannot be in the future.")
        return value

    def create(self, validated_data):
        """Set the recorded_by field to the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['recorded_by'] = request.user
        return super().create(validated_data)


class ExpenseDetailSerializer(ExpenseSerializer):
    """Detailed expense serializer with nested relations"""
    category = ExpenseCategorySerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    vendor = VendorSerializer(read_only=True)
    term = TermSerializer(read_only=True)
    recorded_by = UserBasicSerializer(read_only=True)
    approved_by = UserBasicSerializer(read_only=True)
    
    class Meta(ExpenseSerializer.Meta):
        depth = 1


class TermDetailSerializer(TermSerializer):
    """Detailed term serializer with nested academic year"""
    academic_year = AcademicYearSerializer(read_only=True)
    
    class Meta(TermSerializer.Meta):
        depth = 1


class ExpenseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating expenses"""
    
    class Meta:
        model = Expense
        fields = [
            'title', 'description', 'amount', 'category', 'department', 
            'vendor', 'term', 'incurred_on', 'receipt_image', 
            'invoice_number', 'payment_method'
        ]

    def validate_amount(self, value):
        """Validate that amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_incurred_on(self, value):
        """Validate that incurred_on is not in the future"""
        from django.utils import timezone
        if value > timezone.now().date():
            raise serializers.ValidationError("Expense date cannot be in the future.")
        return value

    def create(self, validated_data):
        """Set the recorded_by field to the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['recorded_by'] = request.user
        return super().create(validated_data)


class ExpenseApprovalSerializer(serializers.ModelSerializer):
    """Serializer for approving/disapproving expenses"""
    
    class Meta:
        model = Expense
        fields = ['approved']

    def update(self, instance, validated_data):
        """Set approval details when approving"""
        request = self.context.get('request')
        if validated_data.get('approved') and request and request.user.is_authenticated:
            instance.approved_by = request.user
            from django.utils import timezone
            instance.approved_at = timezone.now()
        elif not validated_data.get('approved'):
            # Reset approval details if disapproving
            instance.approved_by = None
            instance.approved_at = None
        
        instance.approved = validated_data.get('approved', instance.approved)
        instance.save()
        return instance


class ExpenseSummarySerializer(serializers.Serializer):
    """Serializer for expense summary statistics"""
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    approved_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    pending_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    expense_count = serializers.IntegerField()
    approved_count = serializers.IntegerField()
    pending_count = serializers.IntegerField()
    categories_breakdown = serializers.DictField()
    monthly_breakdown = serializers.DictField() 