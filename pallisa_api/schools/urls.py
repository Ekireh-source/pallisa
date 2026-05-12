from django.urls import path
from .views import (
    CampusListCreateView, CampusDetailView,
    SchoolListCreateView, SchoolDetailView,
    SetupStepsListCreateView, SetupStepsDetailView,
    DocumentListCreateView, DocumentDetailView,
    DashboardAnalyticsView
)

urlpatterns = [
    # Campus endpoints (using public_id which is a UUID)
    path('campuses/', CampusListCreateView.as_view(), name='campus-list'),
    path('campuses/<uuid:public_id>/', CampusDetailView.as_view(), name='campus-detail'),
    
    # School endpoints (using public_id which is a UUID)
    path('schools/', SchoolListCreateView.as_view(), name='school-list'),
    path('schools/<uuid:public_id>/', SchoolDetailView.as_view(), name='school-detail'),
    
    # SetupSteps endpoints
    path('setup-steps/', SetupStepsListCreateView.as_view(), name='setup-steps-list'),
    path('setup-steps/<int:pk>/', SetupStepsDetailView.as_view(), name='setup-steps-detail'),
    
    # Document endpoints
    path('documents/', DocumentListCreateView.as_view(), name='document-list'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),

    # Analytics
    path('analytics/dashboard/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
]
