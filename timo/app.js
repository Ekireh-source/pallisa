document.addEventListener("DOMContentLoaded", () => {
    
    // Initialize Lucide Icons across pages safely
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // =========================================================
    // 1. LOGIN FORM SUBMISSION (Handles login.php logic)
    // =========================================================
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop normal page reload
            
            const btn = document.getElementById('loginBtn');
            const errorBox = document.getElementById('loginError');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Set dynamic loading state
            btn.innerText = "Signing in...";
            btn.disabled = true;
            errorBox.style.display = 'none';

            try {
                const response = await fetch('api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                const result = await response.json();

                if (result.success) {
                    // Redirect to the correct path instructed by server
                    window.location.href = result.data.redirect;
                } else {
                    // Render error natively inside custom container
                    errorBox.innerText = result.message;
                    errorBox.style.display = 'block';
                    btn.innerText = "Sign In";
                    btn.disabled = false;
                }
            } catch (error) {
                console.error("Network Error:", error);
                errorBox.innerText = "Cannot connect to the server. Please check your internet connection.";
                errorBox.style.display = 'block';
                btn.innerText = "Sign In";
                btn.disabled = false;
            }
        });
    }

    // =========================================================
    // 2. DASHBOARD LOADER (Handles index.php logic)
    // =========================================================
    if (document.getElementById('teacherName')) {
        fetchDashboardData();
    }
});

async function fetchDashboardData() {
    try {
        const response = await fetch('api/dashboard.php', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
            // Set greeting based on active clock hour
            const hour = new Date().getHours();
            let greetingText = 'Good Evening,';
            if (hour < 12) greetingText = 'Good Morning,';
            else if (hour < 17) greetingText = 'Good Afternoon,';
            
            document.getElementById('greeting').innerText = greetingText;
            document.getElementById('teacherName').innerText = data.data.teacher_name.split(' ')[0];
            document.getElementById('teacherInitials').innerText = data.data.initials;
            
            // Inject dynamic term context into header badge
            const termBadge = document.querySelector('.app-header span');
            if (termBadge) {
                termBadge.innerText = `Academic System | ${data.data.active_term}, ${data.data.active_year}`;
            }
            
            // Update quick statistics overview row
            const classCount = data.data.classes_today;
            const classText = classCount === 1 ? '1 Stream Assigned' : `${classCount} Streams Assigned`;
            document.getElementById('dailyOverview').innerText = classText;
            
        } else {
            document.getElementById('dailyOverview').innerText = "Schedule unavailable.";
        }
    } catch (error) {
        console.error("API Error:", error);
        document.getElementById('dailyOverview').innerText = "Server disconnected.";
    }
}

// =========================================================
// 3. GLOBAL ROUTER & DIALOG CONTROLS
// =========================================================
function navigateTo(url) {
    // Smooth navigation delay matching active layout animations
    setTimeout(() => { window.location.href = url; }, 150);
}

function confirmLogout() {
    const modal = document.getElementById('customModal');
    const modalContent = document.getElementById('customModalContent');
    
    if (modal && modalContent) {
        modal.classList.remove('hidden');
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
            modalContent.classList.add('scale-100');
        });
    } else {
        // Fallback safety layer if called from a page without the structural HTML modal markup
        if (confirm("Are you sure you want to log out?")) {
            window.location.href = 'api/logout.php';
        }
    }
}

function closeModal() {
    const modal = document.getElementById('customModal');
    const modalContent = document.getElementById('customModalContent');
    
    if (modal && modalContent) {
        modal.classList.add('opacity-0');
        modalContent.classList.remove('scale-100');
        modalContent.classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); }, 300);
    }
}