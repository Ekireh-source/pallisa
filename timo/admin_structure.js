document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadStructureData();

    document.getElementById('formAddClass').addEventListener('submit', handleClassSubmission);
    document.getElementById('formAddStream').addEventListener('submit', handleStreamSubmission);

    const delInput = document.getElementById('inpDeleteConfirm');
    if (delInput) {
        delInput.addEventListener('input', function(e) {
            const btn = document.getElementById('btnConfirmDelete');
            if (e.target.value.toLowerCase().trim() === 'delete') {
                btn.disabled = false;
            } else {
                btn.disabled = true;
            }
        });
    }
});

let targetActionId = null;
let targetActionType = null; // 'class' or 'stream'

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

async function loadStructureData() {
    const container = document.getElementById('structureContainer');
    const select = document.getElementById('selParentClass');
    
    container.innerHTML = `<div class="text-center py-10 text-slate-400"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-brand"></i> Syncing structure...</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch('api/admin_structure.php?action=get_all');
        const result = await response.json();

        if (result.success) {
            const classes = result.data;
            container.innerHTML = '';
            select.innerHTML = '<option value="">-- Select Class --</option>';

            if (classes.length === 0) {
                container.innerHTML = `<div class="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center"><p class="text-sm font-bold text-slate-500">No classes found. Create one to begin.</p></div>`;
                return;
            }

            classes.forEach(cls => {
                const opt = document.createElement('option');
                opt.value = cls.class_id;
                opt.innerText = cls.class_name;
                select.appendChild(opt);

                const card = document.createElement('div');
                card.className = "border border-slate-200 rounded-xl overflow-hidden shadow-sm";
                
                let streamsHtml = '';
                if (cls.streams && cls.streams.length > 0) {
                    const pillHtml = cls.streams.map(stream => `
                        <div class="bg-amber-50 text-amber-700 border border-amber-200/50 pl-2.5 pr-1 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                            <i data-lucide="layers" class="w-3 h-3"></i> 
                            <span class="mr-1">${stream.stream_name}</span>
                            <div class="flex items-center gap-0.5 border-l border-amber-200/50 pl-1">
                                <button onclick="promptEdit('stream', ${stream.stream_id}, '${stream.stream_name.replace(/'/g, "\\'")}')" class="p-1 hover:bg-amber-100 rounded text-amber-600 transition-colors" title="Rename"><i data-lucide="edit-2" class="w-3 h-3"></i></button>
                                <button onclick="promptDelete('stream', ${stream.stream_id}, '${stream.stream_name.replace(/'/g, "\\'")}')" class="p-1 hover:bg-rose-100 rounded text-rose-500 transition-colors" title="Delete"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                            </div>
                        </div>
                    `).join('');
                    streamsHtml = `<div class="p-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">${pillHtml}</div>`;
                } else {
                    streamsHtml = `<div class="p-3.5 bg-slate-50 border-t border-slate-100"><p class="text-[11px] text-slate-400 font-medium italic">No streams attached to this class yet.</p></div>`;
                }

                card.innerHTML = `
                    <div class="bg-white p-3.5 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-50 text-brand flex items-center justify-center border border-blue-100/50"><i data-lucide="building" class="w-4 h-4"></i></div>
                            <h4 class="font-extrabold text-slate-800 text-sm">${cls.class_name}</h4>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="bg-slate-100 text-slate-500 font-bold text-[10px] px-2 py-0.5 rounded border border-slate-200">${cls.streams ? cls.streams.length : 0} Streams</span>
                            <button onclick="promptEdit('class', ${cls.class_id}, '${cls.class_name.replace(/'/g, "\\'")}')" title="Edit Class" class="w-7 h-7 rounded bg-white text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-brand transition-colors border border-slate-200">
                                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="promptDelete('class', ${cls.class_id}, '${cls.class_name.replace(/'/g, "\\'")}')" title="Delete Class" class="w-7 h-7 rounded bg-white text-rose-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors border border-slate-200">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                    ${streamsHtml}
                `;
                container.appendChild(card);
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } catch (error) {
        container.innerHTML = `<div class="text-rose-500 text-center py-5 font-bold text-sm">Failed to load structure.</div>`;
    }
}

// ----------------------------------------------------
// SMART MODAL LOGIC: EDITING
// ----------------------------------------------------
function promptEdit(type, id, name) {
    targetActionType = type;
    targetActionId = id;

    document.getElementById('editModalTitle').innerText = type === 'class' ? 'Rename Class' : 'Rename Stream';
    document.getElementById('editModalLabel').innerText = type === 'class' ? 'Class Name' : 'Stream Name';
    document.getElementById('inpEditName').value = name;

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
        targetActionId = null; targetActionType = null;
    }, 300);
}

async function executeEdit() {
    const newName = document.getElementById('inpEditName').value.trim();
    if (!newName) return;
    
    const btn = document.getElementById('btnConfirmEdit');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...`;
    btn.disabled = true;

    const actionKey = targetActionType === 'class' ? 'edit_class' : 'edit_stream';
    const payload = { action: actionKey, [targetActionType + '_name']: newName, [targetActionType + '_id']: targetActionId };

    try {
        const response = await fetch('api/admin_structure.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            closeEditModal();
            loadStructureData();
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
function promptDelete(type, id, name) {
    targetActionType = type;
    targetActionId = id;
    
    document.getElementById('deleteTargetName').innerText = name;
    document.getElementById('deleteModalTitle').innerText = type === 'class' ? 'Delete Class?' : 'Delete Stream?';
    
    const warningEl = document.getElementById('deleteModalWarning');
    if (type === 'class') {
        warningEl.innerHTML = `You are about to delete <strong class="text-slate-800">${name}</strong>. This will permanently erase the class and <strong class="text-rose-500">all its attached streams</strong>. <span class="text-rose-500 font-bold">This cannot be undone.</span>`;
    } else {
        warningEl.innerHTML = `You are about to delete the stream <strong class="text-slate-800">${name}</strong>. Data linked to this stream will be orphaned. <span class="text-rose-500 font-bold">This cannot be undone.</span>`;
    }

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
        targetActionId = null; targetActionType = null;
    }, 300);
}

