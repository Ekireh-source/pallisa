from rest_framework import serializers
from .models import ReportCard, SubjectReport, SubjectCompetencyScore, GradingSystem, GradeBoundary
from members.models import Student, Subject, Teacher
from expenses.models import AcademicYear, Term

class GradeBoundarySerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeBoundary
        fields = ['id', 'grading_system', 'grade', 'min_score', 'max_score', 'remarks', 'points']

class GradingSystemSerializer(serializers.ModelSerializer):
    boundaries = GradeBoundarySerializer(many=True, read_only=True)

    class Meta:
        model = GradingSystem
        fields = ['id', 'name', 'school', 'description', 'is_active', 'created_at', 'updated_at', 'boundaries']

class SubjectCompetencyScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubjectCompetencyScore
        fields = ['id', 'assessment_type', 'competency_name', 'score', 'max_score']


class SubjectReportSerializer(serializers.ModelSerializer):
    subject_name = serializers.ReadOnlyField(source='subject.name')
    subject_code = serializers.ReadOnlyField(source='subject.code')
    teacher_name = serializers.ReadOnlyField(source='teacher.user_profile.get_full_name')
    competency_scores = SubjectCompetencyScoreSerializer(many=True, read_only=True)

    class Meta:
        model = SubjectReport
        fields = [
            'id', 'subject', 'subject_name', 'subject_code', 'teacher', 'teacher_name',
            'aoi_raw_score', 'aoi_score', 'exam_raw_score', 'exam_score', 'total_score', 
            'grade', 'remarks', 'competency_scores'
        ]
        read_only_fields = ['total_score', 'grade']


class ReportCardSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user_profile.get_full_name')
    student_id_code = serializers.ReadOnlyField(source='student.student_id')
    academic_year_name = serializers.ReadOnlyField(source='academic_year.name')
    term_name = serializers.ReadOnlyField(source='term.name')
    class_name = serializers.ReadOnlyField(source='class_obj.name')
    stream_name = serializers.ReadOnlyField(source='stream.name')
    subject_reports = SubjectReportSerializer(many=True, read_only=True)
    class_teacher_name = serializers.ReadOnlyField(source='class_teacher.user_profile.get_full_name')

    class Meta:
        model = ReportCard
        fields = [
            'id', 'public_id', 'student', 'student_name', 'student_id_code',
            'academic_year', 'academic_year_name', 'term', 'term_name',
            'class_obj', 'class_name', 'stream', 'stream_name',
            'total_score', 'average_score', 'overall_grade', 'position', 'out_of',
            'class_teacher', 'class_teacher_name', 'class_teacher_remarks',
            'head_teacher_remarks', 'attendance_days_present', 'attendance_total_days',
            'is_published', 'subject_reports', 'created_at', 'updated_at'
        ]
        read_only_fields = ['public_id', 'total_score', 'average_score', 'overall_grade', 'created_at', 'updated_at']


class GenerateReportCardSerializer(serializers.Serializer):
    """
    Serializer for the action of generating report cards for a specific group.
    """
    academic_year = serializers.IntegerField()
    term = serializers.IntegerField()
    class_obj = serializers.IntegerField(required=False)
    stream = serializers.IntegerField(required=False)
    student = serializers.IntegerField(required=False)
    school = serializers.IntegerField(required=False)
