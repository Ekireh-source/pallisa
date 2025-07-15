from django.contrib import admin
from .models import FeeCategory, FeeStructure, Scholarship, StudentFeeOverride, FeePayment

class FeeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('is_active', 'created_at', 'updated_at')
    ordering = ('name',)

class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('category', 'class_obj', 'academic_year', 'term', 'amount', 'is_active', 'created_at', 'updated_at')
    search_fields = ('category__name', 'class_obj__name', 'academic_year__name', 'term__name')
    list_filter = ('category', 'class_obj', 'academic_year', 'term', 'is_active')
    ordering = ('academic_year', 'term', 'class_obj', 'category')

class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ('name', 'discount_type', 'discount_value', 'max_discount_amount', 'is_active', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    list_filter = ('discount_type', 'is_active', 'created_at', 'updated_at')
    ordering = ('name',)

class StudentFeeOverrideAdmin(admin.ModelAdmin):
    list_display = ('student', 'category', 'academic_year', 'term', 'custom_amount', 'is_active', 'created_at', 'updated_at')
    search_fields = ('student__full_name', 'category__name', 'academic_year__name', 'term__name')
    list_filter = ('category', 'academic_year', 'term', 'is_active')
    ordering = ('student', 'academic_year', 'term', 'category')

class FeePaymentAdmin(admin.ModelAdmin):
    list_display = ('student', 'category', 'academic_year', 'term', 'amount_paid', 'payment_method', 'payment_status', 'payment_date', 'due_date', 'scholarship', 'discount_amount', 'recorded_by', 'created_at', 'updated_at')
    search_fields = ('student__full_name', 'category__name', 'academic_year__name', 'term__name', 'receipt_number')
    list_filter = ('category', 'academic_year', 'term', 'payment_method', 'payment_status', 'scholarship', 'created_at', 'updated_at')
    ordering = ('-payment_date', '-created_at')

admin.site.register(FeeCategory, FeeCategoryAdmin)
admin.site.register(FeeStructure, FeeStructureAdmin)
admin.site.register(Scholarship, ScholarshipAdmin)
admin.site.register(StudentFeeOverride, StudentFeeOverrideAdmin)
admin.site.register(FeePayment, FeePaymentAdmin)