async function executeDelete() {
    if (!targetActionId) return;
    const btn = document.getElementById('btnConfirmDelete');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Deleting...`;
    btn.disabled = true;

    const actionKey = targetActionType === 'class' ? 'delete_class' : 'delete_stream';

    try {
        const response = await fetch('api/admin_structure.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: actionKey, [targetActionType + '_id']: targetActionId })
        });
        const result = await response.json();

        if (result.success) {
            showNotification(result.message);
            closeDeleteModal();
            loadStructureData();
        } else {
            showNotification(result.message, 'error');
            btn.innerHTML = origHtml; btn.disabled = false;
        }
    } catch (err) {
        showNotification('Failed to execute delete.', 'error');
        btn.innerHTML = origHtml; btn.disabled = false;
    }
}

// Creation Handlers (Unchanged behavior)
async function handleClassSubmission(e) { /* Same as previous version, omitted for brevity here since it just calls the endpoint */
    e.preventDefault();
    const btn = document.getElementById('btnSaveClass');
    const input = document.getElementById('inpClassName');
    btn.disabled = true; btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Saving...`;
    try {
        const response = await fetch('api/admin_structure.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_class', class_name: input.value }) });
        const result = await response.json();
        if (result.success) { showNotification(result.message); input.value = ''; loadStructureData(); } else { showNotification(result.message, 'error'); }
    } catch (err) { showNotification('Failed to create class', 'error'); } finally { btn.disabled = false; btn.innerHTML = `<i data-lucide="save" class="w-3.5 h-3.5"></i> Save Class`; if (typeof lucide !== 'undefined') lucide.createIcons(); }
}

async function handleStreamSubmission(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveStream');
    const selClass = document.getElementById('selParentClass');
    const inpStream = document.getElementById('inpStreamName');
    btn.disabled = true; btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Attaching...`;
    try {
        const response = await fetch('api/admin_structure.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_stream', class_id: selClass.value, stream_name: inpStream.value }) });
        const result = await response.json();
        if (result.success) { showNotification(result.message); inpStream.value = ''; selClass.value = ''; loadStructureData(); } else { showNotification(result.message, 'error'); }
    } catch (err) { showNotification('Failed to attach stream', 'error'); } finally { btn.disabled = false; btn.innerHTML = `<i data-lucide="save" class="w-3.5 h-3.5"></i> Attach Stream`; if (typeof lucide !== 'undefined') lucide.createIcons(); }
}

function confirmLogout() { if(confirm("Are you sure you want to log out of the Admin Workspace?")) { window.location.href = 'api/logout.php'; } }