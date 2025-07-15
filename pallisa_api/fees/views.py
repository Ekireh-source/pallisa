from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.paginator import Paginator
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from django.db.models.functions import ExtractMonth
from rest_framework import generics, permissions
from .models import FeeCategory, FeeStructure, Scholarship, StudentFeeOverride, FeePayment, StudentFeeBalance, TermFeeCollectionSummary
from .serializers import (
    FeeCategorySerializer, FeeStructureSerializer, FeeStructureDetailSerializer,
    ScholarshipSerializer, StudentFeeOverrideSerializer, StudentFeeOverrideDetailSerializer,
    FeePaymentSerializer, FeePaymentDetailSerializer, FeePaymentCreateSerializer,
    FeeSummarySerializer, StudentFeeSummarySerializer, StudentFeeBalanceSerializer,
    TermFeeCollectionSummarySerializer, SchoolFeeCollectionOverviewSerializer
)
from accounts.permission import HasPermission
from members.models import Student


# ==================== FEE CATEGORY VIEWS ====================

class FeeCategoryListCreateView(APIView):
    """List all fee categories or create a new one"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_fee_category',
        'POST': 'create_fee_category',
    }

    @extend_schema(
        summary="List all fee categories",
        parameters=[
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='search', type=str, description='Search in name and description'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: FeeCategorySerializer(many=True)},
        tags=["Fee Categories"]
    )
    def get(self, request):
        """Get list of fee categories with filtering and pagination"""
        queryset = FeeCategory.objects.all()
        
        # Apply filters
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = FeeCategorySerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new fee category",
        request=FeeCategorySerializer,
        responses={201: FeeCategorySerializer},
        tags=["Fee Categories"]
    )
    def post(self, request):
        """Create a new fee category"""
        serializer = FeeCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FeeCategoryDetailView(APIView):
    """Retrieve, update, and delete fee categories"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_fee_category',
        'PUT': 'edit_fee_category',
        'PATCH': 'edit_fee_category',
        'DELETE': 'delete_fee_category',
    }

    def get_object(self, pk):
        return get_object_or_404(FeeCategory, pk=pk)

    @extend_schema(
        summary="Retrieve a fee category",
        responses={200: FeeCategorySerializer},
        tags=["Fee Categories"]
    )
    def get(self, request, pk):
        """Get a specific fee category"""
        category = self.get_object(pk)
        serializer = FeeCategorySerializer(category)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a fee category",
        request=FeeCategorySerializer,
        responses={200: FeeCategorySerializer},
        tags=["Fee Categories"]
    )
    def put(self, request, pk):
        """Update a fee category"""
        category = self.get_object(pk)
        serializer = FeeCategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a fee category",
        responses={204: None},
        tags=["Fee Categories"]
    )
    def delete(self, request, pk):
        """Delete a fee category"""
        category = self.get_object(pk)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== FEE STRUCTURE VIEWS ====================

class FeeStructureListCreateView(APIView):
    """List all fee structures or create a new one"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_fee_structure',
        'POST': 'create_fee_structure',
    }

    @extend_schema(
        summary="List all fee structures",
        parameters=[
            OpenApiParameter(name='category', type=int, description='Filter by category ID'),
            OpenApiParameter(name='class_obj', type=int, description='Filter by class ID'),
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: FeeStructureSerializer(many=True)},
        tags=["Fee Structures"]
    )
    def get(self, request):
        """Get list of fee structures with filtering and pagination"""
        queryset = FeeStructure.objects.select_related('category', 'class_obj', 'academic_year', 'term')
        
        # Apply filters
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        class_obj = request.query_params.get('class_obj')
        if class_obj:
            queryset = queryset.filter(class_obj_id=class_obj)
        
        academic_year = request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year_id=academic_year)
        
        term = request.query_params.get('term')
        if term:
            queryset = queryset.filter(term_id=term)
        
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = FeeStructureSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new fee structure",
        request=FeeStructureSerializer,
        responses={201: FeeStructureSerializer},
        tags=["Fee Structures"]
    )
    def post(self, request):
        """Create a new fee structure"""
        serializer = FeeStructureSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FeeStructureDetailView(APIView):
    """Retrieve, update, and delete fee structures"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_fee_structure',
        'PUT': 'edit_fee_structure',
        'PATCH': 'edit_fee_structure',
        'DELETE': 'delete_fee_structure',
    }

    def get_object(self, pk):
        return get_object_or_404(
            FeeStructure.objects.select_related('category', 'class_obj', 'academic_year', 'term'),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a fee structure",
        responses={200: FeeStructureDetailSerializer},
        tags=["Fee Structures"]
    )
    def get(self, request, pk):
        """Get a specific fee structure"""
        structure = self.get_object(pk)
        serializer = FeeStructureDetailSerializer(structure)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a fee structure",
        request=FeeStructureSerializer,
        responses={200: FeeStructureDetailSerializer},
        tags=["Fee Structures"]
    )
    def put(self, request, pk):
        """Update a fee structure"""
        structure = self.get_object(pk)
        serializer = FeeStructureSerializer(structure, data=request.data)
        if serializer.is_valid():
            serializer.save()
            response_serializer = FeeStructureDetailSerializer(structure)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a fee structure",
        responses={204: None},
        tags=["Fee Structures"]
    )
    def delete(self, request, pk):
        """Delete a fee structure"""
        structure = self.get_object(pk)
        structure.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== SCHOLARSHIP VIEWS ====================

