from rest_framework import serializers
from .models import Topics, ActivityOfIntegration, IntegrationScore, Exam, ExamScore, CompetencyArea


class CompetencyAreaSerializer(serializers.ModelSerializer):
    topic_name = serializers.ReadOnlyField(source='topic.name')

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

    class Meta:
        model = ActivityOfIntegration
        fields = '__all__'
        read_only_fields = ['public_id', 'created_at', 'updated_at']


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



