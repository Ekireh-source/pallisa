document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadSubjectsData();

    document.getElementById('formAddSubject').addEventListener('submit', handleSubjectSubmission);

    const delInput = document.getElementById('inpDeleteConfirm');
    if (delInput) {
        delInput.addEventListener('input', function(e) {
            const btn = document.getElementById('btnConfirmDelete');
            btn.disabled = e.target.value.toLowerCase().trim() !== 'delete';
        });
    }
});

let targetSubjectId = null;
let subjectsCache = [];

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

async function loadSubjectsData() {
    const container = document.getElementById('subjectsContainer');
    container.innerHTML = `<div class="col-span-2 text-center py-10 text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-brand"></i> Syncing registry...</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch('api/admin_subjects.php?action=get_all');
        const result = await response.json();

        if (result.success) {
            subjectsCache = result.data;
            renderSubjects(subjectsCache);
        }
    } catch (error) {
        container.innerHTML = `<div class="col-span-2 text-rose-500 text-center py-5 font-bold text-sm">Failed to load subjects.</div>`;
    }
}

function renderSubjects(dataArray) {
    const container = document.getElementById('subjectsContainer');
    container.innerHTML = '';

    if (dataArray.length === 0) {
        container.innerHTML = `<div class="col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-8 text-center"><p class="text-sm font-bold text-slate-500">No subjects found in the registry.</p></div>`;
        return;
    }

    dataArray.forEach(sub => {
        const card = document.createElement('div');
        card.className = "bg-white p-4 border border-slate-200 rounded-xl shadow-sm flex items-center justify-between elevate-card";
        
        card.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden pr-2">
                <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex flex-shrink-0 items-center justify-center font-extrabold text-[10px] tracking-widest border border-indigo-100 uppercase">
                    ${sub.subject_code}
                </div>
                <div class="truncate">
                    <h4 class="font-extrabold text-slate-800 text-sm truncate" title="${sub.subject_name}">${sub.subject_name}</h4>
                    <p class="text-[10px] text-slate-400 font-bold uppercase mt-0.5">ID: ${sub.subject_id}</p>
                </div>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                <button onclick="promptEdit(${sub.subject_id}, '${sub.subject_name.replace(/'/g, "\\'")}', '${sub.subject_code}')" class="w-8 h-8 rounded bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-brand hover:text-white transition-colors border border-slate-200 hover:border-brand shadow-sm">
                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="promptDelete(${sub.subject_id}, '${sub.subject_name.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded bg-slate-50 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors border border-slate-200 hover:border-rose-500 shadow-sm">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterSubjects() {
    const query = document.getElementById('inpSearchSub').value.toLowerCase().trim();
    if (!query) {
        renderSubjects(subjectsCache);
        return;
    }
    const filtered = subjectsCache.filter(sub => 
        sub.subject_name.toLowerCase().includes(query) || 
        sub.subject_code.toLowerCase().includes(query)
    );
    renderSubjects(filtered);
}

// ----------------------------------------------------
// SMART MODAL LOGIC: EDITING
// ----------------------------------------------------
function promptEdit(id, name, code) {
    targetSubjectId = id;
    document.getElementById('inpEditName').value = name;
    document.getElementById('inpEditCode').value = code;

    const modal = document.getElementById('editModal');
    const content = document.getElementById('editModalContent');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    });
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    const content = document.getElementById('editModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        targetSubjectId = null;
    }, 300);
}

async function executeEdit() {
    const newName = document.getElementById('inpEditName').value.trim();
    const newCode = document.getElementById('inpEditCode').value.trim().toUpperCase();
    if (!newName || !newCode) return showNotification("All fields required", "error");
    
    const btn = document.getElementById('btnConfirmEdit');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...`;
    btn.disabled = true;

    try {
        const response = await fetch('api/admin_subjects.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ action: 'edit_subject', subject_id: targetSubjectId, subject_name: newName, subject_code: newCode })
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            closeEditModal();
            loadSubjectsData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (err) {
        showNotification('Update failed.', 'error');
    } finally {
        btn.innerHTML = origHtml;
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ----------------------------------------------------
// SMART MODAL LOGIC: DELETING
// ----------------------------------------------------
function promptDelete(id, name) {
    targetSubjectId = id;
    document.getElementById('deleteTargetName').innerText = name;
    document.getElementById('inpDeleteConfirm').value = '';
    document.getElementById('btnConfirmDelete').disabled = true;

    const modal = document.getElementById('deleteModal');
    const content = document.getElementById('deleteModalContent');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    });
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    const content = document.getElementById('deleteModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        targetSubjectId = null;
    }, 300);
}

async function executeDelete() {
    if (!targetSubjectId) return;
    const btn = document.getElementById('btnConfirmDelete');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Deleting...`;
    btn.disabled = true;

    try {
        const response = await fetch('api/admin_subjects.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_subject', subject_id: targetSubjectId })
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            closeDeleteModal();
            loadSubjectsData();
        } else {
            showNotification(result.message, 'error');
            btn.innerHTML = origHtml; btn.disabled = false;
        }
    } catch (err) {
        showNotification('Failed to execute delete.', 'error');
        btn.innerHTML = origHtml; btn.disabled = false;
    }
}

// ----------------------------------------------------
// CREATE HANDLER
// ----------------------------------------------------
async function handleSubjectSubmission(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveSubject');
    const inpName = document.getElementById('inpSubName');
    const inpCode = document.getElementById('inpSubCode');
    
    btn.disabled = true; 
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...`;

    try {
        const response = await fetch('api/admin_subjects.php', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ action: 'add_subject', subject_name: inpName.value, subject_code: inpCode.value.toUpperCase() }) 
        });
        const result = await response.json();
        
        if (result.success) { 
            showNotification(result.message); 
            inpName.value = ''; inpCode.value = ''; 
            loadSubjectsData(); 
        } else { 
            showNotification(result.message, 'error'); 
        }
    } catch (err) { 
        showNotification('Failed to register subject', 'error'); 
    } finally { 
        btn.disabled = false; 
        btn.innerHTML = `<i data-lucide="save" class="w-3.5 h-3.5"></i> Save Subject`; 
        if (typeof lucide !== 'undefined') lucide.createIcons(); 
    }
}

function confirmLogout() { if(confirm("Are you sure you want to log out of the Admin Workspace?")) { window.location.href = 'api/logout.php'; } }