class ScholarshipListCreateView(APIView):
    """List all scholarships or create a new one"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_scholarship',
        'POST': 'create_scholarship',
    }

    @extend_schema(
        summary="List all scholarships",
        parameters=[
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='discount_type', type=str, description='Filter by discount type'),
            OpenApiParameter(name='search', type=str, description='Search in name and description'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ScholarshipSerializer(many=True)},
        tags=["Scholarships"]
    )
    def get(self, request):
        """Get list of scholarships with filtering and pagination"""
        queryset = Scholarship.objects.all()
        
        # Apply filters
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        discount_type = request.query_params.get('discount_type')
        if discount_type:
            queryset = queryset.filter(discount_type=discount_type)
        
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = ScholarshipSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new scholarship",
        request=ScholarshipSerializer,
        responses={201: ScholarshipSerializer},
        tags=["Scholarships"]
    )
    def post(self, request):
        """Create a new scholarship"""
        serializer = ScholarshipSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ScholarshipDetailView(APIView):
    """Retrieve, update, and delete scholarships"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_scholarship',
        'PUT': 'edit_scholarship',
        'PATCH': 'edit_scholarship',
        'DELETE': 'delete_scholarship',
    }

    def get_object(self, pk):
        return get_object_or_404(Scholarship, pk=pk)

    @extend_schema(
        summary="Retrieve a scholarship",
        responses={200: ScholarshipSerializer},
        tags=["Scholarships"]
    )
    def get(self, request, pk):
        """Get a specific scholarship"""
        scholarship = self.get_object(pk)
        serializer = ScholarshipSerializer(scholarship)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a scholarship",
        request=ScholarshipSerializer,
        responses={200: ScholarshipSerializer},
        tags=["Scholarships"]
    )
    def put(self, request, pk):
        """Update a scholarship"""
        scholarship = self.get_object(pk)
        serializer = ScholarshipSerializer(scholarship, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a scholarship",
        responses={204: None},
        tags=["Scholarships"]
    )
    def delete(self, request, pk):
        """Delete a scholarship"""
        scholarship = self.get_object(pk)
        scholarship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== STUDENT FEE OVERRIDE VIEWS ====================

