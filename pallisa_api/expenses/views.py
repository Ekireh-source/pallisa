from django.shortcuts import render, get_object_or_404
from django.db.models import Sum, Count, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from datetime import datetime, timedelta
from django.db.models.functions import TruncMonth
from django.core.paginator import Paginator
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.types import OpenApiTypes

from .models import ExpenseCategory, AcademicYear, Term, Department, Vendor, Expense
from .serializers import (
    ExpenseCategorySerializer,
    AcademicYearSerializer,
    TermSerializer,
    TermDetailSerializer,
    DepartmentSerializer,
    VendorSerializer,
    ExpenseSerializer,
    ExpenseDetailSerializer,
    ExpenseCreateUpdateSerializer,
    ExpenseApprovalSerializer,
    ExpenseSummarySerializer,
)

from accounts.permission import filter_by_school


# ==================== EXPENSE CATEGORY VIEWS ====================

class ExpenseCategoryListCreateView(APIView):
    """List all expense categories or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all expense categories",
        parameters=[
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='search', type=str, description='Search in name and description'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: ExpenseCategorySerializer(many=True)},
        tags=["Expense Categories"]
    )
    def get(self, request):
        """Get list of expense categories with filtering and pagination"""
        # Get query parameters
        is_active = request.query_params.get('is_active')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset
        queryset = ExpenseCategory.objects.order_by('name')
        
        # Apply filters
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        else:
            # Default to active categories if no filter specified
            queryset = queryset.filter(is_active=True)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = ExpenseCategorySerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new expense category",
        request=ExpenseCategorySerializer,
        responses={201: ExpenseCategorySerializer},
        tags=["Expense Categories"]
    )
    def post(self, request):
        serializer = ExpenseCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExpenseCategoryDetailView(APIView):
    """Retrieve, update or delete an expense category"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(ExpenseCategory, pk=pk)

    @extend_schema(
        summary="Retrieve an expense category",
        responses={200: ExpenseCategorySerializer},
        tags=["Expense Categories"]
    )
    def get(self, request, pk):
        category = self.get_object(pk)
        serializer = ExpenseCategorySerializer(category)
        return Response(serializer.data)

    @extend_schema(
        summary="Update an expense category",
        request=ExpenseCategorySerializer,
        responses={200: ExpenseCategorySerializer},
        tags=["Expense Categories"]
    )
    def put(self, request, pk):
        category = self.get_object(pk)
        serializer = ExpenseCategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete an expense category",
        responses={204: None},
        tags=["Expense Categories"]
    )
    def delete(self, request, pk):
        category = self.get_object(pk)
        # Soft delete by setting is_active to False
        category.is_active = False
        category.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== ACADEMIC YEAR VIEWS ====================

class AcademicYearListCreateView(APIView):
    """List all academic years or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all academic years",
        parameters=[
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='search', type=str, description='Search in name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: AcademicYearSerializer(many=True)},
        tags=["Academic Years"]
    )
    def get(self, request):
        """Get list of academic years with filtering and pagination"""
        # Get query parameters
        is_active = request.query_params.get('is_active')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset
        queryset = AcademicYear.objects.order_by('-start_date')
        queryset = filter_by_school(queryset, request)
        
        # Apply filters
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        else:
            # Default to active academic years if no filter specified
            queryset = queryset.filter(is_active=True)
        
        if search:
            queryset = queryset.filter(name__icontains=search)

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = AcademicYearSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new academic year",
        request=AcademicYearSerializer,
        responses={201: AcademicYearSerializer},
        tags=["Academic Years"]
    )
    def post(self, request):
        serializer = AcademicYearSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AcademicYearDetailView(APIView):
    """Retrieve, update or delete an academic year"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, request):
        queryset = AcademicYear.objects.all()
        queryset = filter_by_school(queryset, request)
        return get_object_or_404(queryset, pk=pk)

    @extend_schema(
        summary="Retrieve an academic year",
        responses={200: AcademicYearSerializer},
        tags=["Academic Years"]
    )
    def get(self, request, pk):
        academic_year = self.get_object(pk, request)
        serializer = AcademicYearSerializer(academic_year)
        return Response(serializer.data)

    @extend_schema(
        summary="Update an academic year",
        request=AcademicYearSerializer,
        responses={200: AcademicYearSerializer},
        tags=["Academic Years"]
    )
    def put(self, request, pk):
        academic_year = self.get_object(pk, request)
        serializer = AcademicYearSerializer(academic_year, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete an academic year",
        responses={204: None},
        tags=["Academic Years"]
    )
    def delete(self, request, pk):
        academic_year = self.get_object(pk, request)
        # Soft delete by setting is_active to False
        academic_year.is_active = False
        academic_year.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== TERM VIEWS ====================

