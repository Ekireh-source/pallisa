from django.contrib import admin
from .models import Campus, School, SetupSteps, Document

@admin.register(Campus)
class CampusAdmin(admin.ModelAdmin):
    list_display = ('name', 'public_id', 'email', 'phone_number', 'active', 'created_at')
    search_fields = ('name', 'email', 'phone_number')
    list_filter = ('active', 'created_at')

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'public_id', 'owner', 'email', 'phone_number', 'campus', 'level', 'active', 'created_at')
    search_fields = ('name', 'email', 'phone_number', 'owner__email', 'owner__first_name', 'owner__last_name')
    list_filter = ('active', 'level', 'created_at')
    raw_id_fields = ('owner', 'campus')

@admin.register(SetupSteps)
class SetupStepsAdmin(admin.ModelAdmin):
    list_display = ('setup_name', 'school', 'completed', 'completed_at', 'created_at')
    search_fields = ('setup_name', 'school__name')
    list_filter = ('completed', 'created_at')
    raw_id_fields = ('school',)

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('doc_name', 'user', 'doc_type', 'created_at')
    search_fields = ('doc_name', 'user__email', 'doc_type')
    list_filter = ('doc_type', 'created_at')
    raw_id_fields = ('user',)
