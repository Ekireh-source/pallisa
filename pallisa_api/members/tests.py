from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.db import transaction
from unittest.mock import patch
import json

from accounts.models import UserProfile, Role, School, Campus
from expenses.models import AcademicYear
from .models import (
    Class, Stream, Student, Teacher, Parent, ParentStudentRelationship,
    StudentStreamHistory, Subject, TeacherSubjectAssignment
)

User = get_user_model()


class MembersAPITestCase(APITestCase):
    """Base test case for Members API with common setup"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test school and campus
        self.school = School.objects.create(
            name="Test School",
            address="123 Test St",
            phone="+1234567890",
            email="test@school.com"
        )
        
        self.campus = Campus.objects.create(
            school=self.school,
            name="Main Campus",
            address="123 Main St"
        )
        
        # Create test academic year
        self.academic_year = AcademicYear.objects.create(
            name="2024-2025",
            start_date="2024-09-01",
            end_date="2025-06-30",
            is_active=True
        )
        
        # Create roles
        self.admin_role = Role.objects.create(
            school=self.school,
            name="Administrator"
        )
        
        self.teacher_role = Role.objects.create(
            school=self.school,
            name="Teacher"
        )
        
        self.student_role = Role.objects.create(
            school=self.school,
            name="Student"
        )
        
        self.parent_role = Role.objects.create(
            school=self.school,
            name="Parent"
        )
        
        # Create test users
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123'
        )
        
        self.teacher_user = User.objects.create_user(
            email='teacher@test.com',
            password='testpass123'
        )
        
        self.student_user = User.objects.create_user(
            email='student@test.com',
            password='testpass123'
        )
        
        self.parent_user = User.objects.create_user(
            email='parent@test.com',
            password='testpass123'
        )
        
        # Create user profiles
        self.admin_profile = UserProfile.objects.create(
            user=self.admin_user,
            role=self.admin_role,
            first_name="Admin",
            last_name="User",
            phone="+1234567890"
        )
        
        self.teacher_profile = UserProfile.objects.create(
            user=self.teacher_user,
            role=self.teacher_role,
            first_name="Teacher",
            last_name="User",
            phone="+1234567891"
        )
        
        self.student_profile = UserProfile.objects.create(
            user=self.student_user,
            role=self.student_role,
            first_name="Student",
            last_name="User",
            phone="+1234567892"
        )
        
        self.parent_profile = UserProfile.objects.create(
            user=self.parent_user,
            role=self.parent_role,
            first_name="Parent",
            last_name="User",
            phone="+1234567893"
        )
        
        # Create test class and subject
        self.test_class = Class.objects.create(
            school=self.school,
            name="Grade 10",
            level=10,
            description="Grade 10 students"
        )
        
        self.test_subject = Subject.objects.create(
            school=self.school,
            name="Mathematics",
            code="MATH101",
            description="Basic Mathematics"
        )
        
        # Create test teacher
        self.test_teacher = Teacher.objects.create(
            user_profile=self.teacher_profile,
            employee_id="TCH001",
            employment_type="full_time",
            specialization="Mathematics"
        )
        
        # Create test stream
        self.test_stream = Stream.objects.create(
            class_level=self.test_class,
            campus=self.campus,
            academic_year=self.academic_year,
            name="A",
            class_teacher=self.test_teacher
        )
        
        # Create test student
        self.test_student = Student.objects.create(
            user_profile=self.student_profile,
            student_id="STD001",
            admission_number="ADM001",
            current_stream=self.test_stream,
            enrollment_status="enrolled"
        )
        
        # Create test parent
        self.test_parent = Parent.objects.create(
            user_profile=self.parent_profile,
            occupation="Engineer",
            relationship_type="father"
        )
        
        # Create parent-student relationship
        self.parent_student_relationship = ParentStudentRelationship.objects.create(
            parent=self.test_parent,
            student=self.test_student,
            relationship_type="father"
        )
    
    def authenticate_as_admin(self):
        """Authenticate as admin user"""
        self.client.force_authenticate(user=self.admin_user)
    
    def authenticate_as_teacher(self):
        """Authenticate as teacher user"""
        self.client.force_authenticate(user=self.teacher_user)
    
    def authenticate_as_student(self):
        """Authenticate as student user"""
        self.client.force_authenticate(user=self.student_user)
    
    def authenticate_as_parent(self):
        """Authenticate as parent user"""
        self.client.force_authenticate(user=self.parent_user)


class ClassViewsTestCase(MembersAPITestCase):
    """Test cases for Class views"""
    
    def test_list_classes_authenticated(self):
        """Test listing classes with authentication"""
        self.authenticate_as_admin()
        url = reverse('members:class-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Grade 10')
    
    def test_list_classes_unauthenticated(self):
        """Test listing classes without authentication"""
        url = reverse('members:class-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_classes_with_filters(self):
        """Test listing classes with filters"""
        self.authenticate_as_admin()
        url = reverse('members:class-list')
        
        # Test school filter
        response = self.client.get(url, {'school_id': self.school.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test search filter
        response = self.client.get(url, {'search': 'Grade'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test search with no results
        response = self.client.get(url, {'search': 'NonExistent'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)
    
    def test_create_class(self):
        """Test creating a new class"""
        self.authenticate_as_admin()
        url = reverse('members:class-list')
        data = {
            'school': self.school.id,
            'name': 'Grade 11',
            'level': 11,
            'description': 'Grade 11 students'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Class.objects.count(), 2)
        
        new_class = Class.objects.get(name='Grade 11')
        self.assertEqual(new_class.level, 11)
    
    def test_create_class_invalid_data(self):
        """Test creating a class with invalid data"""
        self.authenticate_as_admin()
        url = reverse('members:class-list')
        data = {
            'name': '',  # Empty name should be invalid
            'level': 11
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_class_detail(self):
        """Test retrieving class details"""
        self.authenticate_as_admin()
        url = reverse('members:class-detail', kwargs={'pk': self.test_class.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Grade 10')
        self.assertEqual(response.data['level'], 10)
    
    def test_update_class(self):
        """Test updating a class"""
        self.authenticate_as_admin()
        url = reverse('members:class-detail', kwargs={'pk': self.test_class.pk})
        data = {
            'name': 'Grade 10 Updated',
            'description': 'Updated description'
        }
        
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.test_class.refresh_from_db()
        self.assertEqual(self.test_class.name, 'Grade 10 Updated')
    
    def test_delete_class(self):
        """Test soft deleting a class"""
        self.authenticate_as_admin()
        url = reverse('members:class-detail', kwargs={'pk': self.test_class.pk})
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        self.test_class.refresh_from_db()
        self.assertFalse(self.test_class.is_active)
    
    def test_get_class_streams(self):
        """Test getting streams for a class"""
        self.authenticate_as_admin()
        url = reverse('members:class-streams', kwargs={'pk': self.test_class.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'A')


class SubjectViewsTestCase(MembersAPITestCase):
    """Test cases for Subject views"""
    
    def test_list_subjects(self):
        """Test listing subjects"""
        self.authenticate_as_admin()
        url = reverse('members:subject-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Mathematics')
    
    def test_create_subject(self):
        """Test creating a new subject"""
        self.authenticate_as_admin()
        url = reverse('members:subject-list')
        data = {
            'school': self.school.id,
            'name': 'Physics',
            'code': 'PHY101',
            'description': 'Basic Physics'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Subject.objects.count(), 2)
    
    def test_subject_detail_operations(self):
        """Test subject detail operations"""
        self.authenticate_as_admin()
        url = reverse('members:subject-detail', kwargs={'pk': self.test_subject.pk})
        
        # Test GET
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Mathematics')
        
        # Test PUT
        data = {'name': 'Advanced Mathematics'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test DELETE (soft delete)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class StreamViewsTestCase(MembersAPITestCase):
    """Test cases for Stream views"""
    
    def test_list_streams(self):
        """Test listing streams"""
        self.authenticate_as_admin()
        url = reverse('members:stream-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'A')
    
    def test_create_stream(self):
        """Test creating a new stream"""
        self.authenticate_as_admin()
        url = reverse('members:stream-list')
        data = {
            'class_level': self.test_class.id,
            'campus': self.campus.id,
            'academic_year': self.academic_year.id,
            'name': 'B',
            'class_teacher': self.test_teacher.id
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Stream.objects.count(), 2)
    
    def test_stream_detail_operations(self):
        """Test stream detail operations"""
        self.authenticate_as_admin()
        url = reverse('members:stream-detail', kwargs={'pk': self.test_stream.pk})
        
        # Test GET
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'A')
        
        # Test PUT
        data = {'name': 'Stream A Updated'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_stream_students(self):
        """Test getting students in a stream"""
        self.authenticate_as_admin()
        url = reverse('members:stream-students', kwargs={'pk': self.test_stream.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student_id'], 'STD001')
    
    def test_assign_teacher_to_stream(self):
        """Test assigning a teacher to a stream"""
        # Create another teacher
        teacher_user = User.objects.create_user(
            email='teacher2@test.com',
            password='testpass123'
        )
        teacher_profile = UserProfile.objects.create(
            user=teacher_user,
            role=self.teacher_role,
            first_name="Teacher2",
            last_name="User"
        )
        new_teacher = Teacher.objects.create(
            user_profile=teacher_profile,
            employee_id="TCH002",
            employment_type="full_time"
        )
        
        self.authenticate_as_admin()
        url = reverse('members:stream-assign-teacher', kwargs={'pk': self.test_stream.pk})
        data = {'teacher_id': new_teacher.id}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.test_stream.refresh_from_db()
        self.assertEqual(self.test_stream.class_teacher, new_teacher)
    
    def test_assign_teacher_invalid_id(self):
        """Test assigning invalid teacher ID to stream"""
        self.authenticate_as_admin()
        url = reverse('members:stream-assign-teacher', kwargs={'pk': self.test_stream.pk})
        data = {'teacher_id': 99999}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class StudentViewsTestCase(MembersAPITestCase):
    """Test cases for Student views"""
    
    def test_list_students(self):
        """Test listing students"""
        self.authenticate_as_admin()
        url = reverse('members:student-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['student_id'], 'STD001')
    
    def test_list_students_with_filters(self):
        """Test listing students with various filters"""
        self.authenticate_as_admin()
        url = reverse('members:student-list')
        
        # Test stream filter
        response = self.client.get(url, {'stream_id': self.test_stream.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test enrollment status filter
        response = self.client.get(url, {'enrollment_status': 'enrolled'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test search
        response = self.client.get(url, {'search': 'STD001'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_create_student(self):
        """Test creating a new student"""
        # Create another user profile for student
        student_user2 = User.objects.create_user(
            email='student2@test.com',
            password='testpass123'
        )
        student_profile2 = UserProfile.objects.create(
            user=student_user2,
            role=self.student_role,
            first_name="Student2",
            last_name="User"
        )
        
        self.authenticate_as_admin()
        url = reverse('members:student-list')
        data = {
            'user_profile': student_profile2.id,
            'student_id': 'STD002',
            'admission_number': 'ADM002',
            'current_stream': self.test_stream.id,
            'enrollment_status': 'enrolled'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Student.objects.count(), 2)
    
    def test_student_detail_operations(self):
        """Test student detail operations"""
        self.authenticate_as_admin()
        url = reverse('members:student-detail', kwargs={'pk': self.test_student.pk})
        
        # Test GET
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_id'], 'STD001')
        
        # Test PUT
        data = {'admission_number': 'ADM001_UPDATED'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test DELETE (soft delete)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        self.test_student.refresh_from_db()
        self.assertFalse(self.test_student.is_active)
    
    def test_get_student_parents(self):
        """Test getting parents of a student"""
        self.authenticate_as_admin()
        url = reverse('members:student-parents', kwargs={'pk': self.test_student.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['relationship_type'], 'father')
    
    def test_get_student_history(self):
        """Test getting academic history of a student"""
        # Create history record
        StudentStreamHistory.objects.create(
            student=self.test_student,
            stream=self.test_stream,
            academic_year=self.academic_year
        )
        
        self.authenticate_as_admin()
        url = reverse('members:student-history', kwargs={'pk': self.test_student.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_assign_student_to_stream(self):
        """Test assigning a student to a new stream"""
        # Create another stream
        new_stream = Stream.objects.create(
            class_level=self.test_class,
            campus=self.campus,
            academic_year=self.academic_year,
            name='B'
        )
        
        self.authenticate_as_admin()
        url = reverse('members:student-assign-stream', kwargs={'pk': self.test_student.pk})
        data = {'stream_id': new_stream.id}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.test_student.refresh_from_db()
        self.assertEqual(self.test_student.current_stream, new_stream)
        
        # Check that history record was created
        self.assertTrue(
            StudentStreamHistory.objects.filter(
                student=self.test_student,
                stream=new_stream
            ).exists()
        )
    
    def test_student_statistics(self):
        """Test getting student statistics"""
        self.authenticate_as_admin()
        url = reverse('members:student-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_students', response.data)
        self.assertIn('enrolled', response.data)
        self.assertIn('by_class', response.data)
        self.assertEqual(response.data['total_students'], 1)
        self.assertEqual(response.data['enrolled'], 1)


class TeacherViewsTestCase(MembersAPITestCase):
    """Test cases for Teacher views"""
    
    def test_list_teachers(self):
        """Test listing teachers"""
        self.authenticate_as_admin()
        url = reverse('members:teacher-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['employee_id'], 'TCH001')
    
    def test_create_teacher(self):
        """Test creating a new teacher"""
        # Create another user profile for teacher
        teacher_user2 = User.objects.create_user(
            email='teacher3@test.com',
            password='testpass123'
        )
        teacher_profile2 = UserProfile.objects.create(
            user=teacher_user2,
            role=self.teacher_role,
            first_name="Teacher3",
            last_name="User"
        )
        
        self.authenticate_as_admin()
        url = reverse('members:teacher-list')
        data = {
            'user_profile': teacher_profile2.id,
            'employee_id': 'TCH003',
            'employment_type': 'part_time',
            'specialization': 'Science'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Teacher.objects.count(), 2)
    
    def test_teacher_detail_operations(self):
        """Test teacher detail operations"""
        self.authenticate_as_admin()
        url = reverse('members:teacher-detail', kwargs={'pk': self.test_teacher.pk})
        
        # Test GET
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['employee_id'], 'TCH001')
        
        # Test PUT
        data = {'specialization': 'Advanced Mathematics'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_teacher_assignments(self):
        """Test getting teacher subject assignments"""
        # Create a subject assignment
        TeacherSubjectAssignment.objects.create(
            teacher=self.test_teacher,
            subject=self.test_subject,
            stream=self.test_stream,
            academic_year=self.academic_year
        )
        
        self.authenticate_as_admin()
        url = reverse('members:teacher-assignments', kwargs={'pk': self.test_teacher.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_get_teacher_streams(self):
        """Test getting streams where teacher is class teacher"""
        self.authenticate_as_admin()
        url = reverse('members:teacher-streams', kwargs={'pk': self.test_teacher.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'A')


class ParentViewsTestCase(MembersAPITestCase):
    """Test cases for Parent views"""
    
    def test_list_parents(self):
        """Test listing parents"""
        self.authenticate_as_admin()
        url = reverse('members:parent-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['occupation'], 'Engineer')
    
    def test_create_parent(self):
        """Test creating a new parent"""
        # Create another user profile for parent
        parent_user2 = User.objects.create_user(
            email='parent2@test.com',
            password='testpass123'
        )
        parent_profile2 = UserProfile.objects.create(
            user=parent_user2,
            role=self.parent_role,
            first_name="Parent2",
            last_name="User"
        )
        
        self.authenticate_as_admin()
        url = reverse('members:parent-list')
        data = {
            'user_profile': parent_profile2.id,
            'occupation': 'Doctor',
            'relationship_type': 'mother'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Parent.objects.count(), 2)
    
    def test_parent_detail_operations(self):
        """Test parent detail operations"""
        self.authenticate_as_admin()
        url = reverse('members:parent-detail', kwargs={'pk': self.test_parent.pk})
        
        # Test GET
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['occupation'], 'Engineer')
        
        # Test PUT
        data = {'occupation': 'Senior Engineer'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_parent_children(self):
        """Test getting children of a parent"""
        self.authenticate_as_admin()
        url = reverse('members:parent-children', kwargs={'pk': self.test_parent.pk})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class ParentStudentRelationshipViewsTestCase(MembersAPITestCase):
    """Test cases for Parent-Student Relationship views"""
    
    def test_list_relationships(self):
        """Test listing parent-student relationships"""
        self.authenticate_as_admin()
        url = reverse('members:parent-student-relationship-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['relationship_type'], 'father')
    
    def test_create_relationship(self):
        """Test creating a new parent-student relationship"""
        # Create another parent
        parent_user2 = User.objects.create_user(
            email='parent3@test.com',
            password='testpass123'
        )
        parent_profile2 = UserProfile.objects.create(
            user=parent_user2,
            role=self.parent_role,
            first_name="Parent3",
            last_name="User"
        )
        parent2 = Parent.objects.create(
            user_profile=parent_profile2,
            occupation='Teacher',
            relationship_type='mother'
        )
        
        self.authenticate_as_admin()
        url = reverse('members:parent-student-relationship-list')
        data = {
            'parent': parent2.id,
            'student': self.test_student.id,
            'relationship_type': 'mother'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ParentStudentRelationship.objects.count(), 2)
    
    def test_relationship_detail_operations(self):
        """Test relationship detail operations"""
        self.authenticate_as_admin()
        url = reverse('members:parent-student-relationship-detail', kwargs={'pk': self.parent_student_relationship.pk})
        
        # Test GET
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['relationship_type'], 'father')
        
        # Test PUT
        data = {'relationship_type': 'guardian'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test DELETE (hard delete)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ParentStudentRelationship.objects.count(), 0)


class TeacherSubjectAssignmentViewsTestCase(MembersAPITestCase):
    """Test cases for Teacher Subject Assignment views"""
    
    def test_list_assignments(self):
        """Test listing teacher subject assignments"""
        # Create an assignment
        assignment = TeacherSubjectAssignment.objects.create(
            teacher=self.test_teacher,
            subject=self.test_subject,
            stream=self.test_stream,
            academic_year=self.academic_year
        )
        
        self.authenticate_as_admin()
        url = reverse('members:teacher-subject-assignment-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_create_assignment(self):
        """Test creating a new teacher subject assignment"""
        self.authenticate_as_admin()
        url = reverse('members:teacher-subject-assignment-list')
        data = {
            'teacher': self.test_teacher.id,
            'subject': self.test_subject.id,
            'stream': self.test_stream.id,
            'academic_year': self.academic_year.id
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TeacherSubjectAssignment.objects.count(), 1)
    
    def test_bulk_assign_teachers(self):
        """Test bulk assigning teachers to subjects"""
        # Create another teacher and subject
        teacher_user2 = User.objects.create_user(
            email='teacher4@test.com',
            password='testpass123'
        )
        teacher_profile2 = UserProfile.objects.create(
            user=teacher_user2,
            role=self.teacher_role,
            first_name="Teacher4",
            last_name="User"
        )
        teacher2 = Teacher.objects.create(
            user_profile=teacher_profile2,
            employee_id="TCH004",
            employment_type="full_time"
        )
        
        subject2 = Subject.objects.create(
            school=self.school,
            name="Physics",
            code="PHY101"
        )
        
        self.authenticate_as_admin()
        url = reverse('members:bulk-assign-teacher-subjects')
        data = {
            'assignments': [
                {
                    'teacher': self.test_teacher.id,
                    'subject': self.test_subject.id,
                    'stream': self.test_stream.id,
                    'academic_year': self.academic_year.id
                },
                {
                    'teacher': teacher2.id,
                    'subject': subject2.id,
                    'stream': self.test_stream.id,
                    'academic_year': self.academic_year.id
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TeacherSubjectAssignment.objects.count(), 2)
    
    def test_bulk_assign_with_errors(self):
        """Test bulk assignment with some invalid data"""
        self.authenticate_as_admin()
        url = reverse('members:bulk-assign-teacher-subjects')
        data = {
            'assignments': [
                {
                    'teacher': self.test_teacher.id,
                    'subject': self.test_subject.id,
                    'stream': self.test_stream.id,
                    'academic_year': self.academic_year.id
                },
                {
                    'teacher': 99999,  # Invalid teacher ID
                    'subject': self.test_subject.id,
                    'stream': self.test_stream.id,
                    'academic_year': self.academic_year.id
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)


class PaginationTestCase(MembersAPITestCase):
    """Test pagination functionality"""
    
    def setUp(self):
        super().setUp()
        # Create multiple classes for pagination testing
        for i in range(25):  # Create 25 classes
            Class.objects.create(
                school=self.school,
                name=f"Grade {i+11}",
                level=i+11,
                description=f"Grade {i+11} students"
            )
    
    def test_pagination_default_page_size(self):
        """Test default pagination (20 items per page)"""
        self.authenticate_as_admin()
        url = reverse('members:class-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 20)  # Default page size
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertEqual(response.data['count'], 26)  # 25 + 1 original class
    
    def test_pagination_custom_page_size(self):
        """Test custom page size"""
        self.authenticate_as_admin()
        url = reverse('members:class-list')
        response = self.client.get(url, {'page_size': 10})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)
    
    def test_pagination_specific_page(self):
        """Test accessing specific page"""
        self.authenticate_as_admin()
        url = reverse('members:class-list')
        response = self.client.get(url, {'page': 2, 'page_size': 10})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)


class AuthenticationTestCase(MembersAPITestCase):
    """Test authentication requirements"""
    
    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated requests are denied"""
        endpoints = [
            reverse('members:class-list'),
            reverse('members:subject-list'),
            reverse('members:stream-list'),
            reverse('members:student-list'),
            reverse('members:teacher-list'),
            reverse('members:parent-list'),
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, 
                           f"Endpoint {endpoint} should require authentication")
    
    def test_authenticated_access_allowed(self):
        """Test that authenticated requests are allowed"""
        self.authenticate_as_admin()
        
        endpoints = [
            reverse('members:class-list'),
            reverse('members:subject-list'),
            reverse('members:stream-list'),
            reverse('members:student-list'),
            reverse('members:teacher-list'),
            reverse('members:parent-list'),
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK,
                           f"Endpoint {endpoint} should allow authenticated access")