class TermListCreateView(APIView):
    """List all terms or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all academic terms",
        parameters=[
            OpenApiParameter(name='academic_year', type=int, description='Filter by academic year ID'),
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='is_current', type=bool, description='Filter by current term status'),
            OpenApiParameter(name='search', type=str, description='Search in term name'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: TermSerializer(many=True)},
        tags=["Terms"]
    )
    def get(self, request):
        """Get list of academic terms with filtering and pagination"""
        # Get query parameters
        academic_year = request.query_params.get('academic_year')
        is_active = request.query_params.get('is_active')
        is_current = request.query_params.get('is_current')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset with optimizations
        queryset = Term.objects.select_related('academic_year').order_by('-academic_year__start_date', 'name')
        queryset = filter_by_school(queryset, request, school_field_path='academic_year__school')
        
        # Apply filters
        if academic_year:
            queryset = queryset.filter(academic_year_id=academic_year)
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        else:
            # Default to active terms if no filter specified
            queryset = queryset.filter(is_active=True)
        
        if is_current is not None:
            queryset = queryset.filter(is_current=is_current.lower() == 'true')
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(academic_year__name__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = TermSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new academic term",
        request=TermSerializer,
        responses={201: TermSerializer},
        tags=["Terms"]
    )
    def post(self, request):
        serializer = TermSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TermDetailView(APIView):
    """Retrieve, update or delete a term"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, request):
        queryset = Term.objects.all()
        queryset = filter_by_school(queryset, request, school_field_path='academic_year__school')
        return get_object_or_404(queryset, pk=pk)

    @extend_schema(
        summary="Retrieve a term",
        responses={200: TermDetailSerializer},
        tags=["Terms"]
    )
    def get(self, request, pk):
        term = self.get_object(pk, request)
        serializer = TermDetailSerializer(term)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a term",
        request=TermSerializer,
        responses={200: TermDetailSerializer},
        tags=["Terms"]
    )
    def put(self, request, pk):
        term = self.get_object(pk, request)
        serializer = TermSerializer(term, data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Return detailed serializer for response
            response_serializer = TermDetailSerializer(term)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a term",
        responses={204: None},
        tags=["Terms"]
    )
    def delete(self, request, pk):
        term = self.get_object(pk, request)
        term.is_active = False
        term.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== DEPARTMENT VIEWS ====================

class DepartmentListCreateView(APIView):
    """List all departments or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all departments",
        parameters=[
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='search', type=str, description='Search in name and description'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: DepartmentSerializer(many=True)},
        tags=["Departments"]
    )
    def get(self, request):
        """Get list of departments with filtering and pagination"""
        # Get query parameters
        is_active = request.query_params.get('is_active')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset
        queryset = Department.objects.order_by('name')
        
        # Apply filters
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        else:
            # Default to active departments if no filter specified
            queryset = queryset.filter(is_active=True)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = DepartmentSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new department",
        request=DepartmentSerializer,
        responses={201: DepartmentSerializer},
        tags=["Departments"]
    )
    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DepartmentDetailView(APIView):
    """Retrieve, update or delete a department"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Department, pk=pk)

    @extend_schema(
        summary="Retrieve a department",
        responses={200: DepartmentSerializer},
        tags=["Departments"]
    )
    def get(self, request, pk):
        department = self.get_object(pk)
        serializer = DepartmentSerializer(department)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a department",
        request=DepartmentSerializer,
        responses={200: DepartmentSerializer},
        tags=["Departments"]
    )
    def put(self, request, pk):
        department = self.get_object(pk)
        serializer = DepartmentSerializer(department, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a department",
        responses={204: None},
        tags=["Departments"]
    )
    def delete(self, request, pk):
        department = self.get_object(pk)
        department.is_active = False
        department.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== VENDOR VIEWS ====================

