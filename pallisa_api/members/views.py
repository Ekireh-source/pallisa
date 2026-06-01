from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, filters
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.http import Http404
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from django.core.exceptions import ValidationError

from .models import (
    Class, Stream, Student, Teacher, Parent, ParentStudentRelationship,
    StudentStreamHistory, Subject, SubjectPaper, TeacherSubjectAssignment, NonStaffMember,
    SalaryPeriod, SalaryAllowance, SalaryDeduction, SalaryPayment, SalarySummary
)
from .serializers import (
    ClassSerializer, StreamSerializer, StreamDetailSerializer,
    StudentSerializer, StudentDetailSerializer,
    TeacherSerializer, TeacherDetailSerializer,
    ParentSerializer, ParentDetailSerializer,
    ParentStudentRelationshipSerializer,
    StudentStreamHistorySerializer,
    SubjectSerializer, SubjectPaperSerializer,
    TeacherSubjectAssignmentSerializer,
    NonStaffMemberSerializer, NonStaffMemberDetailSerializer,
    SalaryPeriodSerializer, SalaryAllowanceSerializer, SalaryDeductionSerializer,
    SalaryPaymentSerializer, SalaryPaymentCreateUpdateSerializer, SalarySummarySerializer
)
from accounts.permission import HasPermission, filter_by_school, get_teacher_scope
from .utils import safe_delete_with_relations, create_error_response


# Base classes for common functionality
class BaseListCreateAPIView(APIView):
    """Base class for list and create operations"""
    permission_classes = [IsAuthenticated]
    model = None
    serializer_class = None
    search_fields = []
    filter_fields = {}
    
    def get_queryset(self):
        """Override in subclasses to customize queryset"""
        return self.model.objects.all()
    
    def apply_filters(self, queryset, request):
        """Apply filtering based on query parameters"""
        for param, field in self.filter_fields.items():
            value = request.query_params.get(param)
            if value:
                if field.endswith('__icontains'):
                    queryset = queryset.filter(**{field: value})
                elif param == 'is_active' and value is not None:
                    queryset = queryset.filter(is_active=value.lower() == 'true')
                else:
                    queryset = queryset.filter(**{field: value})
        return queryset
    
    def apply_search(self, queryset, request):
        """Apply search across specified fields"""
        search = request.query_params.get('search')
        if search and self.search_fields:
            search_q = Q()
            for field in self.search_fields:
                search_q |= Q(**{f'{field}__icontains': search})
            queryset = queryset.filter(search_q)
        return queryset
    
    def paginate_queryset(self, queryset, request):
        """Paginate queryset and return paginated response data"""
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        return {
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': page_obj.object_list
        }
    
    def get(self, request):
        queryset = self.get_queryset()
        queryset = self.apply_filters(queryset, request)
        queryset = self.apply_search(queryset, request)
        
        paginated_data = self.paginate_queryset(queryset, request)
        serializer = self.serializer_class(paginated_data['results'], many=True)
        
        return Response({
            'count': paginated_data['count'],
            'next': paginated_data['next'],
            'previous': paginated_data['previous'],
            'results': serializer.data
        })
    
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BaseDetailAPIView(APIView):
    """Base class for retrieve, update, delete operations"""
    permission_classes = [IsAuthenticated]
    model = None
    serializer_class = None
    detail_serializer_class = None
    
    def get_queryset(self):
        """Override in subclasses to customize queryset"""
        return self.model.objects.all()
    
    def get_object(self, pk):
        try:
            return self.get_queryset().get(pk=pk)
        except self.model.DoesNotExist:
            raise Http404
    
    def get_serializer_class(self):
        return self.detail_serializer_class or self.serializer_class
    
    def get(self, request, pk):
        obj = self.get_object(pk)
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(obj, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request, pk):
        obj = self.get_object(pk)
        serializer = self.serializer_class(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        obj = self.get_object(pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== CLASS VIEWS ====================

class ClassListCreateView(APIView):
    """List all class levels or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all class levels",
        parameters=[
            OpenApiParameter(name='campus_id', type=int, description='Filter by campus ID'),
            OpenApiParameter(name='level', type=str, description='Filter by class level (e.g. 0level, Alevel)'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='search', type=str, description='Search in name and description'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ClassSerializer(many=True)},
        tags=["Classes"]
    )
    def get(self, request):
        """Get list of class levels with filtering and pagination"""
        # Get query parameters
        campus_id = request.query_params.get('campus_id')
        level = request.query_params.get('level')
        search = request.query_params.get('search')
        is_active = request.query_params.get('is_active')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Class.objects.select_related('campus').order_by('name')
        queryset = filter_by_school(queryset, request, school_field_path='campus__schools')
        
        # Teacher-level Scope Filter
        if getattr(request.user, 'is_teacher', False):
            scope = get_teacher_scope(request.user)
            if scope:
                queryset = queryset.filter(id__in=scope['class_ids'])
            else:
                queryset = queryset.none()
        
        # Apply filters
        if campus_id:
            queryset = queryset.filter(campus_id=campus_id)
        if level:
            queryset = queryset.filter(level=level)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = ClassSerializer(page_obj.object_list, many=True, context={'request': request})
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a new class level",
        request=ClassSerializer,
        responses={201: ClassSerializer},
        tags=["Classes"]
    )
    def post(self, request):
        """Create a new class level"""
        serializer = ClassSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClassDetailView(APIView):
    """Retrieve, update or delete a class level"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, request):
        """Get class object or return 404"""
        queryset = Class.objects.all()
        queryset = filter_by_school(queryset, request, school_field_path='campus__school')
        return get_object_or_404(queryset, pk=pk)

    @extend_schema(
        summary="Retrieve a class level",
        responses={200: ClassSerializer},
        tags=["Classes"]
    )
    def get(self, request, pk):
        """Get details of a specific class level"""
        class_obj = self.get_object(pk, request)
        serializer = ClassSerializer(class_obj, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary="Update a class level",
        request=ClassSerializer,
        responses={200: ClassSerializer},
        tags=["Classes"]
    )
    def put(self, request, pk):
        """Update a class level"""
        class_obj = self.get_object(pk, request)
        serializer = ClassSerializer(class_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a class level",
        responses={204: None},
        tags=["Classes"]
    )
    def delete(self, request, pk):
        """Soft delete a class level by setting is_active to False"""
        class_obj = self.get_object(pk, request)
        class_obj.is_active = False
        class_obj.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClassStreamsView(APIView):
    """Get all streams for a specific class"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get streams for a class",
        responses={200: StreamSerializer(many=True)},
        tags=["Classes"]
    )
    def get(self, request, pk):
        """Get all active streams for a specific class"""
        class_obj = get_object_or_404(Class, pk=pk)
        streams = class_obj.streams.filter(is_active=True).select_related(
            'class_obj', 'class_teacher__user_profile'
        )
        serializer = StreamSerializer(streams, many=True)
        return Response(serializer.data)


# ==================== SUBJECT VIEWS ====================

class SubjectListCreateView(APIView):
    """List all subjects or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all subjects",
        parameters=[
            OpenApiParameter(name='school_id', type=int, description='Filter by school ID'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='search', type=str, description='Search in name, code and description'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: SubjectSerializer(many=True)},
        tags=["Subjects"]
    )
    def get(self, request):
        """Get list of subjects with filtering and pagination"""
        # Get query parameters
        school_id = request.query_params.get('school_id')
        search = request.query_params.get('search')
        is_active = request.query_params.get('is_active')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Subject.objects.select_related('school').order_by('code')
        queryset = filter_by_school(queryset, request)
        
        # Teacher-level Scope Filter
        if getattr(request.user, 'is_teacher', False):
            scope = get_teacher_scope(request.user)
            if scope:
                queryset = queryset.filter(id__in=scope['subject_ids'])
            else:
                queryset = queryset.none()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(code__icontains=search) | 
                Q(description__icontains=search)
            )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = SubjectSerializer(page_obj.object_list, many=True, context={'request': request})
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a new subject",
        request=SubjectSerializer,
        responses={201: SubjectSerializer},
        tags=["Subjects"]
    )
    def post(self, request):
        """Create a new subject"""
        serializer = SubjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubjectDetailView(APIView):
    """Retrieve, update or delete a subject"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, request):
        """Get subject object or return 404"""
        queryset = Subject.objects.select_related('school')
        queryset = filter_by_school(queryset, request)
        return get_object_or_404(queryset, pk=pk)

    @extend_schema(
        summary="Retrieve a subject",
        responses={200: SubjectSerializer},
        tags=["Subjects"]
    )
    def get(self, request, pk):
        """Get details of a specific subject"""
        subject = self.get_object(pk, request)
        serializer = SubjectSerializer(subject, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary="Update a subject",
        request=SubjectSerializer,
        responses={200: SubjectSerializer},
        tags=["Subjects"]
    )
    def put(self, request, pk):
        """Update a subject"""
        subject = self.get_object(pk, request)
        serializer = SubjectSerializer(subject, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a subject",
        responses={204: None},
        tags=["Subjects"]
    )
    def delete(self, request, pk):
        """Soft delete a subject by setting is_active to False"""
        subject = self.get_object(pk)
        subject.is_active = False
        subject.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== SUBJECT PAPER VIEWS ====================

class SubjectPaperListCreateView(APIView):
    """List all subject papers or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all subject papers",
        parameters=[
            OpenApiParameter(name='subject_id', type=int, description='Filter by subject ID'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='search', type=str, description='Search in paper name and code'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: SubjectPaperSerializer(many=True)},
        tags=["Subject Papers"]
    )
    def get(self, request):
        """Get list of subject papers with filtering and pagination"""
        subject_id = request.query_params.get('subject_id')
        search = request.query_params.get('search')
        is_active = request.query_params.get('is_active')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        queryset = SubjectPaper.objects.select_related('subject').order_by('subject__code', 'name')
        
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(code__icontains=search)
            )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = SubjectPaperSerializer(page_obj.object_list, many=True, context={'request': request})
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a new subject paper",
        request=SubjectPaperSerializer,
        responses={201: SubjectPaperSerializer},
        tags=["Subject Papers"]
    )
    def post(self, request):
        """Create a new subject paper"""
        serializer = SubjectPaperSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubjectPaperDetailView(APIView):
    """Retrieve, update or delete a subject paper"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Get subject paper object or return 404"""
        return get_object_or_404(SubjectPaper.objects.select_related('subject'), pk=pk)

    @extend_schema(
        summary="Retrieve a subject paper",
        responses={200: SubjectPaperSerializer},
        tags=["Subject Papers"]
    )
    def get(self, request, pk):
        """Get details of a specific subject paper"""
        paper = self.get_object(pk)
        serializer = SubjectPaperSerializer(paper, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary="Update a subject paper",
        request=SubjectPaperSerializer,
        responses={200: SubjectPaperSerializer},
        tags=["Subject Papers"]
    )
    def put(self, request, pk):
        """Update a subject paper"""
        paper = self.get_object(pk)
        serializer = SubjectPaperSerializer(paper, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a subject paper",
        responses={204: None},
        tags=["Subject Papers"]
    )
    def delete(self, request, pk):
        """Soft delete a subject paper by setting is_active to False"""
        paper = self.get_object(pk)
        paper.is_active = False
        paper.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== STREAM VIEWS ====================