class ErrorHandlingTestCase(MembersAPITestCase):
    """Test error handling scenarios"""
    
    def test_404_for_nonexistent_objects(self):
        """Test 404 responses for non-existent objects"""
        self.authenticate_as_admin()
        
        endpoints = [
            reverse('members:class-detail', kwargs={'pk': 99999}),
            reverse('members:subject-detail', kwargs={'pk': 99999}),
            reverse('members:stream-detail', kwargs={'pk': 99999}),
            reverse('members:student-detail', kwargs={'pk': 99999}),
            reverse('members:teacher-detail', kwargs={'pk': 99999}),
            reverse('members:parent-detail', kwargs={'pk': 99999}),
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND,
                           f"Endpoint {endpoint} should return 404 for non-existent object")
    
    def test_invalid_data_handling(self):
        """Test handling of invalid data in POST requests"""
        self.authenticate_as_admin()
        
        # Test creating class with invalid data
        url = reverse('members:class-list')
        invalid_data = {
            'name': '',  # Empty name
            'level': 'invalid_level',  # Invalid level type
            'school': 99999  # Non-existent school
        }
        
        response = self.client.post(url, invalid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check that response contains validation errors
        self.assertIn('name', response.data)
        self.assertIn('level', response.data)
        self.assertIn('school', response.data)
