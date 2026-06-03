document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadLearnersData();

    document.getElementById('formAddLearner').addEventListener('submit', handleSingleLearnerSubmission);

    const delInput = document.getElementById('inpDeleteConfirm');
    if (delInput) {
        delInput.addEventListener('input', function (e) {
            document.getElementById('btnConfirmDelete').disabled = e.target.value.toLowerCase().trim() !== 'delete';
        });
    }
});

let learnersCache = [];
let streamsMap = {}; // Key: Stream Name (lowercase), Value: Stream ID
let existingLINs = new Set(); // To check duplicates rapidly
let targetLearnerId = null;
let validatedBulkData = []; // Holds the clean rows ready for server injection

function navigateTo(url) { setTimeout(() => { window.location.href = url; }, 50); }

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
        }, 3500);
    }
}

async function loadLearnersData() {
    const container = document.getElementById('learnersContainer');
    container.innerHTML = `<div class="col-span-2 text-center py-10 text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-brand"></i> Syncing registry...</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch('api/admin_learners.php?action=get_all');
        const result = await response.json();

        if (result.success) {
            const data = result.data;

            // Build Stream Dictionary for dropdowns and fast CSV lookups
            const strSelect = document.getElementById('selLearnerStream');
            const editStrSelect = document.getElementById('selEditStream');
            strSelect.innerHTML = '<option value="">-- Select Stream --</option>';
            editStrSelect.innerHTML = '';

            streamsMap = {};
            data.streams.forEach(str => {
                const combinedName = `${str.class_name} ${str.stream_name}`;
                streamsMap[combinedName.toLowerCase()] = str.stream_id; // For exact matching

                const opt = `<option value="${str.stream_id}">${combinedName}</option>`;
                strSelect.innerHTML += opt;
                editStrSelect.innerHTML += opt;
            });

            // Populate Cache & LIN Set
            learnersCache = data.learners;
            existingLINs.clear();
            learnersCache.forEach(l => existingLINs.add(l.admission_number.toUpperCase()));

            document.getElementById('learnerCountBadge').innerText = learnersCache.length;
            renderLearners(learnersCache);
        }
    } catch (error) {
        container.innerHTML = `<div class="col-span-2 text-rose-500 text-center py-5 font-bold text-sm">Failed to load learner data.</div>`;
    }
}

function renderLearners(dataArray) {
    const container = document.getElementById('learnersContainer');
    container.innerHTML = '';

    if (dataArray.length === 0) {
        container.innerHTML = `<div class="col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-8 text-center"><p class="text-sm font-bold text-slate-500">No learners currently enrolled.</p></div>`;
        return;
    }

    dataArray.forEach(l => {
        const card = document.createElement('div');
        card.className = "bg-white p-3 border border-slate-200 rounded-xl  flex flex-col gap-2 elevate-card";

        card.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-50 pb-2">
                <div class="flex items-center gap-2.5 overflow-hidden pr-2">
                    <div class="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-extrabold text-sm border border-cyan-100 flex-shrink-0">
                        ${l.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div class="truncate">
                        <h4 class="font-extrabold text-slate-800 text-sm truncate" title="${l.full_name}">${l.full_name}</h4>
                        <p class="text-[10px] text-slate-500 font-mono font-bold tracking-wider mt-0.5">${l.admission_number}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                    <button onclick="promptEdit(${l.learner_id}, '${l.full_name.replace(/'/g, "\\'")}', '${l.admission_number}', ${l.stream_id})" class="w-7 h-7 rounded bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-brand hover:text-white transition-colors border border-slate-200 hover:border-brand ">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="promptDelete(${l.learner_id}, '${l.full_name.replace(/'/g, "\\'")}')" class="w-7 h-7 rounded bg-slate-50 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors border border-slate-200 hover:border-rose-500 ">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
            <div class="bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 w-fit">
                <i data-lucide="layers" class="w-3 h-3 flex-shrink-0"></i>
                <span class="text-[10px] font-extrabold truncate uppercase tracking-wide">${l.class_name} ${l.stream_name}</span>
            </div>
        `;
        container.appendChild(card);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterLearners() {
    const query = document.getElementById('inpSearchLearner').value.toLowerCase().trim();
    if (!query) {
        renderLearners(learnersCache);
        return;
    }
    const filtered = learnersCache.filter(l =>
        l.full_name.toLowerCase().includes(query) ||
        l.admission_number.toLowerCase().includes(query) ||
        l.stream_name.toLowerCase().includes(query) ||
        l.class_name.toLowerCase().includes(query)
    );
    renderLearners(filtered);
}

// ----------------------------------------------------
// SINGLE LEARNER ACTIONS
// ----------------------------------------------------
async function handleSingleLearnerSubmission(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveLearner');
    const name = document.getElementById('inpLearnerName').value;
    const lin = document.getElementById('inpLearnerLIN').value.toUpperCase();
    const strId = document.getElementById('selLearnerStream').value;

    btn.disabled = true; btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...`;

    try {
        const response = await fetch('api/admin_learners.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_learner', full_name: name, admission_number: lin, stream_id: strId })
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            document.getElementById('formAddLearner').reset();
            loadLearnersData();
        } else { showNotification(result.message, 'error'); }
    } catch (err) { showNotification('Failed to register learner.', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = `<i data-lucide="save" class="w-3.5 h-3.5"></i> Register Learner`; if (typeof lucide !== 'undefined') lucide.createIcons(); }
}

function promptEdit(id, name, lin, streamId) {
    targetLearnerId = id;
    document.getElementById('inpEditName').value = name;
    document.getElementById('inpEditLIN').value = lin;
    document.getElementById('selEditStream').value = streamId;

    const modal = document.getElementById('editModal'); const content = document.getElementById('editModalContent');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    requestAnimationFrame(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); });
}

function closeEditModal() {
    const modal = document.getElementById('editModal'); const content = document.getElementById('editModalContent');
    modal.classList.add('opacity-0'); content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); targetLearnerId = null; }, 300);
}

async function executeEdit() {
    const name = document.getElementById('inpEditName').value.trim();
    const lin = document.getElementById('inpEditLIN').value.trim().toUpperCase();
    const strId = document.getElementById('selEditStream').value;

    const btn = document.getElementById('btnConfirmEdit');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...`; btn.disabled = true;

    try {
        const response = await fetch('api/admin_learners.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'edit_learner', learner_id: targetLearnerId, full_name: name, admission_number: lin, stream_id: strId })
        });
        const result = await response.json();
        if (result.success) { showNotification(result.message); closeEditModal(); loadLearnersData(); }
        else { showNotification(result.message, 'error'); }
    } catch (err) { showNotification('Failed to update learner.', 'error'); }
    finally { btn.innerHTML = origHtml; btn.disabled = false; if (typeof lucide !== 'undefined') lucide.createIcons(); }
}

