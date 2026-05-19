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

    # Exam Paper Scores
    path('exam-paper-scores/', views.ExamPaperScoreListCreateView.as_view(), name='exam-paper-scores-list-create'),
    path('exam-paper-scores/<int:pk>/', views.ExamPaperScoreDetailView.as_view(), name='exam-paper-scores-detail'),
    path('exams/<uuid:public_id>/bulk-paper-scores/', views.ExamBulkPaperScoreView.as_view(), name='exam-bulk-paper-scores'),
    path('exams/<uuid:public_id>/student-paper-scores/', views.ExamStudentsPaperScoreView.as_view(), name='exam-student-paper-scores'),

    # SA Assessments
    path('sa-assessments/', views.SaAssessmentListCreateView.as_view(), name='sa-assessments-list-create'),
    path('sa-assessments/<uuid:public_id>/', views.SaAssessmentDetailView.as_view(), name='sa-assessments-detail'),
    path('sa-assessments/<uuid:public_id>/bulk-scores/', views.SaAssessmentBulkScoreView.as_view(), name='sa-assessment-bulk-scores'),
    path('sa-assessments/<uuid:public_id>/student-scores/', views.SaAssessmentStudentsScoreView.as_view(), name='sa-assessment-student-scores'),

    # Dynamic Matrices
    path('projects/matrix/', views.ProjectMatrixView.as_view(), name='project-matrix'),
    path('projects/matrix/<str:public_id>/', views.ProjectMatrixView.as_view(), name='project-matrix-detail'),
    path('sa/matrix/', views.SaMatrixView.as_view(), name='sa-matrix'),
]
