from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from decimal import Decimal
from datetime import date, timedelta
from accounts.models import UserProfile

from .models import ExpenseCategory, Term, Department, Vendor, Expense

User = get_user_model()


class ExpenseModelsTestCase(TestCase):
    """Test cases for expense models"""

    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # Create user profile
        self.profile = UserProfile.objects.create(
            user=self.user,
            first_name='Test',
            last_name='User',
            user_type='staff'
        )

        # Create test data
        self.category = ExpenseCategory.objects.create(
            name='Office Supplies',
            description='General office supplies and materials'
        )
        
        self.department = Department.objects.create(
            name='Administration',
            description='Administrative department'
        )
        
        self.vendor = Vendor.objects.create(
            name='Office Mart',
            contact='John Doe',
            email='contact@officemart.com',
            phone='+1234567890'
        )
        
        self.term = Term.objects.create(
            name='Term 1',
            academic_year='2024/2025',
            start_date=date(2024, 1, 1),
            end_date=date(2024, 4, 30)
        )

    def test_expense_category_creation(self):
        """Test ExpenseCategory model creation"""
        self.assertEqual(self.category.name, 'Office Supplies')
        self.assertTrue(self.category.is_active)
        self.assertEqual(str(self.category), 'Office Supplies')

    def test_department_creation(self):
        """Test Department model creation"""
        self.assertEqual(self.department.name, 'Administration')
        self.assertTrue(self.department.is_active)
        self.assertEqual(str(self.department), 'Administration')

    def test_vendor_creation(self):
        """Test Vendor model creation"""
        self.assertEqual(self.vendor.name, 'Office Mart')
        self.assertEqual(self.vendor.email, 'contact@officemart.com')
        self.assertTrue(self.vendor.is_active)
        self.assertEqual(str(self.vendor), 'Office Mart')

    def test_term_creation(self):
        """Test Term model creation"""
        self.assertEqual(self.term.name, 'Term 1')
        self.assertEqual(self.term.academic_year, '2024/2025')
        self.assertEqual(str(self.term), 'Term 1 (2024/2025)')

    def test_expense_creation(self):
        """Test Expense model creation"""
        expense = Expense.objects.create(
            title='Office Chairs',
            description='10 ergonomic office chairs',
            amount=Decimal('1500.00'),
            category=self.category,
            department=self.department,
            vendor=self.vendor,
            term=self.term,
            incurred_on=date.today(),
            recorded_by=self.user
        )
        
        self.assertEqual(expense.title, 'Office Chairs')
        self.assertEqual(expense.amount, Decimal('1500.00'))
        self.assertFalse(expense.approved)
        self.assertEqual(expense.status, 'Pending Approval')
        self.assertEqual(str(expense), 'Office Chairs - 1500.00')

    def test_expense_approval(self):
        """Test expense approval functionality"""
        expense = Expense.objects.create(
            title='Test Expense',
            amount=Decimal('100.00'),
            category=self.category,
            incurred_on=date.today(),
            recorded_by=self.user
        )
        
        # Create another user for approval
        approver = User.objects.create_user(
            email='approver@example.com',
            password='testpass123'
        )
        
        # Approve the expense
        expense.approved = True
        expense.approved_by = approver
        expense.save()
        
        self.assertTrue(expense.approved)
        self.assertEqual(expense.approved_by, approver)
        self.assertIsNotNone(expense.approved_at)
        self.assertEqual(expense.status, 'Approved')


