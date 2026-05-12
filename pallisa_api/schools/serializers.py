from rest_framework import serializers
from .models import Campus, School, SetupSteps, Document


class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = '__all__'
        read_only_fields = ['public_id', 'created_at', 'updated_at']


class SchoolSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='owner.username')
    campus_name = serializers.ReadOnlyField(source='campus.name')

    class Meta:
        model = School
        fields = '__all__'
        read_only_fields = ['public_id', 'owner', 'created_at', 'updated_at']


class SetupStepsSerializer(serializers.ModelSerializer):
    school_name = serializers.ReadOnlyField(source='school.name')

    class Meta:
        model = SetupSteps
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class DocumentSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
