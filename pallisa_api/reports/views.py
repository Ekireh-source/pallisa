from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Sum
from .models import ReportCard, SubjectReport, SubjectCompetencyScore, GradingSystem, GradeBoundary
from .serializers import (
    ReportCardSerializer, SubjectReportSerializer, GenerateReportCardSerializer,
    GradingSystemSerializer, GradeBoundarySerializer
)
from exams.models import IntegrationScore, ExamScore, ActivityOfIntegration
from members.models import Student, TeacherSubjectAssignment
from expenses.models import AcademicYear, Term

class GradingSystemViewSet(viewsets.ModelViewSet):
    queryset = GradingSystem.objects.all()
    serializer_class = GradingSystemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        school_id = self.request.query_params.get('school')
        if school_id:
            qs = qs.filter(school_id=school_id)
        return qs

class GradeBoundaryViewSet(viewsets.ModelViewSet):
    queryset = GradeBoundary.objects.all()
    serializer_class = GradeBoundarySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        system_id = self.request.query_params.get('grading_system')
        if system_id:
            qs = qs.filter(grading_system_id=system_id)
        return qs


class ReportCardViewSet(viewsets.ModelViewSet):
    queryset = ReportCard.objects.all()
    serializer_class = ReportCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ReportCard.objects.all()
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

            # ── 3. Get subjects for this stream ──────────────────────────────
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
            overall_total = 0
            subject_count = 0

            for subject, teacher in subject_teacher_pairs:

                # ── 4a. Fetch every defined AOI for this subject + term ────────
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
                        "title": aoi.title,
                        "score": round(scaled_score, 2),
                        "max_score": 3.0,
                    })

                # AOI contribution: (total_scaled / (count * 3)) * 20
                max_possible_aoi = aoi_count * 3.0
                aoi_contribution = (raw_aoi_total / max_possible_aoi * 20.0) if max_possible_aoi > 0 else 0.0

                # ── 4b. Fetch exam score for this subject + term ───────────────
                exam_score_obj = ExamScore.objects.filter(
                    student=student,
                    subject=subject,
                    exam__term_id=term_id
                ).first()
                exam_raw = float(exam_score_obj.score) if exam_score_obj else 0.0
                exam_contribution = (exam_raw / 100.0) * 80.0

                final_total = aoi_contribution + exam_contribution

                # ── 5. Persist SubjectReport ───────────────────────────────────
                # Preserve existing grade — do not recalculate
                existing_report = SubjectReport.objects.filter(
                    report_card=report_card, subject=subject
                ).first()
                existing_grade = existing_report.grade if existing_report else None

                subject_report, _ = SubjectReport.objects.update_or_create(
                    report_card=report_card,
                    subject=subject,
                    defaults={
                        'teacher': teacher,
                        'aoi_raw_score': raw_aoi_total,
                        'aoi_score': round(aoi_contribution, 2),
                        'exam_raw_score': exam_raw,
                        'exam_score': round(exam_contribution, 2),
                        'grade': existing_grade,  # keep existing; model will set if None
                    }
                )

                # ── 6. Sync individual score rows (delete + recreate) ──────────
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

            # ── 7. Update overall ReportCard totals ───────────────────────────
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


class SubjectReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubjectReport.objects.all()
    serializer_class = SubjectReportSerializer
    permission_classes = [permissions.IsAuthenticated]
