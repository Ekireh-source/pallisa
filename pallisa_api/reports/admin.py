from django.contrib import admin
from .models import ReportCard, SubjectReport, SubjectCompetencyScore


class SubjectCompetencyScoreInline(admin.TabularInline):
    model = SubjectCompetencyScore
    extra = 1


class SubjectReportInline(admin.StackedInline):
    model = SubjectReport
    extra = 1
    show_change_link = True


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = ('student', 'academic_year', 'term', 'class_obj', 'stream', 'average_score', 'overall_grade', 'is_published')
    list_filter = ('academic_year', 'term', 'class_obj', 'stream', 'is_published')
    search_fields = ('student__student_id', 'student__user_profile__user__first_name', 'student__user_profile__user__last_name')
    inlines = [SubjectReportInline]
    fieldsets = (
        ('Student Info', {
            'fields': ('student', 'academic_year', 'term', 'class_obj', 'stream')
        }),
        ('Performance', {
            'fields': ('total_score', 'average_score', 'overall_grade', 'position', 'out_of')
        }),
        ('Remarks', {
            'fields': ('class_teacher', 'class_teacher_remarks', 'head_teacher_remarks')
        }),
        ('Attendance & Publication', {
            'fields': ('attendance_days_present', 'attendance_total_days', 'is_published')
        }),
    )


@admin.register(SubjectReport)
class SubjectReportAdmin(admin.ModelAdmin):
    list_display = ('subject', 'report_card', 'aoi_score', 'exam_score', 'total_score', 'grade', 'teacher')
    list_filter = ('subject', 'report_card__academic_year', 'report_card__term', 'grade')
    search_fields = ('report_card__student__student_id', 'subject__name')
    inlines = [SubjectCompetencyScoreInline]


@admin.register(SubjectCompetencyScore)
class SubjectCompetencyScoreAdmin(admin.ModelAdmin):
    list_display = ('competency_name', 'subject_report', 'assessment_type', 'score', 'max_score')
    list_filter = ('subject_report__subject', 'assessment_type')
