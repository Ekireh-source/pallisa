from rest_framework import serializers
from .models import (
    Topics, ActivityOfIntegration, IntegrationScore, Exam, ExamScore, 
    CompetencyArea, ExamPaperScore, ProjectScore, SaAssessment, SaScore
)


class CompetencyAreaSerializer(serializers.ModelSerializer):
    topic_name = serializers.ReadOnlyField(source='topic.name')
    class_name = serializers.ReadOnlyField(source='class_obj.name')
    term_name = serializers.ReadOnlyField(source='term.name')

    class Meta:
        model = CompetencyArea
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class TopicsSerializer(serializers.ModelSerializer):
    subject_name = serializers.ReadOnlyField(source='subject.name')
    class_name = serializers.ReadOnlyField(source='class_obj.name')

    class Meta:
        model = Topics
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ActivityOfIntegrationSerializer(serializers.ModelSerializer):
    topic_name = serializers.ReadOnlyField(source='topic.name')
    competency_area_name = serializers.ReadOnlyField(source='competency_area.name')
    subject_name = serializers.ReadOnlyField(source='topic.subject.name')
    teacher_name = serializers.ReadOnlyField(source='teacher.user_profile.get_full_name')
    created_by_name = serializers.SerializerMethodField()
    grading_progress = serializers.SerializerMethodField()

    class Meta:
        model = ActivityOfIntegration
        fields = '__all__'
        read_only_fields = ['public_id', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by and hasattr(obj.created_by, 'profile'):
            return obj.created_by.profile.get_full_name()
        return obj.created_by.email if obj.created_by else None

    def get_grading_progress(self, obj):
        try:
            from members.models import Student
            total_students = Student.objects.filter(
                current_stream__class_obj=obj.topic.class_obj,
                is_active=True
            ).count()
            if total_students == 0:
                return 0
            filled_scores = obj.scores.count()
            return min(100, int((filled_scores / total_students) * 100))
        except Exception:
            return 0


class IntegrationScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user_profile.get_full_name')
    activity_topic_name = serializers.ReadOnlyField(source='activity.topic.name')

    class Meta:
        model = IntegrationScore
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ExamSerializer(serializers.ModelSerializer):
    term_name = serializers.ReadOnlyField(source='term.name')
    class_name = serializers.ReadOnlyField(source='class_obj.name')
    class_level = serializers.ReadOnlyField(source='class_obj.level')

    class Meta:
        model = Exam
        fields = '__all__'
        read_only_fields = ['public_id', 'created_at', 'updated_at']


class ExamScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user_profile.get_full_name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    exam_name = serializers.ReadOnlyField(source='exam.name')

    class Meta:
        model = ExamScore
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ExamPaperScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user_profile.get_full_name')
    paper_name = serializers.ReadOnlyField(source='paper.name')
    subject_name = serializers.ReadOnlyField(source='paper.subject.name')
    subject_code = serializers.ReadOnlyField(source='paper.subject.code')

    class Meta:
        model = ExamPaperScore
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ProjectScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user_profile.get_full_name')
    subject_name = serializers.ReadOnlyField(source='subject.name')

    class Meta:
        model = ProjectScore
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class SaAssessmentSerializer(serializers.ModelSerializer):
    stream_name = serializers.ReadOnlyField(source='stream.name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    teacher_name = serializers.ReadOnlyField(source='teacher.user_profile.get_full_name')
    term_name = serializers.ReadOnlyField(source='term.name')
    created_by_name = serializers.SerializerMethodField()
    grading_progress = serializers.SerializerMethodField()

    class Meta:
        model = SaAssessment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by and hasattr(obj.created_by, 'profile'):
            return obj.created_by.profile.get_full_name()
        return obj.created_by.email if obj.created_by else None

    def get_grading_progress(self, obj):
        try:
            from members.models import Student
            total_students = Student.objects.filter(
                current_stream=obj.stream,
                is_active=True
            ).count()
            if total_students == 0:
                return 0
            filled_scores = obj.student_scores.count()
            return min(100, int((filled_scores / total_students) * 100))
        except Exception:
            return 0


class SaScoreSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user_profile.get_full_name')
    admission_number = serializers.ReadOnlyField(source='student.admission_number')

    class Meta:
        model = SaScore
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']