function promptDelete(id, name) {
    targetLearnerId = id;
    document.getElementById('deleteTargetName').innerText = name;
    document.getElementById('inpDeleteConfirm').value = '';
    document.getElementById('btnConfirmDelete').disabled = true;

    const modal = document.getElementById('deleteModal'); const content = document.getElementById('deleteModalContent');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    requestAnimationFrame(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); });
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal'); const content = document.getElementById('deleteModalContent');
    modal.classList.add('opacity-0'); content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); targetLearnerId = null; }, 300);
}

async function executeDelete() {
    if (!targetLearnerId) return;
    const btn = document.getElementById('btnConfirmDelete');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Deleting...`; btn.disabled = true;

    try {
        const response = await fetch('api/admin_learners.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_learner', learner_id: targetLearnerId })
        });
        const result = await response.json();
        if (result.success) { showNotification(result.message); closeDeleteModal(); loadLearnersData(); }
        else { showNotification(result.message, 'error'); btn.innerHTML = origHtml; btn.disabled = false; }
    } catch (err) { showNotification('Failed to execute delete.', 'error'); btn.innerHTML = origHtml; btn.disabled = false; }
}

// ----------------------------------------------------
// INTELLIGENT BULK IMPORT ENGINE
// ----------------------------------------------------
function downloadCSVTemplate() {
    let csvContent = "Full Name,LIN,Stream Name\n";
    // Provide a hint in the first row
    csvContent += "John Doe,U1001,Example: Senior 3 S3 North\n";

    // Add all valid stream names to help the user
    Object.keys(streamsMap).forEach((streamName, idx) => {
        if (idx < 5) csvContent += `Student ${idx + 1},U200${idx + 1},${streamName}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Learner_Upload_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        processCSV(text);
        // Clear input so same file can be uploaded again if needed
        document.getElementById('inpCSVUpload').value = '';
    };
    reader.readAsText(file);
}

