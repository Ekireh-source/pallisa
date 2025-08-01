from django.core.management.base import BaseCommand
from django.db import transaction
from fees.models import update_all_collection_summaries, TermFeeCollectionSummary
from expenses.models import AcademicYear, Term
from members.models import Student


class Command(BaseCommand):
    help = 'Initialize fee collection summaries for all academic years and terms'

    def add_arguments(self, parser):
        parser.add_argument(
            '--academic-year',
            type=int,
            help='Specific academic year ID to process',
        )
        parser.add_argument(
            '--term',
            type=int,
            help='Specific term ID to process',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force recalculation even if summaries already exist',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting fee collection summary initialization...')
        )

        academic_year_id = options.get('academic_year')
        term_id = options.get('term')
        force = options.get('force')

        if academic_year_id and term_id:
            # Process specific academic year and term
            try:
                academic_year = AcademicYear.objects.get(id=academic_year_id)
                term = Term.objects.get(id=term_id)
                
                self.stdout.write(
                    f'Processing {academic_year.name} - {term.name}...'
                )
                
                with transaction.atomic():
                    if force:
                        # Delete existing summary if force is specified
                        TermFeeCollectionSummary.objects.filter(
                            academic_year=academic_year,
                            term=term
                        ).delete()
                    
                    summary = update_term_fee_collection_summary(academic_year_id, term_id)
                    
                    if summary:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Successfully created/updated summary for {academic_year.name} - {term.name}'
                            )
                        )
                        self._print_summary_details(summary)
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f'Failed to create summary for {academic_year.name} - {term.name}'
                            )
                        )
                        
            except (AcademicYear.DoesNotExist, Term.DoesNotExist) as e:
                self.stdout.write(
                    self.style.ERROR(f'Error: {e}')
                )
                return
                
        else:
            # Process all academic years and terms
            academic_years = AcademicYear.objects.filter(is_active=True)
            terms = Term.objects.filter(is_active=True)
            
            if not academic_years.exists():
                self.stdout.write(
                    self.style.WARNING('No active academic years found.')
                )
                return
                
            if not terms.exists():
                self.stdout.write(
                    self.style.WARNING('No active terms found.')
                )
                return
            
            self.stdout.write(
                f'Found {academic_years.count()} academic years and {terms.count()} terms to process.'
            )
            
            if force:
                self.stdout.write(
                    self.style.WARNING('Force flag specified. Deleting existing summaries...')
                )
                TermFeeCollectionSummary.objects.all().delete()
            
            summaries_updated = update_all_collection_summaries()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully processed {summaries_updated} fee collection summaries.'
                )
            )
            
            # Print summary of results
            total_summaries = TermFeeCollectionSummary.objects.count()
            total_expected = sum(s.total_expected_with_overrides for s in TermFeeCollectionSummary.objects.all())
            total_collected = sum(s.total_collected for s in TermFeeCollectionSummary.objects.all())
            
            self.stdout.write(
                f'Total summaries: {total_summaries}'
            )
            self.stdout.write(
                f'Total expected fees: UGX {total_expected:,.2f}'
            )
            self.stdout.write(
                f'Total collected: UGX {total_collected:,.2f}'
            )
            
            if total_expected > 0:
                collection_rate = (total_collected / total_expected) * 100
                self.stdout.write(
                    f'Overall collection rate: {collection_rate:.1f}%'
                )

    def _print_summary_details(self, summary):
        """Print detailed information about a fee collection summary"""
        self.stdout.write(
            f'  Academic Year: {summary.academic_year.name}'
        )
        self.stdout.write(
            f'  Term: {summary.term.name}'
        )
        self.stdout.write(
            f'  Total Students: {summary.total_students}'
        )
        self.stdout.write(
            f'  Students with Fees: {summary.students_with_fees}'
        )
        self.stdout.write(
            f'  Expected (Structures): UGX {summary.total_expected_from_structures:,.2f}'
        )
        self.stdout.write(
            f'  Expected (with Overrides): UGX {summary.total_expected_with_overrides:,.2f}'
        )
        self.stdout.write(
            f'  Collected: UGX {summary.total_collected:,.2f}'
        )
        self.stdout.write(
            f'  Pending: UGX {summary.total_pending_collection:,.2f}'
        )
        self.stdout.write(
            f'  Collection Rate: {summary.collection_percentage}'
        )
        self.stdout.write(
            f'  Efficiency: {summary.collection_efficiency}'
        ) 