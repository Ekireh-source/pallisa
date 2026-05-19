document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadStreams();
});

let currentStep = 1;
let currentStreamId = null;
let currentSubjectId = null;
let currentSubjectCode = "SUB"; // Fallback identifier
let currentAoiId = null;
let currentMaxMark = 0;
let rosterData = [];

// ==========================================
// NAVIGATION & UI FLOW
// ==========================================
function goBack() {
    if (currentStep === 2) {
        document.getElementById('step2-aoi-list').classList.add('hidden');
        document.getElementById('step1-streams').classList.remove('hidden');
        currentStep = 1;
    } else if (currentStep === 3) {
        document.getElementById('step3-scoring').classList.add('hidden');
        document.getElementById('submitBar').classList.add('hidden');
        document.getElementById('step2-aoi-list').classList.remove('hidden');
        currentStep = 2;
        fetchAoiList();
    } else {
        window.location.href = 'index.php';
    }
}

function showNotification(msg, type = 'success') {
    const toast = document.getElementById('notificationToast');
    document.getElementById('toastMessage').innerText = msg;
    document.getElementById('toastSuccessIcon').classList.toggle('hidden', type !== 'success');
    document.getElementById('toastErrorIcon').classList.toggle('hidden', type === 'success');
    toast.classList.remove('opacity-0', '-translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-10');
    }, 3000);
}

// Upgraded High-Capacity Cryptographic String Generator
function generateUniqueCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Extracted ambiguous items (0, 1, I, O)
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `AOI-2026-T2-${currentSubjectCode}-${randomStr}`;
}

function openCreateAoiModal() {
    const m = document.getElementById('createAoiModal');
    const c = document.getElementById('createAoiContent');
    document.getElementById('inpAoiName').value = '';
    document.getElementById('inpAoiCode').value = generateUniqueCode();
    document.getElementById('inpMaxMark').value = '';
    m.classList.remove('hidden');
    requestAnimationFrame(() => { m.classList.remove('opacity-0'); c.classList.remove('scale-95'); c.classList.add('scale-100'); if (typeof lucide !== 'undefined') lucide.createIcons(); });
}

function openEditMaxMarkModal() {
    const m = document.getElementById('editMaxMarkModal');
    const c = document.getElementById('editMaxMarkContent');
    document.getElementById('inpEditMaxMarkValue').value = currentMaxMark;
    m.classList.remove('hidden');
    requestAnimationFrame(() => { m.classList.remove('opacity-0'); c.classList.remove('scale-95'); c.classList.add('scale-100'); });
}

function closeModal(modalId, contentId) {
    const m = document.getElementById(modalId);
    const c = document.getElementById(contentId);
    m.classList.add('opacity-0');
    c.classList.remove('scale-100');
    c.classList.add('scale-95');
    setTimeout(() => { m.classList.add('hidden'); }, 300);
}

