document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadAllocationsData();

    document.getElementById('formAddAssignment').addEventListener('submit', handleAssignmentSubmission);

    const delInput = document.getElementById('inpDeleteConfirm');
    if (delInput) {
        delInput.addEventListener('input', function (e) {
            document.getElementById('btnConfirmDelete').disabled = e.target.value.toLowerCase().trim() !== 'delete';
        });
    }
});

let targetAssignmentId = null;
let assignmentsCache = [];

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

async function loadAllocationsData() {
    const container = document.getElementById('assignmentsContainer');
    container.innerHTML = `<div class="col-span-2 text-center py-10 text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-brand"></i> Syncing allocations...</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch('api/admin_assignments.php?action=get_all');
        const result = await response.json();

        if (result.success) {
            const data = result.data;

            // Populate Create Dropdowns
            populateDropdown('selTeacher', data.teachers, 'user_id', 'full_name', '-- Select Teacher --');
            populateDropdown('selSubject', data.subjects, 'subject_id', 'subject_name', '-- Select Subject --');

            const streamSelect = document.getElementById('selStream');
            streamSelect.innerHTML = '<option value="">-- Select Stream --</option>';
            data.streams.forEach(str => {
                const opt = document.createElement('option');
                opt.value = str.stream_id;
                opt.innerText = `${str.class_name} - ${str.stream_name}`;
                streamSelect.appendChild(opt);
            });

            // Mirror options to the Edit Modal Dropdowns immediately
            document.getElementById('selEditTeacher').innerHTML = document.getElementById('selTeacher').innerHTML;
            document.getElementById('selEditSubject').innerHTML = document.getElementById('selSubject').innerHTML;
            document.getElementById('selEditStream').innerHTML = document.getElementById('selStream').innerHTML;

            // Render Cards
            assignmentsCache = data.assignments;
            document.getElementById('allocationCountBadge').innerText = assignmentsCache.length;
            renderAssignments(assignmentsCache);
        }
    } catch (error) {
        container.innerHTML = `<div class="col-span-2 text-rose-500 text-center py-5 font-bold text-sm">Failed to load allocation data.</div>`;
    }
}

function populateDropdown(elementId, items, valueKey, textKey, defaultText) {
    const el = document.getElementById(elementId);
    el.innerHTML = `<option value="">${defaultText}</option>`;
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item[valueKey];
        opt.innerText = item[textKey];
        el.appendChild(opt);
    });
}

function renderAssignments(dataArray) {
    const container = document.getElementById('assignmentsContainer');
    container.innerHTML = '';

    if (dataArray.length === 0) {
        container.innerHTML = `<div class="col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-8 text-center"><p class="text-sm font-bold text-slate-500">No workload allocations found.</p></div>`;
        return;
    }

    dataArray.forEach(asn => {
        const card = document.createElement('div');
        card.className = "bg-white p-4 border border-slate-200 rounded-xl  flex flex-col gap-3 elevate-card";

        card.innerHTML = `
            <div class="flex items-start justify-between border-b border-slate-50 pb-2.5">
                <div class="flex items-center gap-2.5 truncate pr-2">
                    <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 flex-shrink-0">
                        ${asn.teacher_name.charAt(0).toUpperCase()}
                    </div>
                    <div class="truncate">
                        <h4 class="font-extrabold text-slate-800 text-sm truncate" title="${asn.teacher_name}">${asn.teacher_name}</h4>
                        <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Instructor</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                    <button onclick="promptEdit(${asn.assignment_id}, ${asn.teacher_id}, ${asn.subject_id}, ${asn.stream_id})" class="w-7 h-7 rounded bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-brand hover:text-white transition-colors border border-slate-200 hover:border-brand">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="promptDelete(${asn.assignment_id}, '${asn.teacher_name.replace(/'/g, "\\'")}', '${asn.subject_name.replace(/'/g, "\\'")}', '${asn.stream_name.replace(/'/g, "\\'")}')" class="w-7 h-7 rounded bg-slate-50 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors border border-slate-200 hover:border-rose-500">
                        <i data-lucide="link-2-off" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
            
            <div class="flex items-center justify-between gap-2">
                <div class="bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 w-1/2">
                    <i data-lucide="book-open" class="w-3.5 h-3.5 text-indigo-500 flex-shrink-0"></i>
                    <span class="text-xs font-bold text-indigo-700 truncate" title="${asn.subject_name}">${asn.subject_name}</span>
                </div>
                <i data-lucide="arrow-right" class="w-3 h-3 text-slate-300 flex-shrink-0"></i>
                <div class="bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 w-1/2 justify-end">
                    <span class="text-xs font-bold text-amber-700 truncate" title="${asn.class_name} ${asn.stream_name}">${asn.class_name} ${asn.stream_name}</span>
                    <i data-lucide="layers" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0"></i>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterAssignments() {
    const query = document.getElementById('inpSearchAssignment').value.toLowerCase().trim();
    if (!query) {
        renderAssignments(assignmentsCache);
        return;
    }
    const filtered = assignmentsCache.filter(a =>
        a.teacher_name.toLowerCase().includes(query) ||
        a.subject_name.toLowerCase().includes(query) ||
        a.stream_name.toLowerCase().includes(query) ||
        a.class_name.toLowerCase().includes(query)
    );
    renderAssignments(filtered);
}

// ----------------------------------------------------
// CREATE HANDLER
// ----------------------------------------------------
async function handleAssignmentSubmission(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveAssignment');
    const tId = document.getElementById('selTeacher').value;
    const subId = document.getElementById('selSubject').value;
    const strId = document.getElementById('selStream').value;

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Linking...`;

    try {
        const response = await fetch('api/admin_assignments.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_assignment', teacher_id: tId, subject_id: subId, stream_id: strId })
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            document.getElementById('selTeacher').value = '';
            document.getElementById('selSubject').value = '';
            document.getElementById('selStream').value = '';
            loadAllocationsData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (err) {
        showNotification('Failed to create assignment.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" class="w-3.5 h-3.5"></i> Link Assignment`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ----------------------------------------------------
// SMART MODAL LOGIC: EDITING
// ----------------------------------------------------
function promptEdit(assignmentId, teacherId, subjectId, streamId) {
    targetAssignmentId = assignmentId;

    document.getElementById('selEditTeacher').value = teacherId;
    document.getElementById('selEditSubject').value = subjectId;
    document.getElementById('selEditStream').value = streamId;

    const modal = document.getElementById('editModal');
    const content = document.getElementById('editModalContent');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    requestAnimationFrame(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); });
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    const content = document.getElementById('editModalContent');
    modal.classList.add('opacity-0'); content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); targetAssignmentId = null; }, 300);
}

