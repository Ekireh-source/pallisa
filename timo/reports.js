document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadStreams();
});

let currentStep = 1;
let currentStreamId = null;
let currentSubjectId = null;

// Global Analytics Memory States
let rawReportData = null;
let activeAoiPage = 1;
const aoiPageSize = 3; 

function goBack() {
    if (currentStep === 2) {
        document.getElementById('step2-analytics').classList.add('hidden');
        document.getElementById('step1-streams').classList.remove('hidden');
        currentStep = 1;
    } else {
        window.location.href = 'index.php';
    }
}

async function loadStreams() {
    try {
        const response = await fetch('api/attendance.php?action=get_streams');
        const result = await response.json();
        const list = document.getElementById('streamsList');
        list.innerHTML = '';

        if (result.success && result.data.length > 0) {
            result.data.forEach(stream => {
                const card = document.createElement('button');
                card.className = "w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform text-left";
                card.onclick = () => openStreamAnalytics(stream.stream_id, stream.subject_id, stream.stream_name, stream.subject_name);
                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><i data-lucide="pie-chart" class="w-6 h-6"></i></div>
                        <div><h4 class="text-lg font-bold text-slate-800">${stream.stream_name}</h4><p class="text-sm text-slate-500 font-medium">${stream.subject_name}</p></div>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300"></i>
                `;
                list.appendChild(card);
            });
            lucide.createIcons();
        } else {
            list.innerHTML = `<div class="text-center py-6 text-slate-500 bg-white rounded-2xl border border-slate-100">No streams assigned.</div>`;
        }
    } catch (e) {
        document.getElementById('streamsList').innerHTML = `<div class="text-red-500 text-center py-5">Network connection failure.</div>`;
    }
}

function openStreamAnalytics(streamId, subjectId, streamName, subjectName) {
    currentStreamId = streamId;
    currentSubjectId = subjectId;
    document.getElementById('reportStreamTitle').innerText = streamName;
    document.getElementById('reportSubjectTitle').innerText = subjectName;
    
    document.getElementById('step1-streams').classList.add('hidden');
    document.getElementById('step2-analytics').classList.remove('hidden');
    currentStep = 2;

    fetchAnalyticalReport(streamId, subjectId);
}

async function fetchAnalyticalReport(streamId, subjectId) {
    try {
        const response = await fetch('api/reports.php?stream_id=' + streamId + '&subject_id=' + subjectId);
        const result = await response.json();

        if (result.success) {
            rawReportData = result.data;
            activeAoiPage = 1; 

            document.getElementById('termInfoBadge').innerText = "Term " + rawReportData.meta.term + ", " + rawReportData.meta.year;

            // Clear previously entered calendar date pickers
            document.getElementById('inpAttDatePicker').value = '';

            renderAttendanceData('term'); 
            renderAoiListWithPagination();
            renderSubjectAchievementInsights();
        }
    } catch (e) {
        console.error("Analytics failure:", e);
    }
}

// ==========================================
// 1. ATTENDANCE INTERACTIVE ENGINE (UPGRADED)
// ==========================================
function toggleAttendanceFilter(timeframe) {
    // Clear out custom calendar dates input highlight when a standard range filter tab is clicked
    document.getElementById('inpAttDatePicker').value = '';

    const filters = ['day', 'week', 'term'];
    filters.forEach(f => {
        const btn = document.getElementById("btnAtt" + f.charAt(0).toUpperCase() + f.slice(1));
        if (btn) {
            if (f === timeframe) {
                btn.className = "flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-white text-brand shadow-sm transition-all";
            } else {
                btn.className = "flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-slate-500 transition-all";
            }
        }
    });

    renderAttendanceData(timeframe);
}

// NEW HANDLER: Triggers when the teacher inputs a custom calendar date line directly
async function filterAttendanceByCustomDate(dateValue) {
    if (!dateValue) return;

    // Unhighlight standard filter buttons since we are using a custom date range
    ['Day', 'Week', 'Term'].forEach(f => {
        document.getElementById("btnAtt" + f).className = "flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-slate-500 transition-all";
    });

    const rateTextEl = document.getElementById('txtAttendanceRate');
    const presentEl = document.getElementById('lblPresentCount');
    const absentEl = document.getElementById('lblAbsentCount');
    const chart = document.getElementById('attPieChart');

    rateTextEl.innerText = "...";

    try {
        // Direct query pass fetching data targeted for that specific day matching parameters
        const response = await fetch('api/reports.php?stream_id=' + currentStreamId + '&subject_id=' + currentSubjectId + '&custom_date=' + dateValue);
        const result = await response.json();

        if (result.success && result.data.attendance.custom) {
            const block = result.data.attendance.custom;
            const total = parseInt(block.total_records) || 0;
            const absent = parseInt(block.total_absent) || 0;
            const present = total - absent;
            const rate = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0.0;

            if (total === 0) {
                rateTextEl.innerText = "0%";
                presentEl.innerText = "0";
                absentEl.innerText = "0";
                if (chart) chart.style.background = `#cbd5e1`;
            } else {
                rateTextEl.innerText = rate + "%";
                presentEl.innerText = present;
                absentEl.innerText = absent;
                if (chart) chart.style.background = "conic-gradient(#0a58ca 0% " + rate + "%, #cbd5e1 " + rate + "% 100%)";
            }
        }
    } catch (e) {
        rateTextEl.innerText = "Error";
    }
}

function renderAttendanceData(timeframe) {
    if (!rawReportData || !rawReportData.attendance || !rawReportData.attendance[timeframe]) return;
    
    const block = rawReportData.attendance[timeframe];
    const total = parseInt(block.total_records) || 0;
    const absent = parseInt(block.total_absent) || 0;
    const present = total - absent;
    const rate = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0.0;

    const rateTextEl = document.getElementById('txtAttendanceRate');
    const presentEl = document.getElementById('lblPresentCount');
    const absentEl = document.getElementById('lblAbsentCount');
    const chart = document.getElementById('attPieChart');

    if (total === 0) {
        rateTextEl.innerText = "0%";
        presentEl.innerText = "0";
        absentEl.innerText = "0";
        if (chart) chart.style.background = `#cbd5e1`;
    } else {
        rateTextEl.innerText = rate + "%";
        presentEl.innerText = present;
        absentEl.innerText = absent;
        if (chart) chart.style.background = "conic-gradient(#0a58ca 0% " + rate + "%, #cbd5e1 " + rate + "% 100%)";
    }
}

// ==========================================
// 2. AOI PAGINATION ENGINE
// ==========================================
function renderAoiListWithPagination() {
    if (!rawReportData) return;

    const acts = rawReportData.aoi.activities || [];
    document.getElementById('txtAoiClassAvg').innerText = parseFloat(rawReportData.aoi.overall_class_average || 0) + "%";
    document.getElementById('txtAoiCount').innerText = rawReportData.aoi.activities_count || 0;

    const container = document.getElementById('aoiBreakdownContainer');
    const paginationRow = document.getElementById('aoiPaginationControls');
    container.innerHTML = '';

    if (acts.length === 0) {
        container.innerHTML = `<p class="text-center py-4 text-xs text-slate-400 font-medium">No activity scores logged yet.</p>`;
        if (paginationRow) paginationRow.classList.add('hidden');
        return;
    }

    const totalPages = Math.ceil(acts.length / aoiPageSize);
    if (paginationRow) paginationRow.classList.toggle('hidden', totalPages <= 1);
    
    const indicator = document.getElementById('txtAoiPageIndicator');
    if (indicator) indicator.innerText = "Page " + activeAoiPage + " of " + totalPages;
    
    const prevBtn = document.getElementById('btnAoiPrev');
    const nextBtn = document.getElementById('btnAoiNext');
    if (prevBtn) prevBtn.disabled = (activeAoiPage === 1);
    if (nextBtn) nextBtn.disabled = (activeAoiPage === totalPages);

    const startIdx = (activeAoiPage - 1) * aoiPageSize;
    const paginatedSlice = acts.slice(startIdx, startIdx + aoiPageSize);

    paginatedSlice.forEach(act => {
        const row = document.createElement('div');
        row.className = "flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700";
        row.innerHTML = `
            <div class="truncate max-w-[70%]">
                <p class="truncate text-slate-800">${act.aoi_name}</p>
                <span class="text-[9px] font-mono text-slate-400 uppercase tracking-wide">${act.unique_code}</span>
            </div>
            <span class="text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-md">Avg: ${parseFloat(act.class_average)}%</span>
        `;
        container.appendChild(row);
    });
}

function paginateAoi(direction) {
    activeAoiPage += direction;
    renderAoiListWithPagination();
}

// ==========================================
// 3. GRADE PROFILE INSIGHTS
// ==========================================
function renderSubjectAchievementInsights() {
    if (!rawReportData || !rawReportData.sa) return;

    const sa = rawReportData.sa;
    const aggPercentage = parseFloat(sa.overall_percentage_average || 0);
    document.getElementById('txtSaOverallAvg').innerText = aggPercentage > 0 ? aggPercentage + "%" : '--%';

    const insightBox = document.getElementById('saInsightBox');
    if (!insightBox) return;
    
    if (aggPercentage === 0) {
        insightBox.innerHTML = `⚠️ No evaluation metrics have been posted for this stream's grid yet. Log data in the SA Module to generate reports.`;
        return;
    }

    let summaryText = '';
    if (aggPercentage >= 75) {
        summaryText = `🌟 <strong>Outstanding Performance (${aggPercentage}%):</strong> The class exhibits masterful comprehension. The majority of learners are operating at highest competency boundaries, demonstrating standalone problem-solving abilities.`;
    } else if (aggPercentage >= 50) {
        summaryText = `📈 <strong>Moderate Competency Average (${aggPercentage}%):</strong> The class demonstrates stable foundational tracking. Most learners successfully understand core tasks, but target reinforcement is needed on advanced analytical structures to boost scores.`;
    } else {
        summaryText = `⚠️ <strong>Critical Intervention Alert (${aggPercentage}%):</strong> The composite score sits below desired parameters. Immediate remediation is required to re-explain fundamental concepts, as the class is experiencing structural hurdles applying basic criteria expectations.`;
    }

    insightBox.innerHTML = summaryText;
}