// ==========================================
// STEP 1: LOAD STREAMS
// ==========================================
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
                card.onclick = () => {
                    currentSubjectCode = stream.subject_code ? stream.subject_code.toUpperCase() : 'SUB';
                    loadAoisForStream(stream.stream_id, stream.subject_id, stream.stream_name, stream.subject_name);
                };
                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><i data-lucide="layers" class="w-6 h-6"></i></div>
                        <div><h4 class="text-lg font-bold text-slate-800">${stream.stream_name}</h4><p class="text-sm text-slate-500 font-medium">${stream.subject_name}</p></div>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300"></i>
                `;
                list.appendChild(card);
            });
            lucide.createIcons();
        } else {
            list.innerHTML = `<div class="text-center py-6 text-slate-500 bg-white rounded-2xl border border-slate-100">No classes assigned.</div>`;
        }
    } catch (e) {
        document.getElementById('streamsList').innerHTML = `<div class="text-red-500 text-center py-5">Failed to load classes.</div>`;
    }
}

// ==========================================
// STEP 2: AOI LOGS
// ==========================================
async function loadAoisForStream(streamId, subjectId, streamName, subjectName) {
    currentStreamId = streamId;
    currentSubjectId = subjectId;
    document.getElementById('aoiStreamTitle').innerText = streamName;
    document.getElementById('aoiSubjectTitle').innerText = subjectName;
    
    document.getElementById('step1-streams').classList.add('hidden');
    document.getElementById('step2-aoi-list').classList.remove('hidden');
    currentStep = 2;

    fetchAoiList();
}

async function fetchAoiList() {
    const list = document.getElementById('aoiContainer');
    list.innerHTML = `<div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Loading...</div>`;
    lucide.createIcons();

    try {
        const response = await fetch(`api/aoi.php?action=get_aois&stream_id=${currentStreamId}&subject_id=${currentSubjectId}`);
        const result = await response.json();
        list.innerHTML = '';

        if (result.success && result.data.length > 0) {
            result.data.forEach(aoi => {
                let statusBadge = '';
                let statusIconColor = 'text-brand';
                
                if (aoi.status === 'empty') {
                    statusBadge = `<span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">Not Entered</span>`;
                    statusIconColor = 'text-slate-400';
                } else if (aoi.status === 'partial') {
                    statusBadge = `<span class="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-bold">In Progress (${aoi.scores_entered}/${aoi.total_learners})</span>`;
                    statusIconColor = 'text-amber-500';
                } else if (aoi.status === 'completed') {
                    statusBadge = `<span class="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold">Fully Marked</span>`;
                    statusIconColor = 'text-emerald-500';
                }

                const card = document.createElement('button');
                card.className = "w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform text-left";
                card.onclick = () => openScoring(aoi.aoi_id, aoi.aoi_name, aoi.unique_code, aoi.max_mark);
                
                card.innerHTML = `
                    <div>
                        <h4 class="text-md font-bold text-slate-800">${aoi.aoi_name}</h4>
                        <div class="flex flex-wrap gap-2 mt-1.5 items-center">
                            <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">${aoi.unique_code}</span>
                            <span class="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold">Max: ${aoi.max_mark}</span>
                            ${statusBadge}
                        </div>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center ${statusIconColor}">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </div>
                `;
                list.appendChild(card);
            });
            lucide.createIcons();
        } else {
            list.innerHTML = `<div class="text-center py-6 text-slate-500 bg-white rounded-2xl border border-slate-100 border-dashed">No Activities created yet. Tap '+' to create one.</div>`;
        }
    } catch (e) {
        list.innerHTML = `<div class="text-red-500 text-center py-5">Failed to load activities.</div>`;
    }
}

async function submitNewAoi() {
    const name = document.getElementById('inpAoiName').value;
    const code = document.getElementById('inpAoiCode').value;
    const max = parseFloat(document.getElementById('inpMaxMark').value);
    
    if(!name || !code || !max || max <= 0) {
        showNotification("Please fill all fields correctly.", "error");
        return;
    }

    const btn = document.getElementById('btnSaveAoi');
    btn.innerHTML = "Saving..."; btn.disabled = true;

    try {
        const response = await fetch('api/aoi.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_aoi', stream_id: currentStreamId, subject_id: currentSubjectId, term: 2, academic_year: 2026, aoi_name: name, unique_code: code, max_mark: max })
        });
        const result = await response.json();
        
        if (result.success) {
            showNotification("Activity Created!");
            closeModal('createAoiModal', 'createAoiContent');
            fetchAoiList();
        } else {
            showNotification(result.message, "error");
        }
    } catch (e) {
        showNotification("Network error.", "error");
    } finally {
        btn.innerHTML = "Create"; btn.disabled = false;
    }
}

// ==========================================
// STEP 3: SCORE ENTRY & LIVE RE-CALCULATION
// ==========================================
async function openScoring(aoiId, name, code, maxMark) {
    currentAoiId = aoiId;
    currentMaxMark = parseFloat(maxMark);
    
    document.getElementById('scoringAoiName').innerText = name;
    document.getElementById('scoringAoiCode').innerText = code;
    document.getElementById('scoringMaxMark').innerText = maxMark;

    document.getElementById('step2-aoi-list').classList.add('hidden');
    document.getElementById('step3-scoring').classList.remove('hidden');
    document.getElementById('submitBar').classList.remove('hidden');
    currentStep = 3;

    renderRosterGrid();
}

