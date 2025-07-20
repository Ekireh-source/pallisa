from django.core.management.base import BaseCommand
from members.models import SalaryAllowance, SalaryDeduction


class Command(BaseCommand):
    help = 'Create default salary allowances and deductions'

    def handle(self, *args, **options):
        self.stdout.write('Creating default salary allowances...')
        
        # Default allowances
        allowances_data = [
            {
                'name': 'Housing Allowance',
                'allowance_type': 'housing',
                'description': 'Monthly housing allowance for staff',
                'amount': 50000.00,
                'is_percentage': False,
            },
            {
                'name': 'Transport Allowance',
                'allowance_type': 'transport',
                'description': 'Monthly transport allowance',
                'amount': 30000.00,
                'is_percentage': False,
            },
            {
                'name': 'Medical Allowance',
                'allowance_type': 'medical',
                'description': 'Monthly medical allowance',
                'amount': 25000.00,
                'is_percentage': False,
            },
            {
                'name': 'Responsibility Allowance',
                'allowance_type': 'responsibility',
                'description': 'Additional allowance for leadership roles',
                'amount': 75000.00,
                'is_percentage': False,
            },
            {
                'name': 'Overtime Allowance',
                'allowance_type': 'overtime',
                'description': 'Overtime work compensation',
                'amount': 20000.00,
                'is_percentage': False,
            },
            {
                'name': 'Performance Bonus',
                'allowance_type': 'bonus',
                'description': 'Performance-based bonus',
                'amount': 100000.00,
                'is_percentage': False,
            },
        ]

        for allowance_data in allowances_data:
            allowance, created = SalaryAllowance.objects.get_or_create(
                name=allowance_data['name'],
                defaults=allowance_data
            )
            if created:
                self.stdout.write(f'Created allowance: {allowance.name}')
            else:
                self.stdout.write(f'Allowance already exists: {allowance.name}')

        self.stdout.write('Creating default salary deductions...')
        
        # Default deductions
        deductions_data = [
            {
                'name': 'Income Tax',
                'deduction_type': 'tax',
                'description': 'Monthly income tax deduction',
                'amount': 10.00,
                'is_percentage': True,
            },
            {
                'name': 'NSSF Contribution',
                'deduction_type': 'nssf',
                'description': 'National Social Security Fund contribution',
                'amount': 5.00,
                'is_percentage': True,
            },
            {
                'name': 'NHIF Contribution',
                'deduction_type': 'nhif',
                'description': 'National Hospital Insurance Fund contribution',
                'amount': 1700.00,
                'is_percentage': False,
            },
            {
                'name': 'Loan Repayment',
                'deduction_type': 'loan',
                'description': 'Staff loan repayment',
                'amount': 0.00,
                'is_percentage': False,
            },
            {
                'name': 'Salary Advance',
                'deduction_type': 'advance',
                'description': 'Salary advance repayment',
                'amount': 0.00,
                'is_percentage': False,
            },
        ]

        for deduction_data in deductions_data:
            deduction, created = SalaryDeduction.objects.get_or_create(
                name=deduction_data['name'],
                defaults=deduction_data
            )
            if created:
                self.stdout.write(f'Created deduction: {deduction.name}')
            else:
                self.stdout.write(f'Deduction already exists: {deduction.name}')

        self.stdout.write(
            self.style.SUCCESS('Successfully created default salary allowances and deductions')
        ) 