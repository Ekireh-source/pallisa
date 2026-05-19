document.addEventListener("DOMContentLoaded", () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    fetchAdminDashboardData();

    document.getElementById('adminSettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        saveGlobalSettings();
    });
});

function navigateTo(url) {
    setTimeout(() => { window.location.href = url; }, 50);
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
        }, 3500);
    }
}

// Function to stop spinners if an error occurs
function setStatsErrorState() {
    document.getElementById('statTeachers').innerText = '--';
    document.getElementById('statLearners').innerText = '--';
    document.getElementById('statStreams').innerText = '--';
    document.getElementById('statAttendance').innerText = '--%';
    document.getElementById('statSA').innerText = '--%';
    document.getElementById('statProjects').innerText = '--';
}

async function fetchAdminDashboardData() {
    try {
        const response = await fetch('api/admin.php?action=get_dashboard');
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            
            // Populate Structural Stats
            document.getElementById('statTeachers').innerText = data.stats.total_teachers;
            document.getElementById('statLearners').innerText = data.stats.total_learners;
            document.getElementById('statStreams').innerText = data.stats.total_streams;

            // Populate Academic Performance Overviews
            document.getElementById('statAttendance').innerText = `${data.stats.global_attendance}%`;
            document.getElementById('statSA').innerText = data.stats.global_sa > 0 ? `${data.stats.global_sa}%` : '0%';
            document.getElementById('statProjects').innerText = `${data.stats.project_logs} Logs`;

            // Pre-fill settings form based on DB values
            const activeTerm = data.settings.active_term || '2';
            const activeYear = data.settings.active_year || '2026';
            
            document.getElementById('setTerm').value = activeTerm;
            document.getElementById('setYear').value = activeYear;

            // Update top bar layout badge
            document.getElementById('headerTermBadge').innerText = `Term ${activeTerm}, ${activeYear}`;

            // Check the active competency boxes
            const activeComps = (data.settings.active_competencies || '1,2,3,4').split(',');
            document.querySelectorAll('.comp-check').forEach(box => {
                box.checked = activeComps.includes(box.value);
            });
        } else {
            setStatsErrorState();
            showNotification(result.message, "error");
        }
    } catch (e) {
        setStatsErrorState();
        showNotification("Failed to load dashboard data. Check database.", "error");
    }
}

async function saveGlobalSettings() {
    const btn = document.getElementById('saveSettingsBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...`;
    btn.disabled = true;

    const checkboxes = document.querySelectorAll('.comp-check:checked');
    let selectedComps = Array.from(checkboxes).map(cb => cb.value).join(',');

    if (!selectedComps) selectedComps = '1';

    const termVal = document.getElementById('setTerm').value;
    const yearVal = document.getElementById('setYear').value;

    const payload = {
        active_term: termVal,
        active_year: yearVal,
        active_competencies: selectedComps
    };

    try {
        const response = await fetch('api/admin.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            showNotification(`System Updated: Switched to Term ${termVal}, ${yearVal}.`);
            
            // Instantly re-fetch the dashboard data to show the historical stats!
            fetchAdminDashboardData(); 
        } else {
            showNotification(result.message || "Failed to update settings.", "error");
        }
    } catch (e) {
        showNotification("Network error transmitting settings.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function confirmLogout() {
    if(confirm("Are you sure you want to log out of the Admin Workspace?")) {
        window.location.href = 'api/logout.php';
    }
}