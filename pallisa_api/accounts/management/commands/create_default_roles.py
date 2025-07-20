from django.core.management.base import BaseCommand
from accounts.models import Role, Permission, PermissionCategory


class Command(BaseCommand):
    help = 'Create default roles and permissions if they do not exist'

    def handle(self, *args, **options):
        self.stdout.write('Creating default roles and permissions...')
        
        # Create default permission categories
        admin_category, _ = PermissionCategory.objects.get_or_create(
            code='admin',
            defaults={
                'name': 'Administration',
                'description': 'System administration permissions',
                'is_admin': True
            }
        )
        
        students_category, _ = PermissionCategory.objects.get_or_create(
            code='students',
            defaults={
                'name': 'Student Management',
                'description': 'Student-related permissions',
                'is_admin': False
            }
        )
        
        teachers_category, _ = PermissionCategory.objects.get_or_create(
            code='teachers',
            defaults={
                'name': 'Teacher Management',
                'description': 'Teacher-related permissions',
                'is_admin': False
            }
        )
        
        expenses_category, _ = PermissionCategory.objects.get_or_create(
            code='expenses',
            defaults={
                'name': 'Expense Management',
                'description': 'Expense-related permissions',
                'is_admin': False
            }
        )
        
        fees_category, _ = PermissionCategory.objects.get_or_create(
            code='fees',
            defaults={
                'name': 'Fee Management',
                'description': 'Fee-related permissions',
                'is_admin': False
            }
        )
        
        reports_category, _ = PermissionCategory.objects.get_or_create(
            code='reports',
            defaults={
                'name': 'Reports',
                'description': 'Report and analytics permissions',
                'is_admin': False
            }
        )
        
        salary_category, _ = PermissionCategory.objects.get_or_create(
            code='salary',
            defaults={
                'name': 'Salary Management',
                'description': 'Salary management permissions',
                'is_admin': False
            }
        )
        
        # Create comprehensive permissions
        permissions_data = [
            # Admin permissions
            {
                'code': 'admin.manage_roles',
                'name': 'Manage Roles',
                'description': 'Can create, edit, and delete roles',
                'category': admin_category
            },
            {
                'code': 'admin.manage_permissions',
                'name': 'Manage Permissions',
                'description': 'Can assign and remove permissions from users',
                'category': admin_category
            },
            {
                'code': 'admin.manage_users',
                'name': 'Manage Users',
                'description': 'Can create, edit, and delete user profiles',
                'category': admin_category
            },
            {
                'code': 'admin.manage_salaries',
                'name': 'Manage Salaries',
                'description': 'Full access to salary management including periods, payments, and summaries',
                'category': admin_category
            },
            {
                'code': 'admin.view_users',
                'name': 'View Users',
                'description': 'Can view user profiles',
                'category': admin_category
            },
            {
                'code': 'admin.edit_users',
                'name': 'Edit Users',
                'description': 'Can edit user profiles',
                'category': admin_category
            },
            {
                'code': 'admin.delete_users',
                'name': 'Delete Users',
                'description': 'Can delete user profiles',
                'category': admin_category
            },
            {
                'code': 'admin.view_documents',
                'name': 'View Documents',
                'description': 'Can view documents',
                'category': admin_category
            },
            {
                'code': 'admin.create_documents',
                'name': 'Create Documents',
                'description': 'Can create documents',
                'category': admin_category
            },
            {
                'code': 'admin.edit_documents',
                'name': 'Edit Documents',
                'description': 'Can edit documents',
                'category': admin_category
            },
            {
                'code': 'admin.delete_documents',
                'name': 'Delete Documents',
                'description': 'Can delete documents',
                'category': admin_category
            },
            {
                'code': 'admin.view_reports',
                'name': 'View Reports',
                'description': 'Can view system reports and analytics',
                'category': admin_category
            },
            
            # Student permissions
            {
                'code': 'students.view_students',
                'name': 'View Students',
                'description': 'Can view student information',
                'category': students_category
            },
            {
                'code': 'students.create_student',
                'name': 'Create Students',
                'description': 'Can create new students',
                'category': students_category
            },
            {
                'code': 'students.edit_student',
                'name': 'Edit Students',
                'description': 'Can edit student information',
                'category': students_category
            },
            {
                'code': 'students.delete_student',
                'name': 'Delete Students',
                'description': 'Can delete students',
                'category': students_category
            },
            
            # Teacher permissions
            {
                'code': 'teachers.view_teachers',
                'name': 'View Teachers',
                'description': 'Can view teacher information',
                'category': teachers_category
            },
            {
                'code': 'teachers.create_teacher',
                'name': 'Create Teachers',
                'description': 'Can create new teachers',
                'category': teachers_category
            },
            {
                'code': 'teachers.edit_teacher',
                'name': 'Edit Teachers',
                'description': 'Can edit teacher information',
                'category': teachers_category
            },
            {
                'code': 'teachers.delete_teacher',
                'name': 'Delete Teachers',
                'description': 'Can delete teachers',
                'category': teachers_category
            },
            
            # Expense permissions
            {
                'code': 'expenses.view_expenses',
                'name': 'View Expenses',
                'description': 'Can view expenses',
                'category': expenses_category
            },
            {
                'code': 'expenses.create_expense',
                'name': 'Create Expenses',
                'description': 'Can create new expenses',
                'category': expenses_category
            },
            {
                'code': 'expenses.edit_expense',
                'name': 'Edit Expenses',
                'description': 'Can edit expenses',
                'category': expenses_category
            },
            {
                'code': 'expenses.delete_expense',
                'name': 'Delete Expenses',
                'description': 'Can delete expenses',
                'category': expenses_category
            },
            {
                'code': 'expenses.approve_expense',
                'name': 'Approve Expenses',
                'description': 'Can approve or reject expenses',
                'category': expenses_category
            },
            
            # Fee permissions
            {
                'code': 'fees.view_fees',
                'name': 'View Fees',
                'description': 'Can view fee information',
                'category': fees_category
            },
            {
                'code': 'fees.create_fee',
                'name': 'Create Fees',
                'description': 'Can create new fees',
                'category': fees_category
            },
            {
                'code': 'fees.edit_fee',
                'name': 'Edit Fees',
                'description': 'Can edit fee information',
                'category': fees_category
            },
            {
                'code': 'fees.delete_fee',
                'name': 'Delete Fees',
                'description': 'Can delete fees',
                'category': fees_category
            },
            
            # Salary permissions
            {
                'code': 'salary.view_salary_periods',
                'name': 'View Salary Periods',
                'description': 'View salary periods and their details',
                'category': salary_category
            },
            {
                'code': 'salary.manage_salary_periods',
                'name': 'Manage Salary Periods',
                'description': 'Create, edit, and delete salary periods',
                'category': salary_category
            },
            {
                'code': 'salary.view_allowances',
                'name': 'View Allowances',
                'description': 'View salary allowances and their details',
                'category': salary_category
            },
            {
                'code': 'salary.manage_allowances',
                'name': 'Manage Allowances',
                'description': 'Create, edit, and delete salary allowances',
                'category': salary_category
            },
            {
                'code': 'salary.view_deductions',
                'name': 'View Deductions',
                'description': 'View salary deductions and their details',
                'category': salary_category
            },
            {
                'code': 'salary.manage_deductions',
                'name': 'Manage Deductions',
                'description': 'Create, edit, and delete salary deductions',
                'category': salary_category
            },
            {
                'code': 'salary.view_payments',
                'name': 'View Payments',
                'description': 'View salary payments and their details',
                'category': salary_category
            },
            {
                'code': 'salary.manage_payments',
                'name': 'Manage Payments',
                'description': 'Create, edit, and delete salary payments',
                'category': salary_category
            },
            {
                'code': 'salary.view_summaries',
                'name': 'View Summaries',
                'description': 'View salary summaries and reports',
                'category': salary_category
            },
            {
                'code': 'salary.view_staff_salaries',
                'name': 'View Staff Salaries',
                'description': 'View staff salary information',
                'category': salary_category
            },
            {
                'code': 'salary.process_payments',
                'name': 'Process Payments',
                'description': 'Process salary payments and generate reports',
                'category': salary_category
            },
            
            # Report permissions
            {
                'code': 'reports.view_reports',
                'name': 'View Reports',
                'description': 'Can view system reports',
                'category': reports_category
            },
            {
                'code': 'reports.export_reports',
                'name': 'Export Reports',
                'description': 'Can export reports to various formats',
                'category': reports_category
            },
        ]
        
        created_permissions = []
        for perm_data in permissions_data:
            # First check if a permission with this code already exists
            try:
                permission = Permission.objects.get(code=perm_data['code'])
                # Update existing permission if needed
                updated = False
                if permission.name != perm_data['name']:
                    permission.name = perm_data['name']
                    updated = True
                if permission.description != perm_data['description']:
                    permission.description = perm_data['description']
                    updated = True
                if permission.category != perm_data['category']:
                    permission.category = perm_data['category']
                    updated = True
                
                if updated:
                    permission.save()
                    self.stdout.write(f'Updated permission: {permission.name}')
                else:
                    self.stdout.write(f'Permission already exists: {permission.name}')
            except Permission.DoesNotExist:
                # Check if a permission with this name already exists
                try:
                    existing_permission = Permission.objects.get(name=perm_data['name'])
                    # Update the existing permission with the new code and other fields
                    existing_permission.code = perm_data['code']
                    existing_permission.description = perm_data['description']
                    existing_permission.category = perm_data['category']
                    existing_permission.save()
                    permission = existing_permission
                    self.stdout.write(f'Updated permission: {permission.name} (updated code to {perm_data["code"]})')
                except Permission.DoesNotExist:
                    # Create new permission
                    permission = Permission.objects.create(**perm_data)
                    self.stdout.write(f'Created permission: {permission.name}')
            
            created_permissions.append(permission)
        
        # Create SuperAdmin role
        superadmin_role, created = Role.objects.get_or_create(
            name="SuperAdmin",
            is_superadmin=True,
            defaults={
                "description": "Superadmin role with all system permissions"
            }
        )
        
        if created:
            self.stdout.write('Created SuperAdmin role')
        else:
            self.stdout.write('SuperAdmin role already exists')
        
        # Get ALL permissions (both existing and newly created)
        all_permissions = Permission.objects.all()
        
        # Assign ALL permissions to SuperAdmin role
        superadmin_role.permissions.set(all_permissions)
        self.stdout.write(f'Assigned {all_permissions.count()} permissions to SuperAdmin role')
        
        # Create other default roles with specific permissions
        default_roles = [
            {
                'name': 'School Admin',
                'description': 'School administrator with limited system access',
                'is_superadmin': False,
                'permissions': [
                    'admin.view_users', 'admin.edit_users',
                    'students.view_students', 'students.create_student', 'students.edit_student',
                    'teachers.view_teachers', 'teachers.create_teacher', 'teachers.edit_teacher',
                    'expenses.view_expenses', 'expenses.create_expense', 'expenses.edit_expense', 'expenses.approve_expense',
                    'fees.view_fees', 'fees.create_fee', 'fees.edit_fee',
                    'salary.view_salary_periods', 'salary.view_payments', 'salary.view_summaries',
                    'reports.view_reports'
                ]
            },
            {
                'name': 'Teacher',
                'description': 'Teacher role with classroom management permissions',
                'is_superadmin': False,
                'permissions': [
                    'students.view_students',
                    'expenses.view_expenses', 'expenses.create_expense',
                    'salary.view_staff_salaries',
                    'reports.view_reports'
                ]
            },
            {
                'name': 'Student',
                'description': 'Student role with basic access',
                'is_superadmin': False,
                'permissions': [
                    'expenses.view_expenses'
                ]
            },
            {
                'name': 'Parent',
                'description': 'Parent role with child-related access',
                'is_superadmin': False,
                'permissions': [
                    'students.view_students'
                ]
            }
        ]
        
        for role_data in default_roles:
            permissions_list = role_data.pop('permissions', [])
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )
            if created:
                self.stdout.write(f'Created role: {role.name}')
            else:
                self.stdout.write(f'Role already exists: {role.name}')
            
            # Assign permissions to the role
            if permissions_list:
                role_permissions = Permission.objects.filter(code__in=permissions_list)
                role.permissions.set(role_permissions)
                self.stdout.write(f'Assigned {role_permissions.count()} permissions to {role.name} role')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created default roles and permissions')
        ) 