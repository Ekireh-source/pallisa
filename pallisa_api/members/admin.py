from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import (
    Class, Stream, Student, Teacher, Parent, 
    ParentStudentRelationship, Subject, StudentStreamHistory, TeacherSubjectAssignment, NonStaffMember
)


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'stream_count']
    list_filter = ['is_active']
    search_fields = ['name']
    ordering = ['name']
    
    def stream_count(self, obj):
        return obj.streams.filter(is_active=True).count()
    stream_count.short_description = 'Active Streams'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'is_active')
        }),
        ('Additional Information', {
            'fields': ('description',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = ['name', 'class_obj', 'capacity', 'current_enrollment', 'is_active']
    list_filter = ['class_obj', 'is_active']
    search_fields = ['name', 'class_obj__name']
    ordering = ['class_obj__name', 'name']
    
    def current_enrollment(self, obj):
        count = obj.students.filter(is_active=True).count()
        if count > obj.capacity:
            return format_html('<span style="color: red;">{}</span>', count)
        elif count > obj.capacity * 0.9:
            return format_html('<span style="color: orange;">{}</span>', count)
        return count
    current_enrollment.short_description = 'Enrolled'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'class_obj')
        }),
        ('Assignment', {
            'fields': ('class_teacher',)
        }),
        ('Capacity & Status', {
            'fields': ('capacity', 'is_active')
        }),
    )


