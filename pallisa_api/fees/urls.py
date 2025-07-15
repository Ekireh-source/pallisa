from django.urls import path
from .views import (
    FeeCategoryListCreateView,
    FeeCategoryDetailView,
    FeeStructureListCreateView,
    FeeStructureDetailView,
    ScholarshipListCreateView,
    ScholarshipDetailView,
    StudentFeeOverrideListCreateView,
    StudentFeeOverrideDetailView,
    FeePaymentListCreateView,
    FeePaymentDetailView,
    FeePaymentStatsView,
    FeeSummaryView,
    StudentFeeSummaryView,
    StudentFeeSummaryListView,
    StudentFeeBalanceListView,
    TermFeeCollectionSummaryListView,
    TermFeeCollectionSummaryDetailView,
    TermFeeCollectionSummaryUpdateView,
    TermFeeCollectionSummaryCreateView,
    SchoolFeeCollectionOverviewView,
)

app_name = 'fees'

urlpatterns = [
    # Fee Categories
    path('categories/', FeeCategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', FeeCategoryDetailView.as_view(), name='category-detail'),
    
    # Fee Structures
    path('structures/', FeeStructureListCreateView.as_view(), name='structure-list-create'),
    path('structures/<int:pk>/', FeeStructureDetailView.as_view(), name='structure-detail'),
    
    # Scholarships
    path('scholarships/', ScholarshipListCreateView.as_view(), name='scholarship-list-create'),
    path('scholarships/<int:pk>/', ScholarshipDetailView.as_view(), name='scholarship-detail'),
    
    # Student Fee Overrides
    path('overrides/', StudentFeeOverrideListCreateView.as_view(), name='override-list-create'),
    path('overrides/<int:pk>/', StudentFeeOverrideDetailView.as_view(), name='override-detail'),
    
    # Fee Payments
    path('payments/', FeePaymentListCreateView.as_view(), name='payment-list-create'),
    path('payments/<int:pk>/', FeePaymentDetailView.as_view(), name='payment-detail'),
    path('payments/stats/', FeePaymentStatsView.as_view(), name='payment-stats'),
    
    # Fee Summary and Statistics
    path('summary/', FeeSummaryView.as_view(), name='fee-summary'),
    path('student-summary/', StudentFeeSummaryView.as_view(), name='student-fee-summary'),
    path('student-summaries/', StudentFeeSummaryListView.as_view(), name='student-fee-summaries'),
    # Student Fee Balances
    path('balances/', StudentFeeBalanceListView.as_view(), name='student-balance-list'),
    
    # Term Fee Collection Summaries
    path('collection-summaries/', TermFeeCollectionSummaryListView.as_view(), name='collection-summary-list'),
    path('collection-summaries/create/', TermFeeCollectionSummaryCreateView.as_view(), name='collection-summary-create'),
    path('collection-summaries/<int:pk>/', TermFeeCollectionSummaryDetailView.as_view(), name='collection-summary-detail'),
    path('collection-summaries/<int:pk>/update/', TermFeeCollectionSummaryUpdateView.as_view(), name='collection-summary-update'),
    
    # School Fee Collection Overview
    path('collection-overview/', SchoolFeeCollectionOverviewView.as_view(), name='school-collection-overview'),
] 