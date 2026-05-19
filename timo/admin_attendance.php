<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header("Location: login.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Attendance | Admin Workspace</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: { 
                    fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] }, 
                    colors: { brand: { DEFAULT: '#0a58ca', dark: '#052c54', light: '#eff6ff' } } 
                }
            }
        }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { background-color: #f8fafc; overflow: hidden; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        .sidebar-link { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); color: rgba(255, 255, 255, 0.6); }
        .sidebar-link:hover { color: #ffffff; background: rgba(255,255,255,0.05); transform: translateX(3px); }
        .sidebar-link.active { 
            background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%); 
            color: #ffffff; 
            border-left-color: #22d3ee; 
        }
        .elevate-card { transition: all 0.2s ease-in-out; }
        .elevate-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        
        /* Sticky Table Header */
        thead tr th { position: sticky; top: 0; z-index: 10; background-color: #f8fafc; }
    </style>
</head>
<body class="text-slate-800 antialiased h-screen flex relative">

    <aside class="w-64 bg-[#052c54] flex flex-col h-full flex-shrink-0 border-r border-[#041e3a] relative z-20 shadow-xl overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-48 bg-brand rounded-full blur-[60px] opacity-20 -translate-y-1/2"></div>
        <div class="h-16 flex items-center px-5 border-b border-white/5 relative z-10">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-brand flex items-center justify-center mr-3 shadow-md border border-white/20">
                <i data-lucide="shield-check" class="w-4 h-4 text-white"></i>
            </div>
            <div><h1 class="text-white font-extrabold tracking-tight text-sm drop-shadow-md">System Admin</h1></div>
        </div>

        <nav class="flex-1 py-4 flex flex-col gap-0.5 px-3 relative z-10 overflow-hidden">
            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mb-1.5">Main Menu</p>
            <a href="admin.php" class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Dashboard
            </a>
            
            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mt-4 mb-1.5">School Structure</p>
            <button onclick="navigateTo('admin_structure.php')" class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="building" class="w-4 h-4"></i> Classes & Streams
            </button>
            <button onclick="navigateTo('admin_subjects.php')" class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="book-open" class="w-4 h-4"></i> Subjects
            </button>

            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mt-4 mb-1.5">People & Rosters</p>
            <button onclick="navigateTo('admin_teachers.php')" class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="users" class="w-4 h-4"></i> Teachers
            </button>
            <button onclick="navigateTo('admin_learners.php')" class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="graduation-cap" class="w-4 h-4"></i> Learners
            </button>
            <button onclick="navigateTo('admin_assignments.php')" class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="briefcase" class="w-4 h-4"></i> Allocations
            </button>

            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mt-4 mb-1.5">Analytics</p>
            <button onclick="navigateTo('admin_attendance.php')" class="sidebar-link active flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="calendar-check" class="w-4 h-4"></i> Global Attendance
            </button>
            <button onclick="navigateTo('admin_export.php')" class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left text-cyan-300">
                <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Excel Reports
            </button>
        </nav>

        <div class="p-4 border-t border-white/5 relative z-10 bg-black/10">
            <button onclick="confirmLogout()" class="flex items-center justify-center gap-2 py-2 rounded-lg w-full text-xs font-bold text-white bg-rose-500/80 hover:bg-rose-500 transition-colors">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Sign Out
            </button>
        </div>
    </aside>

    <main class="flex-1 flex flex-col h-full relative bg-slate-50/50">
        
        <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 flex-shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><i data-lucide="calendar-check" class="w-4 h-4"></i></div>
                <h2 class="text-lg font-extrabold text-slate-800 tracking-tight">Global Attendance Analytics</h2>
            </div>
            <div class="flex items-center gap-4">
                <div class="bg-white text-brand px-3 py-1.5 rounded-lg font-bold text-xs border border-slate-200 flex items-center gap-2 shadow-sm">
                    <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span id="headerTermBadge">Loading...</span>
                </div>
            </div>
        </header>

        <div class="flex-1 p-6 overflow-hidden flex flex-col gap-5">
            
            <div class="grid grid-cols-4 gap-5 flex-shrink-0">
                <div class="elevate-card bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">School-Wide Rate</p>
                    <h3 id="kpiRate" class="text-3xl font-extrabold text-emerald-600 tracking-tight"><i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i></h3>
                    <div class="absolute bottom-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl translate-y-10 translate-x-10"></div>
                </div>
                <div class="elevate-card bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Lessons Logged</p>
                    <h3 id="kpiLessons" class="text-3xl font-extrabold text-slate-800 tracking-tight"><i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i></h3>
                </div>
                <div class="elevate-card bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Highest Attendance</p>
                    <h3 id="kpiBest" class="text-base font-extrabold text-indigo-600 tracking-tight mt-1 truncate"><i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i></h3>
                    <p class="text-[10px] text-slate-500 font-medium mt-0.5" id="kpiBestSub">--</p>
                </div>
                <div class="elevate-card bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Lowest Attendance</p>
                    <h3 id="kpiWorst" class="text-base font-extrabold text-rose-500 tracking-tight mt-1 truncate"><i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i></h3>
                    <p class="text-[10px] text-slate-500 font-medium mt-0.5" id="kpiWorstSub">--</p>
                </div>
            </div>

            <div class="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-0">
                
                <div class="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between flex-shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                            <input type="text" id="inpSearch" onkeyup="applyFilters()" placeholder="Search Learner or LIN..." class="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand w-60 shadow-sm">
                        </div>
                        <select id="selStreamFilter" onchange="applyFilters()" class="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand shadow-sm cursor-pointer w-40">
                            <option value="">All Streams</option>
                        </select>
                        <select id="selSubjectFilter" onchange="applyFilters()" class="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand shadow-sm cursor-pointer w-40">
                            <option value="">All Subjects</option>
                        </select>
                    </div>
                    <button onclick="exportToCSV()" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-2">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i> Export Table
                    </button>
                </div>

                <div class="flex-1 overflow-auto">
                    <table class="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr>
                                <th class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest py-3 px-5 border-b border-slate-200">Learner details</th>
                                <th class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest py-3 px-5 border-b border-slate-200">Stream</th>
                                <th class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest py-3 px-5 border-b border-slate-200 text-center">Total Lessons</th>
                                <th class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest py-3 px-5 border-b border-slate-200 text-center">Present</th>
                                <th class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest py-3 px-5 border-b border-slate-200 text-center">Absent</th>
                                <th class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest py-3 px-5 border-b border-slate-200 text-right">Attendance Rate</th>
                            </tr>
                        </thead>
                        <tbody id="attendanceTableBody" class="text-sm">
                            <tr>
                                <td colspan="6" class="text-center py-10 text-slate-400 font-medium">
                                    <i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-brand"></i> Compiling attendance ledger...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    </main>

    <script src="admin_attendance.js"></script>
</body>
</html>