class StudentFeeOverrideListCreateView(APIView):
    """List all student fee overrides or create a new one"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_student_fee_override',
        'POST': 'create_student_fee_override',
    }

    @extend_schema(
        summary="List all student fee overrides",
        parameters=[
            OpenApiParameter(name='student', type=int, description='Filter by student ID'),
            OpenApiParameter(name='category', type=int, description='Filter by category ID'),
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: StudentFeeOverrideSerializer(many=True)},
        tags=["Student Fee Overrides"]
    )
    def get(self, request):
        """Get list of student fee overrides with filtering and pagination"""
        queryset = StudentFeeOverride.objects.select_related('student', 'category', 'academic_year', 'term')
        
        # Apply filters
        student = request.query_params.get('student')
        if student:
            queryset = queryset.filter(student_id=student)
        
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        academic_year = request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year_id=academic_year)
        
        term = request.query_params.get('term')
        if term:
            queryset = queryset.filter(term_id=term)
        
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = StudentFeeOverrideSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new student fee override",
        request=StudentFeeOverrideSerializer,
        responses={201: StudentFeeOverrideSerializer},
        tags=["Student Fee Overrides"]
    )
    def post(self, request):
        """Create a new student fee override"""
        serializer = StudentFeeOverrideSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentFeeOverrideDetailView(APIView):
    """Retrieve, update, and delete student fee overrides"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_student_fee_override',
        'PUT': 'edit_student_fee_override',
        'PATCH': 'edit_student_fee_override',
        'DELETE': 'delete_student_fee_override',
    }

    def get_object(self, pk):
        return get_object_or_404(
            StudentFeeOverride.objects.select_related('student', 'category', 'academic_year', 'term'),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a student fee override",
        responses={200: StudentFeeOverrideDetailSerializer},
        tags=["Student Fee Overrides"]
    )
    def get(self, request, pk):
        """Get a specific student fee override"""
        override = self.get_object(pk)
        serializer = StudentFeeOverrideDetailSerializer(override)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a student fee override",
        request=StudentFeeOverrideSerializer,
        responses={200: StudentFeeOverrideDetailSerializer},
        tags=["Student Fee Overrides"]
    )
    def put(self, request, pk):
        """Update a student fee override"""
        override = self.get_object(pk)
        serializer = StudentFeeOverrideSerializer(override, data=request.data)
        if serializer.is_valid():
            serializer.save()
            response_serializer = StudentFeeOverrideDetailSerializer(override)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a student fee override",
        responses={204: None},
        tags=["Student Fee Overrides"]
    )
    def delete(self, request, pk):
        """Delete a student fee override"""
        override = self.get_object(pk)
        override.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== FEE PAYMENT VIEWS ====================