class StreamListCreateView(APIView):
    """List all streams or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all streams",
        parameters=[
            OpenApiParameter(name='class_id', type=int, description='Filter by class ID'),
            OpenApiParameter(name='search', type=str, description='Search in stream name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: StreamSerializer(many=True)},
        tags=["Streams"]
    )
    def get(self, request):
        """Get list of streams with filtering and pagination"""
        # Get query parameters
        class_id = request.query_params.get('class_id')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Stream.objects.select_related(
            'class_obj', 'class_teacher__user_profile'
        ).prefetch_related('students').order_by('class_obj__name', 'name')
        
        # Apply school filter
        queryset = filter_by_school(queryset, request, school_field_path='class_obj__campus__schools')
        
        # Teacher-level Scope Filter
        if getattr(request.user, 'is_teacher', False):
            scope = get_teacher_scope(request.user)
            if scope:
                queryset = queryset.filter(id__in=scope['stream_ids'])
            else:
                queryset = queryset.none()
        
        # Apply other filters
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        else:
            # Default to active streams if no filter specified
            queryset = queryset.filter(is_active=True)

        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(class_obj__name__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = StreamSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a new stream",
        request=StreamSerializer,
        responses={201: StreamSerializer},
        tags=["Streams"]
    )
    def post(self, request):
        """Create a new stream"""
        serializer = StreamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StreamDetailView(APIView):
    """Retrieve, update or delete a stream"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Get stream object or return 404"""
        return get_object_or_404(
            Stream.objects.select_related(
            'class_obj', 'class_teacher__user_profile'
            ).prefetch_related('students', 'subject_assignments'),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a stream",
        responses={200: StreamDetailSerializer},
        tags=["Streams"]
    )
    def get(self, request, pk):
        """Get details of a specific stream"""
        stream = self.get_object(pk)
        serializer = StreamDetailSerializer(stream)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a stream",
        request=StreamSerializer,
        responses={200: StreamDetailSerializer},
        tags=["Streams"]
    )
    def put(self, request, pk):
        """Update a stream"""
        stream = self.get_object(pk)
        serializer = StreamSerializer(stream, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return detailed serializer for response
            response_serializer = StreamDetailSerializer(stream)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a stream",
        responses={204: None},
        tags=["Streams"]
    )
    def delete(self, request, pk):
        """Soft delete a stream by setting is_active to False"""
        stream = self.get_object(pk)
        stream.is_active = False
        stream.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StreamStudentsView(APIView):
    """Get all students in a specific stream"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get students in a stream",
        responses={200: StudentSerializer(many=True)},
        tags=["Streams"]
    )
    def get(self, request, pk):
        """Get all active students in a specific stream"""
        stream = get_object_or_404(Stream, pk=pk)
        students = stream.students.filter(is_active=True).select_related(
            'user_profile__user', 'current_stream__class_obj'
        )
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)


class StreamAssignTeacherView(APIView):
    """Assign a class teacher to a stream"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Assign teacher to stream",
        request={"type": "object", "properties": {"teacher_id": {"type": "integer"}}},
        responses={200: StreamSerializer},
        tags=["Streams"]
    )
    def post(self, request, pk):
        """Assign a class teacher to a stream"""
        stream = get_object_or_404(Stream, pk=pk)
        teacher_id = request.data.get('teacher_id')
        
        if not teacher_id:
            return Response({'error': 'teacher_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            teacher = Teacher.objects.get(id=teacher_id, is_active=True)
            stream.class_teacher = teacher
            stream.save()
            serializer = StreamSerializer(stream)
            return Response(serializer.data)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== STUDENT VIEWS ====================

class StudentListCreateView(APIView):
    """List all students or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all students",
        parameters=[
            OpenApiParameter(name='campus_id', type=int, description='Filter by campus ID'),
            OpenApiParameter(name='stream_id', type=int, description='Filter by stream ID'),
            OpenApiParameter(name='class_id', type=int, description='Filter by class ID'),
            OpenApiParameter(name='enrollment_status', type=str, description='Filter by enrollment status'),
            OpenApiParameter(name='search', type=str, description='Search in student ID, name, admission number'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: StudentSerializer(many=True)},
        tags=["Students"]
    )
    def get(self, request):
        """Get list of students with filtering and pagination"""
        # Get query parameters
        campus_id = request.query_params.get('campus_id')
        stream_id = request.query_params.get('stream_id')
        class_id = request.query_params.get('class_id')
        enrollment_status = request.query_params.get('enrollment_status')
        search = request.query_params.get('search')
        include_inactive = request.query_params.get('include_inactive', 'false').lower() == 'true'
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Student.objects.select_related(
            'user_profile__user', 'current_stream__class_obj', 'campus'
        ).prefetch_related('parent_student_relationships__parent__user_profile').order_by('student_id')
        
        # Apply filters
        queryset = filter_by_school(queryset, request, school_field_path='campus__schools')
        
        # Teacher-level Scope Filter
        if getattr(request.user, 'is_teacher', False):
            scope = get_teacher_scope(request.user)
            if scope:
                queryset = queryset.filter(current_stream_id__in=scope['stream_ids'])
            else:
                queryset = queryset.none()

        if not include_inactive:
            queryset = queryset.filter(is_active=True)
        if campus_id:
            queryset = queryset.filter(campus_id=campus_id)
        if stream_id:
            queryset = queryset.filter(current_stream_id=stream_id)
        if class_id:
            queryset = queryset.filter(current_stream__class_obj_id=class_id)
        if enrollment_status:
            queryset = queryset.filter(enrollment_status=enrollment_status)
        if search:
            queryset = queryset.filter(
                Q(student_id__icontains=search) |
                Q(lin__icontains=search) |
                Q(user_profile__first_name__icontains=search) |
                Q(user_profile__last_name__icontains=search) |
                Q(admission_number__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = StudentSerializer(page_obj.object_list, many=True, context={'request': request})
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a new student",
        description="""
        Create a new student record. You can either:
        
        1. **Provide an existing user_profile ID** if the user account already exists
        2. **Provide user creation fields** to automatically create a new user account:
           - user_email (required): Email address for the new account
           - user_first_name: First name
           - user_last_name: Last name  
           - user_phone: Phone number
           - user_role_id: Specific role ID (optional, will default to student role)
        
        When creating a new user account:
        - A random password will be generated automatically
        - Login credentials will be sent to the provided email address
        - The user will be prompted to change their password on first login
        """,
        request=StudentSerializer,
        responses={
            201: OpenApiResponse(description="Student created successfully", response=StudentSerializer),
            400: OpenApiResponse(description="Bad request - validation errors")
        },
        examples=[
            OpenApiExample(
                'Create with new user account',
                summary='Automatically create user account',
                description='This will create both a user account and student record',
                value={
                    'user_email': 'john.doe@student.example.com',
                    'user_first_name': 'John',
                    'user_last_name': 'Doe',
                    'user_phone': '+1234567890',
                    'current_stream': 1,
                    'enrollment_status': 'enrolled',
                    'admission_number': 'ADM2024001'
                }
            ),
            OpenApiExample(
                'Create with existing user profile',
                summary='Use existing user account',
                description='This will only create the student record linked to an existing user',
                value={
                    'user_profile': 1,
                    'current_stream': 1,
                    'enrollment_status': 'enrolled',
                    'admission_number': 'ADM2024002'
                }
            )
        ],
        tags=["Students"]
    )
    def post(self, request):
        """Create a new student"""
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentDetailView(APIView):
    """Retrieve, update or delete a student"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Get student object or return 404"""
        return get_object_or_404(
            Student.objects.select_related(
            'user_profile__user', 'current_stream__class_obj'
        ).prefetch_related(
            'parent_student_relationships__parent__user_profile',
            'stream_history__stream__class_obj',
            'stream_history__academic_year'
            ),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a student",
        responses={200: StudentDetailSerializer},
        tags=["Students"]
    )
    def get(self, request, pk):
        """Get details of a specific student"""
        student = self.get_object(pk)
        serializer = StudentDetailSerializer(student, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary="Update a student",
        request=StudentSerializer,
        responses={200: StudentDetailSerializer},
        tags=["Students"]
    )
    def put(self, request, pk):
        """Update a student"""
        student = self.get_object(pk)
        serializer = StudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return detailed serializer for response
            response_serializer = StudentDetailSerializer(student)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a student",
        responses={204: None},
        tags=["Students"]
    )
    def delete(self, request, pk):
        """Soft delete a student by setting is_active to False"""
        student = self.get_object(pk)
        student.is_active = False
        student.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        summary="Restore a soft-deleted student",
        responses={200: StudentDetailSerializer},
        tags=["Students"]
    )
    def patch(self, request, pk):
        """Restore a soft-deleted student by setting is_active to True"""
        student = self.get_object(pk)
        if not student.is_active:
            student.is_active = True
            student.save()
            serializer = StudentDetailSerializer(student)
            return Response(serializer.data)
        return Response(
            {"error": "Student is already active"}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class StudentParentsView(APIView):
    """Get all parents for a specific student"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get parents of a student",
        responses={200: ParentStudentRelationshipSerializer(many=True)},
        tags=["Students"]
    )
    def get(self, request, pk):
        """Get all parent relationships for a specific student"""
        student = get_object_or_404(Student, pk=pk)
        relationships = student.parent_student_relationships.select_related('parent__user_profile')
        serializer = ParentStudentRelationshipSerializer(relationships, many=True)
        return Response(serializer.data)


class StudentHistoryView(APIView):
    """Get academic history for a specific student"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get academic history of a student",
        responses={200: StudentStreamHistorySerializer(many=True)},
        tags=["Students"]
    )
    def get(self, request, pk):
        """Get academic history for a specific student"""
        student = get_object_or_404(Student, pk=pk)
        history = student.stream_history.select_related(
            'stream', 'academic_year'
        ).order_by('-academic_year__start_date')
        serializer = StudentStreamHistorySerializer(history, many=True)
        return Response(serializer.data)


