from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Avg, Sum
from .models import ReportCard, SubjectReport, SubjectCompetencyScore, GradingSystem, GradeBoundary, ReportCardSettings
from .serializers import (
    ReportCardSerializer, SubjectReportSerializer, GenerateReportCardSerializer,
    GradingSystemSerializer, GradeBoundarySerializer, ReportCardSettingsSerializer
)
from exams.models import IntegrationScore, ExamScore, ActivityOfIntegration, ExamPaperScore
from members.models import Student, TeacherSubjectAssignment, SubjectPaper
from expenses.models import AcademicYear, Term
from django.http import HttpResponse
from django.template.loader import render_to_string
import weasyprint
from accounts.permission import filter_by_school

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class GradingSystemViewSet(viewsets.ModelViewSet):
    queryset = GradingSystem.objects.all()
    serializer_class = GradingSystemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        qs = filter_by_school(qs, self.request)
        school_id = self.request.query_params.get('school')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs

class GradeBoundaryViewSet(viewsets.ModelViewSet):
    queryset = GradeBoundary.objects.all()
    serializer_class = GradeBoundarySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        qs = super().get_queryset()
        qs = filter_by_school(qs, self.request, school_field_path='grading_system__school')
        system_id = self.request.query_params.get('grading_system')
        if system_id:
            qs = qs.filter(grading_system_id=system_id)
        return qs