class FeePaymentListCreateView(APIView):
    """List all fee payments or create a new one"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_fee_payment',
        'POST': 'create_fee_payment',
    }

    @extend_schema(
        summary="List all fee payments",
        parameters=[
            OpenApiParameter(name='student', type=int, description='Filter by student ID'),
            OpenApiParameter(name='category', type=int, description='Filter by category ID'),
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='payment_status', type=str, description='Filter by payment status'),
            OpenApiParameter(name='payment_method', type=str, description='Filter by payment method'),
            OpenApiParameter(name='start_date', type=str, description='Filter payments from date (YYYY-MM-DD)'),
            OpenApiParameter(name='end_date', type=str, description='Filter payments to date (YYYY-MM-DD)'),
            OpenApiParameter(name='search', type=str, description='Search in student name, category name, academic year name, and term name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: FeePaymentSerializer(many=True)},
        tags=["Fee Payments"]
    )
    def get(self, request):
        """Get list of fee payments with filtering and pagination"""
        queryset = FeePayment.objects.select_related(
            'student', 'category', 'academic_year', 'term', 'scholarship', 'recorded_by'
        )
        
        # Apply filters
        student = request.query_params.get('student')
        if student:
            queryset = queryset.filter(student_id=student)
        
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        academic_year = request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year_id=academic_year)
        
        term = request.query_params.get('term')
        if term:
            queryset = queryset.filter(term_id=term)
        
        payment_status = request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        
        payment_method = request.query_params.get('payment_method')
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(payment_date__gte=start_date)
            except ValueError:
                pass
        
        end_date = request.query_params.get('end_date')
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(payment_date__lte=end_date)
            except ValueError:
                pass
        
        # Search functionality
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(student__user_profile__first_name__icontains=search) |
                Q(student__user_profile__last_name__icontains=search) |
                Q(student__student_id__icontains=search) |
                Q(category__name__icontains=search) |
                Q(academic_year__name__icontains=search) |
                Q(term__name__icontains=search) |
                Q(receipt_number__icontains=search)
            )
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = FeePaymentSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new fee payment",
        request=FeePaymentCreateSerializer,
        responses={201: FeePaymentDetailSerializer},
        tags=["Fee Payments"]
    )
    def post(self, request):
        """Create a new fee payment"""
        serializer = FeePaymentCreateSerializer(data=request.data)
        if serializer.is_valid():
            payment = serializer.save(recorded_by=request.user.profile)
            response_serializer = FeePaymentDetailSerializer(payment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FeePaymentDetailView(APIView):
    """Retrieve, update, and delete fee payments"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_fee_payment',
        'PUT': 'edit_fee_payment',
        'PATCH': 'edit_fee_payment',
        'DELETE': 'delete_fee_payment',
    }

    def get_object(self, pk):
        return get_object_or_404(
            FeePayment.objects.select_related(
                'student', 'category', 'academic_year', 'term', 'scholarship', 'recorded_by'
            ),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve a fee payment",
        responses={200: FeePaymentDetailSerializer},
        tags=["Fee Payments"]
    )
    def get(self, request, pk):
        """Get a specific fee payment"""
        payment = self.get_object(pk)
        serializer = FeePaymentDetailSerializer(payment)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a fee payment",
        request=FeePaymentCreateSerializer,
        responses={200: FeePaymentDetailSerializer},
        tags=["Fee Payments"]
    )
    def put(self, request, pk):
        """Update a fee payment"""
        payment = self.get_object(pk)
        serializer = FeePaymentCreateSerializer(payment, data=request.data)
        if serializer.is_valid():
            payment = serializer.save()
            response_serializer = FeePaymentDetailSerializer(payment)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a fee payment",
        responses={204: None},
        tags=["Fee Payments"]
    )
    def delete(self, request, pk):
        """Delete a fee payment"""
        payment = self.get_object(pk)
        payment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FeePaymentStatsView(APIView):
    """Get fee payment statistics"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_fee_payment',
    }

    @extend_schema(
        summary="Get fee payment statistics",
        parameters=[
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='start_date', type=str, description='Filter from date (YYYY-MM-DD)'),
            OpenApiParameter(name='end_date', type=str, description='Filter to date (YYYY-MM-DD)'),
        ],
        responses={200: {
            'type': 'object',
            'properties': {
                'total_payments': {'type': 'integer'},
                'completed_payments': {'type': 'integer'},
                'pending_payments': {'type': 'integer'},
                'total_amount': {'type': 'string'},
            }
        }},
        tags=["Fee Payment Statistics"]
    )
    def get(self, request):
        """Get fee payment statistics with filtering"""
        # Get filter parameters
        academic_year = request.query_params.get('academic_year')
        term = request.query_params.get('term')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Base queryset
        payments = FeePayment.objects.all()
        
        # Apply filters
        if academic_year:
            payments = payments.filter(academic_year_id=academic_year)
        if term:
            payments = payments.filter(term_id=term)
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                payments = payments.filter(payment_date__gte=start_date)
            except ValueError:
                pass
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                payments = payments.filter(payment_date__lte=end_date)
            except ValueError:
                pass
        
        # Calculate statistics
        total_payments = payments.count()
        completed_payments = payments.filter(payment_status='completed').count()
        pending_payments = payments.filter(payment_status='pending').count()
        total_amount = payments.filter(payment_status='completed').aggregate(
            total=Sum('amount_paid')
        )['total'] or Decimal('0.00')
        
        stats = {
            'total_payments': total_payments,
            'completed_payments': completed_payments,
            'pending_payments': pending_payments,
            'total_amount': str(total_amount),
        }
        
        return Response(stats)


# ==================== FEE SUMMARY VIEWS ====================

class FeeSummaryView(APIView):
    """Get fee summary statistics"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_fee_summary',
    }

    @extend_schema(
        summary="Get fee summary and statistics",
        parameters=[
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='start_date', type=str, description='Filter from date (YYYY-MM-DD)'),
            OpenApiParameter(name='end_date', type=str, description='Filter to date (YYYY-MM-DD)'),
        ],
        responses={200: FeeSummarySerializer},
        tags=["Fee Summary"]
    )
    def get(self, request):
        """Get fee summary statistics with filtering"""
        # Get filter parameters
        academic_year = request.query_params.get('academic_year')
        term = request.query_params.get('term')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Base queryset
        payments = FeePayment.objects.all()
        
        # Apply filters
        if academic_year:
            payments = payments.filter(academic_year_id=academic_year)
        if term:
            payments = payments.filter(term_id=term)
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                payments = payments.filter(payment_date__gte=start_date)
            except ValueError:
                pass
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                payments = payments.filter(payment_date__lte=end_date)
            except ValueError:
                pass
        
        # Calculate summary statistics
        total_paid = payments.filter(payment_status='completed').aggregate(
            total=Sum('amount_paid')
        )['total'] or Decimal('0.00')
        
        total_discounts = payments.filter(payment_status='completed').aggregate(
            total=Sum('discount_amount')
        )['total'] or Decimal('0.00')
        
        payment_count = payments.filter(payment_status='completed').count()
        overdue_count = payments.filter(
            Q(payment_date__gt=timezone.now().date()) & 
            ~Q(payment_status='completed')
        ).count()
        
        # Calculate expected fees (this would need to be calculated based on fee structures)
        # For now, we'll use a simplified approach
        total_expected = total_paid + total_discounts  # This should be calculated from fee structures
        total_pending = total_expected - total_paid
        
        # Group by category
        by_category = {}
        category_payments = payments.filter(payment_status='completed').values(
            'category__name'
        ).annotate(
            total=Sum('amount_paid'),
            count=Count('id')
        )
        for item in category_payments:
            by_category[item['category__name']] = {
                'total': float(item['total']),
                'count': item['count']
            }
        
        # Group by status
        by_status = {}
        status_payments = payments.values('payment_status').annotate(
            total=Sum('amount_paid'),
            count=Count('id')
        )
        for item in status_payments:
            by_status[item['payment_status']] = {
                'total': float(item['total'] or 0),
                'count': item['count']
            }
        
        # Group by month
        by_month = {}
        month_payments = payments.filter(payment_status='completed').annotate(
            month=ExtractMonth('payment_date')
        ).values('month').annotate(
            total=Sum('amount_paid'),
            count=Count('id')
        )
        for item in month_payments:
            if item['month']:
                month_name = datetime(2024, int(item['month']), 1).strftime('%B')
            else:
                month_name = 'Unknown'
            by_month[month_name] = {
                'total': float(item['total']),
                'count': item['count']
            }
        
        summary_data = {
            'total_expected': total_expected,
            'total_paid': total_paid,
            'total_pending': total_pending,
            'total_discounts': total_discounts,
            'payment_count': payment_count,
            'overdue_count': overdue_count,
            'by_category': by_category,
            'by_status': by_status,
            'by_month': by_month
        }
        
        serializer = FeeSummarySerializer(summary_data)
        return Response(serializer.data)


