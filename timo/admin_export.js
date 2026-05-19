document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    loadExportOptions();

    // DYNAMIC FORM LOGIC: Hide Subject if it's a project
    document.getElementById('selReportType').addEventListener('change', (e) => {
        const type = e.target.value;
        const wrapSub = document.getElementById('wrapSubject');
        const wrapStr = document.getElementById('wrapStream');
        const selSub = document.getElementById('selSubject');
        
        if (type.startsWith('project_')) {
            wrapSub.classList.add('opacity-30', 'pointer-events-none');
            selSub.required = false;
            selSub.value = '';
            wrapStr.classList.remove('col-span-1');
            wrapStr.classList.add('col-span-2');
        } else {
            wrapSub.classList.remove('opacity-30', 'pointer-events-none');
            selSub.required = true;
            wrapStr.classList.remove('col-span-2');
            wrapStr.classList.add('col-span-1');
        }
    });
});

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

async function loadExportOptions() {
    try {
        const response = await fetch('api/admin_assignments.php?action=get_all');
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            const subSel = document.getElementById('selSubject');
            data.subjects.forEach(sub => {
                subSel.innerHTML += `<option value="${sub.subject_id}">${sub.subject_name} (${sub.subject_code})</option>`;
            });

            const strSel = document.getElementById('selStream');
            data.streams.forEach(str => {
                strSel.innerHTML += `<option value="${str.stream_id}">${str.class_name} - ${str.stream_name}</option>`;
            });
        }
        
        const termResp = await fetch('api/admin.php?action=get_dashboard');
        const termData = await termResp.json();
        if(termData.success) {
            document.getElementById('headerTermBadge').innerText = `Locked to Term ${termData.data.settings.active_term}, ${termData.data.settings.active_year}`;
        }
    } catch (error) {
        console.error("Failed to load options.");
    }
}

function validateInputs() {
    const type = document.getElementById('selReportType').value;
    const stream = document.getElementById('selStream').value;
    const subject = document.getElementById('selSubject').value;

    if (!type) return showNotification("Please select a Report Type", "error"), false;
    if (!stream) return showNotification("Please select a Target Stream", "error"), false;
    if (!type.startsWith('project_') && !subject) return showNotification("Subject is required for AOI and SA reports", "error"), false;

    return { type, stream, subject };
}

async function previewData() {
    const inputs = validateInputs();
    if (!inputs) return;

    document.getElementById('lblPreviewTitle').innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-2 text-brand"></i> Calculating Formulas...`;
    document.getElementById('previewPane').classList.remove('hidden');
    document.getElementById('previewPane').classList.add('flex');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const url = `api/admin_export.php?action=preview&type=${inputs.type}&stream_id=${inputs.stream}&subject_id=${inputs.subject}`;
        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            document.getElementById('lblPreviewTitle').innerText = 'Live Data Preview';
            renderTable(result.data.headers, result.data.rows);
            // Smoothly scroll down to the preview pane
            document.getElementById('previewPane').scrollIntoView({ behavior: 'smooth' });
        } else {
            document.getElementById('lblPreviewTitle').innerText = 'Data Error';
            showNotification(result.message, "error");
        }
    } catch (e) {
        showNotification("Failed to fetch preview data.", "error");
    }
}

function renderTable(headers, rows) {
    const thead = document.getElementById('previewThead');
    const tbody = document.getElementById('previewTbody');

    // Build Headers
    let headerHtml = '<tr>';
    headers.forEach(h => {
        headerHtml += `<th class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest py-3 px-5 border-b border-slate-200 whitespace-nowrap">${h}</th>`;
    });
    headerHtml += '</tr>';
    thead.innerHTML = headerHtml;

    // Build Rows
    tbody.innerHTML = '';
    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${headers.length}" class="text-center py-10 text-slate-400 font-medium">No data available for this selection.</td></tr>`;
        return;
    }

    rows.forEach(row => {
        let trHtml = '<tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">';
        row.forEach(cell => {
            trHtml += `<td class="py-3 px-5 text-sm font-medium text-slate-700 whitespace-nowrap">${cell !== null ? cell : '-'}</td>`;
        });
        trHtml += '</tr>';
        tbody.innerHTML += trHtml;
    });
}

function closePreview() {
    document.getElementById('previewPane').classList.add('hidden');
    document.getElementById('previewPane').classList.remove('flex');
}

function downloadData() {
    const inputs = validateInputs();
    if (!inputs) return;
    const url = `api/admin_export.php?action=download&type=${inputs.type}&stream_id=${inputs.stream}&subject_id=${inputs.subject}`;
    window.location.href = url;
}

function confirmLogout() { if(confirm("Are you sure you want to log out of the Admin Workspace?")) { window.location.href = 'api/logout.php'; } }