class ParentStudentRelationshipInline(admin.TabularInline):
    model = ParentStudentRelationship
    extra = 1
    fields = ['parent', 'relationship_type', 'is_primary', 'is_emergency_contact', 'is_authorized_pickup']


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'full_name', 'current_stream', 'enrollment_status', 'admission_date', 'is_active']
    list_filter = ['enrollment_status', 'current_stream__class_obj', 'current_stream', 'admission_date', 'is_active']
    search_fields = ['student_id', 'user_profile__first_name', 'user_profile__last_name', 'admission_number']
    ordering = ['student_id']
    inlines = [ParentStudentRelationshipInline]
    
    def full_name(self, obj):
        return obj.user_profile.get_full_name()
    full_name.short_description = 'Full Name'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user_profile',)
        }),
        ('Student Information', {
            'fields': ('student_id', 'admission_number', 'admission_date', 'current_stream')
        }),
        ('Academic Background', {
            'fields': ('previous_school',),
            'classes': ('collapse',)
        }),
        ('Health Information', {
            'fields': ('special_needs', 'medical_conditions', 'allergies'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('enrollment_status', 'is_active')
        }),
    )
    
    readonly_fields = ['student_id']


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'specialization', 'employment_type', 'hire_date', 'is_active']
    list_filter = ['employment_type', 'user_profile__role__school', 'hire_date', 'is_active']
    search_fields = ['employee_id', 'user_profile__first_name', 'user_profile__last_name', 'specialization']
    ordering = ['employee_id']
    
    def full_name(self, obj):
        return obj.user_profile.get_full_name()
    full_name.short_description = 'Full Name'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user_profile',)
        }),
        ('Employment Information', {
            'fields': ('employee_id', 'hire_date', 'employment_type', 'salary')
        }),
        ('Professional Information', {
            'fields': ('qualification', 'specialization', 'years_of_experience'),
        }),
        ('Experience', {
            'fields': ('previous_experience',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )
    
    readonly_fields = ['employee_id']


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'relationship_type', 'occupation', 'is_primary_contact', 'children_count', 'is_active']
    list_filter = ['relationship_type', 'is_primary_contact', 'is_emergency_contact', 'is_active']
    search_fields = ['user_profile__first_name', 'user_profile__last_name', 'occupation', 'workplace']
    ordering = ['user_profile__first_name', 'user_profile__last_name']
    inlines = [ParentStudentRelationshipInline]
    
    def full_name(self, obj):
        return obj.user_profile.get_full_name()
    full_name.short_description = 'Full Name'
    
    def children_count(self, obj):
        return obj.parent_student_relationships.count()
    children_count.short_description = 'Children'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user_profile',)
        }),
        ('Relationship Information', {
            'fields': ('relationship_type',)
        }),
        ('Contact Information', {
            'fields': ('home_address', 'work_phone')
        }),
        ('Professional Information', {
            'fields': ('occupation', 'workplace'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('is_primary_contact', 'is_emergency_contact', 'is_authorized_pickup')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(ParentStudentRelationship)
class ParentStudentRelationshipAdmin(admin.ModelAdmin):
    list_display = ['parent_name', 'student_name', 'relationship_type', 'is_primary', 'is_emergency_contact']
    list_filter = ['relationship_type', 'is_primary', 'is_emergency_contact', 'is_authorized_pickup']
    search_fields = [
        'parent__user_profile__first_name', 'parent__user_profile__last_name',
        'student__user_profile__first_name', 'student__user_profile__last_name',
        'student__student_id'
    ]
    ordering = ['student__student_id', 'parent__user_profile__first_name']
    
    def parent_name(self, obj):
        return obj.parent.user_profile.get_full_name()
    parent_name.short_description = 'Parent'
    
    def student_name(self, obj):
        return obj.student.user_profile.get_full_name()
    student_name.short_description = 'Student'
    
    fieldsets = (
        ('Relationship', {
            'fields': ('parent', 'student', 'relationship_type')
        }),
        ('Permissions', {
            'fields': ('is_primary', 'is_emergency_contact', 'is_authorized_pickup')
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'school', 'is_active']
    list_filter = ['school', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['code']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'school', 'is_active')
        }),
        ('Description', {
            'fields': ('description',),
            'classes': ('collapse',)
        }),
    )


@admin.register(StudentStreamHistory)
class StudentStreamHistoryAdmin(admin.ModelAdmin):
    list_display = ['student_name', 'stream_name', 'academic_year', 'enrollment_date', 'final_grade', 'is_active']
    list_filter = ['academic_year', 'stream__class_obj', 'is_active']
    search_fields = [
        'student__user_profile__first_name', 'student__user_profile__last_name',
        'student__student_id', 'stream__name'
    ]
    ordering = ['-academic_year__start_date', 'student__student_id']
    
    def student_name(self, obj):
        return obj.student.user_profile.get_full_name()
    student_name.short_description = 'Student'
    
    def stream_name(self, obj):
        return obj.stream.name
    stream_name.short_description = 'Stream'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('student', 'stream', 'academic_year')
        }),
        ('Dates', {
            'fields': ('enrollment_date', 'graduation_date')
        }),
        ('Results', {
            'fields': ('final_grade', 'remarks'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(TeacherSubjectAssignment)
class TeacherSubjectAssignmentAdmin(admin.ModelAdmin):
    list_display = ['teacher_name', 'subject_name', 'stream_name', 'academic_year', 'is_active']
    list_filter = ['academic_year', 'subject', 'stream__class_obj', 'is_active']
    search_fields = [
        'teacher__user_profile__first_name', 'teacher__user_profile__last_name',
        'teacher__employee_id', 'subject__name', 'stream__name'
    ]
    ordering = ['academic_year', 'teacher__employee_id']
    
    def teacher_name(self, obj):
        return obj.teacher.user_profile.get_full_name()
    teacher_name.short_description = 'Teacher'
    
    def subject_name(self, obj):
        return obj.subject.name
    subject_name.short_description = 'Subject'
    
    def stream_name(self, obj):
        return obj.stream.name
    stream_name.short_description = 'Stream'
    
    fieldsets = (
        ('Assignment', {
            'fields': ('teacher', 'subject', 'stream', 'academic_year')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(NonStaffMember)
class NonStaffMemberAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'full_name', 'employment_type', 'salary', 'hire_date', 'is_active']
    list_filter = ['employment_type', 'user_profile__role__school', 'hire_date', 'is_active']
    search_fields = ['employee_id', 'user_profile__first_name', 'user_profile__last_name', 'specialization']
    ordering = ['employee_id']
    
    def full_name(self, obj):
        return obj.user_profile.get_full_name()
    full_name.short_description = 'Full Name'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user_profile',)
        }),
        ('Employment Information', {
            'fields': ('employee_id', 'hire_date', 'employment_type', 'salary')
        }),
        ('Professional Information', {
            'fields': ('qualification', 'specialization', 'years_of_experience'),
        }),
        ('Experience', {
            'fields': ('previous_experience',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )
    
    readonly_fields = ['employee_id']


# Customize the admin site headers
admin.site.site_header = "Pallisa Education Management System"
admin.site.site_title = "Pallisa Admin"
admin.site.index_title = "Members Management"
