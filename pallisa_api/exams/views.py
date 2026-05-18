from members.models import Subject, Student, SubjectPaper
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.paginator import Paginator
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.shortcuts import get_object_or_404
from .models import Topics, ActivityOfIntegration, IntegrationScore, Exam, ExamScore, CompetencyArea, ExamPaperScore
from .serializers import (
    TopicsSerializer, 
    ActivityOfIntegrationSerializer, 
    IntegrationScoreSerializer, 
    ExamSerializer,
    ExamScoreSerializer,
    CompetencyAreaSerializer,
    ExamPaperScoreSerializer
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
        ],
        responses={200: CompetencyAreaSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = CompetencyArea.objects.all()
            
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
            serializer.save(teacher=request.user.profile.teacher_profile if hasattr(request.user.profile, 'teacher_profile') else None)
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

            if student_id is None or score_val is None:
                continue

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



