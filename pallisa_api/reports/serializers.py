from rest_framework import serializers
from .models import ReportCard, SubjectReport, SubjectCompetencyScore, GradingSystem, GradeBoundary, ReportCardSettings
from members.models import Student, Subject, Teacher
from expenses.models import AcademicYear, Term

class GradeBoundarySerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeBoundary
        fields = ['id', 'grading_system', 'grade', 'min_score', 'max_score', 'remarks', 'description', 'points']

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


class ReportCardSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportCardSettings
        fields = [
            'id', 'school',
            # Report sections
            'show_attendance', 'show_grade_descriptor', 'show_grade_descriptor_score_range',
            'show_identifier_legend', 'show_subject_teacher_initials', 'show_teacher_comment',
            'show_header', 'show_watermark', 'show_school_logo', 'show_school_motto',
            # Rank
            'show_overall_student_rank', 'show_stream_student_rank', 'show_division_and_aggregate',
            # Remarks
            'show_class_teacher_remarks', 'show_head_teacher_remarks',
            # Signatures
            'show_class_teacher_signature', 'show_head_teacher_signature', 'show_parent_signature',
            # Others
            'show_school_dates', 'show_school_fees',
            # Dates
            'school_closed_on', 'next_term_begins_on',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


class ReportCardSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user_profile.get_full_name')
    student_id_code = serializers.ReadOnlyField(source='student.student_id')
    student_picture = serializers.SerializerMethodField()
    student_gender = serializers.ReadOnlyField(source='student.user_profile.gender')
    academic_year_name = serializers.ReadOnlyField(source='academic_year.name')
    term_name = serializers.ReadOnlyField(source='term.name')
    class_name = serializers.ReadOnlyField(source='class_obj.name')
    class_level = serializers.ReadOnlyField(source='class_obj.level')
    stream_name = serializers.ReadOnlyField(source='stream.name')
    subject_reports = SubjectReportSerializer(many=True, read_only=True)
    class_teacher_name = serializers.ReadOnlyField(source='class_teacher.user_profile.get_full_name')

    class Meta:
        model = ReportCard
        fields = [
            'id', 'public_id', 'student', 'student_name', 'student_id_code', 'student_picture', 'student_gender',
            'academic_year', 'academic_year_name', 'term', 'term_name',
            'class_obj', 'class_name', 'class_level', 'stream', 'stream_name',
            'total_score', 'average_score', 'overall_grade', 'position', 'out_of',
            'class_teacher', 'class_teacher_name', 'class_teacher_remarks',
            'head_teacher_remarks', 'attendance_days_present', 'attendance_total_days',
            'is_published', 'subject_reports', 'created_at', 'updated_at'
        ]
        read_only_fields = ['public_id', 'total_score', 'average_score', 'overall_grade', 'created_at', 'updated_at']

    def get_student_picture(self, obj):
        if obj.student.user_profile.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.student.user_profile.profile_picture.url)
            return obj.student.user_profile.profile_picture.url
        return None


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
