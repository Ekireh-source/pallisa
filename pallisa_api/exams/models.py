from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from members.models import Student, Subject, Teacher, Class, Stream, SubjectPaper
from schools.models import School, Campus
from expenses.models import AcademicYear, Term
import uuid


class Topics(models.Model):
    """
    Represents a specific learning outcome or competency in a subject for a particular class level.
    Used in the New Lower Secondary Curriculum (Uganda).
    """
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='competencies')
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='competencies')
    name = models.CharField(max_length=255, help_text="The competency name or topic description")
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Competencies"
        unique_together = ['subject', 'class_obj', 'name']

    def __str__(self):
        return f"{self.subject.code} - {self.class_obj.name}: {self.name}"


class CompetencyArea(models.Model):
    """
    Represents a broader area of competency within a subject.
    """
    topic = models.ForeignKey(Topics, on_delete=models.CASCADE, related_name='competency_areas', null=True, blank=True)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='competency_areas', null=True, blank=True)
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='competency_areas', null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ActivityOfIntegration(models.Model):
    """
    Represents an Activity of Integration (AoI) task.
    This is a major assessment task in the New Lower Secondary Curriculum.
    """
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    topic = models.ForeignKey(Topics, on_delete=models.CASCADE, related_name='activities')
    competency_area = models.ForeignKey(CompetencyArea, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name='integration_activities')
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    max_score = models.PositiveIntegerField(default=10, help_text="Usually out of 10 marks for AoI")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AoI: {self.topic.name} ({self.topic.subject.code})"


class IntegrationScore(models.Model):
    """
    Stores the score achieved by a student in an Activity of Integration.
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='integration_scores')
    activity = models.ForeignKey(ActivityOfIntegration, on_delete=models.CASCADE, related_name='scores')
    score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    teacher_remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'activity']

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.score > self.activity.max_score:
            raise ValidationError(f"Score cannot be greater than the maximum score ({self.activity.max_score})")

    def __str__(self):
        return f"{self.student.student_id} - AoI {self.activity.topic.name}: {self.score}"
    
    
    
class Exam(models.Model):
    """
    Represents an examination period (e.g., End of Term 1).
    """
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=100)
    class_obj = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='exams')
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.class_obj.name} ({self.term.name})"


class ExamScore(models.Model):
    """
    Stores the score for a student in a particular subject for an exam.
    """
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='scores')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='exam_scores')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exam_scores')
    score = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['exam', 'student', 'subject']

    def __str__(self):
        return f"{self.student.student_id} - {self.subject.code} - {self.exam.name}: {self.score}"


class ExamPaperScore(models.Model):
    """
    Stores a student's score for a specific subject paper during an exam.
    """
    exam = models.ForeignKey(
        Exam, 
        on_delete=models.CASCADE, 
        related_name='paper_scores'
    )
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        related_name='paper_scores'
    )
    paper = models.ForeignKey(
        SubjectPaper, 
        on_delete=models.CASCADE, 
        related_name='scores'
    )
    score = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['exam', 'student', 'paper']
        verbose_name = "Exam Paper Score"
        verbose_name_plural = "Exam Paper Scores"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.score > self.paper.max_score:
            raise ValidationError(f"Score cannot exceed the paper's maximum score of {self.paper.max_score}")

    def __str__(self):
        return f"{self.student.student_id} - {self.paper.subject.code} {self.paper.name}: {self.score}"


from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver([post_save, post_delete], sender=ExamPaperScore)
def update_overall_exam_score(sender, instance, **kwargs):
    """
    Automatically updates or creates the standard ExamScore record for the subject
    representing the average of all paper scores.
    """
    exam = instance.exam
    student = instance.student
    subject = instance.paper.subject

    # 1. Find all papers defined for this subject
    defined_papers = subject.papers.filter(is_active=True)
    if not defined_papers.exists():
        return

    # 2. Get student's scores for these papers
    paper_scores = ExamPaperScore.objects.filter(
        exam=exam,
        student=student,
        paper__in=defined_papers
    )

    if paper_scores.exists():
        # Calculate standard average normalized to 100%
        total_pct = 0.0
        for ps in paper_scores:
            pct = (float(ps.score) / float(ps.paper.max_score)) * 100.0
            total_pct += pct
        
        # We divide by the number of defined papers to compute the true average
        subject_average = total_pct / defined_papers.count()

        # 3. Save to standard ExamScore (creates if doesn't exist)
        ExamScore.objects.update_or_create(
            exam=exam,
            student=student,
            subject=subject,
            defaults={
                'score': round(subject_average, 2),
                'remarks': f"Computed automatically from {paper_scores.count()} paper(s)."
            }
        )


class ProjectScore(models.Model):
    """
    Stores individual criteria-level scores for a student's projects.
    Maps back to legacy 'project_scores' table.
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='project_scores')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='project_scores')
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    competency_number = models.PositiveIntegerField(help_text="Competency index, e.g., 1, 2, 3, or 4")
    sub_criteria = models.CharField(max_length=10, help_text="Specific criteria code, e.g., '1.8'")
    score = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0.0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'subject', 'term', 'academic_year', 'sub_criteria']
        indexes = [
            models.Index(fields=['subject', 'term', 'academic_year']),
            models.Index(fields=['student', 'competency_number']),
        ]

    def __str__(self):
        return f"{self.student.admission_number} - {self.sub_criteria}: {self.score}"


class SaAssessment(models.Model):
    """
    Represents the metadata configuration for a stream's Summative Assessment.
    Maps back to legacy 'sa_assessments' table.
    """
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name='sa_assessments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sa_assessments')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name='sa_assessments')
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    total_box = models.DecimalField(max_digits=5, decimal_places=2, default=10.00, help_text="Scaling divisor factor")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['stream', 'subject', 'term', 'academic_year']

    def __str__(self):
        return f"SA: {self.subject.code} - {self.stream.name} ({self.term.name})"


class SaScore(models.Model):
    """
    Stores the full milestone-grade matrix row achieved by a student in an SA.
    Maps back to legacy 'sa_scores' table.
    """
    sa_assessment = models.ForeignKey(SaAssessment, on_delete=models.CASCADE, related_name='student_scores')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='sa_scores')
    
    # Milestone scores (L) and corresponding descriptors (G)
    l1 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    g1 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    
    l2 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    g2 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    
    l3 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    g3 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    
    l4 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    g4 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    
    l5 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    g5 = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0.0)])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['sa_assessment', 'student']

    def __str__(self):
        return f"{self.student.admission_number} - {self.sa_assessment}"