class VendorListCreateView(APIView):
    """List all vendors or create a new one"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all vendors",
        parameters=[
            OpenApiParameter(name='is_active', type=bool, description='Filter by active status'),
            OpenApiParameter(name='search', type=str, description='Search in name, contact_person, and email'),
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: VendorSerializer(many=True)},
        tags=["Vendors"]
    )
    def get(self, request):
        """Get list of vendors with filtering and pagination"""
        # Get query parameters
        is_active = request.query_params.get('is_active')
        search = request.query_params.get('search')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))

        # Build queryset
        queryset = Vendor.objects.order_by('name')
        
        # Apply filters
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        else:
            # Default to active vendors if no filter specified
            queryset = queryset.filter(is_active=True)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(contact_person__icontains=search) | 
                Q(email__icontains=search)
            )

        # Paginate results
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page)

        serializer = VendorSerializer(page_obj.object_list, many=True)
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })

    @extend_schema(
        summary="Create a new vendor",
        request=VendorSerializer,
        responses={201: VendorSerializer},
        tags=["Vendors"]
    )
    def post(self, request):
        serializer = VendorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorDetailView(APIView):
    """Retrieve, update or delete a vendor"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Vendor, pk=pk)

    @extend_schema(
        summary="Retrieve a vendor",
        responses={200: VendorSerializer},
        tags=["Vendors"]
    )
    def get(self, request, pk):
        vendor = self.get_object(pk)
        serializer = VendorSerializer(vendor)
        return Response(serializer.data)

    @extend_schema(
        summary="Update a vendor",
        request=VendorSerializer,
        responses={200: VendorSerializer},
        tags=["Vendors"]
    )
    def put(self, request, pk):
        vendor = self.get_object(pk)
        serializer = VendorSerializer(vendor, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete a vendor",
        responses={204: None},
        tags=["Vendors"]
    )
    def delete(self, request, pk):
        vendor = self.get_object(pk)
        vendor.is_active = False
        vendor.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== EXPENSE VIEWS ====================

class CreateExpenseView(APIView):
    """Create a new expense"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        summary="Create a new expense",
        request=ExpenseCreateUpdateSerializer,
        responses={201: ExpenseDetailSerializer},
        tags=["Expenses"]
    )
    def post(self, request):
        serializer = ExpenseCreateUpdateSerializer(
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            expense = serializer.save()
            response_serializer = ExpenseDetailSerializer(
                expense, 
                context={'request': request}
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListExpensesView(APIView):
    """List all expenses with filtering and pagination"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List all expenses",
        parameters=[
            OpenApiParameter(name='category', type=int, description='Filter by category ID'),
            OpenApiParameter(name='department', type=int, description='Filter by department ID'),
            OpenApiParameter(name='vendor', type=int, description='Filter by vendor ID'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
            OpenApiParameter(name='approved', type=bool, description='Filter by approval status'),
            OpenApiParameter(name='start_date', type=str, description='Filter expenses from date (YYYY-MM-DD)'),
            OpenApiParameter(name='end_date', type=str, description='Filter expenses to date (YYYY-MM-DD)'),
            OpenApiParameter(name='search', type=str, description='Search in title and description'),
            OpenApiParameter(name='page', type=int, description='Page number (default: 1)'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page (default: 10)'),
        ],
        responses={200: ExpenseSerializer(many=True)},
        tags=["Expenses"]
    )
    def get(self, request):
        expenses = Expense.objects.select_related(
            'category', 'department', 'vendor', 'term', 'recorded_by', 'approved_by'
        ).order_by('-incurred_on', '-created_at')

        # Filtering
        category = request.query_params.get('category')
        if category:
            expenses = expenses.filter(category_id=category)

        department = request.query_params.get('department')
        if department:
            expenses = expenses.filter(department_id=department)

        vendor = request.query_params.get('vendor')
        if vendor:
            expenses = expenses.filter(vendor_id=vendor)

        term = request.query_params.get('term')
        if term:
            expenses = expenses.filter(term_id=term)

        approved = request.query_params.get('approved')
        if approved is not None:
            expenses = expenses.filter(approved=approved.lower() == 'true')

        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                expenses = expenses.filter(incurred_on__gte=start_date)
            except ValueError:
                pass

        end_date = request.query_params.get('end_date')
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                expenses = expenses.filter(incurred_on__lte=end_date)
            except ValueError:
                pass

        search = request.query_params.get('search')
        if search:
            expenses = expenses.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        paginator = Paginator(expenses, page_size)
        page_obj = paginator.get_page(page)

        serializer = ExpenseSerializer(
            page_obj, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'count': paginator.count,
            'next': page_obj.has_next() and page_obj.next_page_number() or None,
            'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
            'results': serializer.data,
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
        })


