from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from members.models import Student, Subject, Teacher, Class, Stream
from schools.models import School
from expenses.models import AcademicYear, Term
import uuid


class ReportCard(models.Model):
    """
    Main Report Card for a student for a specific term and academic year.
    Consolidates performance across all subjects.
    """
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='report_cards')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE)
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE)
    
    # Overall statistics
    total_score = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    average_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    overall_grade = models.CharField(max_length=10, blank=True, null=True)
    position = models.PositiveIntegerField(null=True, blank=True)
    out_of = models.PositiveIntegerField(null=True, blank=True, help_text="Total students in the class/stream")
    
    # Remarks
    class_teacher = models.ForeignKey(
        Teacher, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='class_reports'
    )
    class_teacher_remarks = models.TextField(blank=True, null=True)
    head_teacher_remarks = models.TextField(blank=True, null=True)
    
    # Other details
    attendance_days_present = models.PositiveIntegerField(default=0)
    attendance_total_days = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'academic_year', 'term']
        ordering = ['-academic_year', '-term', 'student']

    def __str__(self):
        return f"Report Card: {self.student.student_id} - {self.academic_year.name} {self.term.name}"


class SubjectReport(models.Model):
    """
    Detailed performance for a specific subject on a report card.
    Handles the 20% (AoI) and 80% (Exam) breakdown.
    """
    report_card = models.ForeignKey(ReportCard, on_delete=models.CASCADE, related_name='subject_reports')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True)
    
    # 20% - Activities of Integration (AoI)
    aoi_raw_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0,
        help_text="Sum of raw marks from Activities of Integration"
    )
    aoi_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        help_text="Cumulative score from Activities of Integration (out of 20%)"
    )
    
    # 80% - Final Exam
    exam_raw_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Raw Final Exam score (out of 100)"
    )
    exam_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(80)],
        help_text="Final Exam score (out of 80%)"
    )
    
    # Total and Grade
    total_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Sum of AoI (20%) and Exam (80%)"
    )
    grade = models.CharField(max_length=10, blank=True, null=True)
    remarks = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['report_card', 'subject']

    def __str__(self):
        return f"{self.subject.name} - {self.report_card.student.student_id}"

    def save(self, *args, **kwargs):
        # Auto-calculate total score
        self.total_score = self.aoi_score + self.exam_score
        
        if not self.grade:
            school = None
            if getattr(self, 'report_card', None) and getattr(self.report_card, 'student', None) and getattr(self.report_card.student, 'campus', None):
                school = self.report_card.student.campus.schools.filter(active=True).first()

            active_grading_system = None
            if school:
                active_grading_system = GradingSystem.objects.filter(school=school, is_active=True).first()
                
            if active_grading_system:
                # Ordering by -min_score is already set on the model Meta
                boundary = active_grading_system.boundaries.filter(
                    min_score__lte=self.total_score
                ).first()
                if boundary:
                    self.grade = boundary.grade
            
            if not self.grade:
                # Fallback to simple grading logic
                if self.total_score >= 80:
                    self.grade = 'A1'
                elif self.total_score >= 75:
                    self.grade = 'A2'
                elif self.total_score >= 66:
                    self.grade = 'B3'
                elif self.total_score >= 60:
                    self.grade = 'C4'
                elif self.total_score >= 55:
                    self.grade = 'C5'
                elif self.total_score >= 50:
                    self.grade = 'C6'
                elif self.total_score >= 45:
                    self.grade = 'P7'
                elif self.total_score >= 35:
                    self.grade = 'P8'
                else:
                    self.grade = 'F9'
        
        super().save(*args, **kwargs)


class SubjectCompetencyScore(models.Model):
    """
    Stores each individual AOI score (and optionally the exam score) per subject on a report card.
    Each row is one assessment item — one AOI activity, or the exam.
    """
    ASSESSMENT_TYPE_CHOICES = [
        ('aoi', 'Activity of Integration'),
        ('exam', 'Examination'),
    ]
    subject_report = models.ForeignKey(SubjectReport, on_delete=models.CASCADE, related_name='competency_scores')
    assessment_type = models.CharField(max_length=10, choices=ASSESSMENT_TYPE_CHOICES, default='aoi')
    competency_name = models.CharField(max_length=255, help_text="Title of the AOI activity or 'Examination'")
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Raw score achieved by the student"
    )
    max_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=3.0,
        help_text="Maximum possible raw score for this item"
    )

    def __str__(self):
        return f"[{self.get_assessment_type_display()}] {self.competency_name}: {self.score}/{self.max_score}"


class GradingSystem(models.Model):
    LEVEL_CHOICES = [
        ('O-Level', 'O-Level'),
        ('A-Level', 'A-Level'),
    ]
    name = models.CharField(max_length=255)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='O-Level')
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class GradeBoundary(models.Model):
    grading_system = models.ForeignKey(GradingSystem, on_delete=models.CASCADE, related_name='boundaries')
    grade = models.CharField(max_length=10)
    min_score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    remarks = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(
        blank=True, null=True,
        help_text="Full grade descriptor text shown in the grade key table, e.g. 'Exceptional – Demonstrates mastery...'"
    )


    class Meta:
        ordering = ['-min_score']
        unique_together = ['grading_system', 'grade']

    def __str__(self):
        return f"{self.grade} ({self.min_score}-{self.max_score})"


class ReportCardSettings(models.Model):
    """
    Per-school settings controlling which sections appear on the printed report card.
    Created automatically (get_or_create) when first accessed.
    """
    school = models.OneToOneField(
        School,
        on_delete=models.CASCADE,
        related_name='report_card_settings'
    )

    # ── Report sections ──────────────────────────────────────────────────────
    show_attendance = models.BooleanField(default=True)
    show_grade_descriptor = models.BooleanField(default=True)
    show_grade_descriptor_score_range = models.BooleanField(default=True)
    show_identifier_legend = models.BooleanField(default=True)
    show_subject_teacher_initials = models.BooleanField(default=True)
    show_teacher_comment = models.BooleanField(default=True)
    show_header = models.BooleanField(default=True)
    show_watermark = models.BooleanField(default=False)
    show_school_logo = models.BooleanField(default=True)
    show_school_motto = models.BooleanField(default=True)

    # ── Rank ─────────────────────────────────────────────────────────────────
    show_overall_student_rank = models.BooleanField(default=True)
    show_stream_student_rank = models.BooleanField(default=False)
    show_division_and_aggregate = models.BooleanField(default=True)

    # ── Remarks ──────────────────────────────────────────────────────────────
    show_class_teacher_remarks = models.BooleanField(default=True)
    show_head_teacher_remarks = models.BooleanField(default=True)

    # ── Signatures ───────────────────────────────────────────────────────────
    show_class_teacher_signature = models.BooleanField(default=True)
    show_head_teacher_signature = models.BooleanField(default=True)
    show_parent_signature = models.BooleanField(default=False)

    # ── Others ───────────────────────────────────────────────────────────────
    show_school_dates = models.BooleanField(default=True)
    show_school_fees = models.BooleanField(default=False)

    # ── Dates (set per print run) ─────────────────────────────────────────────
    school_closed_on = models.DateField(null=True, blank=True)
    next_term_begins_on = models.DateField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report Settings for {self.school.name}"