class StudentAssignStreamView(APIView):
    """Assign a student to a stream"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Assign student to stream",
        request={"type": "object", "properties": {"stream_id": {"type": "integer"}}},
        responses={200: StudentSerializer},
        tags=["Students"]
    )
    def post(self, request, pk):
        """Assign a student to a stream and create history record"""
        student = get_object_or_404(Student, pk=pk)
        stream_id = request.data.get('stream_id')
        
        if not stream_id:
            return Response({'error': 'stream_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            stream = Stream.objects.get(id=stream_id, is_active=True)
            student.current_stream = stream
            student.save()
            
            # Create history record - Note: Stream no longer has academic_year, 
            # so we'll need to get it from a current academic year or remove this field
            # For now, commenting out the problematic line
            # StudentStreamHistory.objects.create(
            #     student=student,
            #     stream=stream,
            #     academic_year=stream.academic_year  # This field doesn't exist anymore
            # )
            
            serializer = StudentSerializer(student)
            return Response(serializer.data)
        except Stream.DoesNotExist:
            return Response({'error': 'Stream not found'}, status=status.HTTP_404_NOT_FOUND)


class StudentStatisticsView(APIView):
    """Get student statistics and summary"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get student statistics",
        parameters=[
            OpenApiParameter(name='school_id', type=int, description='Filter by school ID'),
        ],
        responses={200: {"type": "object"}},
        tags=["Students"]
    )
    def get(self, request):
        """Get student statistics and summary"""
        # Get query parameters
        school_id = request.query_params.get('school_id')  # Note: school filtering no longer available
        
        # Build queryset
        queryset = Student.objects.select_related('current_stream__class_obj')
        
        # Apply filters
        # Note: School filtering removed as Class no longer has school field
        
        # Calculate statistics
        total_students = queryset.count()
        enrolled = queryset.filter(enrollment_status='enrolled').count()
        transferred = queryset.filter(enrollment_status='transferred').count()
        graduated = queryset.filter(enrollment_status='graduated').count()
        suspended = queryset.filter(enrollment_status='suspended').count()
        withdrawn = queryset.filter(enrollment_status='withdrawn').count()
        
        # Get statistics by class
        by_class = {}
        class_stats = queryset.values('current_stream__class_obj__name').annotate(
            count=Count('id')
        ).order_by('current_stream__class_obj__name')
        
        for stat in class_stats:
            class_name = stat['current_stream__class_obj__name'] or 'Unassigned'
            by_class[class_name] = stat['count']
        
        # Get statistics by stream
        by_stream = {}
        stream_stats = queryset.values('current_stream__name').annotate(
            count=Count('id')
        ).order_by('current_stream__name')
        
        for stat in stream_stats:
            stream_name = stat['current_stream__name'] or 'Unassigned'
            by_stream[stream_name] = stat['count']
        
        # Get enrollment trend (last 12 months)
        enrollment_trend = {}
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        for i in range(12):
            date = timezone.now() - timedelta(days=30*i)
            month_key = date.strftime('%Y-%m')
            count = queryset.filter(
                created_at__year=date.year,
                created_at__month=date.month
            ).count()
            enrollment_trend[month_key] = count
        
        return Response({
            'total_students': total_students,
            'enrolled': enrolled,
            'transferred': transferred,
            'graduated': graduated,
            'suspended': suspended,
            'withdrawn': withdrawn,
            'by_class': by_class,
            'by_stream': by_stream,
            'enrollment_trend': enrollment_trend
        })


class BulkStudentUploadView(APIView):
    """Bulk upload students"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Bulk upload students",
        description="""
        Upload multiple students at once. Each student in the array can either:
        
        1. **Provide an existing user_profile ID** if the user account already exists
        2. **Provide user creation fields** to automatically create a new user account:
           - user_email (required): Email address for the new account
           - user_first_name: First name
           - user_last_name: Last name  
           - user_phone: Phone number
           - user_role_id: Specific role ID (optional, will default to student role)
        
        When creating new user accounts:
        - Random passwords will be generated automatically
        - Login credentials will be sent to the provided email addresses
        - Users will be prompted to change their passwords on first login
        """,
        request={"type": "object", "properties": {"students": {"type": "array", "items": StudentSerializer}}},
        responses={
            201: OpenApiResponse(description="Students created successfully", response=StudentSerializer(many=True)),
            400: OpenApiResponse(description="Bad request - validation errors")
        },
        tags=["Students"]
    )
    def post(self, request):
        """Create multiple students in bulk"""
        # Handle both WSGIRequest and Request objects
        if hasattr(request, 'data'):
            students_data = request.data.get('students', [])
        else:
            # Fallback for WSGIRequest
            import json
            try:
                students_data = json.loads(request.body).get('students', [])
            except (json.JSONDecodeError, AttributeError):
                students_data = []
        
        if not students_data:
            return Response({'error': 'students list is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_students = []
        errors = []
        
        # Pre-generate student IDs to avoid race conditions
        from members.models import Student
        from django.utils import timezone
        
        # Get the school and year for ID generation
        school = None
        if students_data and 'user_role_id' in students_data[0]:
            from accounts.models import Role
            try:
                role = Role.objects.get(id=students_data[0]['user_role_id'])
                school = role.school
            except Role.DoesNotExist:
                pass
        
        if not school:
            from accounts.models import School
            school = School.objects.first()
        
        if school:
            year = timezone.now().year
            school_code = school.name[:3].upper()
            
            # Get the highest existing student ID for this school and year
            existing_students = Student.objects.filter(
                student_id__startswith=f"{school_code}{year}"
            ).exclude(student_id='')
            
            max_number = 0
            if existing_students.exists():
                for student in existing_students:
                    try:
                        student_id = student.student_id
                        if len(student_id) >= 4:
                            number_part = student_id[-4:]
                            number = int(number_part)
                            max_number = max(max_number, number)
                    except (ValueError, IndexError):
                        continue
            
            # Generate student IDs for all students in the batch
            for i, student_data in enumerate(students_data):
                if not student_data.get('student_id'):
                    max_number += 1
                    student_data['student_id'] = f"{school_code}{year}{max_number:04d}"
        
        for i, student_data in enumerate(students_data):
            serializer = StudentSerializer(data=student_data)
            if serializer.is_valid():
                try:
                    student = serializer.save()
                    created_students.append(student)
                except Exception as e:
                    errors.append({f'student_{i}': f'Creation failed: {str(e)}'})
            else:
                errors.append({f'student_{i}': serializer.errors})
        
        if errors:
            return Response({
                'errors': errors,
                'created_count': len(created_students),
                'failed_count': len(errors)
            }, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({
            'message': f'Successfully created {len(created_students)} students',
            'created_count': len(created_students),
            'failed_count': len(errors)
        }, status=status.HTTP_201_CREATED)

class BulkStudentValidateView(APIView):
    """Validate bulk student upload for duplicates"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Validate bulk students upload",
        request={"type": "object", "properties": {"students": {"type": "array", "items": {"type": "object"}}}},
        responses={200: {"type": "object"}},
        tags=["Students"]
    )
    def post(self, request):
        students_data = request.data.get('students', [])
        if not students_data:
            return Response({'error': 'students list is required'}, status=400)
            
        duplicates = []
        field_errors = []
        valid_students = []
        
        from accounts.models import CustomUser
        from members.models import Student
        from members.serializers import StudentSerializer
        
        for idx, student in enumerate(students_data):
            email = student.get('user_email')
            phone = student.get('user_phone')
            first_name = student.get('user_first_name')
            last_name = student.get('user_last_name')
            
            is_valid = True
            
            # 1. Check with Serializer
            serializer = StudentSerializer(data=student)
            if not serializer.is_valid():
                is_valid = False
                field_errors.append({
                    'index': idx,
                    'first_name': first_name or '',
                    'last_name': last_name or '',
                    'errors': serializer.errors
                })
            
            # 2. Check for Duplicates
            is_duplicate = False
            reasons = []
            
            if email and CustomUser.objects.filter(email=email).exists():
                is_duplicate = True
                reasons.append(f"Email {email} already exists")
                
            if phone and CustomUser.objects.filter(profile__phone=phone).exists():
                is_duplicate = True
                reasons.append(f"Phone {phone} already exists")
                
            if first_name and last_name and Student.objects.filter(
                user_profile__first_name__iexact=first_name, 
                user_profile__last_name__iexact=last_name).exists():
                is_duplicate = True
                reasons.append(f"Student named {first_name} {last_name} already exists")
                
            if is_duplicate:
                is_valid = False
                duplicates.append({
                    'index': idx,
                    'first_name': first_name,
                    'last_name': last_name,
                    'reasons': reasons
                })
                
            if is_valid:
                valid_students.append(student)
                
        return Response({
            'total': len(students_data),
            'valid_count': len(valid_students),
            'duplicate_count': len(duplicates),
            'field_error_count': len(field_errors),
            'duplicates': duplicates,
            'field_errors': field_errors
        })