async function renderRosterGrid() {
    const list = document.getElementById('learnersList');
    list.innerHTML = `<div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Loading roster...</div>`;
    lucide.createIcons();

    try {
        const response = await fetch(`api/aoi.php?action=get_roster&aoi_id=${currentAoiId}&stream_id=${currentStreamId}`);
        const result = await response.json();
        list.innerHTML = '';
        rosterData = [];

        if (result.success && result.data.length > 0) {
            result.data.forEach((learner, index) => {
                const score = learner.score_entered !== null ? learner.score_entered : '';
                rosterData.push({ learner_id: learner.learner_id, score: score });
                
                let pctHtml = '<span class="text-[10px] text-slate-400 font-bold">--%</span>';
                if (score !== '') {
                    const pct = ((score / currentMaxMark) * 100).toFixed(1);
                    pctHtml = `<span class="text-sm text-emerald-600 font-bold">${pct}%</span>`;
                }

                const div = document.createElement('div');
                div.className = "bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between";
                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">${index + 1}</div>
                        <div>
                            <p class="text-sm font-bold text-slate-800">${learner.full_name}</p>
                            <p class="text-[10px] text-slate-400 tracking-wider uppercase">${learner.admission_number}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <div id="pct_${learner.learner_id}" class="w-12 text-right">${pctHtml}</div>
                        <input type="number" step="0.5" min="0" max="${currentMaxMark}" value="${score}" data-learner="${learner.learner_id}"
                            class="score-input-field w-16 h-10 px-2 text-center font-bold text-brand bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                            onkeyup="updateScore(${learner.learner_id}, this.value, this)" 
                            onchange="updateScore(${learner.learner_id}, this.value, this)">
                    </div>
                `;
                list.appendChild(div);
            });
        }
    } catch (e) {
        list.innerHTML = `<div class="text-red-500 text-center py-5">Failed to load roster.</div>`;
    }
}

function updateScore(learnerId, val, inputEl) {
    let score = parseFloat(val);
    const pctContainer = document.getElementById(`pct_${learnerId}`);
    const record = rosterData.find(r => r.learner_id === learnerId);

    if (isNaN(score) || val === '') {
        record.score = null;
        pctContainer.innerHTML = '<span class="text-[10px] text-slate-400 font-bold">--%</span>';
        if(inputEl) inputEl.style.borderColor = '#e2e8f0';
        return;
    }

    if (score > currentMaxMark) {
        score = currentMaxMark;
        if(inputEl) { inputEl.value = currentMaxMark; inputEl.style.borderColor = '#ef4444'; }
    } else {
        if(inputEl) inputEl.style.borderColor = '#0a58ca';
    }

    record.score = score;
    const pct = ((score / currentMaxMark) * 100).toFixed(1);
    pctContainer.innerHTML = `<span class="text-sm text-emerald-600 font-bold">${pct}%</span>`;
}

// Handler that triggers the Max Mark modification on the Backend API
async function submitEditedMaxMark() {
    const newMax = parseFloat(document.getElementById('inpEditMaxMarkValue').value);
    if (!newMax || newMax <= 0) {
        showNotification("Please enter a valid positive value.", "error");
        return;
    }

    const btn = document.getElementById('btnUpdateMaxMark');
    btn.innerHTML = "Updating..."; btn.disabled = true;

    try {
        const response = await fetch('api/aoi.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_max_mark', aoi_id: currentAoiId, max_mark: newMax })
        });
        const result = await response.json();

        if (result.success) {
            currentMaxMark = newMax;
            document.getElementById('scoringMaxMark').innerText = newMax;
            showNotification("Max Mark Adjusted!");
            closeModal('editMaxMarkModal', 'editMaxMarkContent');

            // High-Performance UX: Loop through array and instantly recalculate rows without reloading API
            rosterData.forEach(record => {
                const inputEl = document.querySelector(`input[data-learner="${record.learner_id}"]`);
                if (record.score !== null) {
                    // Adjust limits dynamically if old score was higher than the new max mark
                    if (record.score > currentMaxMark) {
                        record.score = currentMaxMark;
                        if(inputEl) inputEl.value = currentMaxMark;
                    }
                    updateScore(record.record_id || record.learner_id, record.score, inputEl);
                }
                if(inputEl) inputEl.setAttribute('max', currentMaxMark); // Reset ceiling attribute
            });

        } else {
            showNotification(result.message, "error");
        }
    } catch (e) {
        showNotification("Failed to update max mark.", "error");
    } finally {
        btn.innerHTML = "Apply Change"; btn.disabled = false;
    }
}

async function submitScores() {
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Saving...`;
    lucide.createIcons();
    btn.disabled = true;

    const validRecords = rosterData.filter(r => r.score !== null);

    try {
        const response = await fetch('api/aoi.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_scores', aoi_id: currentAoiId, records: validRecords })
        });
        const result = await response.json();
        
        if (result.success) {
            showNotification("Scores Saved Successfully!");
            setTimeout(() => { goBack(); btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> Save Scores`; btn.disabled = false; lucide.createIcons(); }, 1500);
        } else {
            showNotification(result.message, "error");
            btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> Save Scores`; btn.disabled = false; lucide.createIcons();
        }
    } catch (error) {
        showNotification("Network error.", "error");
        btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> Save Scores`; btn.disabled = false; lucide.createIcons();
    }
}