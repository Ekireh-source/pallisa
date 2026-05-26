from django.contrib import admin
from .models import (
    Topics, CompetencyArea, ActivityOfIntegration, IntegrationScore,
    Exam, ExamScore, ExamPaperScore, ProjectScore, SaAssessment, SaScore
)

@admin.register(Topics)
class TopicsAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'class_obj', 'created_at')
    search_fields = ('name', 'subject__name', 'class_obj__name')
    list_filter = ('subject', 'class_obj')

@admin.register(CompetencyArea)
class CompetencyAreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_obj', 'term', 'topic', 'created_at')
    search_fields = ('name', 'topic__name', 'class_obj__name', 'term__name')
    list_filter = ('class_obj', 'term')

@admin.register(ActivityOfIntegration)
class ActivityOfIntegrationAdmin(admin.ModelAdmin):
    list_display = ('topic', 'competency_area', 'term', 'max_score')
    search_fields = ('topic__name', 'competency_area__name', 'term__name')
    list_filter = ('term', 'competency_area')

@admin.register(IntegrationScore)
class IntegrationScoreAdmin(admin.ModelAdmin):
    list_display = ('student', 'activity', 'score')
    search_fields = ('student__user_profile__first_name', 'student__user_profile__last_name', 'activity__topic__name')
    list_filter = ('activity',)

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_obj', 'term', 'start_date', 'end_date', 'is_published')
    search_fields = ('name', 'class_obj__name', 'term__name')
    list_filter = ('class_obj', 'term', 'is_published')

@admin.register(ExamScore)
class ExamScoreAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'subject', 'score')
    search_fields = ('exam__name', 'student__user_profile__first_name', 'student__user_profile__last_name', 'subject__name')
    list_filter = ('exam', 'subject')

@admin.register(ExamPaperScore)
class ExamPaperScoreAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'paper', 'score')
    search_fields = ('exam__name', 'student__user_profile__first_name', 'student__user_profile__last_name', 'paper__name')
    list_filter = ('exam', 'paper')

@admin.register(ProjectScore)
class ProjectScoreAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'term', 'academic_year', 'competency_number', 'sub_criteria', 'score')
    search_fields = ('student__user_profile__first_name', 'student__user_profile__last_name', 'subject__name')
    list_filter = ('term', 'academic_year', 'competency_number')

@admin.register(SaAssessment)
class SaAssessmentAdmin(admin.ModelAdmin):
    list_display = ('subject', 'stream', 'teacher', 'term', 'academic_year')
    search_fields = ('subject__name', 'stream__name', 'teacher__user_profile__first_name', 'teacher__user_profile__last_name')
    list_filter = ('term', 'academic_year')

@admin.register(SaScore)
class SaScoreAdmin(admin.ModelAdmin):
    list_display = ('sa_assessment', 'student', 'l1', 'g1', 'l2', 'g2', 'l3', 'g3', 'l4', 'g4', 'l5', 'g5')
    search_fields = ('student__user_profile__first_name', 'student__user_profile__last_name', 'sa_assessment__subject__name')
    list_filter = ('sa_assessment',)