class BulkStudentUploadAsyncView(APIView):
    """Bulk upload students asynchronously via Celery"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Bulk upload students asynchronously",
        request={"type": "object", "properties": {"students": {"type": "array", "items": {"type": "object"}}}},
        responses={202: {"type": "object"}},
        tags=["Students"]
    )
    def post(self, request):
        students_data = request.data.get('students', [])
        if not students_data:
            return Response({'error': 'students list is required'}, status=400)
            
        school_id = None
        if students_data and 'user_role_id' in students_data[0]:
            from accounts.models import Role
            try:
                role = Role.objects.get(id=students_data[0]['user_role_id'])
                school_id = role.school_id
            except Role.DoesNotExist:
                pass
                
        from members.tasks.students import process_bulk_student_upload
        task = process_bulk_student_upload.delay(students_data, school_id)
        
        return Response({
            'message': 'Bulk upload started in the background',
            'task_id': task.id
        }, status=status.HTTP_202_ACCEPTED)
        
        response_serializer = StudentSerializer(created_students, many=True)
        return Response({
            'students': response_serializer.data,
            'created_count': len(created_students),
            'message': f'Successfully created {len(created_students)} students'
        }, status=status.HTTP_201_CREATED)


# ==================== TEACHER VIEWS ====================

class TeacherListCreateView(APIView):
    """List all teachers or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all teachers",
        parameters=[
            OpenApiParameter(name='school_id', type=int, description='Filter by school ID'),
            OpenApiParameter(name='employment_type', type=str, description='Filter by employment type'),
            OpenApiParameter(name='specialization', type=str, description='Filter by specialization'),
            OpenApiParameter(name='search', type=str, description='Search in employee ID, name, specialization'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: TeacherSerializer(many=True)},
        tags=["Teachers"]
    )
    def get(self, request):
        """Get list of teachers with filtering and pagination"""
        # Get query parameters
        school_id = request.query_params.get('school_id')
        campus_id = request.query_params.get('campus_id')
        employment_type = request.query_params.get('employment_type')
        specialization = request.query_params.get('specialization')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Teacher.objects.select_related(
            'user_profile__user', 'user_profile__role__school', 'campus'
        ).prefetch_related('subject_assignments', 'primary_streams').order_by('employee_id')
        
        # Apply filters
        if school_id:
            queryset = queryset.filter(user_profile__role__school_id=school_id)
        if campus_id:
            queryset = queryset.filter(campus_id=campus_id)
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
        if specialization:
            queryset = queryset.filter(specialization__icontains=specialization)
        if search:
            queryset = queryset.filter(
                Q(employee_id__icontains=search) |
                Q(user_profile__first_name__icontains=search) |
                Q(user_profile__last_name__icontains=search) |
                Q(specialization__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = TeacherSerializer(page_obj.object_list, many=True, context={'request': request})
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a new teacher",
        description="""
        Create a new teacher record. You can either:
        
        1. **Provide an existing user_profile ID** if the user account already exists
        2. **Provide user creation fields** to automatically create a new user account:
           - user_email (required): Email address for the new account
           - user_first_name: First name
           - user_last_name: Last name  
           - user_phone: Phone number
           - user_role_id: Specific role ID (optional, will default to teacher role)
        
        When creating a new user account:
        - A random password will be generated automatically
        - Login credentials will be sent to the provided email address
        - The user will be prompted to change their password on first login
        """,
        request=TeacherSerializer,
        responses={
            201: OpenApiResponse(description="Teacher created successfully", response=TeacherSerializer),
            400: OpenApiResponse(description="Bad request - validation errors")
        },
        examples=[
            OpenApiExample(
                'Create with new user account',
                summary='Automatically create user account',
                description='This will create both a user account and teacher record',
                value={
                    'user_email': 'jane.smith@teacher.example.com',
                    'user_first_name': 'Jane',
                    'user_last_name': 'Smith',
                    'user_phone': '+1234567891',
                    'employment_type': 'full_time',
                    'specialization': 'Mathematics',
                    'qualification': 'Masters in Mathematics'
                }
            ),
            OpenApiExample(
                'Create with existing user profile',
                summary='Use existing user account',
                description='This will only create the teacher record linked to an existing user',
                value={
                    'user_profile': 1,
                    'employment_type': 'part_time',
                    'specialization': 'Science',
                    'qualification': 'BSc Physics'
                }
            )
        ],
        tags=["Teachers"]
    )
    def post(self, request):
        """Create a new teacher"""
        serializer = TeacherSerializer(data=request.data)
        if serializer.is_valid():
            teacher = serializer.save()
            # Return detailed serializer for response
            response_serializer = TeacherDetailSerializer(teacher)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeacherDetailView(APIView):
    """Retrieve, update or delete a teacher"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Get teacher object or return 404"""
        return get_object_or_404(
            Teacher.objects.select_related(
                'user_profile__user', 'user_profile__role__school'
            ).prefetch_related('subject_assignments', 'primary_streams'),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a teacher",
        responses={200: TeacherDetailSerializer},
        tags=["Teachers"]
    )
    def get(self, request, pk):
        """Get details of a specific teacher"""
        teacher = self.get_object(pk)
        serializer = TeacherDetailSerializer(teacher, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary="Update a teacher",
        request=TeacherSerializer,
        responses={200: TeacherDetailSerializer},
        tags=["Teachers"]
    )
    def put(self, request, pk):
        """Update a teacher"""
        teacher = self.get_object(pk)
        serializer = TeacherSerializer(teacher, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return detailed serializer for response
            response_serializer = TeacherDetailSerializer(teacher)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a teacher",
        responses={204: None},
        tags=["Teachers"]
    )
    def delete(self, request, pk):
        """Soft delete a teacher by setting is_active to False"""
        teacher = self.get_object(pk)
        teacher.is_active = False
        teacher.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeacherAssignmentsView(APIView):
    """Get all subject assignments for a specific teacher"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get teacher assignments",
        responses={200: TeacherSubjectAssignmentSerializer(many=True)},
        tags=["Teachers"]
    )
    def get(self, request, pk):
        """Get all active subject assignments for a specific teacher"""
        teacher = get_object_or_404(Teacher, pk=pk)
        assignments = teacher.subject_assignments.filter(is_active=True).select_related(
            'subject', 'stream__class_obj', 'academic_year'
        )
        serializer = TeacherSubjectAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)


class TeacherStreamsView(APIView):
    """Get all streams where teacher is the class teacher"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get teacher streams",
        responses={200: StreamSerializer(many=True)},
        tags=["Teachers"]
    )
    def get(self, request, pk):
        """Get all streams where teacher is the class teacher"""
        teacher = get_object_or_404(Teacher, pk=pk)
        streams = teacher.primary_streams.filter(is_active=True).select_related(
            'class_obj'
        )
        serializer = StreamSerializer(streams, many=True)
        return Response(serializer.data)


# ==================== PARENT VIEWS ====================

