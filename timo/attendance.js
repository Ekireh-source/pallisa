document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Set dynamic date
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.innerText = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    loadStreams();
});

let currentStreamId = null;
let currentSubjectId = null;
let currentSessionId = null;
let rosterData = [];

// ==========================================
// NOTIFICATION & DIALOG SYSTEM
// ==========================================

function showNotification(msg, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const msgEl = document.getElementById('toastMessage');
    const successIcon = document.getElementById('toastSuccessIcon');
    const errorIcon = document.getElementById('toastErrorIcon');

    // Set message and icons based on type
    msgEl.innerText = msg;
    if (type === 'success') {
        successIcon.classList.remove('hidden');
        errorIcon.classList.add('hidden');
    } else {
        successIcon.classList.add('hidden');
        errorIcon.classList.remove('hidden');
    }

    // Slide in animation
    toast.classList.remove('opacity-0', '-translate-y-10');
    toast.classList.add('opacity-100', 'translate-y-0');

    // Auto slide out after 3 seconds
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-10');
    }, 3000);
}

function confirmLogout() {
    const modal = document.getElementById('customModal');
    const modalContent = document.getElementById('customModalContent');

    modal.classList.remove('hidden');

    // Small delay to allow display:block to apply before animating opacity
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    });
}

function closeModal() {
    const modal = document.getElementById('customModal');
    const modalContent = document.getElementById('customModalContent');

    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');

    // Wait for animation to finish before hiding
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// ==========================================
// CORE ATTENDANCE LOGIC
// ==========================================

async function loadStreams() {
    const list = document.getElementById('streamsList');
    try {
        const response = await fetch('api/attendance.php?action=get_streams');
        const result = await response.json();
        list.innerHTML = '';

        if (result.success && result.data.length > 0) {
            result.data.forEach(stream => {
                const card = document.createElement('button');
                card.className = "w-full bg-white p-4 rounded-2xl  border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform text-left";
                card.onclick = () => openRoster(stream.stream_id, stream.subject_id, stream.stream_name, stream.subject_name);

                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-brand">
                            <i data-lucide="users" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-slate-800">${stream.stream_name}</h4>
                            <p class="text-sm text-slate-500 font-medium">${stream.subject_name}</p>
                        </div>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300"></i>
                `;
                list.appendChild(card);
            });
            lucide.createIcons();
        } else {
            list.innerHTML = `<div class="text-center py-6 text-slate-500 bg-white rounded-2xl border border-slate-100">No classes assigned.</div>`;
        }
    } catch (error) {
        list.innerHTML = `<div class="text-red-500 text-center py-5">Failed to load classes.</div>`;
    }
}

async function openRoster(streamId, subjectId, streamName, subjectName) {
    currentStreamId = streamId;
    currentSubjectId = subjectId;

    document.getElementById('rosterTitle').innerText = streamName;
    document.getElementById('rosterSubject').innerText = subjectName;

    document.getElementById('step1-streams').classList.add('hidden');
    document.getElementById('step2-roster').classList.remove('hidden');
    document.getElementById('submitBar').classList.remove('hidden');

    const list = document.getElementById('learnersList');
    list.innerHTML = `<div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Loading roster...</div>`;
    lucide.createIcons();

    try {
        const response = await fetch(`api/attendance.php?action=get_roster&stream_id=${streamId}&subject_id=${subjectId}`);
        const result = await response.json();

        list.innerHTML = '';
        rosterData = [];

        if (result.success && result.data.learners.length > 0) {

            const isEdit = result.data.is_edit;
            currentSessionId = result.data.session_id;

            if (isEdit) {
                document.getElementById('editBadge').classList.remove('hidden');
                document.getElementById('submitBtnText').innerText = "Update Attendance";
            } else {
                document.getElementById('editBadge').classList.add('hidden');
                document.getElementById('submitBtnText').innerText = "Save Attendance";
            }

            result.data.learners.forEach((learner, index) => {
                const status = learner.status || 'present';
                rosterData.push({ learner_id: learner.learner_id, status: status });

                const div = document.createElement('div');
                div.className = "learner-row bg-white p-3 rounded-2xl  border border-slate-100 flex items-center justify-between";

                const pClass = status === 'present'
                    ? "status-btn w-12 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-500 text-white "
                    : "status-btn w-12 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-600";

                const aClass = status === 'absent'
                    ? "status-btn w-12 py-1.5 rounded-lg text-xs font-bold transition-all bg-rose-500 text-white "
                    : "status-btn w-12 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-600";

                div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                            ${index + 1}
                        </div>
                        <div>
                            <p class="text-sm font-bold text-slate-800">${learner.full_name}</p>
                            <p class="text-[10px] text-slate-400 tracking-wider uppercase">${learner.admission_number}</p>
                        </div>
                    </div>
                    
                    <div class="flex bg-slate-100 p-1 rounded-xl gap-1">
                        <button onclick="setStatus(${learner.learner_id}, 'present', this)" class="${pClass}" data-type="present">P</button>
                        <button onclick="setStatus(${learner.learner_id}, 'absent', this)" class="${aClass}" data-type="absent">A</button>
                    </div>
                `;
                list.appendChild(div);
            });
        } else {
            list.innerHTML = `<div class="text-center py-6 text-slate-500 bg-white rounded-2xl border border-slate-100">No learners found.</div>`;
            document.getElementById('submitBar').classList.add('hidden');
        }
    } catch (error) {
        showNotification("Failed to load roster from server.", "error");
        list.innerHTML = `<div class="text-red-500 text-center py-5">Failed to load roster.</div>`;
    }
}

function setStatus(learnerId, status, clickedBtn) {
    const record = rosterData.find(r => r.learner_id === learnerId);
    if (record) record.status = status;

    const container = clickedBtn.parentElement;
    const presentBtn = container.querySelector('[data-type="present"]');
    const absentBtn = container.querySelector('[data-type="absent"]');

    if (status === 'present') {
        presentBtn.className = "status-btn w-12 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-500 text-white ";
        absentBtn.className = "status-btn w-12 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-600";
    } else {
        absentBtn.className = "status-btn w-12 py-1.5 rounded-lg text-xs font-bold transition-all bg-rose-500 text-white ";
        presentBtn.className = "status-btn w-12 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-400 hover:text-slate-600";
    }

    // Auto-scroll
    const currentRow = clickedBtn.closest('.learner-row');
    const nextRow = currentRow.nextElementSibling;

    if (nextRow) {
        setTimeout(() => {
            nextRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
    }
}

async function submitAttendance() {
    const btn = document.getElementById('submitBtn');
    const originalText = document.getElementById('submitBtnText').innerText;

    btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Saving...`;
    lucide.createIcons();
    btn.disabled = true;

    const payload = {
        stream_id: currentStreamId,
        subject_id: currentSubjectId,
        session_id: currentSessionId,
        records: rosterData
    };

    try {
        const response = await fetch('api/attendance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showNotification(currentSessionId ? "Attendance Updated!" : "Attendance Saved!", "success");

            // Redirect after brief delay so user sees the success toast
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 1500);

        } else {
            showNotification(result.message, "error");
            btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> <span id="submitBtnText">${originalText}</span>`;
            btn.disabled = false;
            lucide.createIcons();
        }
    } catch (error) {
        showNotification("Network error. Check your connection.", "error");
        btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> <span id="submitBtnText">${originalText}</span>`;
        btn.disabled = false;
        lucide.createIcons();
    }
}