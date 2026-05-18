from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportCardViewSet, SubjectReportViewSet, GradingSystemViewSet,
    GradeBoundaryViewSet, ReportCardSettingsViewSet
)

router = DefaultRouter()
router.register(r'report-cards', ReportCardViewSet)
router.register(r'subject-details', SubjectReportViewSet)
router.register(r'grading-systems', GradingSystemViewSet)
router.register(r'grade-boundaries', GradeBoundaryViewSet)
router.register(r'report-settings', ReportCardSettingsViewSet, basename='report-settings')

urlpatterns = [
    path('', include(router.urls)),
]
