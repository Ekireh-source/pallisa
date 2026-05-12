import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.paginator import Paginator
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.shortcuts import get_object_or_404
from .models import Campus, School, SetupSteps, Document
from .serializers import (
    CampusSerializer, 
    SchoolSerializer, 
    SetupStepsSerializer, 
    DocumentSerializer
)
from django.utils import timezone
from members.models import Student, Teacher
from fees.models import FeePayment
from expenses.models import Expense
from django.db.models import Sum

logger = logging.getLogger(__name__)

class CampusListCreateView(APIView):
    """
    List all campuses or create a new campus.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @extend_schema(
        summary="List all campuses",
        description="Retrieve a list of all available campuses with pagination.",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: CampusSerializer(many=True)}
    )
    def get(self, request):
        try:
            queryset = Campus.objects.all()
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = CampusSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing campuses: {str(e)}")
            return Response({"error": "Failed to retrieve campuses"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create a new campus",
        description="Create a new campus instance with the provided details.",
        request=CampusSerializer,
        responses={201: CampusSerializer, 400: {"description": "Invalid data"}}
    )
    def post(self, request):
        serializer = CampusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            logger.info(f"Campus created: {serializer.data.get('name')}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating campus: {str(e)}")
            return Response({"error": "Failed to create campus"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CampusDetailView(APIView):
    """
    Retrieve, update or delete a campus instance by public_id.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_object(self, public_id):
        return get_object_or_404(Campus, public_id=public_id)

    @extend_schema(summary="Get campus details", responses={200: CampusSerializer})
    def get(self, request, public_id):
        campus = self.get_object(public_id)
        serializer = CampusSerializer(campus)
        return Response(serializer.data)

    @extend_schema(summary="Update campus details", request=CampusSerializer, responses={200: CampusSerializer})
    def put(self, request, public_id):
        campus = self.get_object(public_id)
        serializer = CampusSerializer(campus, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating campus {public_id}: {str(e)}")
            return Response({"error": "Failed to update campus"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete a campus", responses={204: None})
    def delete(self, request, public_id):
        try:
            campus = self.get_object(public_id)
            campus.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting campus {public_id}: {str(e)}")
            return Response({"error": "Failed to delete campus"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SchoolListCreateView(APIView):
    """
    List all schools for the current user or create a new school.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List user schools",
        description="Retrieve a list of schools owned by the authenticated user with pagination.",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: SchoolSerializer(many=True)}
    )
    def get(self, request):
        try:
            if request.user.is_staff:
                queryset = School.objects.all()
            else:
                queryset = School.objects.filter(owner=request.user)
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = SchoolSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing schools for user {request.user.id}: {str(e)}")
            return Response({"error": "Failed to retrieve schools"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create a new school",
        request=SchoolSerializer,
        responses={201: SchoolSerializer}
    )
    def post(self, request):
        serializer = SchoolSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save(owner=request.user)
            logger.info(f"School created: {serializer.data.get('name')} by user {request.user.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating school: {str(e)}")
            return Response({"error": "Failed to create school"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SchoolDetailView(APIView):
    """
    Retrieve, update or delete a school instance by public_id.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, public_id):
        if self.request.user.is_staff:
            return get_object_or_404(School, public_id=public_id)
        return get_object_or_404(School, public_id=public_id, owner=self.request.user)

    @extend_schema(summary="Get school details", responses={200: SchoolSerializer})
    def get(self, request, public_id):
        school = self.get_object(public_id)
        serializer = SchoolSerializer(school)
        return Response(serializer.data)

    @extend_schema(summary="Update school details", request=SchoolSerializer, responses={200: SchoolSerializer})
    def put(self, request, public_id):
        school = self.get_object(public_id)
        serializer = SchoolSerializer(school, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating school {public_id}: {str(e)}")
            return Response({"error": "Failed to update school"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete a school", responses={204: None})
    def delete(self, request, public_id):
        try:
            school = self.get_object(public_id)
            school.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting school {public_id}: {str(e)}")
            return Response({"error": "Failed to delete school"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SetupStepsListCreateView(APIView):
    """
    List all setup steps for the user's schools or create a new step.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List setup steps",
        description="Retrieve a list of setup steps with pagination.",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: SetupStepsSerializer(many=True)}
    )
    def get(self, request):
        try:
            if request.user.is_staff:
                queryset = SetupSteps.objects.all()
            else:
                queryset = SetupSteps.objects.filter(school__owner=request.user)
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = SetupStepsSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing setup steps: {str(e)}")
            return Response({"error": "Failed to retrieve setup steps"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create a new setup step",
        request=SetupStepsSerializer,
        responses={201: SetupStepsSerializer}
    )
    def post(self, request):
        serializer = SetupStepsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            school = serializer.validated_data['school']
            if not request.user.is_staff and school.owner != request.user:
                return Response({"error": "You do not own this school."}, status=status.HTTP_403_FORBIDDEN)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating setup step: {str(e)}")
            return Response({"error": "Failed to create setup step"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SetupStepsDetailView(APIView):
    """
    Retrieve, update or delete a setup step.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        if self.request.user.is_staff:
            return get_object_or_404(SetupSteps, pk=pk)
        return get_object_or_404(SetupSteps, pk=pk, school__owner=self.request.user)

    @extend_schema(summary="Get setup step details", responses={200: SetupStepsSerializer})
    def get(self, request, pk):
        step = self.get_object(pk)
        serializer = SetupStepsSerializer(step)
        return Response(serializer.data)

    @extend_schema(summary="Update setup step", request=SetupStepsSerializer, responses={200: SetupStepsSerializer})
    def put(self, request, pk):
        step = self.get_object(pk)
        serializer = SetupStepsSerializer(step, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating setup step {pk}: {str(e)}")
            return Response({"error": "Failed to update setup step"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete a setup step", responses={204: None})
    def delete(self, request, pk):
        try:
            step = self.get_object(pk)
            step.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting setup step {pk}: {str(e)}")
            return Response({"error": "Failed to delete setup step"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentListCreateView(APIView):
    """
    List user's documents or upload a new one.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        summary="List user documents",
        description="Retrieve a list of documents with pagination.",
        parameters=[
            OpenApiParameter(name='page', type=int, description='Page number'),
            OpenApiParameter(name='page_size', type=int, description='Number of items per page'),
        ],
        responses={200: DocumentSerializer(many=True)}
    )
    def get(self, request):
        try:
            if request.user.is_staff:
                queryset = Document.objects.all()
            else:
                queryset = Document.objects.filter(user=request.user)
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page)
            
            serializer = DocumentSerializer(page_obj.object_list, many=True)
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next() and page_obj.next_page_number() or None,
                'previous': page_obj.has_previous() and page_obj.previous_page_number() or None,
                'results': serializer.data,
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
            })
        except Exception as e:
            logger.error(f"Error listing documents: {str(e)}")
            return Response({"error": "Failed to retrieve documents"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Upload a new document",
        request=DocumentSerializer,
        responses={201: DocumentSerializer}
    )
    def post(self, request):
        serializer = DocumentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error uploading document: {str(e)}")
            return Response({"error": "Failed to upload document"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentDetailView(APIView):
    """
    Retrieve, update or delete a document.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk):
        if self.request.user.is_staff:
            return get_object_or_404(Document, pk=pk)
        return get_object_or_404(Document, pk=pk, user=self.request.user)

    @extend_schema(summary="Get document details", responses={200: DocumentSerializer})
    def get(self, request, pk):
        document = self.get_object(pk)
        serializer = DocumentSerializer(document)
        return Response(serializer.data)

    @extend_schema(summary="Update document details", request=DocumentSerializer, responses={200: DocumentSerializer})
    def put(self, request, pk):
        document = self.get_object(pk)
        serializer = DocumentSerializer(document, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating document {pk}: {str(e)}")
            return Response({"error": "Failed to update document"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(summary="Delete a document", responses={204: None})
    def delete(self, request, pk):
        try:
            document = self.get_object(pk)
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting document {pk}: {str(e)}")
            return Response({"error": "Failed to delete document"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DashboardAnalyticsView(APIView):
    """
    Returns analytics for the dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary="Get dashboard analytics")
    def get(self, request):
        try:
            school_id = request.query_params.get('school_id')
            now = timezone.now()
            current_month = now.month
            current_year = now.year

            students_qs = Student.objects.filter(is_active=True)
            teachers_qs = Teacher.objects.filter(is_active=True)
            payments_qs = FeePayment.objects.filter(payment_status='completed')
            expenses_qs = Expense.objects.all()

            if school_id:
                students_qs = students_qs.filter(campus__schools__id=school_id)
                teachers_qs = teachers_qs.filter(campus__schools__id=school_id)
                payments_qs = payments_qs.filter(student__campus__schools__id=school_id)

            total_students = students_qs.count()
            total_teachers = teachers_qs.count()

            monthly_payments = payments_qs.filter(payment_date__year=current_year, payment_date__month=current_month)
            monthly_revenue = monthly_payments.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0

            monthly_expenses_qs = expenses_qs.filter(incurred_on__year=current_year, incurred_on__month=current_month)
            monthly_expenses = monthly_expenses_qs.aggregate(Sum('amount'))['amount__sum'] or 0

            recent_txs = payments_qs.select_related('student__user_profile', 'category').order_by('-payment_date', '-created_at')[:5]
            transactions = []
            for tx in recent_txs:
                transactions.append({
                    'id': str(tx.id),
                    'student': tx.student.user_profile.get_full_name() if getattr(tx.student, 'user_profile', None) else tx.student.student_id,
                    'amount': f"UGX {tx.amount_paid:,.0f}",
                    'category': tx.category.name if tx.category else "Fee",
                    'date': tx.payment_date.strftime("%b %d, %Y"),
                    'status': tx.payment_status,
                })

            return Response({
                'total_students': f"{total_students:,}",
                'total_teachers': f"{total_teachers:,}",
                'monthly_revenue': f"UGX {monthly_revenue:,.0f}",
                'monthly_expenses': f"UGX {monthly_expenses:,.0f}",
                'recent_transactions': transactions
            })
        except Exception as e:
            logger.error(f"Error fetching dashboard analytics: {str(e)}")
            return Response({"error": "Failed to fetch dashboard analytics"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