function processCSV(csvText) {
    const lines = csvText.split('\n');
    const tableBody = document.getElementById('previewTableBody');
    tableBody.innerHTML = '';
    validatedBulkData = [];

    let validCount = 0;
    let invalidCount = 0;
    let localLINCache = new Set(); // Prevent duplicates within the CSV itself

    // Skip Header Row (i = 1)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Basic CSV splitting (assuming no commas inside names for template simplicity)
        const cols = line.split(',');
        const fullName = cols[0] ? cols[0].trim() : '';
        const lin = cols[1] ? cols[1].trim().toUpperCase() : '';
        const rawStream = cols[2] ? cols[2].trim() : '';
        const lowerStream = rawStream.toLowerCase();

        let isValid = true;
        let reason = '';
        let matchedStreamId = null;

        if (!fullName || !lin || !rawStream) {
            isValid = false; reason = 'Missing fields';
        } else if (!streamsMap[lowerStream]) {
            isValid = false; reason = 'Stream not found';
        } else if (existingLINs.has(lin)) {
            isValid = false; reason = 'LIN exists in DB';
        } else if (localLINCache.has(lin)) {
            isValid = false; reason = 'Duplicate LIN in CSV';
        } else {
            matchedStreamId = streamsMap[lowerStream];
            localLINCache.add(lin);
        }

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 last:border-none";

        if (isValid) {
            validCount++;
            validatedBulkData.push({ full_name: fullName, admission_number: lin, stream_id: matchedStreamId });
            tr.innerHTML = `
                <td class="py-2.5"><span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-1 rounded">VALID</span></td>
                <td class="py-2.5 font-bold text-slate-800">${fullName}</td>
                <td class="py-2.5 font-mono text-slate-500">${lin}</td>
                <td class="py-2.5 text-xs text-slate-600 font-bold">${rawStream}</td>
            `;
        } else {
            invalidCount++;
            tr.innerHTML = `
                <td class="py-2.5"><span class="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold px-2 py-1 rounded">REJECTED</span></td>
                <td class="py-2.5 font-bold text-slate-800">${fullName || '-'}</td>
                <td class="py-2.5 font-mono text-slate-500">${lin || '-'}</td>
                <td class="py-2.5 text-xs font-bold text-rose-500 flex items-center gap-1"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i> ${reason}</td>
            `;
        }
        tableBody.appendChild(tr);
    }

    document.getElementById('lblValidCount').innerText = validCount;
    document.getElementById('lblInvalidCount').innerText = invalidCount;

    const btnConfirm = document.getElementById('btnConfirmBulk');
    btnConfirm.disabled = validCount === 0;

    const modal = document.getElementById('bulkPreviewModal');
    const content = document.getElementById('bulkPreviewContent');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    requestAnimationFrame(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeBulkModal() {
    const modal = document.getElementById('bulkPreviewModal');
    const content = document.getElementById('bulkPreviewContent');
    modal.classList.add('opacity-0'); content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
}

async function executeBulkImport() {
    if (validatedBulkData.length === 0) return;

    const btn = document.getElementById('btnConfirmBulk');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing Array...`;
    btn.disabled = true;

    try {
        const response = await fetch('api/admin_learners.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bulk_import', learners: validatedBulkData })
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            closeBulkModal();
            loadLearnersData();
        } else { showNotification(result.message, 'error'); }
    } catch (err) {
        showNotification('Server rejected bulk package.', 'error');
    } finally {
        btn.innerHTML = origHtml; btn.disabled = false;
    }
}

function confirmLogout() { if (confirm("Are you sure you want to log out of the Admin Workspace?")) { window.location.href = 'api/logout.php'; } }