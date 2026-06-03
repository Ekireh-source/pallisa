document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadStreams();
});

let currentStep = 1;
let currentStreamId = null;
let currentSubjectId = null;
let studentRosterCache = [];

function goBack() {
    if (currentStep === 2) {
        document.getElementById('step2-directory').classList.add('hidden');
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
                card.className = "w-full bg-white p-4 rounded-2xl  border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform text-left";
                card.onclick = () => openStreamDirectory(stream.stream_id, stream.subject_id, stream.stream_name, stream.subject_name);
                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600"><i data-lucide="graduation-cap" class="w-6 h-6"></i></div>
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

function openStreamDirectory(streamId, subjectId, streamName, subjectName) {
    currentStreamId = streamId;
    currentSubjectId = subjectId;

    document.getElementById('dirStreamTitle').innerText = streamName;
    document.getElementById('dirSubjectTitle').innerText = subjectName;

    document.getElementById('step1-streams').classList.add('hidden');
    document.getElementById('step2-directory').classList.remove('hidden');
    currentStep = 2;

    fetchStreamRosterRecords(streamId);
}

async function fetchStreamRosterRecords(streamId) {
    const grid = document.getElementById('directoryRosterGrid');
    grid.innerHTML = `<div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Compiling true records...</div>`;

    document.getElementById('inpDirectorySearch').value = '';

    try {
        const response = await fetch(`api/attendance.php?action=get_roster&stream_id=${streamId}&subject_id=${currentSubjectId}`);
        const result = await response.json();

        if (result.success && result.data.learners) {
            studentRosterCache = result.data.learners || [];
            document.getElementById('lblRosterCount').innerText = `${studentRosterCache.length} Learners`;

            // Render baseline container shells
            renderDirectoryCards(studentRosterCache);
        }
    } catch (e) {
        grid.innerHTML = `<div class="text-red-500 text-center py-5">Roster compile pipeline exception logged.</div>`;
    }
}

function renderDirectoryCards(arrayData) {
    const grid = document.getElementById('directoryRosterGrid');
    grid.innerHTML = '';

    if (arrayData.length === 0) {
        grid.innerHTML = `<div class="text-center py-10 text-slate-400 font-medium">No matching student profile logs located.</div>`;
        return;
    }

    arrayData.forEach((learner, index) => {
        const cardWrapper = document.createElement('div');
        cardWrapper.id = `card_wrapper_${learner.learner_id}`;
        cardWrapper.className = "flex flex-col bg-white rounded-2xl  border border-slate-100 overflow-hidden transition-all duration-200";

        const guardianHotline = `+2567000000${index + 1}`;

        cardWrapper.innerHTML = `
            <div onclick="toggleStudentHistoryView(${learner.learner_id})" class="p-3.5 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors select-none">
                <div class="flex items-center gap-3 truncate max-w-[55%]">
                    <div class="w-9 h-9 rounded-full bg-slate-100 font-bold text-xs text-slate-500 flex items-center justify-center flex-shrink-0">
                        ${learner.full_name.charAt(0)}
                    </div>
                    <div class="truncate">
                        <p class="text-sm font-bold text-slate-800 truncate">${learner.full_name}</p>
                        <p class="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">${learner.admission_number}</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-2.5" onclick="event.stopPropagation();">
                    <span id="rate_badge_${learner.learner_id}" class="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">--%</span>
                    
                    <a href="sms:${guardianHotline}" class="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition-all">
                        <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                    </a>
                    <a href="tel:${guardianHotline}" class="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 active:scale-95 transition-all">
                        <i data-lucide="phone" class="w-3.5 h-3.5"></i>
                    </a>
                </div>
            </div>

            <div id="dropdown_${learner.learner_id}" class="hidden border-t border-slate-100/70 bg-slate-50/50 p-4 text-xs space-y-3">
                <div class="text-center text-slate-400"><i data-lucide="loader-2" class="w-4 h-4 animate-spin inline"></i></div>
            </div>
        `;
        grid.appendChild(cardWrapper);

        // Asynchronously load real metrics to color the cards right away
        loadTrueStudentMetricsInline(learner.learner_id);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Background evaluation routine that updates calculations instantly
async function loadTrueStudentMetricsInline(learnerId) {
    try {
        const response = await fetch(`api/attendance.php?action=get_student_history&learner_id=${learnerId}&subject_id=${currentSubjectId}`);
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            const total = parseInt(data.total_classes) || 0;
            const present = parseInt(data.attended_classes) || 0;
            const rate = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 100.0;

            const badge = document.getElementById(`rate_badge_${learnerId}`);
            const wrapper = document.getElementById(`card_wrapper_${learnerId}`);
            const dropdown = document.getElementById(`dropdown_${learnerId}`);

            // TARGET WARNING DESIGN RULES: Highlight dodging students in red
            if (rate < 75.0 && total > 0) {
                badge.className = "text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 px-2 py-1 rounded-lg animate-pulse";
                wrapper.className = "flex flex-col bg-white rounded-2xl  border border-rose-200 overflow-hidden";
            } else {
                badge.className = "text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg";
                wrapper.className = "flex flex-col bg-white rounded-2xl  border border-slate-100 overflow-hidden";
            }
            badge.innerText = `${rate}%`;

            // Build itemized date lists cleanly without zone distortions
            let absenceLogsHtml = '';
            if (data.absence_dates && data.absence_dates.length > 0) {
                const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                let datesList = data.absence_dates.map(dateStr => {
                    if (!dateStr || !dateStr.includes('-')) return '';
                    const parts = dateStr.split('-');
                    const monthIdx = parseInt(parts[1], 10) - 1;
                    const dayNum = parseInt(parts[2], 10);
                    return `<span class="bg-rose-50 text-rose-600 font-bold border border-rose-100/60 px-2 py-0.5 rounded">${monthsList[monthIdx] || parts[1]} ${dayNum}</span>`;
                }).join(' ');

                absenceLogsHtml = `
                    <div class="space-y-1 pt-1">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Recorded Absences:</p>
                        <div class="flex flex-wrap gap-1.5">${datesList}</div>
                    </div>
                `;
            } else if (total > 0) {
                absenceLogsHtml = `<p class="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> Perfect Attendance History</p>`;
            } else {
                absenceLogsHtml = `<p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">No class sessions conducted yet.</p>`;
            }

            dropdown.innerHTML = `
                <div class="flex justify-between items-baseline">
                    <p class="font-semibold text-slate-600">Total Attendance: <span class="font-bold text-slate-800">${present} / ${total} Lessons</span></p>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div class="h-full ${rate >= 75 ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full transition-all" style="width: ${rate}%"></div>
                </div>
                ${absenceLogsHtml}
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } catch (e) {
        console.error("Async payload trace error:", e);
    }
}

function toggleStudentHistoryView(learnerId) {
    const dropdown = document.getElementById(`dropdown_${learnerId}`);
    if (dropdown) dropdown.classList.toggle('hidden');
}

function filterDirectoryLive(searchVal) {
    const cleanQuery = searchVal.toLowerCase().trim();
    if (!cleanQuery) {
        renderDirectoryCards(studentRosterCache);
        return;
    }
    const filteredMatches = studentRosterCache.filter(student => {
        return student.full_name.toLowerCase().includes(cleanQuery) ||
            student.admission_number.toLowerCase().includes(cleanQuery);
    });
    renderDirectoryCards(filteredMatches);
}