class ParentListCreateView(APIView):
    """List all parents or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all parents",
        parameters=[
            OpenApiParameter(name='school_id', type=int, description='Filter by school ID (through children)'),
            OpenApiParameter(name='relationship_type', type=str, description='Filter by relationship type'),
            OpenApiParameter(name='search', type=str, description='Search in name and occupation'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ParentSerializer(many=True)},
        tags=["Parents"]
    )
    def get(self, request):
        """Get list of parents with filtering and pagination"""
        # Get query parameters
        school_id = request.query_params.get('school_id')  # Note: school filtering no longer available
        relationship_type = request.query_params.get('relationship_type')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Parent.objects.select_related('user_profile').prefetch_related(
            'parent_student_relationships__student__user_profile'
        ).order_by('user_profile__last_name')
        
        # Apply filters
        # Note: School filtering through children removed as Class no longer has school field
        if relationship_type:
            queryset = queryset.filter(
                parent_student_relationships__relationship_type=relationship_type
            ).distinct()
        if search:
            queryset = queryset.filter(
                Q(user_profile__first_name__icontains=search) |
                Q(user_profile__last_name__icontains=search) |
                Q(occupation__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = ParentSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a new parent",
        description="""
        Create a new parent record. You can either:
        
        1. **Provide an existing user_profile ID** if the user account already exists
        2. **Provide user creation fields** to automatically create a new user account:
           - user_email (required): Email address for the new account
           - user_first_name: First name
           - user_last_name: Last name  
           - user_phone: Phone number
           - user_role_id: Specific role ID (optional, will default to parent role)
        
        When creating a new user account:
        - A random password will be generated automatically
        - Login credentials will be sent to the provided email address
        - The user will be prompted to change their password on first login
        """,
        request=ParentSerializer,
        responses={
            201: OpenApiResponse(description="Parent created successfully", response=ParentSerializer),
            400: OpenApiResponse(description="Bad request - validation errors")
        },
        examples=[
            OpenApiExample(
                'Create with new user account',
                summary='Automatically create user account',
                description='This will create both a user account and parent record',
                value={
                    'user_email': 'robert.doe@parent.example.com',
                    'user_first_name': 'Robert',
                    'user_last_name': 'Doe',
                    'user_phone': '+1234567892',
                    'relationship_type': 'father',
                    'occupation': 'Engineer',
                    'workplace': 'Tech Corp Inc.'
                }
            ),
            OpenApiExample(
                'Create with existing user profile',
                summary='Use existing user account',
                description='This will only create the parent record linked to an existing user',
                value={
                    'user_profile': 1,
                    'relationship_type': 'mother',
                    'occupation': 'Doctor',
                    'workplace': 'City Hospital'
                }
            )
        ],
        tags=["Parents"]
    )
    def post(self, request):
        """Create a new parent"""
        serializer = ParentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ParentDetailView(APIView):
    """Retrieve, update or delete a parent"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Get parent object or return 404"""
        return get_object_or_404(
            Parent.objects.select_related(
                'user_profile__user'
            ).prefetch_related('parent_student_relationships__student'),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a parent",
        responses={200: ParentDetailSerializer},
        tags=["Parents"]
    )
    def get(self, request, pk):
        """Get details of a specific parent"""
        parent = self.get_object(pk)
        serializer = ParentDetailSerializer(parent)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a parent",
        request=ParentSerializer,
        responses={200: ParentDetailSerializer},
        tags=["Parents"]
    )
    def put(self, request, pk):
        """Update a parent"""
        parent = self.get_object(pk)
        serializer = ParentSerializer(parent, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return detailed serializer for response
            response_serializer = ParentDetailSerializer(parent)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a parent",
        responses={204: None},
        tags=["Parents"]
    )
    def delete(self, request, pk):
        """Soft delete a parent by setting is_active to False"""
        parent = self.get_object(pk)
        parent.is_active = False
        parent.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ParentChildrenView(APIView):
    """Get all children for a specific parent"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get children of a parent",
        responses={200: ParentStudentRelationshipSerializer(many=True)},
        tags=["Parents"]
    )
    def get(self, request, pk):
        """Get all children relationships for a specific parent"""
        parent = get_object_or_404(Parent, pk=pk)
        relationships = parent.parent_student_relationships.select_related('student__user_profile')
        serializer = ParentStudentRelationshipSerializer(relationships, many=True)
        return Response(serializer.data)


# ==================== PARENT-STUDENT RELATIONSHIP VIEWS ====================

class ParentStudentRelationshipListCreateView(APIView):
    """List all parent-student relationships or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List parent-student relationships",
        parameters=[
            OpenApiParameter(name='student_id', type=int, description='Filter by student ID'),
            OpenApiParameter(name='parent_id', type=int, description='Filter by parent ID'),
            OpenApiParameter(name='relationship_type', type=str, description='Filter by relationship type'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ParentStudentRelationshipSerializer(many=True)},
        tags=["Parent-Student Relationships"]
    )
    def get(self, request):
        """Get list of parent-student relationships with filtering and pagination"""
        # Get query parameters
        student_id = request.query_params.get('student_id')
        parent_id = request.query_params.get('parent_id')
        relationship_type = request.query_params.get('relationship_type')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = ParentStudentRelationship.objects.select_related(
            'parent__user_profile', 'student__user_profile'
        ).order_by('-created_at')
        
        # Apply filters
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        if relationship_type:
            queryset = queryset.filter(relationship_type=relationship_type)

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = ParentStudentRelationshipSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a parent-student relationship",
        request=ParentStudentRelationshipSerializer,
        responses={201: ParentStudentRelationshipSerializer},
        tags=["Parent-Student Relationships"]
    )
    def post(self, request):
        """Create a new parent-student relationship"""
        serializer = ParentStudentRelationshipSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ParentStudentRelationshipDetailView(APIView):
    """Retrieve, update or delete a parent-student relationship"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Get parent-student relationship object or return 404"""
        return get_object_or_404(
            ParentStudentRelationship.objects.select_related(
                'parent__user_profile', 'student__user_profile'
            ),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a parent-student relationship",
        responses={200: ParentStudentRelationshipSerializer},
        tags=["Parent-Student Relationships"]
    )
    def get(self, request, pk):
        """Get details of a specific parent-student relationship"""
        relationship = self.get_object(pk)
        serializer = ParentStudentRelationshipSerializer(relationship)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a parent-student relationship",
        request=ParentStudentRelationshipSerializer,
        responses={200: ParentStudentRelationshipSerializer},
        tags=["Parent-Student Relationships"]
    )
    def put(self, request, pk):
        """Update a parent-student relationship"""
        relationship = self.get_object(pk)
        serializer = ParentStudentRelationshipSerializer(relationship, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a parent-student relationship",
        responses={204: None},
        tags=["Parent-Student Relationships"]
    )
    def delete(self, request, pk):
        """Delete a parent-student relationship"""
        relationship = self.get_object(pk)
        relationship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== TEACHER SUBJECT ASSIGNMENT VIEWS ====================

