from exams.models import Project
from django.db.models import Q
from expenses.models import AcademicYear
from expenses.models import Term
from members.models import Subject, Student, SubjectPaper, Stream, TeacherSubjectAssignment, Teacher
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.paginator import Paginator
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.shortcuts import get_object_or_404
from accounts.permission import filter_by_school, get_user_school, get_teacher_scope
from .models import (
    Topics, ActivityOfIntegration, IntegrationScore, Exam, ExamScore, 
    CompetencyArea, ExamPaperScore, ProjectScore, SaAssessment, SaScore
)
from .serializers import (
    TopicsSerializer, 
    ActivityOfIntegrationSerializer, 
    IntegrationScoreSerializer, 
    ExamSerializer,
    ExamScoreSerializer,
    CompetencyAreaSerializer,
    ExamPaperScoreSerializer,
    ProjectScoreSerializer,
    SaAssessmentSerializer,
    SaScoreSerializer
)

logger = logging.getLogger(__name__)

class TopicsListCreateView(APIView):
    """
    List all topics or create a new topic.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @extend_schema(
        summary="List all topics",
        description="Retrieve a list of all available topics with pagination.",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: TopicsSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = Topics.objects.all()
            queryset = filter_by_school(queryset, request, school_field_path='class_obj__campus__schools')
            
            if getattr(request.user, 'is_teacher', False):
                scope = get_teacher_scope(request.user)
                if scope:
                    queryset = queryset.filter(class_obj_id__in=scope['class_ids'])
                else:
                    queryset = queryset.none()
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = TopicsSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing topics: {str(e)}")
            return Response({"error": "Failed to retrieve topics"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create a new topic",
        request=TopicsSerializer,
        responses={201: TopicsSerializer}
    )
    def post(self, request):
        serializer = TopicsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating topic: {str(e)}")
            return Response({"error": "Failed to create topic"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TopicsDetailView(APIView):
    """
    Retrieve, update or delete a topic instance.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self, pk):
        return get_object_or_404(Topics, pk=pk)

    @extend_schema(summary="Get topic details", responses={200: TopicsSerializer})
    def get(self, request, pk):
        topic = self.get_object(pk)
        serializer = TopicsSerializer(topic)
        return Response(serializer.data)

    @extend_schema(summary="Update topic details", request=TopicsSerializer, responses={200: TopicsSerializer})
    def patch(self, request, pk):
        topic = self.get_object(pk)
        serializer = TopicsSerializer(topic, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating topic {pk}: {str(e)}")
            return Response({"error": "Failed to update topic"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete a topic", responses={204: None})
    def delete(self, request, pk):
        try:
            topic = self.get_object(pk)
            topic.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting topic {pk}: {str(e)}")
            return Response({"error": "Failed to delete topic"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompetencyAreaListCreateView(APIView):
    """
    List all competency areas or create a new one.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @extend_schema(
        summary="List all competency areas",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
            OpenApiParameter(name='class_id', type=int, description='Filter by class ID'),
            OpenApiParameter(name='term_id', type=int, description='Filter by term ID'),
            OpenApiParameter(name='topic_id', type=int, description='Filter by topic ID'),
        ],
        responses={200: CompetencyAreaSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = CompetencyArea.objects.all().order_by('-created_at')
            
            # Filter by class_id, term_id, and topic_id
            class_id = request.query_params.get('class_id')
            if class_id:
                queryset = queryset.filter(class_obj_id=class_id)
                
            term_id = request.query_params.get('term_id')
            if term_id:
                queryset = queryset.filter(term_id=term_id)

            topic_id = request.query_params.get('topic_id') or request.query_params.get('topic')
            if topic_id:
                queryset = queryset.filter(topic_id=topic_id)
                
            # School scoping
            queryset = filter_by_school(queryset, request, school_field_path='class_obj__campus__schools')
            
            if getattr(request.user, 'is_teacher', False):
                scope = get_teacher_scope(request.user)
                if scope:
                    queryset = queryset.filter(class_obj_id__in=scope['class_ids'])
                else:
                    queryset = queryset.none()
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = CompetencyAreaSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing competency areas: {str(e)}")
            return Response({"error": "Failed to retrieve competency areas"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create a new competency area",
        request=CompetencyAreaSerializer,
        responses={201: CompetencyAreaSerializer}
    )
    def post(self, request):
        serializer = CompetencyAreaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating competency area: {str(e)}")
            return Response({"error": "Failed to create competency area"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompetencyAreaDetailView(APIView):
    """
    Retrieve, update or delete a competency area instance.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self, pk):
        return get_object_or_404(CompetencyArea, pk=pk)

    @extend_schema(summary="Get competency area details", responses={200: CompetencyAreaSerializer})
    def get(self, request, pk):
        area = self.get_object(pk)
        serializer = CompetencyAreaSerializer(area)
        return Response(serializer.data)

    @extend_schema(summary="Update competency area details", request=CompetencyAreaSerializer, responses={200: CompetencyAreaSerializer})
    def put(self, request, pk):
        area = self.get_object(pk)
        serializer = CompetencyAreaSerializer(area, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating competency area {pk}: {str(e)}")
            return Response({"error": "Failed to update competency area"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete a competency area", responses={204: None})
    def delete(self, request, pk):
        try:
            area = self.get_object(pk)
            area.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting competency area {pk}: {str(e)}")
            return Response({"error": "Failed to delete competency area"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ActivityOfIntegrationListCreateView(APIView):
    """
    List all integration activities or create a new one.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List all integration activities",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ActivityOfIntegrationSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = ActivityOfIntegration.objects.all()
            queryset = filter_by_school(queryset, request, school_field_path='topic__class_obj__campus__schools')
            
            if getattr(request.user, 'is_teacher', False):
                queryset = queryset.filter(created_by=request.user)
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = ActivityOfIntegrationSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing activities: {str(e)}")
            return Response({"error": "Failed to retrieve activities"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create a new integration activity",
        request=ActivityOfIntegrationSerializer,
        responses={201: ActivityOfIntegrationSerializer}
    )
    def post(self, request):
        serializer = ActivityOfIntegrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save(
                teacher=request.user.profile.teacher_profile if hasattr(request.user.profile, 'teacher_profile') else None,
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating activity: {str(e)}")
            return Response({"error": "Failed to create activity"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ActivityOfIntegrationDetailView(APIView):
    """
    Retrieve, update or delete an integration activity by public_id.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, public_id):
        return get_object_or_404(ActivityOfIntegration, public_id=public_id)

    @extend_schema(summary="Get activity details", responses={200: ActivityOfIntegrationSerializer})
    def get(self, request, public_id):
        activity = self.get_object(public_id)
        serializer = ActivityOfIntegrationSerializer(activity)
        return Response(serializer.data)

    @extend_schema(summary="Update activity details", request=ActivityOfIntegrationSerializer, responses={200: ActivityOfIntegrationSerializer})
    def put(self, request, public_id):
        activity = self.get_object(public_id)
        serializer = ActivityOfIntegrationSerializer(activity, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating activity {public_id}: {str(e)}")
            return Response({"error": "Failed to update activity"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete an activity", responses={204: None})
    def delete(self, request, public_id):
        try:
            activity = self.get_object(public_id)
            activity.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting activity {public_id}: {str(e)}")
            return Response({"error": "Failed to delete activity"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IntegrationScoreListCreateView(APIView):
    """
    List all scores or create a new score.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List all integration scores",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: IntegrationScoreSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = IntegrationScore.objects.all()
            queryset = filter_by_school(queryset, request, school_field_path='student__campus__schools')
            
            if getattr(request.user, 'is_teacher', False):
                scope = get_teacher_scope(request.user)
                if scope:
                    queryset = queryset.filter(student__current_stream_id__in=scope['stream_ids'], aoi__topic__subject_id__in=scope['subject_ids'])
                else:
                    queryset = queryset.none()
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = IntegrationScoreSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing scores: {str(e)}")
            return Response({"error": "Failed to retrieve scores"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create a new integration score",
        request=IntegrationScoreSerializer,
        responses={201: IntegrationScoreSerializer}
    )
    def post(self, request):
        serializer = IntegrationScoreSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating score: {str(e)}")
            return Response({"error": "Failed to create score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class IntegrationScoreDetailView(APIView):
    """
    Retrieve, update or delete an integration score.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(IntegrationScore, pk=pk)

    @extend_schema(summary="Get integration score details", responses={200: IntegrationScoreSerializer})
    def get(self, request, pk):
        score = self.get_object(pk)
        serializer = IntegrationScoreSerializer(score)
        return Response(serializer.data)

    @extend_schema(summary="Update integration score", request=IntegrationScoreSerializer, responses={200: IntegrationScoreSerializer})
    def put(self, request, pk):
        score = self.get_object(pk)
        serializer = IntegrationScoreSerializer(score, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating integration score {pk}: {str(e)}")
            return Response({"error": "Failed to update score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete an integration score", responses={204: None})
    def delete(self, request, pk):
        try:
            score = self.get_object(pk)
            score.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting integration score {pk}: {str(e)}")
            return Response({"error": "Failed to delete score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExamListCreateView(APIView):
    """
    List all exams or create a new exam.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List all exams",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ExamSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = Exam.objects.all()
            queryset = filter_by_school(queryset, request, school_field_path='class_obj__campus__schools')
            
            if getattr(request.user, 'is_teacher', False):
                scope = get_teacher_scope(request.user)
                if scope:
                    queryset = queryset.filter(class_obj_id__in=scope['class_ids'])
                else:
                    queryset = queryset.none()
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = ExamSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing exams: {str(e)}")
            return Response({"error": "Failed to retrieve exams"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Create a new exam", request=ExamSerializer, responses={201: ExamSerializer})
    def post(self, request):
        data = request.data.copy()
        class_obj_val = data.get('class_obj')
        
        if class_obj_val == 'all':
            from members.models import Class
            try:
                # Determine which classes to create exams for
                # Usually we want classes belonging to the same school as the user
                classes = Class.objects.filter(is_active=True)
                
                # Filter by user's school if possible
                profile = getattr(request.user, 'profile', None)
                if profile and profile.role and profile.role.school:
                    # Get all campuses for this school
                    school = profile.role.school
                    classes = classes.filter(campus__schools=school)
                
                if not classes.exists():
                    return Response({"error": "No active classes found to create exams for"}, status=status.HTTP_400_BAD_REQUEST)
                
                created_exams = []
                for cls in classes:
                    exam_data = data.copy()
                    exam_data['class_obj'] = cls.id
                    serializer = ExamSerializer(data=exam_data)
                    if serializer.is_valid():
                        serializer.save()
                        created_exams.append(serializer.data)
                    else:
                        # If one fails, we might want to know, but let's continue for others
                        logger.warning(f"Failed to create bulk exam for class {cls.id}: {serializer.errors}")
                
                return Response(created_exams, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Error in bulk exam creation: {str(e)}")
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = ExamSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating exam: {str(e)}")
            return Response({"error": "Failed to create exam"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExamDetailView(APIView):
    """
    Retrieve, update or delete an exam by public_id.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, public_id):
        return get_object_or_404(Exam, public_id=public_id)

    @extend_schema(summary="Get exam details", responses={200: ExamSerializer})
    def get(self, request, public_id):
        exam = self.get_object(public_id)
        serializer = ExamSerializer(exam)
        return Response(serializer.data)

    @extend_schema(summary="Update exam details", request=ExamSerializer, responses={200: ExamSerializer})
    def put(self, request, public_id):
        exam = self.get_object(public_id)
        serializer = ExamSerializer(exam, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating exam {public_id}: {str(e)}")
            return Response({"error": "Failed to update exam"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete an exam", responses={204: None})
    def delete(self, request, public_id):
        try:
            exam = self.get_object(public_id)
            exam.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting exam {public_id}: {str(e)}")
            return Response({"error": "Failed to delete exam"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExamScoreListCreateView(APIView):
    """
    List all exam scores or create a new score.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List all exam scores",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ExamScoreSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = ExamScore.objects.all()
            queryset = filter_by_school(queryset, request, school_field_path='student__campus__schools')
            
            if getattr(request.user, 'is_teacher', False):
                scope = get_teacher_scope(request.user)
                if scope:
                    queryset = queryset.filter(student__current_stream_id__in=scope['stream_ids'])
                else:
                    queryset = queryset.none()
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = ExamScoreSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing exam scores: {str(e)}")
            return Response({"error": "Failed to retrieve exam scores"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Create a new exam score", request=ExamScoreSerializer, responses={201: ExamScoreSerializer})
    def post(self, request):
        serializer = ExamScoreSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating exam score: {str(e)}")
            return Response({"error": "Failed to create exam score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExamScoreDetailView(APIView):
    """
    Retrieve, update or delete an exam score.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(ExamScore, pk=pk)

    @extend_schema(summary="Get exam score details", responses={200: ExamScoreSerializer})
    def get(self, request, pk):
        score = self.get_object(pk)
        serializer = ExamScoreSerializer(score)
        return Response(serializer.data)

    @extend_schema(summary="Update exam score", request=ExamScoreSerializer, responses={200: ExamScoreSerializer})
    def put(self, request, pk):
        score = self.get_object(pk)
        serializer = ExamScoreSerializer(score, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating exam score {pk}: {str(e)}")
            return Response({"error": "Failed to update score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete an exam score", responses={204: None})
    def delete(self, request, pk):
        try:
            score = self.get_object(pk)
            score.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting exam score {pk}: {str(e)}")
            return Response({"error": "Failed to delete score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExamBulkScoreView(APIView):
    """
    Update exam scores in bulk for a specific exam and subject.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Bulk update exam scores",
        request={
            "type": "object",
            "properties": {
                "subject_id": {"type": "integer"},
                "scores": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "student_id": {"type": "integer"},
                            "score": {"type": "number"},
                            "remarks": {"type": "string"},
                        }
                    }
                }
            }
        },
        responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}}
    )
    def post(self, request, public_id):
        exam = get_object_or_404(Exam, public_id=public_id)
        subject_id = request.data.get('subject_id')
        scores_data = request.data.get('scores', [])

        if not subject_id:
            return Response({"error": "Subject ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        subject = get_object_or_404(Subject, id=subject_id)
        
        updated_count = 0
        created_count = 0

        for item in scores_data:
            student_id = item.get('student_id')
            score_val = item.get('score')
            remarks = item.get('remarks', '')
            papers_data = item.get('papers', {})

            if student_id is None:
                continue

            if score_val is not None and str(score_val).strip() != "":
                score_obj, created = ExamScore.objects.update_or_create(
                    exam=exam,
                    student_id=student_id,
                    subject=subject,
                    defaults={
                        'score': score_val,
                        'remarks': remarks
                    }
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

            for paper_id_str, paper_score in papers_data.items():
                if paper_score is not None and str(paper_score).strip() != "":
                    try:
                        paper = SubjectPaper.objects.get(id=int(paper_id_str), subject=subject)
                        _, p_created = ExamPaperScore.objects.update_or_create(
                            exam=exam,
                            student_id=student_id,
                            paper=paper,
                            defaults={
                                'score': float(paper_score),
                                'remarks': remarks
                            }
                        )
                        if p_created:
                            created_count += 1
                        else:
                            updated_count += 1
                    except (SubjectPaper.DoesNotExist, ValueError):
                        pass

        return Response({
            "message": f"Successfully processed {len(scores_data)} scores",
            "created": created_count,
            "updated": updated_count
        })

class ExamStudentsScoreView(APIView):
    """
    Get all students in an exam's class with their current scores for a specific subject.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get students with scores for an exam and subject",
        parameters=[
            OpenApiParameter(name='subject_id', type=int, description='Subject ID'),
        ],
        responses={200: {"type": "array", "items": {"type": "object"}}}
    )
    def get(self, request, public_id):
        exam = get_object_or_404(Exam, public_id=public_id)
        subject_id = request.query_params.get('subject_id')

        if not subject_id:
            return Response({"error": "Subject ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get all students in the class
        students = Student.objects.filter(current_stream__class_obj=exam.class_obj, is_active=True).select_related('user_profile')
        
        # Get existing scores
        scores = ExamScore.objects.filter(exam=exam, subject_id=subject_id)
        scores_map = {s.student_id: s for s in scores}
        
        # Get existing paper scores
        paper_scores = ExamPaperScore.objects.filter(exam=exam, paper__subject_id=subject_id)
        paper_scores_map = {}
        for ps in paper_scores:
            if ps.student_id not in paper_scores_map:
                paper_scores_map[ps.student_id] = {}
            paper_scores_map[ps.student_id][str(ps.paper_id)] = ps.score

        result = []
        for student in students:
            score_obj = scores_map.get(student.id)
            result.append({
                "student_id": student.id,
                "student_name": f"{student.user_profile.first_name} {student.user_profile.last_name}",
                "admission_number": student.admission_number,
                "score": score_obj.score if score_obj else None,
                "remarks": score_obj.remarks if score_obj else "",
                "score_id": score_obj.id if score_obj else None,
                "papers": paper_scores_map.get(student.id, {})
            })

        return Response(result)


class ActivityBulkScoreView(APIView):
    """
    Update integration scores in bulk for a specific activity.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Bulk update integration scores",
        request={
            "type": "object",
            "properties": {
                "scores": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "student_id": {"type": "integer"},
                            "score": {"type": "number"},
                            "remarks": {"type": "string"},
                        }
                    }
                }
            }
        },
        responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}}
    )
    def post(self, request, public_id):
        activity = get_object_or_404(ActivityOfIntegration, public_id=public_id)
        scores_data = request.data.get('scores', [])

        updated_count = 0
        created_count = 0

        for item in scores_data:
            student_id = item.get('student_id')
            score_val = item.get('score')
            remarks = item.get('remarks', '')

            if student_id is None or score_val is None:
                continue

            score_obj, created = IntegrationScore.objects.update_or_create(
                activity=activity,
                student_id=student_id,
                defaults={
                    'score': score_val,
                    'teacher_remarks': remarks
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response({
            "message": f"Successfully processed {len(scores_data)} scores",
            "created": created_count,
            "updated": updated_count
        })

class ActivityStudentsScoreView(APIView):
    """
    Get all students in an activity's class with their current scores.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get students with integration scores for an activity",
        responses={200: {"type": "array", "items": {"type": "object"}}}
    )
    def get(self, request, public_id):
        activity = get_object_or_404(ActivityOfIntegration, public_id=public_id)

        # Get all students in the class associated with the topic
        students = Student.objects.filter(
            current_stream__class_obj=activity.topic.class_obj, 
            is_active=True
        ).select_related('user_profile')
        
        # Get existing scores
        scores = IntegrationScore.objects.filter(activity=activity)
        scores_map = {s.student_id: s for s in scores}

        result = []
        for student in students:
            score_obj = scores_map.get(student.id)
            result.append({
                "student_id": student.id,
                "student_name": f"{student.user_profile.first_name} {student.user_profile.last_name}",
                "admission_number": student.admission_number,
                "score": score_obj.score if score_obj else None,
                "remarks": score_obj.teacher_remarks if score_obj else "",
                "score_id": score_obj.id if score_obj else None
            })

        return Response(result)


class ExamPaperScoreListCreateView(APIView):
    """
    List all exam paper scores or create a new score.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List all exam paper scores",
        parameters=[
            OpenApiParameter(name='exam_id', type=int, description='Filter by exam ID'),
            OpenApiParameter(name='student_id', type=int, description='Filter by student ID'),
            OpenApiParameter(name='paper_id', type=int, description='Filter by subject paper ID'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ExamPaperScoreSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = ExamPaperScore.objects.all().select_related('exam', 'student__user_profile', 'paper__subject')
            queryset = filter_by_school(queryset, request, school_field_path='student__campus__schools')
            
            if getattr(request.user, 'is_teacher', False):
                scope = get_teacher_scope(request.user)
                if scope:
                    queryset = queryset.filter(student__current_stream_id__in=scope['stream_ids'], paper__subject_id__in=scope['subject_ids'])
                else:
                    queryset = queryset.none()
            
            exam_id = request.query_params.get('exam_id')
            student_id = request.query_params.get('student_id')
            paper_id = request.query_params.get('paper_id')
            
            if exam_id:
                queryset = queryset.filter(exam_id=exam_id)
            if student_id:
                queryset = queryset.filter(student_id=student_id)
            if paper_id:
                queryset = queryset.filter(paper_id=paper_id)
            
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = ExamPaperScoreSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing paper scores: {str(e)}")
            return Response({"error": "Failed to retrieve paper scores"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Create a new exam paper score", request=ExamPaperScoreSerializer, responses={201: ExamPaperScoreSerializer})
    def post(self, request):
        serializer = ExamPaperScoreSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating paper score: {str(e)}")
            return Response({"error": "Failed to create paper score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExamPaperScoreDetailView(APIView):
    """
    Retrieve, update or delete an exam paper score.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(ExamPaperScore, pk=pk)

    @extend_schema(summary="Get exam paper score details", responses={200: ExamPaperScoreSerializer})
    def get(self, request, pk):
        score = self.get_object(pk)
        serializer = ExamPaperScoreSerializer(score)
        return Response(serializer.data)

    @extend_schema(summary="Update exam paper score", request=ExamPaperScoreSerializer, responses={200: ExamPaperScoreSerializer})
    def put(self, request, pk):
        score = self.get_object(pk)
        serializer = ExamPaperScoreSerializer(score, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating paper score {pk}: {str(e)}")
            return Response({"error": "Failed to update paper score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete an exam paper score", responses={204: None})
    def delete(self, request, pk):
        try:
            score = self.get_object(pk)
            score.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting paper score {pk}: {str(e)}")
            return Response({"error": "Failed to delete paper score"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExamBulkPaperScoreView(APIView):
    """
    Update subject paper scores in bulk for a specific exam and paper.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Bulk update exam subject paper scores",
        request={
            "type": "object",
            "properties": {
                "paper_id": {"type": "integer"},
                "scores": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "student_id": {"type": "integer"},
                            "score": {"type": "number"},
                            "remarks": {"type": "string"},
                        }
                     }
                }
            }
        },
        responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}}
    )
    def post(self, request, public_id):
        exam = get_object_or_404(Exam, public_id=public_id)
        paper_id = request.data.get('paper_id')
        scores_data = request.data.get('scores', [])

        if not paper_id:
            return Response({"error": "Paper ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        paper = get_object_or_404(SubjectPaper, id=paper_id)
        
        updated_count = 0
        created_count = 0

        for item in scores_data:
            student_id = item.get('student_id')
            score_val = item.get('score')
            remarks = item.get('remarks', '')

            if student_id is None or score_val is None:
                continue

            score_obj, created = ExamPaperScore.objects.update_or_create(
                exam=exam,
                student_id=student_id,
                paper=paper,
                defaults={
                    'score': score_val,
                    'remarks': remarks
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response({
            "message": f"Successfully processed {len(scores_data)} paper scores",
            "created": created_count,
            "updated": updated_count
        })


class ExamStudentsPaperScoreView(APIView):
    """
    Get all students in an exam's class with their current scores for a specific subject paper.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get students with paper scores for an exam and paper",
        parameters=[
            OpenApiParameter(name='paper_id', type=int, description='Subject Paper ID'),
        ],
        responses={200: {"type": "array", "items": {"type": "object"}}}
    )
    def get(self, request, public_id):
        exam = get_object_or_404(Exam, public_id=public_id)
        paper_id = request.query_params.get('paper_id')

        if not paper_id:
            return Response({"error": "Paper ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        students = Student.objects.filter(current_stream__class_obj=exam.class_obj, is_active=True).select_related('user_profile')
        
        scores = ExamPaperScore.objects.filter(exam=exam, paper_id=paper_id)
        scores_map = {s.student_id: s for s in scores}

        result = []
        for student in students:
            score_obj = scores_map.get(student.id)
            result.append({
                "student_id": student.id,
                "student_name": f"{student.user_profile.first_name} {student.user_profile.last_name}",
                "admission_number": student.admission_number,
                "score": score_obj.score if score_obj else None,
                "remarks": score_obj.remarks if score_obj else "",
                "score_id": score_obj.id if score_obj else None
            })

        return Response(result)


class ProjectMatrixView(APIView):
    """
    List and batch updates student project competency scores.
    Class-based view matching the timo API and DRF structure.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get students project scores matrix",
        parameters=[
            OpenApiParameter(name='stream_id', type=int, description='Stream ID', required=False),
            OpenApiParameter(name='subject_id', type=int, description='Subject ID', required=False),
            OpenApiParameter(name='competency_number', type=int, description='Competency Index (e.g. 1-4)', required=False),
        ],
        responses={200: {"type": "object"}}
    )
    def get(self, request, public_id=None):
        stream_id = request.query_params.get('stream_id')
        subject_id = request.query_params.get('subject_id')
        competency_number_param = request.query_params.get('competency_number')

        active_year = AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.first()
        active_term = Term.objects.filter(is_current=True).first() or Term.objects.first()

        if not active_year or not active_term:
            return Response({"error": "No active academic year or term configured in system settings"}, status=status.HTTP_400_BAD_REQUEST)

        # Handle detail lookup by project public_id
        if public_id:
            project = Project.objects.filter(public_id=public_id).first()
            
            competency_number = 1
            # Fallback: if public_id is legacy format "stream_id-subject_id-competency_number"
            if not project:
                parts = public_id.split('-')
                if len(parts) == 3:
                    try:
                        stream_id, subject_id, competency_number = map(int, parts)
                        project = Project.objects.filter(
                            stream_id=stream_id,
                            subject_id=subject_id,
                            term=active_term
                        ).first()
                        if not project:
                            # Create a default project for compatibility
                            stream = Stream.objects.filter(id=stream_id).first()
                            subject = Subject.objects.filter(id=subject_id).first()
                            name = f"{subject.name if subject else 'Subject'} Project"
                            project = Project.objects.create(
                                name=name,
                                stream_id=stream_id,
                                subject_id=subject_id,
                                term=active_term,
                                created_by=request.user
                            )
                    except ValueError:
                        pass
            else:
                comp_param = request.query_params.get('competency_number')
                competency_number = 1
                if comp_param:
                    try:
                        competency_number = int(str(comp_param).strip().rstrip('/'))
                    except ValueError:
                        competency_number = 1

            if not project:
                return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

            students = Student.objects.filter(current_stream=project.stream, is_active=True).select_related('user_profile')

            scores = ProjectScore.objects.filter(project=project, competency_number=competency_number)
            scores_map = {s.student_id: s.scores for s in scores}

            result_learners = []
            for student in students:
                result_learners.append({
                    "student_id": student.id,
                    "student_name": f"{student.user_profile.first_name} {student.user_profile.last_name}",
                    "admission_number": student.admission_number,
                    "scores": scores_map.get(student.id, {})
                })

            return Response({
                "public_id": project.public_id,
                "project_name": project.name,
                "stream_id": project.stream_id,
                "stream_name": project.stream.name if project.stream else "N/A",
                "subject_id": project.subject_id,
                "subject_name": project.subject.name if project.subject else "N/A",
                "competency_number": competency_number,
                "active_competencies": [1, 2, 3, 4],
                "learners": result_learners
            })

        # List all projects
        projects_query = Project.objects.filter(term=active_term)
        
        # Apply teacher stream assignments filtering
        if getattr(request.user, 'is_teacher', False):
            teacher = None
            profile = getattr(request.user, 'profile', None)
            if profile and hasattr(profile, 'teacher_profile'):
                teacher = profile.teacher_profile
            
            if teacher:
                assigned_stream_ids = TeacherSubjectAssignment.objects.filter(
                    teacher=teacher,
                    academic_year=active_year,
                    is_active=True
                ).values_list('stream_id', flat=True).distinct()
                
                projects_query = projects_query.filter(
                    Q(created_by=request.user) | Q(stream_id__in=assigned_stream_ids)
                )
            else:
                projects_query = projects_query.filter(created_by=request.user)

        projects_list = []
        for p in projects_query.select_related('stream', 'subject', 'term', 'term__academic_year'):
            total_students = Student.objects.filter(current_stream=p.stream, is_active=True).count()
            scores_count = ProjectScore.objects.filter(project=p).count()
            total_potential = total_students * 4
            progress = min(100, int((scores_count / total_potential) * 100)) if total_potential > 0 else 0

            projects_list.append({
                "public_id": p.public_id,
                "name": p.name,
                "stream_id": p.stream_id,
                "stream_name": p.stream.name if p.stream else "N/A",
                "subject_id": p.subject_id,
                "subject_name": p.subject.name if p.subject else "N/A",
                "term_name": p.term.name if p.term else "N/A",
                "academic_year_name": p.term.academic_year.name if (p.term and p.term.academic_year) else "N/A",
                "grading_progress": progress
            })

        return Response({
            "count": len(projects_list),
            "next": None,
            "previous": None,
            "results": projects_list
        })

    @extend_schema(
        summary="Batch updates student project competency scores"
    )
    def post(self, request, public_id=None):
        action = request.data.get('action')
        
        # 1. Project Creation
        if action == 'create' or (not public_id and 'name' in request.data):
            name = request.data.get('name')
            stream_id = request.data.get('stream_id')
            subject_id = request.data.get('subject_id')
            description = request.data.get('description', '')

            active_term = Term.objects.filter(is_current=True).first() or Term.objects.first()

            if not name or not stream_id or not subject_id:
                return Response({"error": "name, stream_id, and subject_id are required"}, status=status.HTTP_400_BAD_REQUEST)

            project = Project.objects.create(
                name=name,
                stream_id=stream_id,
                subject_id=subject_id,
                term=active_term,
                description=description,
                created_by=request.user
            )

            return Response({
                "message": "Project created successfully",
                "public_id": project.public_id,
                "name": project.name
            }, status=status.HTTP_201_CREATED)

        # 2. Score Matrix Upserting
        project_id = public_id
        competency_number = request.data.get('competency_number')
        if competency_number is not None:
            try:
                competency_number = int(str(competency_number).strip().rstrip('/'))
            except ValueError:
                pass
        records = request.data.get('records', [])

        if not project_id:
            project_id = request.data.get('project_id')

        project = Project.objects.filter(public_id=project_id).first()
        # Fallback legacy parsing support
        if not project and project_id:
            parts = project_id.split('-')
            if len(parts) == 3:
                try:
                    stream_id, subject_id, competency_number_fallback = map(int, parts)
                    competency_number = competency_number_fallback if competency_number is None else competency_number
                    active_term = Term.objects.filter(is_current=True).first() or Term.objects.first()
                    project = Project.objects.filter(
                        stream_id=stream_id,
                        subject_id=subject_id,
                        term=active_term
                    ).first()
                except ValueError:
                    pass

        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if competency_number is None:
            return Response({"error": "competency_number is required"}, status=status.HTTP_400_BAD_REQUEST)

        from django.db import transaction
        try:
            with transaction.atomic():
                for r in records:
                    student_id = r.get('student_id')
                    student_scores = r.get('scores', {})
                    
                    cleaned_scores = {}
                    for k, v in student_scores.items():
                        if v is not None and v != '':
                            try:
                                cleaned_scores[k] = float(v)
                            except ValueError:
                                pass

                    ProjectScore.objects.update_or_create(
                        project=project,
                        student_id=student_id,
                        competency_number=competency_number,
                        defaults={
                            'scores': cleaned_scores,
                            'created_by': request.user
                        }
                    )

            return Response({"message": "Project evaluation scores updated successfully"})
        except Exception as e:
            logger.error(f"Error in ProjectMatrix post view: {str(e)}")
            return Response({"error": f"Failed to update project scores matrix: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Delete student project scores configuration matrix"
    )
    def delete(self, request, public_id=None):
        if not public_id:
            return Response({"error": "public_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.filter(public_id=public_id).first()
        
        # Fallback legacy parsing support
        if not project:
            parts = public_id.split('-')
            if len(parts) == 3:
                try:
                    stream_id, subject_id, _ = map(int, parts)
                    active_term = Term.objects.filter(is_current=True).first() or Term.objects.first()
                    project = Project.objects.filter(
                        stream_id=stream_id,
                        subject_id=subject_id,
                        term=active_term
                    ).first()
                except ValueError:
                    pass

        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if getattr(request.user, 'is_teacher', False):
            if project.created_by != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        project.delete()
        return Response({"message": "Project deleted successfully"})


class SaMatrixView(APIView):
    """
    List and batch updates student Summative Assessment (SA) matrix scores.
    Class-based view matching the timo API and DRF structure.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get students Summative Assessment scores matrix",
        parameters=[
            OpenApiParameter(name='stream_id', type=int, description='Stream ID'),
            OpenApiParameter(name='subject_id', type=int, description='Subject ID'),
        ],
        responses={200: {"type": "object"}}
    )
    def get(self, request):
        stream_id = request.query_params.get('stream_id')
        subject_id = request.query_params.get('subject_id')

        if not stream_id or not subject_id:
            return Response({"error": "stream_id and subject_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        active_year = AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.first()
        active_term = Term.objects.filter(is_current=True).first() or Term.objects.first()

        if not active_year or not active_term:
            return Response({"error": "No active academic year or term configured in system settings"}, status=status.HTTP_400_BAD_REQUEST)

        sa_assessment = SaAssessment.objects.filter(
            stream_id=stream_id,
            subject_id=subject_id,
            term=active_term,
            academic_year=active_year
        ).first()

        scores_map = {}
        if sa_assessment:
            sa_scores = SaScore.objects.filter(sa_assessment=sa_assessment)
            scores_map = {s.student_id: s for s in sa_scores}

        students = Student.objects.filter(current_stream_id=stream_id, is_active=True).select_related('user_profile')

        result_learners = []
        for student in students:
            s_score = scores_map.get(student.id)
            result_learners.append({
                "student_id": student.id,
                "student_name": f"{student.user_profile.first_name} {student.user_profile.last_name}",
                "admission_number": student.admission_number,
                "l1": float(s_score.l1) if s_score and s_score.l1 is not None else None,
                "g1": float(s_score.g1) if s_score and s_score.g1 is not None else None,
                "l2": float(s_score.l2) if s_score and s_score.l2 is not None else None,
                "g2": float(s_score.g2) if s_score and s_score.g2 is not None else None,
                "l3": float(s_score.l3) if s_score and s_score.l3 is not None else None,
                "g3": float(s_score.g3) if s_score and s_score.g3 is not None else None,
                "l4": float(s_score.l4) if s_score and s_score.l4 is not None else None,
                "g4": float(s_score.g4) if s_score and s_score.g4 is not None else None,
                "l5": float(s_score.l5) if s_score and s_score.l5 is not None else None,
                "g5": float(s_score.g5) if s_score and s_score.g5 is not None else None,
            })

        return Response({
            "sa_id": sa_assessment.id if sa_assessment else None,
            "total_box": float(sa_assessment.total_box) if sa_assessment else 10.00,
            "learners": result_learners
        })

    @extend_schema(
        summary="Batch updates student Summative Assessment (SA) matrix scores"
    )
    def post(self, request):
        stream_id = request.data.get('stream_id')
        subject_id = request.data.get('subject_id')
        total_box = float(request.data.get('total_box', 10.00))
        records = request.data.get('records', [])

        if not stream_id or not subject_id:
            return Response({"error": "stream_id and subject_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        active_year = AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.first()
        active_term = Term.objects.filter(is_current=True).first() or Term.objects.first()

        if not active_year or not active_term:
            return Response({"error": "No active academic year or term configured in system settings"}, status=status.HTTP_400_BAD_REQUEST)

        from django.db import transaction
        try:
            with transaction.atomic():
                sa_assessment, created = SaAssessment.objects.update_or_create(
                    stream_id=stream_id,
                    subject_id=subject_id,
                    term=active_term,
                    academic_year=active_year,
                    defaults={
                        'total_box': total_box,
                        'teacher': request.user.profile.teacher_profile if hasattr(request.user.profile, 'teacher_profile') else None
                    }
                )

                SaScore.objects.filter(sa_assessment=sa_assessment).delete()

                sa_scores_to_create = []
                for r in records:
                    sa_scores_to_create.append(SaScore(
                        sa_assessment=sa_assessment,
                        student_id=r['student_id'],
                        l1=r.get('l1') if r.get('l1') != '' and r.get('l1') is not None else None,
                        g1=r.get('g1') if r.get('g1') != '' and r.get('g1') is not None else None,
                        l2=r.get('l2') if r.get('l2') != '' and r.get('l2') is not None else None,
                        g2=r.get('g2') if r.get('g2') != '' and r.get('g2') is not None else None,
                        l3=r.get('l3') if r.get('l3') != '' and r.get('l3') is not None else None,
                        g3=r.get('g3') if r.get('g3') != '' and r.get('g3') is not None else None,
                        l4=r.get('l4') if r.get('l4') != '' and r.get('l4') is not None else None,
                        g4=r.get('g4') if r.get('g4') != '' and r.get('g4') is not None else None,
                        l5=r.get('l5') if r.get('l5') != '' and r.get('l5') is not None else None,
                        g5=r.get('g5') if r.get('g5') != '' and r.get('g5') is not None else None,
                    ))
                SaScore.objects.bulk_create(sa_scores_to_create)

            return Response({
                "message": "SA evaluation scores grid matrix saved successfully",
                "sa_id": sa_assessment.id
            })
        except Exception as e:
            logger.error(f"Error in SaMatrix post view: {str(e)}")
            return Response({"error": "Failed to update SA scores matrix"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaAssessmentListCreateView(APIView):
    """
    List all Summative Assessments or create a new one.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List all Summative Assessments",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
            OpenApiParameter(name='stream_id', type=int, description='Filter by stream'),
            OpenApiParameter(name='subject_id', type=int, description='Filter by subject'),
        ],
        responses={200: SaAssessmentSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = SaAssessment.objects.all().order_by('-created_at')
            queryset = filter_by_school(queryset, request, school_field_path='stream__class_obj__campus__schools')
            
            if getattr(request.user, 'is_teacher', False):
                queryset = queryset.filter(created_by=request.user)
            stream_id = request.query_params.get('stream_id')
            subject_id = request.query_params.get('subject_id')
            if stream_id:
                queryset = queryset.filter(stream_id=stream_id)
            if subject_id:
                queryset = queryset.filter(subject_id=subject_id)

            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))

            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)

            serializer = SaAssessmentSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing sa assessments: {str(e)}")
            return Response({"error": "Failed to retrieve SA assessments"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create a new Summative Assessment",
        request=SaAssessmentSerializer,
        responses={201: SaAssessmentSerializer}
    )
    def post(self, request):
        data = request.data.copy()
        if 'academic_year' not in data or not data.get('academic_year'):
            active_year = AcademicYear.objects.filter(is_current=True).first() or AcademicYear.objects.first()
            if active_year:
                data['academic_year'] = active_year.id
        if 'term' not in data or not data.get('term'):
            active_term = Term.objects.filter(is_current=True).first() or Term.objects.first()
            if active_term:
                data['term'] = active_term.id

        serializer = SaAssessmentSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            serializer.save(
                teacher=request.user.profile.teacher_profile if hasattr(request.user.profile, 'teacher_profile') else None,
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating sa assessment: {str(e)}")
            return Response({"error": "Failed to create SA assessment"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaAssessmentDetailView(APIView):
    """
    Retrieve, update or delete a Summative Assessment by public_id.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, public_id):
        return get_object_or_404(SaAssessment, public_id=public_id)

    @extend_schema(summary="Get Summative Assessment details", responses={200: SaAssessmentSerializer})
    def get(self, request, public_id):
        sa = self.get_object(public_id)
        serializer = SaAssessmentSerializer(sa)
        return Response(serializer.data)

    @extend_schema(summary="Update Summative Assessment details", request=SaAssessmentSerializer, responses={200: SaAssessmentSerializer})
    def put(self, request, public_id):
        sa = self.get_object(public_id)
        serializer = SaAssessmentSerializer(sa, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating sa assessment {public_id}: {str(e)}")
            return Response({"error": "Failed to update SA assessment"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete a Summative Assessment", responses={204: None})
    def delete(self, request, public_id):
        try:
            sa = self.get_object(public_id)
            sa.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting sa assessment {public_id}: {str(e)}")
            return Response({"error": "Failed to delete SA assessment"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaAssessmentStudentsScoreView(APIView):
    """
    Get all students in an SA assessment's stream with their current scores.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Get students with SA scores for a summative assessment",
        responses={200: {"type": "array", "items": {"type": "object"}}}
    )
    def get(self, request, public_id):
        sa = get_object_or_404(SaAssessment, public_id=public_id)

        # Get all students in the stream
        students = Student.objects.filter(
            current_stream=sa.stream, 
            is_active=True
        ).select_related('user_profile')
        
        # Get existing scores
        scores = SaScore.objects.filter(sa_assessment=sa)
        scores_map = {s.student_id: s for s in scores}

        result = []
        for student in students:
            s_score = scores_map.get(student.id)
            result.append({
                "student_id": student.id,
                "student_name": f"{student.user_profile.first_name} {student.user_profile.last_name}",
                "admission_number": student.admission_number,
                "l1": float(s_score.l1) if s_score and s_score.l1 is not None else None,
                "g1": float(s_score.g1) if s_score and s_score.g1 is not None else None,
                "l2": float(s_score.l2) if s_score and s_score.l2 is not None else None,
                "g2": float(s_score.g2) if s_score and s_score.g2 is not None else None,
                "l3": float(s_score.l3) if s_score and s_score.l3 is not None else None,
                "g3": float(s_score.g3) if s_score and s_score.g3 is not None else None,
                "l4": float(s_score.l4) if s_score and s_score.l4 is not None else None,
                "g4": float(s_score.g4) if s_score and s_score.g4 is not None else None,
                "l5": float(s_score.l5) if s_score and s_score.l5 is not None else None,
                "g5": float(s_score.g5) if s_score and s_score.g5 is not None else None,
                "score_id": s_score.id if s_score else None
            })

        return Response(result)


class SaAssessmentBulkScoreView(APIView):
    """
    Bulk update SA scores for a specific Summative Assessment.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="Bulk update SA scores by assessment public_id",
        request={
            "type": "object",
            "properties": {
                "records": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "student_id": {"type": "integer"},
                            "l1": {"type": "number"},
                            "g1": {"type": "number"},
                            "l2": {"type": "number"},
                            "g2": {"type": "number"},
                            "l3": {"type": "number"},
                            "g3": {"type": "number"},
                            "l4": {"type": "number"},
                            "g4": {"type": "number"},
                            "l5": {"type": "number"},
                            "g5": {"type": "number"},
                        }
                    }
                }
            }
        },
        responses={200: {"type": "object", "properties": {"message": {"type": "string"}}}}
    )
    def post(self, request, public_id):
        sa = get_object_or_404(SaAssessment, public_id=public_id)
        records = request.data.get('records', [])

        from django.db import transaction
        try:
            with transaction.atomic():
                # Delete existing scores for this assessment
                SaScore.objects.filter(sa_assessment=sa).delete()

                sa_scores_to_create = []
                for r in records:
                    sa_scores_to_create.append(SaScore(
                        sa_assessment=sa,
                        student_id=r['student_id'],
                        l1=r.get('l1') if r.get('l1') != '' and r.get('l1') is not None else None,
                        g1=r.get('g1') if r.get('g1') != '' and r.get('g1') is not None else None,
                        l2=r.get('l2') if r.get('l2') != '' and r.get('l2') is not None else None,
                        g2=r.get('g2') if r.get('g2') != '' and r.get('g2') is not None else None,
                        l3=r.get('l3') if r.get('l3') != '' and r.get('l3') is not None else None,
                        g3=r.get('g3') if r.get('g3') != '' and r.get('g3') is not None else None,
                        l4=r.get('l4') if r.get('l4') != '' and r.get('l4') is not None else None,
                        g4=r.get('g4') if r.get('g4') != '' and r.get('g4') is not None else None,
                        l5=r.get('l5') if r.get('l5') != '' and r.get('l5') is not None else None,
                        g5=r.get('g5') if r.get('g5') != '' and r.get('g5') is not None else None,
                    ))
                SaScore.objects.bulk_create(sa_scores_to_create)

            return Response({
                "message": "SA scores updated successfully",
                "sa_id": sa.id
            })
        except Exception as e:
            logger.error(f"Error bulk updating SA scores: {str(e)}")
            return Response({"error": "Failed to bulk update SA scores"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




