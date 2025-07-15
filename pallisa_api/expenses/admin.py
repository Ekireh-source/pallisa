from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import ExpenseCategory, AcademicYear, Term, Department, Vendor, Expense
from django.db import models


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description_short', 'expense_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    list_per_page = 25

    def description_short(self, obj):
        """Show first 50 characters of description"""
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return '-'
    description_short.short_description = 'Description'

    def expense_count(self, obj):
        """Show count of expenses in this category"""
        count = obj.expenses.count()
        if count > 0:
            url = reverse('admin:expenses_expense_changelist') + f'?category__id__exact={obj.id}'
            return format_html('<a href="{}">{} expenses</a>', url, count)
        return '0 expenses'
    expense_count.short_description = 'Expenses'


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'duration_days', 'term_count', 'is_current', 'is_active']
    list_filter = ['is_current', 'is_active', 'start_date']
    search_fields = ['name']
    ordering = ['-start_date']
    list_per_page = 25

    def duration_days(self, obj):
        """Show academic year duration in days"""
        if obj.start_date and obj.end_date:
            duration = (obj.end_date - obj.start_date).days
            return f"{duration} days"
        return '-'
    duration_days.short_description = 'Duration'

    def term_count(self, obj):
        """Show count of terms in this academic year"""
        count = obj.terms.count()
        if count > 0:
            url = reverse('admin:expenses_term_changelist') + f'?academic_year__id__exact={obj.id}'
            return format_html('<a href="{}">{} terms</a>', url, count)
        return '0 terms'
    term_count.short_description = 'Terms'

    def save_model(self, request, obj, form, change):
        """Override to handle is_current logic"""
        super().save_model(request, obj, form, change)


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ['name', 'academic_year', 'start_date', 'end_date', 'duration_days', 'expense_count', 'is_current', 'is_active']
    list_filter = ['academic_year', 'is_current', 'is_active', 'start_date']
    search_fields = ['name', 'academic_year__name']
    ordering = ['-academic_year__start_date', 'name']
    list_per_page = 25

    def duration_days(self, obj):
        """Show term duration in days"""
        if obj.start_date and obj.end_date:
            duration = (obj.end_date - obj.start_date).days
            return f"{duration} days"
        return '-'
    duration_days.short_description = 'Duration'

    def expense_count(self, obj):
        """Show count of expenses in this term"""
        count = obj.expenses.count()
        if count > 0:
            url = reverse('admin:expenses_expense_changelist') + f'?term__id__exact={obj.id}'
            return format_html('<a href="{}">{} expenses</a>', url, count)
        return '0 expenses'
    expense_count.short_description = 'Expenses'


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'description_short', 'expense_count', 'total_expenses', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    list_per_page = 25

    def description_short(self, obj):
        """Show first 50 characters of description"""
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return '-'
    description_short.short_description = 'Description'

    def expense_count(self, obj):
        """Show count of expenses for this department"""
        count = obj.expenses.count()
        if count > 0:
            url = reverse('admin:expenses_expense_changelist') + f'?department__id__exact={obj.id}'
            return format_html('<a href="{}">{} expenses</a>', url, count)
        return '0 expenses'
    expense_count.short_description = 'Expenses'

    def total_expenses(self, obj):
        """Show total amount of expenses for this department"""
        total = sum(expense.amount for expense in obj.expenses.all())
        return f"UGX {total:,.2f}" if total > 0 else 'UGX 0.00'
    total_expenses.short_description = 'Total Amount'


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact', 'email', 'phone', 'expense_count', 'total_expenses', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'contact', 'email', 'phone']
    ordering = ['name']
    list_per_page = 25

    def expense_count(self, obj):
        """Show count of expenses for this vendor"""
        count = obj.expenses.count()
        if count > 0:
            url = reverse('admin:expenses_expense_changelist') + f'?vendor__id__exact={obj.id}'
            return format_html('<a href="{}">{} expenses</a>', url, count)
        return '0 expenses'
    expense_count.short_description = 'Expenses'

    def total_expenses(self, obj):
        """Show total amount of expenses for this vendor"""
        total = sum(expense.amount for expense in obj.expenses.all())
        return f"UGX {total:,.2f}" if total > 0 else 'UGX 0.00'
    total_expenses.short_description = 'Total Amount'


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'amount_formatted', 'category', 'department', 
        'vendor', 'incurred_on', 'recorded_by_name', 'approval_status', 'created_at'
    ]
    list_filter = [
        'approved', 'category', 'department', 'term', 'vendor',
        'payment_method', 'incurred_on', 'created_at'
    ]
    search_fields = ['title', 'description', 'invoice_number']
    ordering = ['-incurred_on', '-created_at']
    list_per_page = 25
    date_hierarchy = 'incurred_on'
    readonly_fields = ['recorded_by', 'approved_by', 'approved_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'amount', 'incurred_on')
        }),
        ('Categorization', {
            'fields': ('category', 'department', 'vendor', 'term')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'invoice_number', 'receipt_image')
        }),
        ('Approval', {
            'fields': ('approved', 'approved_by', 'approved_at')
        }),
        ('System Information', {
            'fields': ('recorded_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def amount_formatted(self, obj):
        """Format amount with currency symbol"""
        return f"UGX {obj.amount:,.2f}"
    amount_formatted.short_description = 'Amount'
    amount_formatted.admin_order_field = 'amount'

    def recorded_by_name(self, obj):
        """Show name of user who recorded the expense"""
        if obj.recorded_by and hasattr(obj.recorded_by, 'profile'):
            profile = obj.recorded_by.profile
            return f"{profile.first_name} {profile.last_name}"
        elif obj.recorded_by:
            return obj.recorded_by.email
        return '-'
    recorded_by_name.short_description = 'Recorded By'

    def approval_status(self, obj):
        """Show approval status with color coding"""
        if obj.approved:
            approved_by = "Unknown"
            if obj.approved_by and hasattr(obj.approved_by, 'profile'):
                profile = obj.approved_by.profile
                approved_by = f"{profile.first_name} {profile.last_name}"
            elif obj.approved_by:
                approved_by = obj.approved_by.email
            
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Approved</span><br>'
                '<small>by {} on {}</small>',
                approved_by,
                obj.approved_at.strftime('%Y-%m-%d %H:%M') if obj.approved_at else 'Unknown'
            )
        else:
            return format_html('<span style="color: orange; font-weight: bold;">⏳ Pending</span>')
    approval_status.short_description = 'Status'

    def get_readonly_fields(self, request, obj=None):
        """Make certain fields readonly based on approval status"""
        readonly = list(self.readonly_fields)
        if obj and obj.approved:
            # If expense is approved, make most fields readonly
            readonly.extend(['title', 'description', 'amount', 'category', 'department', 
                           'vendor', 'term', 'incurred_on', 'payment_method', 
                           'invoice_number', 'receipt_image'])
        return readonly

    def save_model(self, request, obj, form, change):
        """Set recorded_by to current user if creating new expense"""
        if not change:  # Creating new object
            obj.recorded_by = request.user
        
        # Handle approval logic
        if obj.approved and not obj.approved_by:
            obj.approved_by = request.user
            from django.utils import timezone
            obj.approved_at = timezone.now()
        elif not obj.approved:
            obj.approved_by = None
            obj.approved_at = None
            
        super().save_model(request, obj, form, change)

    def has_change_permission(self, request, obj=None):
        """Check if user can change this expense"""
        if obj and obj.approved and obj.recorded_by != request.user:
            # Only allow the person who recorded it or superuser to edit approved expenses
            return request.user.is_superuser
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        """Check if user can delete this expense"""
        if obj and obj.approved and obj.recorded_by != request.user:
            # Only allow the person who recorded it or superuser to delete approved expenses
            return request.user.is_superuser
        return super().has_delete_permission(request, obj)

    actions = ['approve_expenses', 'disapprove_expenses']

    def approve_expenses(self, request, queryset):
        """Bulk approve selected expenses"""
        updated = 0
        for expense in queryset:
            if not expense.approved and expense.recorded_by != request.user:
                expense.approved = True
                expense.approved_by = request.user
                from django.utils import timezone
                expense.approved_at = timezone.now()
                expense.save()
                updated += 1
        
        self.message_user(request, f'{updated} expenses were approved.')
    approve_expenses.short_description = "Approve selected expenses"

    def disapprove_expenses(self, request, queryset):
        """Bulk disapprove selected expenses"""
        updated = 0
        for expense in queryset:
            if expense.approved:
                expense.approved = False
                expense.approved_by = None
                expense.approved_at = None
                expense.save()
                updated += 1
        
        self.message_user(request, f'{updated} expenses were disapproved.')
    disapprove_expenses.short_description = "Disapprove selected expenses"


# Customize admin site headers
admin.site.site_header = "Pallisa Expense Management"
admin.site.site_title = "Expense Admin"
admin.site.index_title = "Expense Management Administration"