class TeacherSubjectAssignmentListCreateView(APIView):
    """List all teacher subject assignments or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List teacher subject assignments",
        parameters=[
            OpenApiParameter(name='teacher_id', type=int, description='Filter by teacher ID'),
            OpenApiParameter(name='stream_id', type=int, description='Filter by stream ID'),
            OpenApiParameter(name='academic_year_id', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: TeacherSubjectAssignmentSerializer(many=True)},
        tags=["Teacher Assignments"]
    )
    def get(self, request):
        """Get list of teacher subject assignments with filtering and pagination"""
        # Get query parameters
        teacher_id = request.query_params.get('teacher_id')
        stream_id = request.query_params.get('stream_id')
        academic_year_id = request.query_params.get('academic_year_id')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = TeacherSubjectAssignment.objects.select_related(
            'teacher__user_profile', 'subject', 'stream__class_obj', 'academic_year'
        ).order_by('-academic_year__start_date')
        
        # Apply filters
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if stream_id:
            queryset = queryset.filter(stream_id=stream_id)
        if academic_year_id:
            queryset = queryset.filter(academic_year_id=academic_year_id)

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = TeacherSubjectAssignmentSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a teacher subject assignment",
        request=TeacherSubjectAssignmentSerializer,
        responses={201: TeacherSubjectAssignmentSerializer},
        tags=["Teacher Assignments"]
    )
    def post(self, request):
        """Create a new teacher subject assignment"""
        serializer = TeacherSubjectAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TeacherSubjectAssignmentDetailView(APIView):
    """Retrieve, update or delete a teacher subject assignment"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """Get teacher subject assignment object or return 404"""
        return get_object_or_404(
            TeacherSubjectAssignment.objects.select_related(
                'teacher__user_profile', 'subject', 'stream__class_obj', 'academic_year'
            ),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a teacher subject assignment",
        responses={200: TeacherSubjectAssignmentSerializer},
        tags=["Teacher Assignments"]
    )
    def get(self, request, pk):
        """Get details of a specific teacher subject assignment"""
        assignment = self.get_object(pk)
        serializer = TeacherSubjectAssignmentSerializer(assignment)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a teacher subject assignment",
        request=TeacherSubjectAssignmentSerializer,
        responses={200: TeacherSubjectAssignmentSerializer},
        tags=["Teacher Assignments"]
    )
    def put(self, request, pk):
        """Update a teacher subject assignment"""
        assignment = self.get_object(pk)
        serializer = TeacherSubjectAssignmentSerializer(assignment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a teacher subject assignment",
        responses={204: None},
        tags=["Teacher Assignments"]
    )
    def delete(self, request, pk):
        """Delete a teacher subject assignment"""
        assignment = self.get_object(pk)
        assignment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class BulkAssignTeacherSubjectsView(APIView):
    """Bulk assign teachers to subjects and streams"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Bulk assign teachers to subjects",
        request={"type": "object", "properties": {"assignments": {"type": "array", "items": TeacherSubjectAssignmentSerializer}}},
        responses={201: TeacherSubjectAssignmentSerializer(many=True)},
        tags=["Teacher Assignments"]
    )
    def post(self, request):
        """Create multiple teacher subject assignments in bulk"""
        assignments = request.data.get('assignments', [])
        
        if not assignments:
            return Response({'error': 'assignments list is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_assignments = []
        errors = []
        
        for i, assignment_data in enumerate(assignments):
            serializer = TeacherSubjectAssignmentSerializer(data=assignment_data)
            if serializer.is_valid():
                assignment = serializer.save()
                created_assignments.append(assignment)
            else:
                errors.append({f'assignment_{i}': serializer.errors})
        
        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
        
        response_serializer = TeacherSubjectAssignmentSerializer(created_assignments, many=True)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class NonStaffMemberListCreateView(APIView):
    """List all non-staff members or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all non-staff members",
        parameters=[
            OpenApiParameter(name='employment_type', type=str, description='Filter by employment type'),
            OpenApiParameter(name='search', type=str, description='Search in employee ID, name, specialization'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: NonStaffMemberSerializer(many=True)},
        tags=["NonStaffMembers"]
    )
    def get(self, request):
        search = request.query_params.get('search')
        employment_type = request.query_params.get('employment_type')
        is_active = request.query_params.get('is_active')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        queryset = NonStaffMember.objects.select_related('user_profile__user', 'user_profile__role__school').order_by('employee_id')
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if search:
            queryset = queryset.filter(
                Q(employee_id__icontains=search) |
                Q(user_profile__first_name__icontains=search) |
                Q(user_profile__last_name__icontains=search) |
                Q(specialization__icontains=search)
            )
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        serializer = NonStaffMemberSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next(),
            'previous': page_obj.has_previous(),
            'results': serializer.data
        })

    @extend_schema(
        summary="Create a new non-staff member",
        request=NonStaffMemberSerializer,
        responses={201: OpenApiResponse(description="Non-staff member created successfully", response=NonStaffMemberSerializer)},
        tags=["NonStaffMembers"]
    )
    def post(self, request):
        serializer = NonStaffMemberSerializer(data=request.data)
        if serializer.is_valid():
            member = serializer.save()
            response_serializer = NonStaffMemberSerializer(member)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NonStaffMemberDetailView(APIView):
    """Retrieve, update or delete a non-staff member"""
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        return get_object_or_404(NonStaffMember, pk=pk)
    
    @extend_schema(
        summary="Retrieve a non-staff member",
        responses={200: NonStaffMemberDetailSerializer},
        tags=["NonStaffMembers"]
    )
    def get(self, request, pk):
        """Get detailed information about a non-staff member"""
        non_staff_member = self.get_object(pk)
        serializer = NonStaffMemberDetailSerializer(non_staff_member)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Update a non-staff member",
        request=NonStaffMemberSerializer,
        responses={200: NonStaffMemberDetailSerializer},
        tags=["NonStaffMembers"]
    )
    def put(self, request, pk):
        """Update a non-staff member"""
        non_staff_member = self.get_object(pk)
        serializer = NonStaffMemberSerializer(non_staff_member, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(NonStaffMemberDetailSerializer(non_staff_member).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Delete a non-staff member",
        responses={204: None},
        tags=["NonStaffMembers"]
    )
    def delete(self, request, pk):
        """Delete a non-staff member"""
        non_staff_member = self.get_object(pk)
        
        # Check for related records that might prevent deletion
        related_fields = ['salary_payments']
        success, error_message = safe_delete_with_relations(non_staff_member, related_fields)
        
        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return create_error_response(error_message, status.HTTP_400_BAD_REQUEST)


# ==================== SALARY MANAGEMENT VIEWS ====================

@extend_schema(tags=["Salary Management"])
class SalaryPeriodListCreateView(APIView):
    """List and create salary periods"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_salaries',
        'POST': 'admin.manage_salaries',
    }
    
    @extend_schema(
        summary="List salary periods",
        parameters=[
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
        ],
        responses={200: SalaryPeriodSerializer(many=True)}
    )
    def get(self, request):
        """Get list of salary periods with filtering"""
        queryset = SalaryPeriod.objects.select_related('academic_year', 'term').all()
        
        # Apply filters
        academic_year = request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year_id=academic_year)
        
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        serializer = SalaryPeriodSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Create salary period",
        request=SalaryPeriodSerializer,
        responses={201: SalaryPeriodSerializer}
    )
    def post(self, request):
        """Create a new salary period"""
        serializer = SalaryPeriodSerializer(data=request.data)
        if serializer.is_valid():
            salary_period = serializer.save()
            return Response(SalaryPeriodSerializer(salary_period).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Salary Management"])
class SalaryPeriodDetailView(APIView):
    """Retrieve, update, and delete salary periods"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_salaries',
        'PATCH': 'admin.manage_salaries',
        'DELETE': 'admin.manage_salaries',
    }
    
    @extend_schema(summary="Get salary period details")
    def get(self, request, pk):
        """Get salary period details"""
        try:
            salary_period = SalaryPeriod.objects.get(pk=pk)
        except SalaryPeriod.DoesNotExist:
            return Response({'error': 'Salary period not found'}, status=404)
        
        serializer = SalaryPeriodSerializer(salary_period)
        return Response(serializer.data)

    @extend_schema(summary="Update salary period")
    def patch(self, request, pk):
        """Update salary period"""
        try:
            salary_period = SalaryPeriod.objects.get(pk=pk)
        except SalaryPeriod.DoesNotExist:
            return Response({'error': 'Salary period not found'}, status=404)
        
        if not salary_period.can_be_modified():
            return Response({'error': 'Cannot modify closed salary period'}, status=400)
        
        serializer = SalaryPeriodSerializer(salary_period, data=request.data, partial=True)
        if serializer.is_valid():
            salary_period = serializer.save()
            return Response(SalaryPeriodSerializer(salary_period).data)
        return Response(serializer.errors, status=400)

    @extend_schema(summary="Activate salary period")
    def post(self, request, pk):
        """Activate a specific salary period and deactivate all others"""
        try:
            salary_period = SalaryPeriod.objects.get(pk=pk)
        except SalaryPeriod.DoesNotExist:
            return Response({'error': 'Salary period not found'}, status=404)
        
        if not salary_period.can_be_modified():
            return Response({'error': 'Cannot modify closed salary period'}, status=400)
        
        try:
            # Use the class method to activate this period and deactivate others
            SalaryPeriod.activate_period(pk)
            return Response({'message': f'Salary period "{salary_period.name}" has been activated'})
        except ValidationError as e:
            return Response({'error': str(e)}, status=400)

    @extend_schema(summary="Delete salary period")
    def delete(self, request, pk):
        """Delete salary period"""
        try:
            salary_period = SalaryPeriod.objects.get(pk=pk)
        except SalaryPeriod.DoesNotExist:
            return Response({'error': 'Salary period not found'}, status=404)
        
        if not salary_period.can_be_modified():
            return Response({'error': 'Cannot delete closed salary period'}, status=400)
        
        salary_period.delete()
        return Response(status=204)


@extend_schema(tags=["Salary Management"])
class SalaryAllowanceListCreateView(APIView):
    """List and create salary allowances"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_salaries',
        'POST': 'admin.manage_salaries',
    }
    
    @extend_schema(
        summary="List salary allowances",
        parameters=[
            OpenApiParameter(name='allowance_type', type=str, description='Filter by allowance type'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
        ],
        responses={200: SalaryAllowanceSerializer(many=True)}
    )
    def get(self, request):
        """Get list of salary allowances with filtering"""
        queryset = SalaryAllowance.objects.all()
        
        # Apply filters
        allowance_type = request.query_params.get('allowance_type')
        if allowance_type:
            queryset = queryset.filter(allowance_type=allowance_type)
        
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        serializer = SalaryAllowanceSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Create salary allowance",
        request=SalaryAllowanceSerializer,
        responses={201: SalaryAllowanceSerializer}
    )
    def post(self, request):
        """Create a new salary allowance"""
        serializer = SalaryAllowanceSerializer(data=request.data)
        if serializer.is_valid():
            allowance = serializer.save()
            return Response(SalaryAllowanceSerializer(allowance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Salary Management"])
class SalaryAllowanceDetailView(APIView):
    """Retrieve, update, and delete salary allowances"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_salaries',
        'PATCH': 'admin.manage_salaries',
        'DELETE': 'admin.manage_salaries',
    }
    
    @extend_schema(summary="Get salary allowance details")
    def get(self, request, pk):
        """Get salary allowance details"""
        try:
            allowance = SalaryAllowance.objects.get(pk=pk)
        except SalaryAllowance.DoesNotExist:
            return Response({'error': 'Salary allowance not found'}, status=404)
        
        serializer = SalaryAllowanceSerializer(allowance)
        return Response(serializer.data)

    @extend_schema(summary="Update salary allowance")
    def patch(self, request, pk):
        """Update salary allowance"""
        try:
            allowance = SalaryAllowance.objects.get(pk=pk)
        except SalaryAllowance.DoesNotExist:
            return Response({'error': 'Salary allowance not found'}, status=404)
        
        serializer = SalaryAllowanceSerializer(allowance, data=request.data, partial=True)
        if serializer.is_valid():
            allowance = serializer.save()
            return Response(SalaryAllowanceSerializer(allowance).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(summary="Delete salary allowance")
    def delete(self, request, pk):
        """Delete salary allowance"""
        try:
            allowance = SalaryAllowance.objects.get(pk=pk)
        except SalaryAllowance.DoesNotExist:
            return Response({'error': 'Salary allowance not found'}, status=404)
        
        allowance.delete()
        return Response(status=204)


@extend_schema(tags=["Salary Management"])
class SalaryDeductionListCreateView(APIView):
    """List and create salary deductions"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_salaries',
        'POST': 'admin.manage_salaries',
    }
    
    @extend_schema(
        summary="List salary deductions",
        parameters=[
            OpenApiParameter(name='deduction_type', type=str, description='Filter by deduction type'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
        ],
        responses={200: SalaryDeductionSerializer(many=True)}
    )
    def get(self, request):
        """Get list of salary deductions with filtering"""
        queryset = SalaryDeduction.objects.all()
        
        # Apply filters
        deduction_type = request.query_params.get('deduction_type')
        if deduction_type:
            queryset = queryset.filter(deduction_type=deduction_type)
        
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        serializer = SalaryDeductionSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Create salary deduction",
        request=SalaryDeductionSerializer,
        responses={201: SalaryDeductionSerializer}
    )
    def post(self, request):
        """Create a new salary deduction"""
        serializer = SalaryDeductionSerializer(data=request.data)
        if serializer.is_valid():
            deduction = serializer.save()
            return Response(SalaryDeductionSerializer(deduction).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Salary Management"])
class SalaryDeductionDetailView(APIView):
    """Retrieve, update, and delete salary deductions"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_salaries',
        'PATCH': 'admin.manage_salaries',
        'DELETE': 'admin.manage_salaries',
    }
    
    @extend_schema(summary="Get salary deduction details")
    def get(self, request, pk):
        """Get salary deduction details"""
        try:
            deduction = SalaryDeduction.objects.get(pk=pk)
        except SalaryDeduction.DoesNotExist:
            return Response({'error': 'Salary deduction not found'}, status=404)
        
        serializer = SalaryDeductionSerializer(deduction)
        return Response(serializer.data)

    @extend_schema(summary="Update salary deduction")
    def patch(self, request, pk):
        """Update salary deduction"""
        try:
            deduction = SalaryDeduction.objects.get(pk=pk)
        except SalaryDeduction.DoesNotExist:
            return Response({'error': 'Salary deduction not found'}, status=404)
        
        serializer = SalaryDeductionSerializer(deduction, data=request.data, partial=True)
        if serializer.is_valid():
            deduction = serializer.save()
            return Response(SalaryDeductionSerializer(deduction).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(summary="Delete salary deduction")
    def delete(self, request, pk):
        """Delete salary deduction"""
        try:
            deduction = SalaryDeduction.objects.get(pk=pk)
        except SalaryDeduction.DoesNotExist:
            return Response({'error': 'Salary deduction not found'}, status=404)
        
        deduction.delete()
        return Response(status=204)


@extend_schema(tags=["Salary Management"])
class SalaryPaymentListCreateView(APIView):
    """List and create salary payments"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_salaries',
        'POST': 'admin.manage_salaries',
    }
    
    @extend_schema(
        summary="List salary payments",
        parameters=[
            OpenApiParameter(name='salary_period', type=int, description='Filter by salary period'),
            OpenApiParameter(name='payment_status', type=str, description='Filter by payment status'),
            OpenApiParameter(name='staff_type', type=str, description='Filter by staff type (teacher/non_staff)'),
            OpenApiParameter(name='payment_date_from', type=str, description='Filter by payment date from (YYYY-MM-DD)'),
            OpenApiParameter(name='payment_date_to', type=str, description='Filter by payment date to (YYYY-MM-DD)'),
        ],
        responses={200: SalaryPaymentSerializer(many=True)}
    )
    def get(self, request):
        """Get list of salary payments with filtering"""
        queryset = SalaryPayment.objects.select_related(
            'teacher__user_profile', 'non_staff_member__user_profile',
            'salary_period', 'processed_by'
        ).prefetch_related('details__allowance', 'details__deduction').all()
        
        # Apply filters
        salary_period = request.query_params.get('salary_period')
        if salary_period:
            queryset = queryset.filter(salary_period_id=salary_period)
        
        payment_status = request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        
        staff_type = request.query_params.get('staff_type')
        if staff_type == 'teacher':
            queryset = queryset.filter(teacher__isnull=False)
        elif staff_type == 'non_staff':
            queryset = queryset.filter(non_staff_member__isnull=False)
        
        payment_date_from = request.query_params.get('payment_date_from')
        if payment_date_from:
            queryset = queryset.filter(payment_date__gte=payment_date_from)
        
        payment_date_to = request.query_params.get('payment_date_to')
        if payment_date_to:
            queryset = queryset.filter(payment_date__lte=payment_date_to)
        
        serializer = SalaryPaymentSerializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Create salary payment",
        request=SalaryPaymentCreateUpdateSerializer,
        responses={201: SalaryPaymentSerializer}
    )
    def post(self, request):
        """Create a new salary payment"""
        serializer = SalaryPaymentCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Set the processed_by field
            validated_data = serializer.validated_data
            validated_data['processed_by'] = request.user.profile
            
            salary_payment = serializer.save(**validated_data)
            return Response(SalaryPaymentSerializer(salary_payment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Salary Management"])
class SalaryPaymentDetailView(APIView):
    """Retrieve, update, and delete salary payments"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'admin.manage_salaries',
        'PATCH': 'admin.manage_salaries',
        'DELETE': 'admin.manage_salaries',
    }
    
    @extend_schema(summary="Get salary payment details")
    def get(self, request, pk):
        """Get salary payment details"""
        try:
            salary_payment = SalaryPayment.objects.select_related(
                'teacher__user_profile', 'non_staff_member__user_profile',
                'salary_period', 'processed_by'
            ).prefetch_related('details__allowance', 'details__deduction').get(pk=pk)
        except SalaryPayment.DoesNotExist:
            return Response({'error': 'Salary payment not found'}, status=404)
        
        serializer = SalaryPaymentSerializer(salary_payment)
        return Response(serializer.data)

    @extend_schema(summary="Update salary payment")
    def patch(self, request, pk):
        """Update salary payment"""
        try:
            salary_payment = SalaryPayment.objects.get(pk=pk)
        except SalaryPayment.DoesNotExist:
            return Response({'error': 'Salary payment not found'}, status=404)
        
        serializer = SalaryPaymentCreateUpdateSerializer(salary_payment, data=request.data, partial=True)
        if serializer.is_valid():
            salary_payment = serializer.save()
            return Response(SalaryPaymentSerializer(salary_payment).data)
        return Response(serializer.errors, status=400)

    @extend_schema(summary="Delete salary payment")
    def delete(self, request, pk):
        """Delete salary payment"""
        try:
            salary_payment = SalaryPayment.objects.get(pk=pk)
        except SalaryPayment.DoesNotExist:
            return Response({'error': 'Salary payment not found'}, status=404)
        
        salary_payment.delete()
        return Response(status=204)


@extend_schema(tags=["Salary Management"])
class SalarySummaryView(APIView):
    """Get salary summary for a period"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.manage_salaries'
    
    @extend_schema(
        summary="Get salary summary",
        parameters=[
            OpenApiParameter(name='salary_period', type=int, description='Salary period ID', required=True),
        ],
        responses={200: SalarySummarySerializer}
    )
    def get(self, request):
        """Get salary summary for a period"""
        salary_period_id = request.query_params.get('salary_period')
        if not salary_period_id:
            return Response({'error': 'Salary period ID is required'}, status=400)
        
        try:
            salary_period = SalaryPeriod.objects.get(pk=salary_period_id)
        except SalaryPeriod.DoesNotExist:
            return Response({'error': 'Salary period not found'}, status=404)
        
        # Get or create summary
        summary, created = SalarySummary.objects.get_or_create(salary_period=salary_period)
        
        # Calculate summary
        summary.calculate_summary()
        
        serializer = SalarySummarySerializer(summary)
        return Response(serializer.data)


@extend_schema(tags=["Salary Management"])
class SalarySummaryListView(APIView):
    """List salary summaries"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.manage_salaries'
    
    @extend_schema(
        summary="List salary summaries",
        parameters=[
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year'),
        ],
        responses={200: SalarySummarySerializer(many=True)}
    )
    def get(self, request):
        """Get list of salary summaries with filtering"""
        queryset = SalarySummary.objects.select_related('salary_period__academic_year', 'salary_period__term').all()
        
        # Apply filters
        academic_year = request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(salary_period__academic_year_id=academic_year)
        
        serializer = SalarySummarySerializer(queryset, many=True)
        return Response(serializer.data)


@extend_schema(tags=["Salary Management"])
class StaffSalaryListView(APIView):
    """List staff members with their salary information"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required = 'admin.manage_salaries'
    
    @extend_schema(
        summary="List staff with salary information",
        parameters=[
            OpenApiParameter(name='staff_type', type=str, description='Filter by staff type (teacher/non_staff)'),
            OpenApiParameter(name='employment_type', type=str, description='Filter by employment type'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
        ],
        responses={200: {"type": "object", "properties": {
            "teachers": {"type": "array"},
            "non_staff": {"type": "array"},
            "total_staff": {"type": "integer"},
            "total_salary_budget": {"type": "number"}
        }}}
    )
    def get(self, request):
        """Get list of staff members with salary information"""
        staff_type = request.query_params.get('staff_type')
        employment_type = request.query_params.get('employment_type')
        is_active = request.query_params.get('is_active')
        
        # Get teachers
        teachers_queryset = Teacher.objects.select_related('user_profile').all()
        if employment_type:
            teachers_queryset = teachers_queryset.filter(employment_type=employment_type)
        if is_active is not None:
            teachers_queryset = teachers_queryset.filter(is_active=is_active.lower() == 'true')
        
        # Get non-staff members
        non_staff_queryset = NonStaffMember.objects.select_related('user_profile').all()
        if employment_type:
            non_staff_queryset = non_staff_queryset.filter(employment_type=employment_type)
        if is_active is not None:
            non_staff_queryset = non_staff_queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by staff type
        if staff_type == 'teacher':
            non_staff_queryset = NonStaffMember.objects.none()
        elif staff_type == 'non_staff':
            teachers_queryset = Teacher.objects.none()
        
        # Serialize data
        teachers_data = []
        for teacher in teachers_queryset:
            teachers_data.append({
                'id': teacher.id,
                'employee_id': teacher.employee_id,
                'name': teacher.full_name,
                'email': teacher.user_profile.user.email if teacher.user_profile.user else None,
                'employment_type': teacher.employment_type,
                'base_salary': teacher.salary,
                'is_active': teacher.is_active,
                'hire_date': teacher.hire_date,
            })
        
        non_staff_data = []
        for non_staff in non_staff_queryset:
            non_staff_data.append({
                'id': non_staff.id,
                'employee_id': non_staff.employee_id,
                'name': non_staff.full_name,
                'email': non_staff.user_profile.user.email if non_staff.user_profile.user else None,
                'employment_type': non_staff.employment_type,
                'base_salary': non_staff.salary,
                'is_active': non_staff.is_active,
                'hire_date': non_staff.hire_date,
            })
        
        # Calculate totals
        total_staff = len(teachers_data) + len(non_staff_data)
        total_salary_budget = sum(
            (t['base_salary'] or 0 for t in teachers_data + non_staff_data)
        )
        
        return Response({
            'teachers': teachers_data,
            'non_staff': non_staff_data,
            'total_staff': total_staff,
            'total_salary_budget': total_salary_budget,
        })


# ==================== BULK UPLOAD VIEWS ====================

class BulkTeacherUploadView(APIView):
    """Bulk upload teachers"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Bulk upload teachers",
        description="""
        Upload multiple teachers at once. Each teacher in the array can either:
        
        1. **Provide an existing user_profile ID** if the user account already exists
        2. **Provide user creation fields** to automatically create a new user account:
           - user_email (required): Email address for the new account
           - user_first_name: First name
           - user_last_name: Last name  
           - user_phone: Phone number
           - user_role_id: Specific role ID (optional, will default to teacher role)
        
        When creating new user accounts:
        - Random passwords will be generated automatically
        - Login credentials will be sent to the provided email addresses
        - Users will be prompted to change their passwords on first login
        """,
        request={"type": "object", "properties": {"teachers": {"type": "array", "items": TeacherSerializer}}},
        responses={
            201: OpenApiResponse(description="Teachers created successfully", response=TeacherSerializer(many=True)),
            400: OpenApiResponse(description="Bad request - validation errors")
        },
        tags=["Teachers"]
    )
    def post(self, request):
        """Create multiple teachers in bulk"""
        # Handle both WSGIRequest and Request objects
        if hasattr(request, 'data'):
            teachers_data = request.data.get('teachers', [])
        else:
            # Fallback for WSGIRequest
            import json
            try:
                teachers_data = json.loads(request.body).get('teachers', [])
            except (json.JSONDecodeError, AttributeError):
                teachers_data = []
        
        if not teachers_data:
            return Response({'error': 'teachers list is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_teachers = []
        errors = []
        
        # Pre-generate employee IDs to avoid race conditions
        from members.models import Teacher
        from django.utils import timezone
        
        # Get the school and year for ID generation
        school = None
        if teachers_data and 'user_role_id' in teachers_data[0]:
            from accounts.models import Role
            try:
                role = Role.objects.get(id=teachers_data[0]['user_role_id'])
                school = role.school
            except Role.DoesNotExist:
                pass
        
        if not school:
            from accounts.models import School
            school = School.objects.first()
        
        if school:
            year = timezone.now().year
            school_code = school.name[:3].upper()
            
            # Get the highest existing teacher ID for this school and year
            existing_teachers = Teacher.objects.filter(
                employee_id__startswith=f"TCH{school_code}{year}"
            ).exclude(employee_id='')
            
            max_number = 0
            if existing_teachers.exists():
                for teacher in existing_teachers:
                    try:
                        employee_id = teacher.employee_id
                        if len(employee_id) >= 4:
                            number_part = employee_id[-4:]
                            number = int(number_part)
                            max_number = max(max_number, number)
                    except (ValueError, IndexError):
                        continue
            
            # Generate employee IDs for all teachers in the batch
            for i, teacher_data in enumerate(teachers_data):
                if not teacher_data.get('employee_id'):
                    max_number += 1
                    teacher_data['employee_id'] = f"TCH{school_code}{year}{max_number:04d}"
        
        for i, teacher_data in enumerate(teachers_data):
            serializer = TeacherSerializer(data=teacher_data)
            if serializer.is_valid():
                try:
                    teacher = serializer.save()
                    created_teachers.append(teacher)
                except Exception as e:
                    errors.append({f'teacher_{i}': f'Creation failed: {str(e)}'})
            else:
                errors.append({f'teacher_{i}': serializer.errors})
        
        if errors:
            return Response({
                'errors': errors,
                'created_count': len(created_teachers),
                'failed_count': len(errors)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        response_serializer = TeacherSerializer(created_teachers, many=True)
        return Response({
            'teachers': response_serializer.data,
            'created_count': len(created_teachers),
            'message': f'Successfully created {len(created_teachers)} teachers'
        }, status=status.HTTP_201_CREATED)


class BulkNonStaffMemberUploadView(APIView):
    """Bulk upload non-staff members"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Bulk upload non-staff members",
        description="""
        Upload multiple non-staff members at once. Each member in the array can either:
        
        1. **Provide an existing user_profile ID** if the user account already exists
        2. **Provide user creation fields** to automatically create a new user account:
           - user_email (required): Email address for the new account
           - user_first_name: First name
           - user_last_name: Last name  
           - user_phone: Phone number
           - user_role_id: Specific role ID (optional, will default to non-staff role)
        
        When creating new user accounts:
        - Random passwords will be generated automatically
        - Login credentials will be sent to the provided email addresses
        - Users will be prompted to change their passwords on first login
        """,
        request={"type": "object", "properties": {"non_staff_members": {"type": "array", "items": NonStaffMemberSerializer}}},
        responses={
            201: OpenApiResponse(description="Non-staff members created successfully", response=NonStaffMemberSerializer(many=True)),
            400: OpenApiResponse(description="Bad request - validation errors")
        },
        tags=["NonStaffMembers"]
    )
    def post(self, request):
        """Create multiple non-staff members in bulk"""
        # Handle both WSGIRequest and Request objects
        if hasattr(request, 'data'):
            members_data = request.data.get('non_staff_members', [])
        else:
            # Fallback for WSGIRequest
            import json
            try:
                members_data = json.loads(request.body).get('non_staff_members', [])
            except (json.JSONDecodeError, AttributeError):
                members_data = []
        
        if not members_data:
            return Response({'error': 'non_staff_members list is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_members = []
        errors = []
        
        # Pre-generate employee IDs to avoid race conditions
        from members.models import NonStaffMember
        from django.utils import timezone
        
        # Get the school and year for ID generation
        school = None
        if members_data and 'user_role_id' in members_data[0]:
            from accounts.models import Role
            try:
                role = Role.objects.get(id=members_data[0]['user_role_id'])
                school = role.school
            except Role.DoesNotExist:
                pass
        
        if not school:
            from accounts.models import School
            school = School.objects.first()
        
        if school:
            year = timezone.now().year
            school_code = school.name[:3].upper()
            
            # Get the highest existing non-staff member ID for this school and year
            existing_members = NonStaffMember.objects.filter(
                employee_id__startswith=f"NS{school_code}{year}"
            ).exclude(employee_id='')
            
            max_number = 0
            if existing_members.exists():
                for member in existing_members:
                    try:
                        employee_id = member.employee_id
                        if len(employee_id) >= 4:
                            number_part = employee_id[-4:]
                            number = int(number_part)
                            max_number = max(max_number, number)
                    except (ValueError, IndexError):
                        continue
            
            # Generate employee IDs for all members in the batch
            for i, member_data in enumerate(members_data):
                if not member_data.get('employee_id'):
                    max_number += 1
                    member_data['employee_id'] = f"NS{school_code}{year}{max_number:04d}"
        
        for i, member_data in enumerate(members_data):
            serializer = NonStaffMemberSerializer(data=member_data)
            if serializer.is_valid():
                try:
                    member = serializer.save()
                    created_members.append(member)
                except Exception as e:
                    errors.append({f'non_staff_member_{i}': f'Creation failed: {str(e)}'})
            else:
                errors.append({f'non_staff_member_{i}': serializer.errors})
        
        if errors:
            return Response({
                'errors': errors,
                'created_count': len(created_members),
                'failed_count': len(errors)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        response_serializer = NonStaffMemberSerializer(created_members, many=True)
        return Response({
            'non_staff_members': response_serializer.data,
            'created_count': len(created_members),
            'message': f'Successfully created {len(created_members)} non-staff members'
        }, status=status.HTTP_201_CREATED)