async function executeEdit() {
    const tId = document.getElementById('selEditTeacher').value;
    const subId = document.getElementById('selEditSubject').value;
    const strId = document.getElementById('selEditStream').value;

    if (!tId || !subId || !strId) return showNotification("All fields are required.", "error");

    const btn = document.getElementById('btnConfirmEdit');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...`;
    btn.disabled = true;

    try {
        const response = await fetch('api/admin_assignments.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'edit_assignment', assignment_id: targetAssignmentId, teacher_id: tId, subject_id: subId, stream_id: strId })
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            closeEditModal();
            loadAllocationsData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (err) {
        showNotification('Failed to update assignment.', 'error');
    } finally {
        btn.innerHTML = origHtml; btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ----------------------------------------------------
// SMART MODAL LOGIC: DELETING
// ----------------------------------------------------
function promptDelete(id, teacher, subject, stream) {
    targetAssignmentId = id;
    document.getElementById('deleteTargetInfo').innerText = `${teacher} and ${subject} (${stream})`;
    document.getElementById('inpDeleteConfirm').value = '';
    document.getElementById('btnConfirmDelete').disabled = true;

    const modal = document.getElementById('deleteModal');
    const content = document.getElementById('deleteModalContent');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    requestAnimationFrame(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); });
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    const content = document.getElementById('deleteModalContent');
    modal.classList.add('opacity-0'); content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); targetAssignmentId = null; }, 300);
}

async function executeDelete() {
    if (!targetAssignmentId) return;
    const btn = document.getElementById('btnConfirmDelete');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Revoking...`;
    btn.disabled = true;

    try {
        const response = await fetch('api/admin_assignments.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_assignment', assignment_id: targetAssignmentId })
        });
        const result = await response.json();

        if (result.success) { showNotification(result.message); closeDeleteModal(); loadAllocationsData(); }
        else { showNotification(result.message, 'error'); btn.innerHTML = origHtml; btn.disabled = false; }
    } catch (err) { showNotification('Failed to revoke assignment.', 'error'); btn.innerHTML = origHtml; btn.disabled = false; }
}

function confirmLogout() { if (confirm("Are you sure you want to log out of the Admin Workspace?")) { window.location.href = 'api/logout.php'; } }