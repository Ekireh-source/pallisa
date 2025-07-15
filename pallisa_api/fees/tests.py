from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from accounts.models import UserProfile
from .models import FeeCategory, FeePayment, Scholarship, FeeStructure, StudentFeeOverride
from expenses.models import AcademicYear, Term
from members.models import Class, Stream, Student
from decimal import Decimal
from datetime import date

User = get_user_model()

class FeesAPITestCase(APITestCase):
    def setUp(self):
        # Create user and profile with permission
        self.user = User.objects.create_user(email='owner@example.com', password='testpass123')
        self.profile = UserProfile.objects.create(user=self.user, user_type='school_owner', first_name='Test', last_name='Owner')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create supporting models
        self.class_obj = Class.objects.create(name='S1')
        self.stream = Stream.objects.create(name='S1A', class_obj=self.class_obj)
        self.academic_year = AcademicYear.objects.create(
            name='2024/2025',
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31)
        )
        self.term = Term.objects.create(
            name='Term 1',
            academic_year=self.academic_year,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 4, 30)
        )
        self.student = Student.objects.create(user_profile=self.profile, student_id='STU001', current_stream=self.stream)
        
        # Create base fee category for other tests
        self.category = FeeCategory.objects.create(name='Tuition', description='Tuition fees')

    def test_fee_category_crud(self):
        """Test CRUD operations for FeeCategory"""
        # Create
        url = reverse('fees:category-list-create')
        data = {'name': 'Library', 'description': 'Library fees'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        category_id = response.data['id']

        # List
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(cat['name'] == 'Library' for cat in response.data['results']))

        # Retrieve
        detail_url = reverse('fees:category-detail', args=[category_id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Library')

        # Update
        response = self.client.put(detail_url, {'name': 'Library Updated', 'description': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Library Updated')

        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_fee_structure_crud(self):
        """Test CRUD operations for FeeStructure"""
        # Create
        url = reverse('fees:structure-list-create')
        data = {
            'category': self.category.id,
            'class_obj': self.class_obj.id,
            'academic_year': self.academic_year.id,
            'term': self.term.id,
            'amount': '50000.00',
            'is_active': True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        structure_id = response.data['id']

        # List
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(s['amount'] == '50000.00' for s in response.data['results']))

        # Retrieve
        detail_url = reverse('fees:structure-detail', args=[structure_id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount'], '50000.00')

        # Update
        response = self.client.put(detail_url, {**data, 'amount': '60000.00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount'], '60000.00')

        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_scholarship_crud(self):
        """Test CRUD operations for Scholarship"""
        # Create
        url = reverse('fees:scholarship-list-create')
        data = {
            'name': 'Academic Excellence',
            'description': 'Scholarship for top performers',
            'discount_type': 'percentage',
            'discount_value': '25.00',
            'max_discount_amount': '10000.00',
            'is_active': True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        scholarship_id = response.data['id']

        # List
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(s['name'] == 'Academic Excellence' for s in response.data['results']))

        # Retrieve
        detail_url = reverse('fees:scholarship-detail', args=[scholarship_id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Academic Excellence')

        # Update
        response = self.client.put(detail_url, {**data, 'discount_value': '30.00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['discount_value'], '30.00')

        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_student_fee_override_crud(self):
        """Test CRUD operations for StudentFeeOverride"""
        # Create
        url = reverse('fees:override-list-create')
        data = {
            'student': self.student.id,
            'category': self.category.id,
            'academic_year': self.academic_year.id,
            'term': self.term.id,
            'custom_amount': '40000.00',
            'reason': 'Special circumstances',
            'is_active': True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        override_id = response.data['id']

        # List
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(o['custom_amount'] == '40000.00' for o in response.data['results']))

        # Retrieve
        detail_url = reverse('fees:override-detail', args=[override_id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['custom_amount'], '40000.00')

        # Update
        response = self.client.put(detail_url, {**data, 'custom_amount': '35000.00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['custom_amount'], '35000.00')

        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_fee_payment_crud(self):
        """Test CRUD operations for FeePayment"""
        # Create
        url = reverse('fees:payment-list-create')
        data = {
            'student': self.student.id,
            'category': self.category.id,
            'academic_year': self.academic_year.id,
            'term': self.term.id,
            'amount_paid': '1000.00',
            'payment_method': 'cash',
            'payment_status': 'completed',
            'payment_date': date.today(),
            'due_date': date.today(),
            'discount_amount': '0.00',
            'notes': 'Paid in full'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        payment_id = response.data['id']

        # List
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(p['amount_paid'] == '1000.00' for p in response.data['results']))

        # Retrieve
        detail_url = reverse('fees:payment-detail', args=[payment_id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount_paid'], '1000.00')

        # Update
        response = self.client.put(detail_url, {**data, 'amount_paid': '1200.00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['amount_paid'], '1200.00')

        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_fee_summary_endpoint(self):
        """Test the fee summary endpoint"""
        # Create some test payments
        FeePayment.objects.create(
            student=self.student,
            category=self.category,
            academic_year=self.academic_year,
            term=self.term,
            amount_paid=Decimal('1000.00'),
            payment_method='cash',
            payment_status='completed',
            payment_date=date.today(),
            due_date=date.today(),
            discount_amount=Decimal('0.00'),
            recorded_by=self.profile
        )

        url = reverse('fees:fee-summary')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_paid', response.data)
        self.assertIn('total_expected', response.data)
        self.assertIn('by_category', response.data)
        self.assertIn('by_status', response.data)
        self.assertIn('by_month', response.data)

    def test_student_fee_summary_endpoint(self):
        """Test the student fee summary endpoint"""
        # Create a test payment
        FeePayment.objects.create(
            student=self.student,
            category=self.category,
            academic_year=self.academic_year,
            term=self.term,
            amount_paid=Decimal('1000.00'),
            payment_method='cash',
            payment_status='completed',
            payment_date=date.today(),
            due_date=date.today(),
            discount_amount=Decimal('0.00'),
            recorded_by=self.profile
        )

        url = reverse('fees:student-fee-summary')
        response = self.client.get(url, {'student': self.student.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('student_id', response.data)
        self.assertIn('student_name', response.data)
        self.assertIn('total_paid', response.data)
        self.assertIn('payment_status', response.data)

    def test_student_fee_summaries_endpoint(self):
        """Test the student fee summaries list endpoint"""
        # Create a test payment
        FeePayment.objects.create(
            student=self.student,
            category=self.category,
            academic_year=self.academic_year,
            term=self.term,
            amount_paid=Decimal('1000.00'),
            payment_method='cash',
            payment_status='completed',
            payment_date=date.today(),
            due_date=date.today(),
            discount_amount=Decimal('0.00'),
            recorded_by=self.profile
        )

        url = reverse('fees:student-fee-summaries')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertIn('student_id', response.data[0])
        self.assertIn('student_name', response.data[0])
        self.assertIn('total_paid', response.data[0])

    def test_filtering_and_pagination(self):
        """Test filtering and pagination for list endpoints"""
        # Create multiple categories
        FeeCategory.objects.create(name='Library', description='Library fees')
        FeeCategory.objects.create(name='Sports', description='Sports fees')
        FeeCategory.objects.create(name='Laboratory', description='Lab fees')

        url = reverse('fees:category-list-create')
        
        # Test search
        response = self.client.get(url, {'search': 'Library'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(cat['name'] == 'Library' for cat in response.data['results']))

        # Test pagination
        response = self.client.get(url, {'page': 1, 'page_size': 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data['results']), 2)

    def test_permissions_required(self):
        """Test that unauthenticated requests are rejected"""
        # Unauthenticated client
        unauth_client = APIClient()
        url = reverse('fees:category-list-create')
        response = unauth_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_scholarship_calculation(self):
        """Test scholarship discount calculation"""
        # Create a scholarship
        scholarship = Scholarship.objects.create(
            name='Test Scholarship',
            discount_type='percentage',
            discount_value=Decimal('20.00'),
            max_discount_amount=Decimal('5000.00')
        )

        # Test percentage calculation
        base_amount = Decimal('10000.00')
        discount = scholarship.calculate_discount(base_amount)
        expected_discount = Decimal('2000.00')  # 20% of 10000
        self.assertEqual(discount, expected_discount)

        # Test max discount limit
        base_amount = Decimal('50000.00')
        discount = scholarship.calculate_discount(base_amount)
        self.assertEqual(discount, Decimal('5000.00'))  # Should be capped at max_discount_amount

    def test_fee_payment_with_scholarship(self):
        """Test fee payment creation with scholarship"""
        scholarship = Scholarship.objects.create(
            name='Test Scholarship',
            discount_type='percentage',
            discount_value=Decimal('10.00')
        )

        url = reverse('fees:payment-list-create')
        data = {
            'student': self.student.id,
            'category': self.category.id,
            'academic_year': self.academic_year.id,
            'term': self.term.id,
            'amount_paid': '900.00',
            'payment_method': 'cash',
            'payment_status': 'completed',
            'payment_date': date.today(),
            'due_date': date.today(),
            'scholarship': scholarship.id,
            'discount_amount': '100.00',
            'notes': 'Payment with scholarship'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['scholarship']['id'], scholarship.id)
        self.assertEqual(response.data['discount_amount'], '100.00')

    def test_fee_structure_filtering(self):
        """Test fee structure filtering by various parameters"""
        # Create fee structure
        FeeStructure.objects.create(
            category=self.category,
            class_obj=self.class_obj,
            academic_year=self.academic_year,
            term=self.term,
            amount=Decimal('50000.00'),
            is_active=True
        )

        url = reverse('fees:structure-list-create')
        
        # Test filtering by category
        response = self.client.get(url, {'category': self.category.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)

        # Test filtering by class
        response = self.client.get(url, {'class_obj': self.class_obj.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)

        # Test filtering by academic year
        response = self.client.get(url, {'academic_year': self.academic_year.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data['results']) > 0)

    def test_student_fee_override_unique_constraint(self):
        """Test that student fee overrides are unique per student-category-academic_year-term"""
        # Create first override
        StudentFeeOverride.objects.create(
            student=self.student,
            category=self.category,
            academic_year=self.academic_year,
            term=self.term,
            custom_amount=Decimal('40000.00'),
            reason='First override'
        )

        # Try to create duplicate override
        url = reverse('fees:override-list-create')
        data = {
            'student': self.student.id,
            'category': self.category.id,
            'academic_year': self.academic_year.id,
            'term': self.term.id,
            'custom_amount': '45000.00',
            'reason': 'Second override'
        }
        response = self.client.post(url, data)
        # Should fail due to unique constraint
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_fee_payment_receipt_number_generation(self):
        """Test that receipt numbers are auto-generated"""
        url = reverse('fees:payment-list-create')
        data = {
            'student': self.student.id,
            'category': self.category.id,
            'academic_year': self.academic_year.id,
            'term': self.term.id,
            'amount_paid': '1000.00',
            'payment_method': 'cash',
            'payment_status': 'completed',
            'payment_date': date.today(),
            'due_date': date.today(),
            'discount_amount': '0.00',
            'notes': 'Test payment'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['receipt_number'].startswith('RCPT-'))
        # Check that receipt number has the expected format (RCPT- + 8 hex chars = 13 total)
        self.assertEqual(len(response.data['receipt_number']), 13)  # RCPT- + 8 hex chars
