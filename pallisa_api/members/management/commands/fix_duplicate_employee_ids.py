from django.core.management.base import BaseCommand
from django.db import transaction
from members.models import Teacher, NonStaffMember
from django.utils import timezone
import time


class Command(BaseCommand):
    help = 'Fix duplicate employee IDs in Teacher and NonStaffMember models'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Fix Teacher employee IDs
        self.fix_teacher_employee_ids(dry_run)
        
        # Fix NonStaffMember employee IDs
        self.fix_nonstaff_employee_ids(dry_run)
        
        self.stdout.write(self.style.SUCCESS('Employee ID fix completed!'))

    def fix_teacher_employee_ids(self, dry_run):
        """Fix duplicate teacher employee IDs"""
        self.stdout.write('Checking Teacher employee IDs...')
        
        # Find teachers with duplicate or empty employee IDs
        teachers_without_id = Teacher.objects.filter(employee_id='')
        teachers_with_duplicates = []
        
        # Check for duplicates
        seen_ids = set()
        for teacher in Teacher.objects.exclude(employee_id='').order_by('employee_id'):
            if teacher.employee_id in seen_ids:
                teachers_with_duplicates.append(teacher)
            else:
                seen_ids.add(teacher.employee_id)
        
        total_fixes = len(teachers_without_id) + len(teachers_with_duplicates)
        
        if total_fixes == 0:
            self.stdout.write(self.style.SUCCESS('No Teacher employee ID issues found'))
            return
        
        self.stdout.write(f'Found {len(teachers_without_id)} teachers without employee IDs')
        self.stdout.write(f'Found {len(teachers_with_duplicates)} teachers with duplicate employee IDs')
        
        if dry_run:
            return
        
        # Fix the issues
        with transaction.atomic():
            # Fix teachers without employee IDs
            for teacher in teachers_without_id:
                old_id = teacher.employee_id
                teacher.save()  # This will trigger the auto-generation
                self.stdout.write(f'Fixed teacher {teacher.id}: "{old_id}" -> "{teacher.employee_id}"')
            
            # Fix teachers with duplicate employee IDs
            for teacher in teachers_with_duplicates:
                old_id = teacher.employee_id
                teacher.employee_id = ''  # Clear it to trigger regeneration
                teacher.save()
                self.stdout.write(f'Fixed duplicate teacher {teacher.id}: "{old_id}" -> "{teacher.employee_id}"')

    def fix_nonstaff_employee_ids(self, dry_run):
        """Fix duplicate non-staff member employee IDs"""
        self.stdout.write('Checking NonStaffMember employee IDs...')
        
        # Find non-staff members with duplicate or empty employee IDs
        nonstaff_without_id = NonStaffMember.objects.filter(employee_id='')
        nonstaff_with_duplicates = []
        
        # Check for duplicates
        seen_ids = set()
        for nonstaff in NonStaffMember.objects.exclude(employee_id='').order_by('employee_id'):
            if nonstaff.employee_id in seen_ids:
                nonstaff_with_duplicates.append(nonstaff)
            else:
                seen_ids.add(nonstaff.employee_id)
        
        total_fixes = len(nonstaff_without_id) + len(nonstaff_with_duplicates)
        
        if total_fixes == 0:
            self.stdout.write(self.style.SUCCESS('No NonStaffMember employee ID issues found'))
            return
        
        self.stdout.write(f'Found {len(nonstaff_without_id)} non-staff members without employee IDs')
        self.stdout.write(f'Found {len(nonstaff_with_duplicates)} non-staff members with duplicate employee IDs')
        
        if dry_run:
            return
        
        # Fix the issues
        with transaction.atomic():
            # Fix non-staff members without employee IDs
            for nonstaff in nonstaff_without_id:
                old_id = nonstaff.employee_id
                nonstaff.save()  # This will trigger the auto-generation
                self.stdout.write(f'Fixed non-staff {nonstaff.id}: "{old_id}" -> "{nonstaff.employee_id}"')
            
            # Fix non-staff members with duplicate employee IDs
            for nonstaff in nonstaff_with_duplicates:
                old_id = nonstaff.employee_id
                nonstaff.employee_id = ''  # Clear it to trigger regeneration
                nonstaff.save()
                self.stdout.write(f'Fixed duplicate non-staff {nonstaff.id}: "{old_id}" -> "{nonstaff.employee_id}"') 