class ExpenseDetailView(APIView):
    """Retrieve, update or delete an expense"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        return get_object_or_404(
            Expense.objects.select_related(
                'category', 'department', 'vendor', 'term', 'recorded_by', 'approved_by'
            ),
            pk=pk
        )

    @extend_schema(
        summary="Retrieve an expense",
        responses={200: ExpenseDetailSerializer},
        tags=["Expenses"]
    )
    def get(self, request, pk):
        expense = self.get_object(pk)
        serializer = ExpenseDetailSerializer(expense, context={'request': request})
        return Response(serializer.data)

    @extend_schema(
        summary="Update an expense",
        request=ExpenseCreateUpdateSerializer,
        responses={200: ExpenseDetailSerializer},
        tags=["Expenses"]
    )
    def put(self, request, pk):
        expense = self.get_object(pk)
        
        # Check if user can edit this expense
        # School owners can edit any expense
        # Other users can only edit their own unapproved expenses
        if (not hasattr(request.user, 'profile') or request.user.profile.user_type != 'school_owner') and (
            expense.approved or request.user != expense.recorded_by
        ):
            return Response(
                {"error": "Cannot edit this expense. Only school owners can edit approved expenses or expenses created by others."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ExpenseCreateUpdateSerializer(
            expense, 
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            expense = serializer.save()
            response_serializer = ExpenseDetailSerializer(
                expense, 
                context={'request': request}
            )
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Delete an expense",
        responses={204: None},
        tags=["Expenses"]
    )
    def delete(self, request, pk):
        expense = self.get_object(pk)
        
        # Check if user can delete this expense
        # School owners can delete any expense
        # Other users can only delete their own unapproved expenses
        if (not hasattr(request.user, 'profile') or request.user.profile.user_type != 'school_owner') and (
            expense.approved or request.user != expense.recorded_by
        ):
            return Response(
                {"error": "Cannot delete this expense. Only school owners can delete approved expenses or expenses created by others."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApproveExpenseView(APIView):
    """Approve or disapprove an expense"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Expense, pk=pk)

    @extend_schema(
        summary="Approve or disapprove an expense",
        request=ExpenseApprovalSerializer,
        responses={200: ExpenseDetailSerializer},
        tags=["Expenses"]
    )
    def patch(self, request, pk):
        expense = self.get_object(pk)
        
        # Only school owners can approve expenses
        if not hasattr(request.user, 'profile') or request.user.profile.user_type != 'school_owner':
            return Response(
                {"error": "Only school owners can approve expenses"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Non-school owners cannot approve their own expenses
        # School owners can approve their own expenses
        if (request.user.profile.user_type != 'school_owner' and 
            expense.recorded_by == request.user):
            return Response(
                {"error": "Cannot approve your own expenses"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ExpenseApprovalSerializer(
            expense, 
            data=request.data, 
            context={'request': request}
        )
        if serializer.is_valid():
            expense = serializer.save()
            response_serializer = ExpenseDetailSerializer(
                expense, 
                context={'request': request}
            )
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExpenseSummaryView(APIView):
    """Get expense summary and statistics"""
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get expense summary and statistics",
        parameters=[
            OpenApiParameter(name='year', type=int, description='Filter by year'),
            OpenApiParameter(name='month', type=int, description='Filter by month (1-12)'),
            OpenApiParameter(name='term', type=int, description='Filter by term ID'),
        ],
        responses={200: ExpenseSummarySerializer},
        tags=["Expenses"]
    )
    def get(self, request):
        expenses = Expense.objects.all()

        # Date filtering
        year = request.query_params.get('year')
        if year:
            expenses = expenses.filter(incurred_on__year=year)

        month = request.query_params.get('month')
        if month:
            expenses = expenses.filter(incurred_on__month=month)

        term = request.query_params.get('term')
        if term:
            expenses = expenses.filter(term_id=term)

        # Calculate summary statistics
        total_expenses = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        approved_expenses = expenses.filter(approved=True).aggregate(Sum('amount'))['amount__sum'] or 0
        pending_expenses = total_expenses - approved_expenses

        expense_count = expenses.count()
        approved_count = expenses.filter(approved=True).count()
        pending_count = expense_count - approved_count

        # Category breakdown
        categories_breakdown = {}
        category_stats = expenses.values('category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        for stat in category_stats:
            categories_breakdown[stat['category__name']] = {
                'total': stat['total'],
                'count': stat['count']
            }

        # Monthly breakdown for the current year
        current_year = timezone.now().year
        monthly_expenses = expenses.filter(incurred_on__year=current_year).annotate(
            month=TruncMonth('incurred_on')
        ).values('month').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('month')

        monthly_breakdown = {}
        for month_data in monthly_expenses:
            month_name = month_data['month'].strftime('%B %Y')
            monthly_breakdown[month_name] = {
                'total': month_data['total'],
                'count': month_data['count']
            }

        summary_data = {
            'total_expenses': total_expenses,
            'approved_expenses': approved_expenses,
            'pending_expenses': pending_expenses,
            'expense_count': expense_count,
            'approved_count': approved_count,
            'pending_count': pending_count,
            'categories_breakdown': categories_breakdown,
            'monthly_breakdown': monthly_breakdown,
        }

        serializer = ExpenseSummarySerializer(summary_data)
        return Response(serializer.data)