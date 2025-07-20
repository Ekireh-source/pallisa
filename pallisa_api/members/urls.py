from django.urls import path
from . import views

app_name = 'members'

urlpatterns = [
    # Classes URLs
    path('classes/', views.ClassListCreateView.as_view(), name='class-list'),
    path('classes/<int:pk>/', views.ClassDetailView.as_view(), name='class-detail'),
    path('classes/<int:pk>/streams/', views.ClassStreamsView.as_view(), name='class-streams'),
    
    # Subjects URLs
    path('subjects/', views.SubjectListCreateView.as_view(), name='subject-list'),
    path('subjects/<int:pk>/', views.SubjectDetailView.as_view(), name='subject-detail'),
    
    # Streams URLs
    path('streams/', views.StreamListCreateView.as_view(), name='stream-list'),
    path('streams/<int:pk>/', views.StreamDetailView.as_view(), name='stream-detail'),
    path('streams/<int:pk>/students/', views.StreamStudentsView.as_view(), name='stream-students'),
    path('streams/<int:pk>/assign-teacher/', views.StreamAssignTeacherView.as_view(), name='stream-assign-teacher'),
    
    # Students URLs
    path('students/', views.StudentListCreateView.as_view(), name='student-list'),
    path('students/<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),
    path('students/<int:pk>/parents/', views.StudentParentsView.as_view(), name='student-parents'),
    path('students/<int:pk>/history/', views.StudentHistoryView.as_view(), name='student-history'),
    path('students/<int:pk>/assign-stream/', views.StudentAssignStreamView.as_view(), name='student-assign-stream'),
    path('students/statistics/', views.StudentStatisticsView.as_view(), name='student-statistics'),
    
    # Teachers URLs
    path('teachers/', views.TeacherListCreateView.as_view(), name='teacher-list'),
    path('teachers/<int:pk>/', views.TeacherDetailView.as_view(), name='teacher-detail'),
    path('teachers/<int:pk>/assignments/', views.TeacherAssignmentsView.as_view(), name='teacher-assignments'),
    path('teachers/<int:pk>/streams/', views.TeacherStreamsView.as_view(), name='teacher-streams'),
    
    # Parents URLs
    path('parents/', views.ParentListCreateView.as_view(), name='parent-list'),
    path('parents/<int:pk>/', views.ParentDetailView.as_view(), name='parent-detail'),
    path('parents/<int:pk>/children/', views.ParentChildrenView.as_view(), name='parent-children'),
    
    # Parent-Student Relationships URLs
    path('parent-student-relationships/', views.ParentStudentRelationshipListCreateView.as_view(), name='parent-student-relationship-list'),
    path('parent-student-relationships/<int:pk>/', views.ParentStudentRelationshipDetailView.as_view(), name='parent-student-relationship-detail'),
    
    # Teacher Subject Assignments URLs
    path('teacher-subject-assignments/', views.TeacherSubjectAssignmentListCreateView.as_view(), name='teacher-subject-assignment-list'),
    path('teacher-subject-assignments/bulk-assign/', views.BulkAssignTeacherSubjectsView.as_view(), name='bulk-assign-teacher-subjects'),
    
    # Non-Staff Members URLs
    path('non-staff-members/', views.NonStaffMemberListCreateView.as_view(), name='non-staff-member-list'),
    path('non-staff-members/<int:pk>/', views.NonStaffMemberDetailView.as_view(), name='non-staff-member-detail'),
    
    # ==================== SALARY MANAGEMENT URLS ====================
    
    # Salary Periods URLs
    path('salary-periods/', views.SalaryPeriodListCreateView.as_view(), name='salary-period-list'),
    path('salary-periods/<int:pk>/', views.SalaryPeriodDetailView.as_view(), name='salary-period-detail'),
    
    # Salary Allowances URLs
    path('salary-allowances/', views.SalaryAllowanceListCreateView.as_view(), name='salary-allowance-list'),
    path('salary-allowances/<int:pk>/', views.SalaryAllowanceDetailView.as_view(), name='salary-allowance-detail'),
    
    # Salary Deductions URLs
    path('salary-deductions/', views.SalaryDeductionListCreateView.as_view(), name='salary-deduction-list'),
    path('salary-deductions/<int:pk>/', views.SalaryDeductionDetailView.as_view(), name='salary-deduction-detail'),
    
    # Salary Payments URLs
    path('salary-payments/', views.SalaryPaymentListCreateView.as_view(), name='salary-payment-list'),
    path('salary-payments/<int:pk>/', views.SalaryPaymentDetailView.as_view(), name='salary-payment-detail'),
    
    # Salary Summaries URLs
    path('salary-summaries/', views.SalarySummaryListView.as_view(), name='salary-summary-list'),
    path('salary-summary/', views.SalarySummaryView.as_view(), name='salary-summary'),
    
    # Staff Salary List URL
    path('staff-salaries/', views.StaffSalaryListView.as_view(), name='staff-salary-list'),
] 