class StudentFeeSummaryView(APIView):
    """Get fee summary for individual students"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_student_fee_summary',
    }

    @extend_schema(
        summary="Get fee summary for a specific student",
        parameters=[
            OpenApiParameter(name='student', type=int, description='Student ID (required)'),
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
        ],
        responses={200: StudentFeeSummarySerializer},
        tags=["Student Fee Summary"]
    )
    def get(self, request):
        """Get fee summary for a specific student"""
        # Get filter parameters
        student_id = request.query_params.get('student')
        academic_year = request.query_params.get('academic_year')
        term = request.query_params.get('term')
        
        if not student_id:
            return Response(
                {'error': 'Student ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get student payments
        payments = FeePayment.objects.filter(student_id=student_id)
        
        if academic_year:
            payments = payments.filter(academic_year_id=academic_year)
        if term:
            payments = payments.filter(term_id=term)
        
        # Calculate summary for the student
        total_paid = payments.filter(payment_status='completed').aggregate(
            total=Sum('amount_paid')
        )['total'] or Decimal('0.00')
        
        total_discounts = payments.filter(payment_status='completed').aggregate(
            total=Sum('discount_amount')
        )['total'] or Decimal('0.00')
        
        payment_count = payments.filter(payment_status='completed').count()
        overdue_count = payments.filter(
            Q(payment_date__gt=timezone.now().date()) & 
            ~Q(payment_status='completed')
        ).count()
        
        # Get last payment date
        last_payment = payments.filter(payment_status='completed').order_by('-payment_date').first()
        last_payment_date = last_payment.payment_date if last_payment else None
        
        # Calculate expected fees (simplified - should be based on fee structures)
        total_expected = total_paid + total_discounts  # This should be calculated from fee structures
        total_pending = total_expected - total_paid
        
        # Determine payment status
        if total_pending <= 0:
            payment_status = 'paid'
        elif total_paid > 0:
            payment_status = 'partial'
        else:
            payment_status = 'unpaid'
        
        # Get student info
        try:
            student = Student.objects.get(id=student_id)
            student_name = student.full_name
            class_name = student.current_stream.class_obj.name if student.current_stream else 'N/A'
        except Student.DoesNotExist:
            student_name = 'Unknown'
            class_name = 'N/A'
        
        summary_data = {
            'student_id': student_id,
            'student_name': student_name,
            'class_name': class_name,
            'total_expected': total_expected,
            'total_paid': total_paid,
            'total_pending': total_pending,
            'total_discounts': total_discounts,
            'payment_count': payment_count,
            'overdue_count': overdue_count,
            'last_payment_date': last_payment_date,
            'payment_status': payment_status
        }
        
        serializer = StudentFeeSummarySerializer(summary_data)
        return Response(serializer.data)


class StudentFeeSummaryListView(APIView):
    """Get fee summary for all students"""
    permission_classes = [IsAuthenticated, HasPermission]
    permission_required_map = {
        'GET': 'view_student_fee_summary',
    }

    @extend_schema(
        summary="Get fee summary for all students",
        parameters=[
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='class_obj', type=int, description='Filter by class ID'),
            OpenApiParameter(name='payment_status', type=str, description='Filter by payment status'),
            OpenApiParameter(name='search', type=str, description='Search in student name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: StudentFeeSummarySerializer(many=True)},
        tags=["Student Fee Summary"]
    )
    def get(self, request):
        """Get fee summary for all students with filtering and pagination"""
        # Get filter parameters
        academic_year = request.query_params.get('academic_year')
        term = request.query_params.get('term')
        class_obj = request.query_params.get('class_obj')
        payment_status = request.query_params.get('payment_status')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        # Get all students
        students = Student.objects.select_related('current_stream__class_obj')
        
        if class_obj:
            students = students.filter(current_stream__class_obj_id=class_obj)
        
        if search:
            students = students.filter(
                Q(user_profile__first_name__icontains=search) |
                Q(user_profile__last_name__icontains=search) |
                Q(student_id__icontains=search)
            )
        
        summaries = []
        
        for student in students:
            # Get student payments
            payments = FeePayment.objects.filter(student=student)
            
            if academic_year:
                payments = payments.filter(academic_year_id=academic_year)
            if term:
                payments = payments.filter(term_id=term)
            
            # Calculate summary for the student
            total_paid = payments.filter(payment_status='completed').aggregate(
                total=Sum('amount_paid')
            )['total'] or Decimal('0.00')
            
            total_discounts = payments.filter(payment_status='completed').aggregate(
                total=Sum('discount_amount')
            )['total'] or Decimal('0.00')
            
            payment_count = payments.filter(payment_status='completed').count()
            overdue_count = payments.filter(
                Q(payment_date__gt=timezone.now().date()) & 
                ~Q(payment_status='completed')
            ).count()
            
            # Get last payment date
            last_payment = payments.filter(payment_status='completed').order_by('-payment_date').first()
            last_payment_date = last_payment.payment_date if last_payment else None
            
            # Calculate expected fees (simplified)
            total_expected = total_paid + total_discounts
            total_pending = total_expected - total_paid
            
            # Determine payment status
            if total_pending <= 0:
                student_payment_status = 'paid'
            elif total_paid > 0:
                student_payment_status = 'partial'
            else:
                student_payment_status = 'unpaid'
            
            # Filter by payment status if specified
            if payment_status and student_payment_status != payment_status:
                continue
            
            summary_data = {
                'student_id': student.id,
                'student_name': student.full_name,
                'class_name': student.current_stream.class_obj.name if student.current_stream else 'N/A',
                'total_expected': total_expected,
                'total_paid': total_paid,
                'total_pending': total_pending,
                'total_discounts': total_discounts,
                'payment_count': payment_count,
                'overdue_count': overdue_count,
                'last_payment_date': last_payment_date,
                'payment_status': student_payment_status
            }
            
            summaries.append(summary_data)
        
        # Sort by student name
        summaries.sort(key=lambda x: x['student_name'])
        
        # Paginate results
        paginator = Paginator(summaries, page_size)
        page_obj = paginator.get_page(page)
        
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': page_obj.object_list,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })


class StudentFeeBalanceListView(generics.ListAPIView):
    """List all student fee balances, with optional filters"""
    queryset = StudentFeeBalance.objects.select_related('student', 'academic_year', 'term', 'student__current_stream__class_obj')
    serializer_class = StudentFeeBalanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List all student fee balances",
        parameters=[
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='class_obj', type=int, description='Filter by class ID'),
            OpenApiParameter(name='balance_status', type=str, description='Filter by balance status (paid, partial, unpaid, overpaid)'),
            OpenApiParameter(name='search', type=str, description='Search in student name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: StudentFeeBalanceSerializer(many=True)},
        tags=["Student Fee Balances"]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        academic_year = self.request.query_params.get('academic_year')
        term = self.request.query_params.get('term')
        class_obj = self.request.query_params.get('class_obj')
        balance_status = self.request.query_params.get('balance_status')
        search = self.request.query_params.get('search')
        
        if academic_year:
            qs = qs.filter(academic_year_id=academic_year)
        if term:
            qs = qs.filter(term_id=term)
        if class_obj:
            qs = qs.filter(student__current_stream__class_obj_id=class_obj)
        if balance_status:
            qs = qs.filter(balance_status=balance_status)
        if search:
            qs = qs.filter(
                Q(student__user_profile__first_name__icontains=search) |
                Q(student__user_profile__last_name__icontains=search) |
                Q(student__student_id__icontains=search)
            )
        return qs


class TermFeeCollectionSummaryListView(generics.ListAPIView):
    """List all term fee collection summaries, with optional filters"""
    queryset = TermFeeCollectionSummary.objects.select_related('academic_year', 'term')
    serializer_class = TermFeeCollectionSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List all term fee collection summaries",
        parameters=[
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='search', type=str, description='Search in academic year or term name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: TermFeeCollectionSummarySerializer(many=True)},
        tags=["Term Fee Collection Summaries"]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        academic_year = self.request.query_params.get('academic_year')
        term = self.request.query_params.get('term')
        search = self.request.query_params.get('search')
        
        if academic_year:
            qs = qs.filter(academic_year_id=academic_year)
        if term:
            qs = qs.filter(term_id=term)
        if search:
            qs = qs.filter(
                Q(academic_year__name__icontains=search) |
                Q(term__name__icontains=search)
            )
        
        return qs


class TermFeeCollectionSummaryDetailView(generics.RetrieveAPIView):
    """Get a specific term fee collection summary"""
    queryset = TermFeeCollectionSummary.objects.select_related('academic_year', 'term')
    serializer_class = TermFeeCollectionSummarySerializer
    permission_classes = [permissions.IsAuthenticated]


class TermFeeCollectionSummaryUpdateView(generics.UpdateAPIView):
    """Update a term fee collection summary (recalculate)"""
    queryset = TermFeeCollectionSummary.objects.select_related('academic_year', 'term')
    serializer_class = TermFeeCollectionSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.calculate_collection_summary()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class TermFeeCollectionSummaryCreateView(generics.CreateAPIView):
    """Create a new term fee collection summary"""
    queryset = TermFeeCollectionSummary.objects.all()
    serializer_class = TermFeeCollectionSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        academic_year_id = request.data.get('academic_year')
        term_id = request.data.get('term')
        
        if not academic_year_id or not term_id:
            return Response(
                {'error': 'Both academic_year and term are required'}, 
                status=400
            )
        
        from .models import update_term_fee_collection_summary
        summary = update_term_fee_collection_summary(academic_year_id, term_id)
        
        if summary:
            serializer = self.get_serializer(summary)
            return Response(serializer.data, status=201)
        else:
            return Response(
                {'error': 'Failed to create term fee collection summary'}, 
                status=400
            )


class SchoolFeeCollectionOverviewView(generics.GenericAPIView):
    """Get school-wide fee collection overview"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SchoolFeeCollectionOverviewSerializer

    def get(self, request):
        """Get comprehensive school fee collection overview"""
        from .models import get_school_fee_collection_overview
        
        overview = get_school_fee_collection_overview()
        serializer = self.get_serializer(overview)
        return Response(serializer.data)
