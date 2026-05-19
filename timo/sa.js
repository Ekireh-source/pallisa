document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadStreams();
});

let currentStep = 1;
let currentStreamId = null;
let currentSubjectId = null;
let sa_id = null; 
let globalTotalBox = 10.00; // Default matching your database schema baseline
let matrixData = [];

// Column keys arranged in strict line sequences
const line1Keys = ['l1', 'l2', 'l3', 'l4', 'l5'];
const line2Keys = ['g1', 'g2', 'g3', 'g4', 'g5'];
const allKeys = ['l1', 'g1', 'l2', 'g2', 'l3', 'g3', 'l4', 'g4', 'l5', 'g5'];

function goBack() {
    if (currentStep === 2) {
        document.getElementById('step2-matrix').classList.add('hidden');
        document.getElementById('submitBar').classList.add('hidden');
        document.getElementById('step1-streams').classList.remove('hidden');
        currentStep = 1;
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
    setTimeout(() => { toast.classList.remove('opacity-100', 'translate-y-0'); toast.classList.add('opacity-0', '-translate-y-10'); }, 3000);
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
                card.onclick = () => openMatrixGrid(stream.stream_id, stream.subject_id, stream.stream_name, stream.subject_name);
                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600"><i data-lucide="award" class="w-6 h-6"></i></div>
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

async function openMatrixGrid(streamId, subjectId, streamName, subjectName) {
    currentStreamId = streamId;
    currentSubjectId = subjectId;
    
    document.getElementById('matrixStreamTitle').innerText = streamName;
    document.getElementById('matrixSubjectTitle').innerText = subjectName;
    
    document.getElementById('step1-streams').classList.add('hidden');
    document.getElementById('step2-matrix').classList.remove('hidden');
    document.getElementById('submitBar').classList.remove('hidden');
    currentStep = 2;

    const grid = document.getElementById('matrixGrid');
    grid.innerHTML = `<div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Generating Matrix Spreadsheet...</div>`;
    lucide.createIcons();

    try {
        const response = await fetch(`api/sa.php?stream_id=${streamId}&subject_id=${subjectId}`);
        const result = await response.json();
        grid.innerHTML = '';
        matrixData = [];

        if (result.success && result.data.learners.length > 0) {
            sa_id = result.data.sa_id;
            
            // Hydrate the editable total box value from database configuration state safely
            if (result.data.total_box) {
                globalTotalBox = parseFloat(result.data.total_box);
                document.getElementById('inpTotalBox').value = globalTotalBox;
            }

            result.data.learners.forEach((learner) => {
                let rowObj = { learner_id: learner.learner_id };
                allKeys.forEach(k => {
                    rowObj[k] = learner[k] !== null && learner[k] !== undefined ? parseFloat(learner[k]) : null;
                });
                matrixData.push(rowObj);

                const rowCard = document.createElement('div');
                rowCard.className = "bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4";
                
                const buildInputLine = (keysArray) => {
                    let html = '';
                    keysArray.forEach(k => {
                        const currentVal = (rowObj[k] !== null && rowObj[k] !== 0) ? rowObj[k] : '';
                        html += `
                            <div class="flex-1 flex flex-col items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-100/80">
                                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${k}</span>
                                <input type="number" step="0.1" min="0" value="${currentVal}" 
                                    class="w-full h-8 text-center text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:border-brand"
                                    onkeyup="computeMatrixLive(${learner.learner_id}, '${k}', this.value, this)"
                                    onchange="computeMatrixLive(${learner.learner_id}, '${k}', this.value, this)">
                            </div>
                        `;
                    });
                    return html;
                };

                rowCard.innerHTML = `
                    <div class="flex justify-between items-center border-b border-slate-100 pb-2.5">
                        <div>
                            <p class="text-sm font-bold text-slate-800">${learner.full_name}</p>
                            <p class="text-[10px] text-slate-400 font-mono uppercase tracking-wide">${learner.admission_number}</p>
                        </div>
                        <div id="aggregate_badge_${learner.learner_id}" class="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-xs transition-all">
                            --%
                        </div>
                    </div>
                    
                    <div class="flex gap-2 w-full">
                        ${buildInputLine(line1Keys)}
                    </div>
                    
                    <div class="flex gap-2 w-full">
                        ${buildInputLine(line2Keys)}
                    </div>
                `;
                grid.appendChild(rowCard);
                recalcRowTotal(learner.learner_id);
            });
        } else {
            grid.innerHTML = `<div class="text-center py-6 text-slate-500 bg-white rounded-2xl border border-slate-100">No learners found in stream roster list.</div>`;
        }
    } catch (error) {
        grid.innerHTML = `<div class="text-red-500 text-center py-5">Spreadsheet initialization failed.</div>`;
    }
}

function computeMatrixLive(learnerId, key, value, inputEl) {
    let num = parseFloat(value);
    const row = matrixData.find(r => r.learner_id === learnerId);

    if (isNaN(num) || value === '') {
        row[key] = null;
        inputEl.style.borderColor = '#e2e8f0';
        recalcRowTotal(learnerId);
        return;
    }

    if (num < 0) {
        num = 0;
        inputEl.value = '0';
    }
    inputEl.style.borderColor = '#0a58ca';

    row[key] = num;
    recalcRowTotal(learnerId);
}

// Controller block responding immediately to parent Total Box modifications
function updateGlobalTotalBox(val) {
    let parsedTotal = parseFloat(val);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
        globalTotalBox = 1.00; // Lower boundary safety limit to prevent division by zero
    } else {
        globalTotalBox = parsedTotal;
    }

    // High-performance live update across all students simultaneously
    matrixData.forEach(learner => {
        recalcRowTotal(learner.learner_id);
    });
}

function recalcRowTotal(learnerId) {
    const row = matrixData.find(r => r.learner_id === learnerId);
    const badge = document.getElementById(`aggregate_badge_${learnerId}`);
    
    let sum = 0;
    let entriesFound = false;

    allKeys.forEach(k => {
        if (row[k] !== null && row[k] !== undefined) {
            sum += row[k];
            entriesFound = true;
        }
    });

    if (!entriesFound) {
        badge.innerText = '--%';
        badge.className = "bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold text-xs";
        return;
    }

    // Your requested formula context implementation: (Sum / Global Total Box) * 100
    const finalPct = ((sum / globalTotalBox) * 100).toFixed(1);
    badge.innerText = `${finalPct}%`;
    
    if (finalPct >= 75) {
        badge.className = "bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full font-bold text-xs shadow-sm";
    } else if (finalPct >= 50) {
        badge.className = "bg-blue-50 text-brand border border-blue-100 px-3 py-1 rounded-full font-bold text-xs shadow-sm";
    } else {
        badge.className = "bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1 rounded-full font-bold text-xs shadow-sm";
    }
}

async function submitSA_Scores() {
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Committing Matrix Records...`;
    lucide.createIcons();
    btn.disabled = true;

    const payload = {
        stream_id: currentStreamId,
        subject_id: currentSubjectId,
        sa_id: sa_id,
        total_box: globalTotalBox, // Pack the custom editable total box value directly into the payload
        records: matrixData
    };

    try {
        const response = await fetch('api/sa.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            showNotification("SA Matrix saved successfully!");
            setTimeout(() => { window.location.href = 'index.php'; }, 1500);
        } else {
            showNotification(result.message, "error");
            btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> <span>Save Grid Matrix</span>`;
            btn.disabled = false;
            lucide.createIcons();
        }
    } catch (e) {
        showNotification("Transmission pipe disconnected.", "error");
        btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> <span>Save Grid Matrix</span>`;
        btn.disabled = false;
        lucide.createIcons();
    }
}