<?php
session_start();

// Security Check: If not logged in, redirect to login page
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

// Security Check: If admin, redirect to admin dashboard
if ($_SESSION['role'] === 'admin') {
    header("Location: admin_dashboard.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Teacher Dashboard | Academic System</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        brand: { light: '#1e6be0', DEFAULT: '#0a58ca', dark: '#052c54' }
                    }
                }
            }
        }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        /* Mobile App Optimizations */
        body { 
            -webkit-tap-highlight-color: transparent; 
            background-color: #f1f5f9; 
            overflow: hidden; 
        }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
        
        /* Premium Header Gradient */
        .app-header {
            background: linear-gradient(135deg, #0a58ca 0%, #052c54 100%);
        }
    </style>
</head>
<body class="text-slate-800 antialiased h-screen flex flex-col relative">

    <header class="app-header text-white pt-10 pb-16 px-5 rounded-b-[2rem] flex-shrink-0 z-0 relative shadow-lg overflow-hidden">
        
        <div class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>

        <div class="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full mb-5 backdrop-blur-sm relative z-10">
            <div class="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></div>
            <span class="text-[10px] font-semibold tracking-wide text-blue-50 uppercase">Academic Administration</span>
        </div>

        <div class="flex justify-between items-end mb-1 relative z-10">
            <div>
                <p id="greeting" class="text-blue-200/90 text-xs font-medium tracking-wide mb-0.5">Good Morning,</p>
                <h1 id="teacherName" class="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Loading...</h1>
            </div>
            <div id="teacherInitials" class="w-11 h-11 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center font-bold text-sm backdrop-blur-md shadow-inner">
                --
            </div>
        </div>
    </header>

    <main class="flex-1 -mt-8 px-5 z-10 relative overflow-y-auto pb-28">
        
        <section class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between mb-6 backdrop-blur-sm bg-white/90">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-brand">
                    <i data-lucide="book-open" class="w-5 h-5"></i>
                </div>
                <div>
                    <h2 class="text-xs font-bold text-slate-400 uppercase">My Schedule</h2>
                    <p id="dailyOverview" class="text-sm font-semibold text-slate-700">Loading...</p>
                </div>
            </div>
        </section>

        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Assessments & Records</h3>
        <div class="grid grid-cols-2 gap-3 mb-6">
            
            <button onclick="navigateTo('attendance.php')" class="bg-white p-4 rounded-2xl text-center border border-slate-100 shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-blue-50 text-brand flex items-center justify-center">
                    <i data-lucide="user-check" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-800">Attendance</h4>
                    <p class="text-[10px] text-slate-500 leading-tight mt-0.5">Daily Roll Call</p>
                </div>
            </button>

            <button onclick="navigateTo('aoi.php')" class="bg-white p-4 rounded-2xl text-center border border-slate-100 shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <i data-lucide="target" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-800">AOI Marks</h4>
                    <p class="text-[10px] text-slate-500 leading-tight mt-0.5">Integration</p>
                </div>
            </button>

            <button onclick="navigateTo('sa.php')" class="bg-white p-4 rounded-2xl text-center border border-slate-100 shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                    <i data-lucide="award" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-800">SA Marks</h4>
                    <p class="text-[10px] text-slate-500 leading-tight mt-0.5">S3 / S4 Scoring</p>
                </div>
            </button>

            <button onclick="navigateTo('projects.php')" class="bg-white p-4 rounded-2xl text-center border border-slate-100 shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <i data-lucide="folder-kanban" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-800">Projects</h4>
                    <p class="text-[10px] text-slate-500 leading-tight mt-0.5">Competencies</p>
                </div>
            </button>

        </div>

        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Insights & Management</h3>
        <div class="grid grid-cols-2 gap-3">
            
            <button onclick="navigateTo('reports.php')" class="bg-white p-4 rounded-2xl text-center border border-slate-100 shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <i data-lucide="pie-chart" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-800">Class Reports</h4>
                    <p class="text-[10px] text-slate-500 leading-tight mt-0.5">Attendance & Marks</p>
                </div>
            </button>

            <button onclick="navigateTo('students.php')" class="bg-white p-4 rounded-2xl text-center border border-slate-100 shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2">
                <div class="w-12 h-12 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <i data-lucide="graduation-cap" class="w-6 h-6"></i>
                </div>
                <div>
                    <h4 class="text-sm font-bold text-slate-800">My Students</h4>
                    <p class="text-[10px] text-slate-500 leading-tight mt-0.5">Stream Directory</p>
                </div>
            </button>

        </div>

    </main>

    <nav class="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-between px-6 pt-3 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <button class="flex flex-col items-center gap-1 text-brand">
            <i data-lucide="home" class="w-6 h-6 fill-brand/10"></i>
            <span class="text-[10px] font-bold">Home</span>
        </button>
        
        <button onclick="navigateTo('attendance.php')" class="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
            <i data-lucide="users" class="w-6 h-6"></i>
            <span class="text-[10px] font-semibold">Streams</span>
        </button>

        <button onclick="navigateTo('reports.php')" class="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
            <i data-lucide="bar-chart-2" class="w-6 h-6"></i>
            <span class="text-[10px] font-semibold">Reports</span>
        </button>

        <button onclick="confirmLogout()" class="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors">
            <i data-lucide="user" class="w-6 h-6"></i>
            <span class="text-[10px] font-semibold">Profile</span>
        </button>
    </nav>

    <div id="notificationToast" class="fixed top-5 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl z-[100] transition-all duration-300 opacity-0 -translate-y-10 flex items-center gap-3 pointer-events-none">
        <i data-lucide="check-circle" id="toastSuccessIcon" class="w-5 h-5 text-emerald-400 hidden"></i>
        <i data-lucide="alert-triangle" id="toastErrorIcon" class="w-5 h-5 text-rose-400 hidden"></i>
        <span id="toastMessage" class="text-sm font-medium tracking-wide">Message</span>
    </div>

    <div id="customModal" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] hidden flex items-center justify-center opacity-0 transition-opacity duration-300">
        <div id="customModalContent" class="bg-white rounded-3xl p-6 w-11/12 max-w-sm shadow-2xl transform scale-95 transition-transform duration-300">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="log-out" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900">Sign Out?</h3>
                </div>
            </div>
            <p class="text-sm text-gray-500 mb-8 ml-1">Are you sure you want to log out of your session? You will need to enter your password to access your dashboard again.</p>
            <div class="flex gap-3">
                <button onclick="closeModal()" class="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95">Cancel</button>
                <button onclick="window.location.href='api/logout.php'" class="flex-1 py-3.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/30 transition-colors active:scale-95">Yes, Sign Out</button>
            </div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>