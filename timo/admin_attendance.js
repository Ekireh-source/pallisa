document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadAttendanceData();
});

let masterData = [];

function navigateTo(url) { setTimeout(() => { window.location.href = url; }, 50); }

async function loadAttendanceData() {
    try {
        const response = await fetch('api/admin_attendance.php?action=get_analytics');
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            masterData = data.learners;

            // Set Term Badge
            document.getElementById('headerTermBadge').innerText = `Term ${data.term}, ${data.year}`;

            // Populate KPIs
            document.getElementById('kpiRate').innerText = `${data.kpis.global_rate}%`;
            document.getElementById('kpiRate').className = `text-3xl font-extrabold tracking-tight ${data.kpis.global_rate >= 75 ? 'text-emerald-600' : 'text-rose-500'}`;
            document.getElementById('kpiLessons').innerText = data.kpis.total_sessions;

            document.getElementById('kpiBest').innerText = data.kpis.best_stream || 'N/A';
            document.getElementById('kpiBestSub').innerText = data.kpis.best_stream ? `${data.kpis.best_rate}% Attendance` : '--';

            document.getElementById('kpiWorst').innerText = data.kpis.worst_stream || 'N/A';
            document.getElementById('kpiWorstSub').innerText = data.kpis.worst_stream ? `${data.kpis.worst_rate}% Attendance` : '--';

            // Populate Filters
            const streamSel = document.getElementById('selStreamFilter');
            const subSel = document.getElementById('selSubjectFilter');

            data.filters.streams.forEach(s => { streamSel.innerHTML += `<option value="${s}">${s}</option>`; });
            data.filters.subjects.forEach(s => { subSel.innerHTML += `<option value="${s}">${s}</option>`; });

            renderTable(masterData);
        }
    } catch (error) {
        document.getElementById('attendanceTableBody').innerHTML = `<tr><td colspan="6" class="text-center py-10 text-rose-500 font-bold">Failed to load attendance analytics.</td></tr>`;
    }
}

function applyFilters() {
    const search = document.getElementById('inpSearch').value.toLowerCase().trim();
    const stream = document.getElementById('selStreamFilter').value;
    const subject = document.getElementById('selSubjectFilter').value;

    const filtered = masterData.filter(row => {
        const matchSearch = row.full_name.toLowerCase().includes(search) || row.admission_number.toLowerCase().includes(search);
        const matchStream = stream === "" || row.stream_full === stream;
        const matchSubject = subject === "" || row.subjects_list.includes(subject);
        return matchSearch && matchStream && matchSubject;
    });

    renderTable(filtered);
}

function renderTable(dataArray) {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    if (dataArray.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400 font-medium">No matching records found.</td></tr>`;
        return;
    }

    dataArray.forEach(row => {
        const rate = parseFloat(row.attendance_rate);
        const rateColor = rate >= 75 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200 font-extrabold';

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-slate-50/50 transition-colors";
        tr.innerHTML = `
            <td class="py-3 px-5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 flex-shrink-0">
                        ${row.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p class="font-extrabold text-slate-800 leading-tight">${row.full_name}</p>
                        <p class="text-[10px] font-mono text-slate-500 mt-0.5">${row.admission_number}</p>
                    </div>
                </div>
            </td>
            <td class="py-3 px-5">
                <span class="text-xs font-bold text-slate-600">${row.stream_full}</span>
            </td>
            <td class="py-3 px-5 text-center font-bold text-slate-700">${row.total_lessons}</td>
            <td class="py-3 px-5 text-center font-bold text-emerald-600">${row.present}</td>
            <td class="py-3 px-5 text-center font-bold text-rose-500">${row.absent}</td>
            <td class="py-3 px-5 text-right">
                <span class="px-2.5 py-1 rounded-md text-xs border  ${rateColor}">${rate}%</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function exportToCSV() {
    if (masterData.length === 0) return;

    let csv = "Full Name,LIN,Stream,Total Lessons,Present,Absent,Attendance Rate (%)\n";
    masterData.forEach(r => {
        csv += `"${r.full_name}","${r.admission_number}","${r.stream_full}",${r.total_lessons},${r.present},${r.absent},${r.attendance_rate}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Global_Attendance_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function confirmLogout() { if (confirm("Are you sure you want to log out of the Admin Workspace?")) { window.location.href = 'api/logout.php'; } }