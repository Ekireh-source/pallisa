document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadStreams();
});

let currentStep = 1;
let currentStreamId = null;
let currentSubjectId = null;
let activeCompetency = null; 
let allowedCompetencies = []; // Will be dynamically loaded from admin database configurations

let scoreCache = {}; 
let backendLearnersList = [];

function goBack() {
    if (currentStep === 2) {
        document.getElementById('step2-board').classList.add('hidden');
        document.getElementById('submitBar').classList.add('hidden');
        document.getElementById('step1-streams').classList.remove('hidden');
        currentStep = 1;
    } else {
        window.location.href = 'index.php';
    }
}

function showNotification(msg, type = 'success') {
    const toast = document.getElementById('notificationToast');
    if (toast) {
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
                card.onclick = () => openProjectBoard(stream.stream_id, stream.subject_id, stream.stream_name, stream.subject_name);
                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><i data-lucide="folder-kanban" class="w-6 h-6"></i></div>
                        <div><h4 class="text-lg font-bold text-slate-800">${stream.stream_name}</h4><p class="text-sm text-slate-500 font-medium">${stream.subject_name}</p></div>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300"></i>
                `;
                list.appendChild(card);
            });
            lucide.createIcons();
        } else {
            list.innerHTML = `<div class="text-center py-6 text-slate-500 bg-white rounded-2xl border border-slate-100">No streams found.</div>`;
        }
    } catch (e) {
        document.getElementById('streamsList').innerHTML = `<div class="text-red-500 text-center py-5">Network connection failure.</div>`;
    }
}

async function openProjectBoard(streamId, subjectId, streamName, subjectName) {
    currentStreamId = streamId;
    currentSubjectId = subjectId;
    
    document.getElementById('projectStreamTitle').innerText = streamName;
    document.getElementById('projectSubjectTitle').innerText = subjectName;
    
    document.getElementById('step1-streams').classList.add('hidden');
    document.getElementById('step2-board').classList.remove('hidden');
    document.getElementById('submitBar').classList.remove('hidden');
    currentStep = 2;

    // Fetch scores which will now also tell us what competencies the admin activated!
    fetchProjectRosterAndTabs();
}

async function fetchProjectRosterAndTabs() {
    const list = document.getElementById('projectLearnersList');
    const tabsContainer = document.getElementById('competencyTabsContainer');
    list.innerHTML = `<div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Pulling scores records...</div>`;
    
    // Fallback indicator default if network drops mid-call
    let targetComp = activeCompetency;

    try {
        // Fallback target placeholder if none selected yet
        if (!targetComp) targetComp = 1;

        const response = await fetch(`api/projects.php?stream_id=${currentStreamId}&subject_id=${currentSubjectId}&competency_number=${targetComp}`);
        const result = await response.json();
        list.innerHTML = '';

        if (result.success) {
            backendLearnersList = result.data.learners || [];
            
            // DYNAMIC UPDATE: Hydrate allowed tabs array configured by Admin from response variables
            allowedCompetencies = result.data.active_competencies || [1,2,3,4];
            
            // Enforce safe boundaries context: if current selection isn't allowed, use the first active one
            if (!activeCompetency || !allowedCompetencies.includes(activeCompetency)) {
                activeCompetency = allowedCompetencies[0];
            }

            // Build Tab Interface on-the-fly dynamically
            tabsContainer.innerHTML = '';
            allowedCompetencies.forEach(num => {
                const btn = document.createElement('button');
                btn.onclick = () => switchCompetencyTab(num);
                btn.innerText = `C${num}`;
                if (num === activeCompetency) {
                    btn.className = "flex-1 py-2.5 text-center rounded-xl text-xs font-bold transition-all bg-white text-brand shadow-sm";
                } else {
                    btn.className = "flex-1 py-2.5 text-center rounded-xl text-xs font-semibold transition-all text-slate-500 hover:text-slate-800";
                }
                tabsContainer.appendChild(btn);
            });

            // Painter Sub-Criteria Fields blocks loop counts mapping metrics
            const targetCriteria = getCriteriaListForCompetency(activeCompetency);

            if (backendLearnersList.length === 0) {
                list.innerHTML = `<div class="text-center py-6 text-slate-500 bg-white rounded-2xl border border-slate-100">No students found in this stream.</div>`;
                return;
            }

            backendLearnersList.forEach((learner) => {
                const card = document.createElement('div');
                card.className = "bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3.5";
                let itemsHtml = '<div class="grid grid-cols-5 gap-2 w-full">';
                
                targetCriteria.forEach(fullCriteriaKey => {
                    let currentVal = '';
                    if (learner.scores && learner.scores[fullCriteriaKey] !== undefined && learner.scores[fullCriteriaKey] !== null) {
                        currentVal = learner.scores[fullCriteriaKey];
                    }
                    
                    if (!scoreCache[learner.learner_id]) scoreCache[learner.learner_id] = {};
                    if (scoreCache[learner.learner_id][fullCriteriaKey] === undefined) {
                        scoreCache[learner.learner_id][fullCriteriaKey] = currentVal !== '' ? parseFloat(currentVal) : null;
                    }

                    const boxBg = fullCriteriaKey === '1.8' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100';
                    const textLabelColor = fullCriteriaKey === '1.8' ? 'text-amber-600 font-bold' : 'text-slate-400 font-semibold';

                    itemsHtml += `
                        <div class="flex flex-col items-center gap-1 p-1.5 rounded-xl border ${boxBg}">
                            <span class="text-[9px] uppercase tracking-tight ${textLabelColor}">${fullCriteriaKey}</span>
                            <input type="number" step="0.1" min="0" value="${scoreCache[learner.learner_id][fullCriteriaKey] !== null ? scoreCache[learner.learner_id][fullCriteriaKey] : ''}" 
                                class="w-full h-7 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-brand"
                                onkeyup="cacheProjectScoreLive(${learner.learner_id}, '${fullCriteriaKey}', this.value, this)"
                                onchange="cacheProjectScoreLive(${learner.learner_id}, '${fullCriteriaKey}', this.value, this)">
                        </div>
                    `;
                });
                
                itemsHtml += '</div>';

                card.innerHTML = `
                    <div class="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                            <p class="text-sm font-bold text-slate-800">${learner.full_name}</p>
                            <p class="text-[10px] text-slate-400 font-mono uppercase tracking-wide">${learner.admission_number}</p>
                        </div>
                        <span class="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md uppercase">C${activeCompetency} Matrix</span>
                    </div>
                    ${itemsHtml}
                `;
                list.appendChild(card);
            });
        }
    } catch (e) {
        list.innerHTML = `<div class="text-red-500 text-center py-5">Failed to fetch competency list.</div>`;
    }
}

function switchCompetencyTab(compNum) {
    activeCompetency = compNum;
    fetchProjectRosterAndTabs(); // Re-trigger payload draw pass to construct layout smoothly
}

function getCriteriaListForCompetency(compNum) {
    let list = [];
    let limit = 0;
    if (compNum === 1) limit = 14;
    else if (compNum === 2) limit = 3;
    else if (compNum === 3) limit = 6;
    else if (compNum === 4) limit = 2;

    for (let i = 1; i <= limit; i++) {
        list.push(`${compNum}.${i}`);
    }
    return list;
}

function cacheProjectScoreLive(learnerId, criteriaKey, value, inputEl) {
    let score = parseFloat(value);
    if (isNaN(score) || value === '') {
        scoreCache[learnerId][criteriaKey] = null;
        inputEl.style.borderColor = '#e2e8f0';
        return;
    }
    if (score < 0) { score = 0; inputEl.value = '0'; }
    inputEl.style.borderColor = '#0a58ca';
    scoreCache[learnerId][criteriaKey] = score;
}

async function submitProjectScores() {
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Committing Project Marks...`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    btn.disabled = true;

    let batchRecords = [];
    Object.keys(scoreCache).forEach(learnerId => {
        Object.keys(scoreCache[learnerId]).forEach(criteriaKey => {
            if (scoreCache[learnerId][criteriaKey] !== null) {
                batchRecords.push({
                    learner_id: parseInt(learnerId),
                    competency_number: parseInt(criteriaKey.split('.')[0]),
                    sub_criteria: criteriaKey,
                    score: scoreCache[learnerId][criteriaKey]
                });
            }
        });
    });

    try {
        const response = await fetch('api/projects.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject_id: currentSubjectId,
                records: batchRecords
            })
        });
        const result = await response.json();

        if (result.success) {
            showNotification("Project evaluation matrix records successfully updated!");
            setTimeout(() => { window.location.href = 'index.php'; }, 1500);
        } else {
            showNotification(result.message, "error");
            btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> <span>Save Competency Scores</span>`;
            btn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } catch (e) {
        showNotification("Failed to transmit metrics records bundle.", "error");
        btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> <span>Save Competency Scores</span>`;
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}