from django.urls import path
from . import views

urlpatterns = [
    # Topics
    path('topics/', views.TopicsListCreateView.as_view(), name='topics-list-create'),
    path('topics/<int:pk>/', views.TopicsDetailView.as_view(), name='topics-detail'),

    # Competency Areas
    path('competency-areas/', views.CompetencyAreaListCreateView.as_view(), name='competency-areas-list-create'),
    path('competency-areas/<int:pk>/', views.CompetencyAreaDetailView.as_view(), name='competency-areas-detail'),
    
    # Activity of Integration
    path('activities/', views.ActivityOfIntegrationListCreateView.as_view(), name='activities-list-create'),
    path('activities/<uuid:public_id>/', views.ActivityOfIntegrationDetailView.as_view(), name='activities-detail'),
    path('activities/<uuid:public_id>/bulk-scores/', views.ActivityBulkScoreView.as_view(), name='activity-bulk-scores'),
    path('activities/<uuid:public_id>/student-scores/', views.ActivityStudentsScoreView.as_view(), name='activity-student-scores'),
    
    # Integration Scores
    path('integration-scores/', views.IntegrationScoreListCreateView.as_view(), name='integration-scores-list-create'),
    path('integration-scores/<int:pk>/', views.IntegrationScoreDetailView.as_view(), name='integration-scores-detail'),
    
    # Exams
    path('exams/', views.ExamListCreateView.as_view(), name='exams-list-create'),
    path('exams/<uuid:public_id>/', views.ExamDetailView.as_view(), name='exams-detail'),
    
    # Exam Scores
    path('exam-scores/', views.ExamScoreListCreateView.as_view(), name='exam-scores-list-create'),
    path('exam-scores/<int:pk>/', views.ExamScoreDetailView.as_view(), name='exam-scores-detail'),
    path('exams/<uuid:public_id>/bulk-scores/', views.ExamBulkScoreView.as_view(), name='exam-bulk-scores'),
    path('exams/<uuid:public_id>/student-scores/', views.ExamStudentsScoreView.as_view(), name='exam-student-scores'),
]