class ExpenseAPITestCase(APITestCase):
    """Test cases for expense API endpoints"""

    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.user.email_verified = True
        self.user.save()
        
        # Create user profile
        self.profile = UserProfile.objects.create(
            user=self.user,
            first_name='Test',
            last_name='User',
            user_type='staff'
        )

        # Create test data
        self.category = ExpenseCategory.objects.create(
            name='Office Supplies',
            description='General office supplies'
        )
        
        self.department = Department.objects.create(
            name='Administration'
        )

        # Get JWT token for authentication
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        
        # Set authentication header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_expense_category_list(self):
        """Test listing expense categories"""
        url = reverse('expense-category-list-create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Office Supplies')

    def test_expense_category_create(self):
        """Test creating expense category"""
        url = reverse('expense-category-list-create')
        data = {
            'name': 'Transportation',
            'description': 'Travel and transportation expenses'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Transportation')
        self.assertTrue(ExpenseCategory.objects.filter(name='Transportation').exists())

    def test_department_list(self):
        """Test listing departments"""
        url = reverse('department-list-create')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Administration')

    def test_expense_create(self):
        """Test creating an expense"""
        url = reverse('expense-create')
        data = {
            'title': 'Test Expense',
            'description': 'A test expense',
            'amount': '250.00',
            'category': self.category.id,
            'department': self.department.id,
            'incurred_on': date.today().isoformat(),
            'payment_method': 'cash'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Expense')
        self.assertEqual(response.data['recorded_by']['id'], self.user.id)
        self.assertFalse(response.data['approved'])

    def test_expense_list(self):
        """Test listing expenses"""
        # Create test expense
        expense = Expense.objects.create(
            title='Test Expense',
            amount=Decimal('100.00'),
            category=self.category,
            department=self.department,
            incurred_on=date.today(),
            recorded_by=self.user
        )
        
        url = reverse('expense-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Expense')

    def test_expense_filter_by_category(self):
        """Test filtering expenses by category"""
        # Create another category and expense
        other_category = ExpenseCategory.objects.create(name='Other Category')
        
        Expense.objects.create(
            title='Expense 1',
            amount=Decimal('100.00'),
            category=self.category,
            incurred_on=date.today(),
            recorded_by=self.user
        )
        
        Expense.objects.create(
            title='Expense 2',
            amount=Decimal('200.00'),
            category=other_category,
            incurred_on=date.today(),
            recorded_by=self.user
        )
        
        url = reverse('expense-list')
        response = self.client.get(url, {'category': self.category.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['category'], self.category.id)

    def test_expense_summary(self):
        """Test expense summary endpoint"""
        # Create test expenses
        Expense.objects.create(
            title='Approved Expense',
            amount=Decimal('500.00'),
            category=self.category,
            incurred_on=date.today(),
            recorded_by=self.user,
            approved=True
        )
        
        Expense.objects.create(
            title='Pending Expense',
            amount=Decimal('300.00'),
            category=self.category,
            incurred_on=date.today(),
            recorded_by=self.user,
            approved=False
        )
        
        url = reverse('expense-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['total_expenses']), 800.00)
        self.assertEqual(float(response.data['approved_expenses']), 500.00)
        self.assertEqual(float(response.data['pending_expenses']), 300.00)
        self.assertEqual(response.data['expense_count'], 2)
        self.assertEqual(response.data['approved_count'], 1)
        self.assertEqual(response.data['pending_count'], 1)

    def test_unauthorized_access(self):
        """Test that unauthenticated requests are rejected"""
        # Remove authentication
        self.client.credentials()
        
        url = reverse('expense-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expense_approval_permissions(self):
        """Test expense approval permissions"""
        # Create expense
        expense = Expense.objects.create(
            title='Test Expense',
            amount=Decimal('100.00'),
            category=self.category,
            incurred_on=date.today(),
            recorded_by=self.user
        )
        
        # Try to approve own expense (should fail)
        url = reverse('expense-approve', kwargs={'pk': expense.id})
        data = {'approved': True}
        
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Cannot approve your own expenses', response.data['error'])


class ExpenseModelConstraintsTestCase(TestCase):
    """Test model constraints and validations"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

    def test_term_unique_constraint(self):
        """Test that term name + academic year must be unique"""
        Term.objects.create(
            name='Term 1',
            academic_year='2024/2025',
            start_date=date(2024, 1, 1),
            end_date=date(2024, 4, 30)
        )
        
        # Try to create duplicate
        with self.assertRaises(Exception):
            Term.objects.create(
                name='Term 1',
                academic_year='2024/2025',
                start_date=date(2024, 5, 1),
                end_date=date(2024, 8, 31)
            )

    def test_expense_category_unique_name(self):
        """Test that expense category names must be unique"""
        ExpenseCategory.objects.create(name='Office Supplies')
        
        # Try to create duplicate
        with self.assertRaises(Exception):
            ExpenseCategory.objects.create(name='Office Supplies')
