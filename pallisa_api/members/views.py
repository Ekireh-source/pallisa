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

from .models import (
    Class, Stream, Student, Teacher, Parent, ParentStudentRelationship,
    StudentStreamHistory, Subject, TeacherSubjectAssignment
)
from .serializers import (
    ClassSerializer, StreamSerializer, StreamDetailSerializer,
    StudentSerializer, StudentDetailSerializer,
    TeacherSerializer, TeacherDetailSerializer,
    ParentSerializer, ParentDetailSerializer,
    ParentStudentRelationshipSerializer,
    StudentStreamHistorySerializer,
    SubjectSerializer,
    TeacherSubjectAssignmentSerializer
)


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
        serializer = serializer_class(obj)
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
        search = request.query_params.get('search')
        is_active = request.query_params.get('is_active')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Class.objects.order_by('name')
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = ClassSerializer(page_obj.object_list, many=True)
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

    def get_object(self, pk):
        """Get class object or return 404"""
        return get_object_or_404(Class, pk=pk)

    @extend_schema(
        summary="Retrieve a class level",
        responses={200: ClassSerializer},
        tags=["Classes"]
    )
    def get(self, request, pk):
        """Get details of a specific class level"""
        class_obj = self.get_object(pk)
        serializer = ClassSerializer(class_obj)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a class level",
        request=ClassSerializer,
        responses={200: ClassSerializer},
        tags=["Classes"]
    )
    def put(self, request, pk):
        """Update a class level"""
        class_obj = self.get_object(pk)
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
        class_obj = self.get_object(pk)
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
        
        # Apply filters
        if school_id:
            queryset = queryset.filter(school_id=school_id)
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

        serializer = SubjectSerializer(page_obj.object_list, many=True)
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

    def get_object(self, pk):
        """Get subject object or return 404"""
        return get_object_or_404(Subject.objects.select_related('school'), pk=pk)

    @extend_schema(
        summary="Retrieve a subject",
        responses={200: SubjectSerializer},
        tags=["Subjects"]
    )
    def get(self, request, pk):
        """Get details of a specific subject"""
        subject = self.get_object(pk)
        serializer = SubjectSerializer(subject)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a subject",
        request=SubjectSerializer,
        responses={200: SubjectSerializer},
        tags=["Subjects"]
    )
    def put(self, request, pk):
        """Update a subject"""
        subject = self.get_object(pk)
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
        
        # Apply filters
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
            OpenApiParameter(name='school_id', type=int, description='Filter by school ID'),
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
        school_id = request.query_params.get('school_id')  # Note: school filtering no longer available
        stream_id = request.query_params.get('stream_id')
        class_id = request.query_params.get('class_id')
        enrollment_status = request.query_params.get('enrollment_status')
        search = request.query_params.get('search')
        include_inactive = request.query_params.get('include_inactive', 'false').lower() == 'true'
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Student.objects.select_related(
            'user_profile__user', 'current_stream__class_obj'
        ).prefetch_related('parent_student_relationships__parent__user_profile').order_by('student_id')
        
        # Apply filters
        # Note: School filtering removed as Class no longer has school field
        if not include_inactive:
            queryset = queryset.filter(is_active=True)
        if stream_id:
            queryset = queryset.filter(current_stream_id=stream_id)
        if class_id:
            queryset = queryset.filter(current_stream__class_obj_id=class_id)
        if enrollment_status:
            queryset = queryset.filter(enrollment_status=enrollment_status)
        if search:
            queryset = queryset.filter(
                Q(student_id__icontains=search) |
                Q(user_profile__first_name__icontains=search) |
                Q(user_profile__last_name__icontains=search) |
                Q(admission_number__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = StudentSerializer(page_obj.object_list, many=True)
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
        serializer = StudentDetailSerializer(student)
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
        """Get comprehensive student statistics"""
        school_id = request.query_params.get('school_id')  # Note: school filtering no longer available
        
        queryset = Student.objects.filter(is_active=True)
        # Note: School filtering removed as Class no longer has school field
        
        # Calculate statistics
        stats = {
            'total_students': queryset.count(),
            'enrolled': queryset.filter(enrollment_status='enrolled').count(),
            'transferred': queryset.filter(enrollment_status='transferred').count(),
            'graduated': queryset.filter(enrollment_status='graduated').count(),
            'by_class': {}
        }

        # Group by class level - updated field reference
        class_counts = queryset.values(
            'current_stream__class_obj__name'
        ).annotate(count=Count('id')).order_by('current_stream__class_obj__name')

        for item in class_counts:
            class_name = item['current_stream__class_obj__name'] or 'Unassigned'
            stats['by_class'][class_name] = item['count']

        return Response(stats)


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
        employment_type = request.query_params.get('employment_type')
        specialization = request.query_params.get('specialization')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Teacher.objects.select_related(
            'user_profile__user', 'user_profile__role__school'
        ).prefetch_related('subject_assignments', 'primary_streams').order_by('employee_id')
        
        # Apply filters
        if school_id:
            queryset = queryset.filter(user_profile__role__school_id=school_id)
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

        serializer = TeacherSerializer(page_obj.object_list, many=True)
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
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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
        serializer = TeacherDetailSerializer(teacher)
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
