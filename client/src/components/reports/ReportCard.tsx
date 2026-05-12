"use client";

import React from "react";
import { ReportCardData } from "@/types/report";
import { processSubjects, getTeacherRemark } from "@/lib/utils";
import styles from "./ReportCard.module.css";

interface ReportCardProps {
  data: ReportCardData;
}

const GRADE_COLORS: Record<string, string> = {
  "grade-A": styles.gradeA,
  "grade-B": styles.gradeB,
  "grade-C": styles.gradeC,
  "grade-D": styles.gradeD,
  "grade-F": styles.gradeF,
};

export default function ReportCard({ data }: ReportCardProps) {
  const { school, student, subjects } = data;
  const processed = processSubjects(subjects);

  const totals = processed.reduce(
    (acc, s) => ({
      bot: acc.bot + s.bot,
      mot: acc.mot + s.mot,
      eot: acc.eot + s.eot,
      aoi: acc.aoi + s.aoi,
      subTotal: acc.subTotal + s.subTotal,
      cumTotal: acc.cumTotal + s.cumTotal,
    }),
    { bot: 0, mot: 0, eot: 0, aoi: 0, subTotal: 0, cumTotal: 0 }
  );

  const avg = (totals.cumTotal / processed.length).toFixed(1);
  const teacherRemark = getTeacherRemark(parseFloat(avg));
  const maxTotal = processed.length * 100;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.crest} aria-hidden="true">
          <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" width={30} height={30}>
            <circle cx="15" cy="8" r="4" fill="#185FA5" />
            <path d="M15 13 L6 18 L15 23 L24 18 Z" fill="#185FA5" />
            <rect x="12" y="23" width="6" height="4" rx="1" fill="#185FA5" />
          </svg>
        </div>
        <div className={styles.schoolInfo}>
          <h1 className={styles.schoolName}>{school.name}</h1>
          <p className={styles.schoolAddress}>
            {school.address}&nbsp;·&nbsp;Academic Report Card
          </p>
        </div>
        <div className={styles.termBadge}>
          {student.term} · {student.year}
        </div>
      </div>

      {/* Student Meta */}
      <div className={styles.meta}>
        <MetaItem label="Student Name" value={student.name} />
        <MetaItem label="Admission No." value={student.admissionNo} />
        <MetaItem label="Class / Stream" value={`${student.class} · ${student.stream}`} />
        <MetaItem label="Class Teacher" value={student.classTeacher} />
      </div>

      {/* Marks Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thLeft}>Subject</th>
              <th>BOT<br /><span className={styles.thSub}>Test 1</span></th>
              <th>MOT<br /><span className={styles.thSub}>Test 2</span></th>
              <th>EOT<br /><span className={styles.thSub}>Exam</span></th>
              <th>AOI<br /><span className={styles.thSub}>/20</span></th>
              <th>Total<br /><span className={styles.thSub}>/100</span></th>
              <th>Exam<br /><span className={styles.thSub}>/80</span></th>
              <th>Cum.<br /><span className={styles.thSub}>Total</span></th>
              <th>Grd</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {processed.map((s, i) => (
              <tr key={i} className={i % 2 === 1 ? styles.rowAlt : ""}>
                <td className={styles.tdLeft}>{s.name}</td>
                <td>{s.bot}</td>
                <td>{s.mot}</td>
                <td>{s.eot}</td>
                <td>{s.aoi}</td>
                <td>{s.subTotal}</td>
                <td>{s.examMark}</td>
                <td><strong>{s.cumTotal}</strong></td>
                <td>
                  <span className={`${styles.gradeBadge} ${GRADE_COLORS[s.gradeCls]}`}>
                    {s.grade}
                  </span>
                </td>
                <td className={styles.tdRemarks}>{s.remarks}</td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className={styles.totalsRow}>
              <td className={styles.tdLeft}>Totals</td>
              <td>{totals.bot}</td>
              <td>{totals.mot}</td>
              <td>{totals.eot}</td>
              <td>{totals.aoi}</td>
              <td>{totals.subTotal}</td>
              <td>{totals.eot}</td>
              <td>{totals.cumTotal}</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className={styles.footer}>
        <FooterItem label="Total Marks Scored" value={`${totals.cumTotal} / ${maxTotal}`} />
        <FooterItem label="Average" value={`${avg}%`} />
        <FooterItem
          label="Class Position"
          value={
            <span className={styles.posPill}>
              {student.position} / {student.outOf}
            </span>
          }
        />
        <FooterItem
          label="Aggregate (Div.)"
          value={`${student.division} (Agg. ${student.aggregate})`}
        />
      </div>

      {/* Teacher Remarks */}
      <div className={styles.remarksBox}>
        <p className={styles.remarksLabel}>Class Teacher&apos;s Remarks</p>
        <p className={styles.remarksText}>{teacherRemark}</p>
      </div>

      {/* Signatures */}
      <div className={styles.sigRow}>
        <SigBlock label="Class Teacher" />
        <SigBlock label="Head Teacher" />
        <SigBlock label="Parent / Guardian" />
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaItem}>
      <p className={styles.metaLabel}>{label}</p>
      <p className={styles.metaValue}>{value}</p>
    </div>
  );
}

function FooterItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.footerSection}>
      <p className={styles.footerLabel}>{label}</p>
      <div className={styles.footerValue}>{value}</div>
    </div>
  );
}

function SigBlock({ label }: { label: string }) {
  return (
    <div className={styles.sigBlock}>
      <div className={styles.sigLine}>{label}</div>
    </div>
  );
}
