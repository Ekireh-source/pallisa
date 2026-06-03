document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadTeachersData();

    document.getElementById('formAddTeacher').addEventListener('submit', handleTeacherSubmission);

    const delInput = document.getElementById('inpDeleteConfirm');
    if (delInput) {
        delInput.addEventListener('input', function (e) {
            document.getElementById('btnConfirmDelete').disabled = e.target.value.toLowerCase().trim() !== 'delete';
        });
    }
});

let targetTeacherId = null;
let teachersCache = [];

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

async function loadTeachersData() {
    const container = document.getElementById('teachersContainer');
    container.innerHTML = `<div class="text-center py-10 text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-brand"></i> Syncing registry...</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch('api/admin_teachers.php?action=get_all');
        const result = await response.json();

        if (result.success) {
            teachersCache = result.data;
            document.getElementById('staffCountBadge').innerText = teachersCache.length;
            renderTeachers(teachersCache);
        }
    } catch (error) {
        container.innerHTML = `<div class="text-rose-500 text-center py-5 font-bold text-sm">Failed to load staff roster.</div>`;
    }
}

function renderTeachers(dataArray) {
    const container = document.getElementById('teachersContainer');
    container.innerHTML = '';

    if (dataArray.length === 0) {
        container.innerHTML = `<div class="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center"><p class="text-sm font-bold text-slate-500">No teachers found in the registry.</p></div>`;
        return;
    }

    dataArray.forEach(teacher => {
        const card = document.createElement('div');
        card.className = "bg-white p-3.5 border border-slate-200 rounded-xl  flex items-center justify-between elevate-card";

        card.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden pr-2">
                <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex flex-shrink-0 items-center justify-center font-extrabold text-sm border border-slate-200">
                    ${teacher.full_name.charAt(0).toUpperCase()}
                </div>
                <div class="truncate">
                    <h4 class="font-extrabold text-slate-800 text-sm truncate" title="${teacher.full_name}">${teacher.full_name}</h4>
                    <p class="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5 truncate">${teacher.email}</p>
                </div>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0">
                <button onclick="promptEdit(${teacher.user_id}, '${teacher.full_name.replace(/'/g, "\\'")}', '${teacher.email}')" class="w-8 h-8 rounded bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-brand hover:text-white transition-colors border border-slate-200 hover:border-brand " title="Edit Profile">
                    <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="promptDelete(${teacher.user_id}, '${teacher.full_name.replace(/'/g, "\\'")}')" class="w-8 h-8 rounded bg-slate-50 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors border border-slate-200 hover:border-rose-500 " title="Revoke Access">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterTeachers() {
    const query = document.getElementById('inpSearchTeacher').value.toLowerCase().trim();
    if (!query) {
        renderTeachers(teachersCache);
        return;
    }
    const filtered = teachersCache.filter(t =>
        t.full_name.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query)
    );
    renderTeachers(filtered);
}

// ----------------------------------------------------
// CREATE HANDLER
// ----------------------------------------------------
async function handleTeacherSubmission(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveTeacher');
    const inpName = document.getElementById('inpTeacherName');
    const inpEmail = document.getElementById('inpTeacherEmail');

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Registering...`;

    try {
        const response = await fetch('api/admin_teachers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_teacher', full_name: inpName.value, email: inpEmail.value })
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            inpName.value = ''; inpEmail.value = '';
            loadTeachersData();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (err) {
        showNotification('Failed to register teacher.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save" class="w-3.5 h-3.5"></i> Register Teacher`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ----------------------------------------------------
// SMART MODAL LOGIC: EDITING
// ----------------------------------------------------
function promptEdit(id, name, email) {
    targetTeacherId = id;
    document.getElementById('inpEditName').value = name;
    document.getElementById('inpEditEmail').value = email;

    const modal = document.getElementById('editModal');
    const content = document.getElementById('editModalContent');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    requestAnimationFrame(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); });
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    const content = document.getElementById('editModalContent');
    modal.classList.add('opacity-0'); content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); targetTeacherId = null; }, 300);
}

async function executeEdit() {
    const newName = document.getElementById('inpEditName').value.trim();
    const newEmail = document.getElementById('inpEditEmail').value.trim();
    if (!newName || !newEmail) return;

    const btn = document.getElementById('btnConfirmEdit');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...`;
    btn.disabled = true;

    try {
        const response = await fetch('api/admin_teachers.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'edit_teacher', user_id: targetTeacherId, full_name: newName, email: newEmail })
        });
        const result = await response.json();

        if (result.success) { showNotification(result.message); closeEditModal(); loadTeachersData(); }
        else { showNotification(result.message, 'error'); }
    } catch (err) { showNotification('Update failed.', 'error'); }
    finally { btn.innerHTML = origHtml; btn.disabled = false; if (typeof lucide !== 'undefined') lucide.createIcons(); }
}

// ----------------------------------------------------
// SMART MODAL LOGIC: DELETING
// ----------------------------------------------------
function promptDelete(id, name) {
    targetTeacherId = id;
    document.getElementById('deleteTargetName').innerText = name;
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
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); targetTeacherId = null; }, 300);
}

async function executeDelete() {
    if (!targetTeacherId) return;
    const btn = document.getElementById('btnConfirmDelete');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Revoking...`;
    btn.disabled = true;

    try {
        const response = await fetch('api/admin_teachers.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_teacher', user_id: targetTeacherId })
        });
        const result = await response.json();

        if (result.success) { showNotification(result.message); closeDeleteModal(); loadTeachersData(); }
        else { showNotification(result.message, 'error'); btn.innerHTML = origHtml; btn.disabled = false; }
    } catch (err) { showNotification('Failed to execute delete.', 'error'); btn.innerHTML = origHtml; btn.disabled = false; }
}

function confirmLogout() { if (confirm("Are you sure you want to log out of the Admin Workspace?")) { window.location.href = 'api/logout.php'; } }