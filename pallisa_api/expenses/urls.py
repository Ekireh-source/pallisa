from django.urls import path
from .views import (
    # Expense Category Views
    ExpenseCategoryListCreateView,
    ExpenseCategoryDetailView,
    
    # Academic Year Views
    AcademicYearListCreateView,
    AcademicYearDetailView,
    
    # Term Views
    TermListCreateView,
    TermDetailView,
    
    # Department Views
    DepartmentListCreateView,
    DepartmentDetailView,
    
    # Vendor Views
    VendorListCreateView,
    VendorDetailView,
    
    # Expense Views
    CreateExpenseView,
    ListExpensesView,
    ExpenseDetailView,
    ApproveExpenseView,
    ExpenseSummaryView,
)

urlpatterns = [
    # Expense Category endpoints
    path('categories/', ExpenseCategoryListCreateView.as_view(), name='expense-category-list-create'),
    path('categories/<int:pk>/', ExpenseCategoryDetailView.as_view(), name='expense-category-detail'),
    
    # Academic Year endpoints
    path('academic-years/', AcademicYearListCreateView.as_view(), name='academic-year-list-create'),
    path('academic-years/<int:pk>/', AcademicYearDetailView.as_view(), name='academic-year-detail'),
    
    # Term endpoints
    path('terms/', TermListCreateView.as_view(), name='term-list-create'),
    path('terms/<int:pk>/', TermDetailView.as_view(), name='term-detail'),
    
    # Department endpoints
    path('departments/', DepartmentListCreateView.as_view(), name='department-list-create'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    
    # Vendor endpoints
    path('vendors/', VendorListCreateView.as_view(), name='vendor-list-create'),
    path('vendors/<int:pk>/', VendorDetailView.as_view(), name='vendor-detail'),
    
    # Expense endpoints
    path('', ListExpensesView.as_view(), name='expense-list'),
    path('create/', CreateExpenseView.as_view(), name='expense-create'),
    path('<int:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
    path('<int:pk>/approve/', ApproveExpenseView.as_view(), name='expense-approve'),
    path('summary/', ExpenseSummaryView.as_view(), name='expense-summary'),
] 