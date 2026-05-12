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