class ReportCardViewSet(viewsets.ModelViewSet):
    queryset = ReportCard.objects.all()
    serializer_class = ReportCardSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = ReportCard.objects.all()
        queryset = filter_by_school(queryset, self.request, school_field_path='student__campus__schools')
        student_id = self.request.query_params.get('student_id', None)
        academic_year = self.request.query_params.get('academic_year', None)
        term = self.request.query_params.get('term', None)
        class_id = self.request.query_params.get('class_id', None)
        stream_id = self.request.query_params.get('stream_id', None)

        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if academic_year:
            queryset = queryset.filter(academic_year_id=academic_year)
        if term:
            queryset = queryset.filter(term_id=term)
        if class_id:
            queryset = queryset.filter(class_obj_id=class_id)
        if stream_id:
            queryset = queryset.filter(stream_id=stream_id)
            
        return queryset

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate (or regenerate) report cards for one or more students.

        Scoring formula per subject:
          AOI contribution  = (sum_of_aoi_scores / (count_of_aois * 3)) * 20
          Exam contribution = (exam_raw_score / 100) * 80
          Final total       = AOI contribution + Exam contribution  (out of 100)

        Subjects are determined by TeacherSubjectAssignment for the student's
        current stream in the given academic year — every assigned subject is
        included even if no scores exist yet (they appear as 0).
        """
        serializer = GenerateReportCardSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        academic_year_id = data.get('academic_year')
        term_id = data.get('term')
        school_id = data.get('school')
        class_id = data.get('class_obj')
        stream_id = data.get('stream')
        student_id = data.get('student')

        # ── 1. Resolve which students to process ───────────────────────────────
        students = Student.objects.filter(is_active=True).select_related(
            'user_profile', 'campus', 'current_stream__class_obj'
        )
        students = filter_by_school(students, request, school_field_path='campus__schools')
        
        if student_id:
            students = students.filter(id=student_id)
        elif stream_id:
            students = students.filter(current_stream_id=stream_id)
        elif class_id:
            students = students.filter(current_stream__class_obj_id=class_id)
        elif school_id:
            students = students.filter(campus__schools__id=school_id)

        if not students.exists():
            return Response(
                {"error": "No students found matching the criteria"},
                status=status.HTTP_404_NOT_FOUND
            )

        response_data = []

        for student in students:
            stream = student.current_stream
            if not stream:
                # Cannot determine subjects without a stream assignment
                response_data.append({
                    "student": student.user_profile.get_full_name(),
                    "student_id": student.student_id,
                    "error": "Student has no current stream assigned",
                    "subjects": []
                })
                continue

            class_obj = stream.class_obj

            # ── 2. Create / update the top-level ReportCard ────────────────────
            report_card, _ = ReportCard.objects.update_or_create(
                student=student,
                academic_year_id=academic_year_id,
                term_id=term_id,
                defaults={
                    'class_obj': class_obj,
                    'stream': stream,
                }
            )

            # ── 3. Determine class level and compute report card ──────────────
            class_level = (class_obj.level or '0level').lower()

            if 'alevel' in class_level:
                subject_reports_data, overall_total, subject_count = self._compute_alevel_report(
                    student=student,
                    academic_year_id=academic_year_id,
                    term_id=term_id,
                    class_obj=class_obj,
                    stream=stream,
                    report_card=report_card
                )
            else:
                subject_reports_data, overall_total, subject_count = self._compute_olevel_report(
                    student=student,
                    academic_year_id=academic_year_id,
                    term_id=term_id,
                    class_obj=class_obj,
                    stream=stream,
                    report_card=report_card
                )

            # ── 4. Update overall ReportCard totals ───────────────────────────
            if subject_count > 0:
                report_card.total_score = round(overall_total, 2)
                report_card.average_score = round(overall_total / subject_count, 2)
                report_card.out_of = students.count() if not student_id else None
                report_card.save()

            response_data.append({
                "student": student.user_profile.get_full_name(),
                "student_id": student.student_id,
                "stream": stream.name,
                "class": class_obj.name,
                "average_score": round(overall_total / subject_count, 2) if subject_count else 0,
                "subjects": subject_reports_data,
            })

        return Response({
            "message": f"Successfully generated/updated {len(response_data)} report card(s).",
            "results": response_data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        report_card = self.get_object()
        student = report_card.student
        class_obj = report_card.class_obj
        
        school = None
        if student.campus:
            school = student.campus.schools.first()
            
        settings = getattr(school, 'reportcardsettings', None) if school else None
        if not settings:
            settings = ReportCardSettings()
        
        serializer = self.get_serializer(report_card)
        data = serializer.data
        
        class_level = (class_obj.level or '0level').lower()
        is_alevel = 'alevel' in class_level
        
        if is_alevel:
            template_name = 'reports/alevel_report.html'
        else:
            template_name = 'reports/olevel_report.html'

        # Helper to map grades to CSS color classes
        def get_grade_class(grade):
            if not grade:
                return 'grade-default'
            g = grade.strip().upper()
            if g == 'A': return 'grade-a'
            if g == 'B': return 'grade-b'
            if g == 'C': return 'grade-c'
            if g == 'D': return 'grade-d'
            if g == 'E': return 'grade-e'
            if g == 'O': return 'grade-o'
            if g == 'F': return 'grade-f'
            if g.startswith('D'): return 'grade-sub-d'
            if g.startswith('C'): return 'grade-sub-c'
            if g.startswith('P'): return 'grade-sub-p'
            if g.startswith('F'): return 'grade-sub-f'
            return 'grade-default'

        # Helper to generate A-Level paper comments based on scores
        def get_paper_comment(paper):
            if paper.get('remarks'):
                return paper['remarks']
            if paper.get('comment'):
                return paper['comment']
            if paper.get('description'):
                return paper['description']
                
            score_val = float(paper.get('score') or 0.0)
            max_score = float(paper.get('max_score') or 100.0)
            pct = (score_val / max_score) * 100.0 if max_score > 0.0 else 0.0
            
            if pct >= 80.0:
                return 'Excellent performance — keep it up!'
            if pct >= 75.0:
                return 'Very good performance, maintain the effort.'
            if pct >= 70.0:
                return 'Good performance, maintain the effort.'
            if pct >= 65.0:
                return 'There is room for improvement.'
            if pct >= 52.0:
                return 'Average — revise organic reactions.'
            if pct >= 45.0:
                return 'Below average performance, aim higher.'
            if pct >= 40.0:
                return 'Weak pass, double your effort.'
            return 'Below average, work extra hard.'

        # Helper for teacher display name/initials
        def get_teacher_display(teacher_name, show_initials):
            if not teacher_name:
                return '—'
            if show_initials:
                parts = [p[0] for p in teacher_name.split() if p]
                return '.'.join(parts) + '.' if parts else '—'
            return teacher_name

        # Calculate custom context attributes for A-Level structure
        principal_passes = 0
        subsidiary_passes = 0
        
        show_initials = settings.show_subject_teacher_initials if settings else True
        
        # O-Level dynamic AOI computation
        max_aois = 1
        if not is_alevel:
            for sr in data.get('subject_reports', []):
                aois = [c for c in sr.get('competency_scores', []) if c.get('assessment_type') == 'aoi']
                if len(aois) > max_aois:
                    max_aois = len(aois)

        total_aoi = 0.0
        total_exam = 0.0
        
        for sr in data.get('subject_reports', []):
            grade = (sr.get('grade') or '').upper()
            sr['grade_class'] = get_grade_class(grade)
            sr['teacher_display'] = get_teacher_display(sr.get('teacher_name'), show_initials)
            
            sub_total = float(sr.get('aoi_score') or 0.0) + float(sr.get('exam_score') or 0.0)
            sr['sub_total'] = round(sub_total, 1)
            
            total_aoi += float(sr.get('aoi_score') or 0.0)
            total_exam += float(sr.get('exam_score') or 0.0)
            
            if is_alevel:
                if grade in ['A', 'B', 'C', 'D', 'E']:
                    principal_passes += 1
                elif grade == 'O':
                    subsidiary_passes += 1
                    
                for paper in sr.get('competency_scores', []):
                    paper['comment'] = get_paper_comment(paper)
                    title = paper.get('competency_name') or ''
                    paper['display_title'] = title.split(' (')[0] if ' (' in title else title
            else:
                # Pad AOIs to match max_aois length exactly for table rendering
                aois = [c for c in sr.get('competency_scores', []) if c.get('assessment_type') == 'aoi']
                padded_aois = []
                for idx in range(max_aois):
                    if idx < len(aois):
                        padded_aois.append(aois[idx].get('score') or '—')
                    else:
                        padded_aois.append('—')
                sr['aoi_list'] = padded_aois

        total_cum = total_aoi + total_exam

        # Resolve active grading system for key legend
        active_grading_system = None
        if school:
            level_str = 'A-Level' if is_alevel else 'O-Level'
            active_grading_system = GradingSystem.objects.filter(
                school=school,
                level=level_str,
                is_active=True
            ).first()
            if not active_grading_system:
                active_grading_system = GradingSystem.objects.filter(
                    school=school,
                    is_active=True
                ).first()
                
        if active_grading_system:
            # Decorate boundaries with CSS grade class
            for b in active_grading_system.boundaries.all():
                b.grade_class = get_grade_class(b.grade)

        attendance_total_days = data.get('attendance_total_days') or 0
        attendance_days_present = data.get('attendance_days_present') or 0
        days_absent = max(0, attendance_total_days - attendance_days_present)

        context = {
            'report': data,
            'settings': settings,
            'school': school,
            'primary_color': school.report_primary_color if school and hasattr(school, 'report_primary_color') else '#0fa88a',
            'accent_color': school.report_accent_color if school and hasattr(school, 'report_accent_color') else '#162032',
            'principal_passes': principal_passes,
            'subsidiary_passes': subsidiary_passes,
            'days_absent': days_absent,
            'grading_system': active_grading_system,
            'max_aois': max_aois,
            'aoi_range': list(range(max_aois)),
            'total_aoi': f"{total_aoi:.1f}",
            'total_exam': f"{total_exam:.1f}",
            'total_cum': f"{total_cum:.1f}",
        }
        
        html_string = render_to_string(template_name, context)
        pdf_file = weasyprint.HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf()
        
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{data["student_name"].replace(" ", "_")}_Report.pdf"'
        return response

    def _compute_olevel_report(self, student, academic_year_id, term_id, class_obj, stream, report_card):
        """
        Computes the O-Level report card for a single student.
        """
        # Primary: use TeacherSubjectAssignment (includes teacher info)
        # Fallback: subjects from the school the student belongs to
        assignments = TeacherSubjectAssignment.objects.filter(
            stream=stream,
            academic_year_id=academic_year_id,
            is_active=True
        ).select_related('subject', 'teacher')

        if assignments.exists():
            # Build list of (subject, teacher) tuples from assignments
            subject_teacher_pairs = [(a.subject, a.teacher) for a in assignments]
        else:
            # Fallback: discover subjects from the school via the campus
            from members.models import Subject as MemberSubject
            school = None
            if student.campus:
                school = student.campus.schools.filter(active=True).first()
            if school:
                school_subjects = MemberSubject.objects.filter(school=school, is_active=True)
            else:
                # Last resort: derive subjects from this student's existing AOI scores
                scored_subject_ids = IntegrationScore.objects.filter(
                    student=student
                ).values_list('activity__topic__subject_id', flat=True).distinct()
                school_subjects = MemberSubject.objects.filter(id__in=scored_subject_ids)
            subject_teacher_pairs = [(s, None) for s in school_subjects]

        subject_reports_data = []
        overall_total = 0.0
        subject_count = 0

        for subject, teacher in subject_teacher_pairs:
            # ── Fetch every defined AOI for this subject + term ────────
            all_aois = ActivityOfIntegration.objects.filter(
                topic__subject=subject,
                term_id=term_id
            ).select_related('topic')

            # Map activity_id → IntegrationScore for this student
            aoi_score_map = {
                s.activity_id: s
                for s in IntegrationScore.objects.filter(
                    student=student,
                    activity__in=all_aois
                )
            }

            aoi_items = []
            raw_aoi_total = 0.0
            aoi_count = all_aois.count()

            for aoi in all_aois:
                score_obj = aoi_score_map.get(aoi.id)
                raw = float(score_obj.score) if score_obj else 0.0
                aoi_max = float(aoi.max_score) if getattr(aoi, 'max_score', None) else 10.0
                scaled_score = (raw / aoi_max) * 3.0 if aoi_max > 0 else 0.0
                
                raw_aoi_total += scaled_score
                aoi_items.append({
                    "aoi_id": aoi.id,
                    "title": aoi.topic.name,
                    "score": round(scaled_score, 2),
                    "max_score": 3.0,
                })

            # AOI contribution: (total_scaled / (count * 3)) * 20
            max_possible_aoi = aoi_count * 3.0
            aoi_contribution = (raw_aoi_total / max_possible_aoi * 20.0) if max_possible_aoi > 0 else 0.0

            # ── Fetch exam score for this subject + term ───────────────
            exam_score_obj = ExamScore.objects.filter(
                student=student,
                subject=subject,
                exam__term_id=term_id
            ).first()
            exam_raw = float(exam_score_obj.score) if exam_score_obj else 0.0
            exam_contribution = (exam_raw / 100.0) * 80.0

            final_total = aoi_contribution + exam_contribution

            # ── Persist SubjectReport ───────────────────────────────────
            subject_report, _ = SubjectReport.objects.update_or_create(
                report_card=report_card,
                subject=subject,
                defaults={
                    'teacher': teacher,
                    'aoi_raw_score': raw_aoi_total,
                    'aoi_score': round(aoi_contribution, 2),
                    'exam_raw_score': exam_raw,
                    'exam_score': round(exam_contribution, 2),
                    'grade': None,  # Always recalculate grade on generation
                }
            )

            # ── Sync individual score rows (delete + recreate) ──────────
            SubjectCompetencyScore.objects.filter(subject_report=subject_report).delete()

            # One row per AOI
            SubjectCompetencyScore.objects.bulk_create([
                SubjectCompetencyScore(
                    subject_report=subject_report,
                    assessment_type='aoi',
                    competency_name=item["title"],
                    score=item["score"],
                    max_score=3.0,
                )
                for item in aoi_items
            ])

            # One row for the exam
            SubjectCompetencyScore.objects.create(
                subject_report=subject_report,
                assessment_type='exam',
                competency_name='End of Term Examination',
                score=exam_raw,
                max_score=100.0,
            )

            subject_reports_data.append({
                "subject": subject.name,
                "subject_code": subject.code,
                "teacher": teacher.user_profile.get_full_name() if teacher else None,
                "aois": aoi_items,
                "aoi_raw_total": round(raw_aoi_total, 2),
                "aoi_max_possible": max_possible_aoi,
                "aoi_contribution": round(aoi_contribution, 2),
                "exam_raw": exam_raw,
                "exam_contribution": round(exam_contribution, 2),
                "final_total": round(final_total, 2),
                "grade": subject_report.grade,
            })

            overall_total += final_total
            subject_count += 1

        return subject_reports_data, overall_total, subject_count

    def _compute_alevel_report(self, student, academic_year_id, term_id, class_obj, stream, report_card):
        """
        Computes the A-Level report card for a single student.
        A-Level computations calculate the average of all paper percentage scores.
        """
        assignments = TeacherSubjectAssignment.objects.filter(
            stream=stream,
            academic_year_id=academic_year_id,
            is_active=True
        ).select_related('subject', 'teacher')

        if assignments.exists():
            subject_teacher_pairs = [(a.subject, a.teacher) for a in assignments]
        else:
            from members.models import Subject as MemberSubject
            # Fallback: only include subjects where the student has scores for this term
            scored_subject_ids = ExamPaperScore.objects.filter(
                student=student, exam__term_id=term_id
            ).values_list('paper__subject_id', flat=True).distinct()
            
            standard_subject_ids = ExamScore.objects.filter(
                student=student, exam__term_id=term_id
            ).values_list('subject_id', flat=True).distinct()
            
            all_ids = set(scored_subject_ids).union(set(standard_subject_ids))
            school_subjects = MemberSubject.objects.filter(id__in=all_ids)
            subject_teacher_pairs = [(s, None) for s in school_subjects]

        subject_reports_data = []
        overall_total = 0.0
        subject_count = 0

        for subject, teacher in subject_teacher_pairs:

            # 1. Fetch defined active papers for this subject
            defined_papers = SubjectPaper.objects.filter(subject=subject, is_active=True)
            
            # 2. Query paper-level scores
            paper_scores = ExamPaperScore.objects.filter(
                exam__term_id=term_id,
                student=student,
                paper__in=defined_papers
            ).select_related('paper')

            # Calculate individual paper details and overall percentage
            total_pct = 0.0
            papers_data = []
            
            if defined_papers.exists():
                for paper in defined_papers:
                    # Find matching paper score
                    ps = next((x for x in paper_scores if x.paper_id == paper.id), None)
                    score_val = float(ps.score) if ps else 0.0
                    max_score = float(paper.max_score)
                    pct = (score_val / max_score) * 100.0 if max_score > 0.0 else 0.0
                    
                    papers_data.append({
                        "paper_id": paper.id,
                        "name": paper.name,
                        "code": paper.code,
                        "score": score_val,
                        "max_score": max_score,
                        "percentage": round(pct, 2)
                    })
                    total_pct += pct
                
                final_total = total_pct / defined_papers.count()
            else:
                # If no papers are defined, fallback to the standard overall ExamScore record if it exists
                exam_score_obj = ExamScore.objects.filter(
                    student=student,
                    subject=subject,
                    exam__term_id=term_id
                ).first()
                final_total = float(exam_score_obj.score) if exam_score_obj else 0.0

            # Map total mark to A-level grade scale
            if final_total >= 80.0:
                grade = 'A'
            elif final_total >= 70.0:
                grade = 'B'
            elif final_total >= 60.0:
                grade = 'C'
            elif final_total >= 50.0:
                grade = 'D'
            elif final_total >= 40.0:
                grade = 'E'
            elif final_total >= 35.0:
                grade = 'O'
            else:
                grade = 'F'

            # Persist to Django SubjectReport model
            subject_report, _ = SubjectReport.objects.update_or_create(
                report_card=report_card,
                subject=subject,
                defaults={
                    'teacher': teacher,
                    'aoi_raw_score': 0.0,
                    'aoi_score': 0.0,
                    'exam_raw_score': final_total,
                    'exam_score': round(final_total, 2),
                    'grade': grade,
                }
            )

            # Sync individual paper scores to SubjectCompetencyScore table for full detailing
            SubjectCompetencyScore.objects.filter(subject_report=subject_report).delete()
            
            if defined_papers.exists():
                for pd in papers_data:
                    SubjectCompetencyScore.objects.create(
                        subject_report=subject_report,
                        assessment_type='exam',
                        competency_name=f"{pd['name']} ({pd['code'] or 'N/A'})",
                        score=pd['score'],
                        max_score=pd['max_score'],
                    )
            else:
                SubjectCompetencyScore.objects.create(
                    subject_report=subject_report,
                    assessment_type='exam',
                    competency_name='Overall Examination Score',
                    score=final_total,
                    max_score=100.0,
                )

            # Format list output for client
            formatted_papers = []
            for pd in papers_data:
                formatted_papers.append({
                    "paper_id": pd["paper_id"],
                    "title": f"{pd['name']} ({pd['code'] or 'N/A'})",
                    "score": pd["score"],
                    "max_score": pd["max_score"],
                    "percentage": pd["percentage"]
                })

            subject_reports_data.append({
                "subject": subject.name,
                "subject_code": subject.code,
                "teacher": teacher.user_profile.get_full_name() if teacher else None,
                "aois": [], # A-level has no O-level coursework AOIs
                "aoi_raw_total": 0.0,
                "aoi_max_possible": 0.0,
                "aoi_contribution": 0.0,
                "exam_raw": final_total,
                "exam_contribution": round(final_total, 2),
                "final_total": round(final_total, 2),
                "grade": grade,
                "papers": formatted_papers
            })

            overall_total += final_total
            subject_count += 1

        return subject_reports_data, overall_total, subject_count


class SubjectReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubjectReport.objects.all()
    serializer_class = SubjectReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_by_school(qs, self.request, school_field_path='report_card__student__campus__schools')


class ReportCardSettingsViewSet(viewsets.ViewSet):
    """
    Manages the per-school ReportCardSettings record.

    GET  /report-settings/          → list (returns the single settings object for the school)
    GET  /report-settings/{id}/     → retrieve
    PATCH /report-settings/{id}/    → partial update
    POST /report-settings/          → create (or return existing)
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_school(self, request):
        """Resolve the school from the requesting user's profile."""
        profile = getattr(request.user, 'profile', None)
        if profile:
            school = getattr(profile, 'school', None)
            if school:
                return school
        # Fallback: look up via School model ownership
        from schools.models import School
        return School.objects.filter(owner=request.user).first()

    def list(self, request):
        school = self._get_school(request)
        if not school:
            return Response({'error': 'No school associated with this user.'}, status=status.HTTP_404_NOT_FOUND)
        settings, _ = ReportCardSettings.objects.get_or_create(school=school)
        serializer = ReportCardSettingsSerializer(settings)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        try:
            settings = ReportCardSettings.objects.get(pk=pk)
        except ReportCardSettings.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReportCardSettingsSerializer(settings)
        return Response(serializer.data)

    def create(self, request):
        school = self._get_school(request)
        if not school:
            return Response({'error': 'No school associated with this user.'}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = ReportCardSettings.objects.get_or_create(school=school)
        serializer = ReportCardSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        try:
            settings = ReportCardSettings.objects.get(pk=pk)
        except ReportCardSettings.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReportCardSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        return self.partial_update(request, pk)
