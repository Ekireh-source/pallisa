from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportCardViewSet, SubjectReportViewSet, GradingSystemViewSet, GradeBoundaryViewSet

router = DefaultRouter()
router.register(r'report-cards', ReportCardViewSet)
router.register(r'subject-details', SubjectReportViewSet)
router.register(r'grading-systems', GradingSystemViewSet)
router.register(r'grade-boundaries', GradeBoundaryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
