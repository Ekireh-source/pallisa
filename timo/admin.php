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
    <title>Admin Control Center | Academic System</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
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
        body {
            background-color: #f8fafc;
            overflow: hidden;
        }

        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }

        .sidebar-link {
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            color: rgba(255, 255, 255, 0.6);
        }

        .sidebar-link:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.05);
            transform: translateX(3px);
        }

        .sidebar-link.active {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
            color: #ffffff;
            border-left-color: #22d3ee;
        }

        .elevate-card {
            transition: all 0.2s ease-in-out;
        }

        .elevate-card:hover {
            transform: translateY(-2px);
            box-: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        }
    </style>
</head>

<body class="text-slate-800 antialiased h-screen flex">

    <aside
        class="w-64 bg-[#052c54] flex flex-col h-full flex-shrink-0 border-r border-[#041e3a] relative z-20 -xl overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-48 bg-brand rounded-full blur-[60px] opacity-20 -translate-y-1/2">
        </div>
        <div class="h-16 flex items-center px-5 border-b border-white/5 relative z-10">
            <div
                class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-brand flex items-center justify-center mr-3  border border-white/20">
                <i data-lucide="shield-check" class="w-4 h-4 text-white"></i>
            </div>
            <h1 class="text-white font-extrabold tracking-tight text-sm drop-">System Admin</h1>
        </div>

        <nav class="flex-1 py-4 flex flex-col gap-0.5 px-3 relative z-10 overflow-hidden">
            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mb-1.5">Main Menu</p>
            <a href="admin.php"
                class="sidebar-link active flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Dashboard
            </a>

            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mt-4 mb-1.5">School
                Structure</p>
            <button onclick="navigateTo('admin_structure.php')"
                class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="building" class="w-4 h-4"></i> Classes & Streams
            </button>
            <button onclick="navigateTo('admin_subjects.php')"
                class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="book-open" class="w-4 h-4"></i> Subjects
            </button>

            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mt-4 mb-1.5">People &
                Rosters</p>
            <button onclick="navigateTo('admin_teachers.php')"
                class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="users" class="w-4 h-4"></i> Teachers
            </button>
            <button onclick="navigateTo('admin_learners.php')"
                class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="graduation-cap" class="w-4 h-4"></i> Learners
            </button>
            <button onclick="navigateTo('admin_assignments.php')"
                class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="briefcase" class="w-4 h-4"></i> Allocations
            </button>

            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mt-4 mb-1.5">Analytics
            </p>
            <button onclick="navigateTo('admin_attendance.php')"
                class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
                <i data-lucide="calendar-check" class="w-4 h-4"></i> Global Attendance
            </button>
            <button onclick="navigateTo('admin_export.php')"
                class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left text-cyan-300">
                <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Excel Reports
            </button>
        </nav>

        <div class="p-4 border-t border-white/5 relative z-10 bg-black/10">
            <button onclick="confirmLogout()"
                class="flex items-center justify-center gap-2 py-2 rounded-lg w-full text-xs font-bold text-white bg-rose-500/80 hover:bg-rose-500 transition-colors">
                <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Sign Out
            </button>
        </div>
    </aside>

    <main class="flex-1 flex flex-col h-full relative bg-slate-50/50">

        <header
            class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 flex-shrink-0">
            <div>
                <h2 class="text-lg font-extrabold text-slate-800 tracking-tight">Overview Dashboard</h2>
            </div>
            <div class="flex items-center gap-4">
                <div
                    class="bg-white text-brand px-3 py-1.5 rounded-lg font-bold text-xs border border-slate-200 flex items-center gap-2 ">
                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span id="headerTermBadge">Term --, ----</span>
                </div>
            </div>
        </header>

        <div class="flex-1 p-6 overflow-hidden flex flex-col gap-5">

            <div class="grid grid-cols-6 gap-4 flex-shrink-0">

                <div
                    class="col-span-2 elevate-card bg-white p-4 rounded-xl  border border-slate-200 flex items-center gap-4 relative overflow-hidden">
                    <div
                        class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                        <i data-lucide="users" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Teachers
                        </p>
                        <h3 id="statTeachers" class="text-xl font-extrabold text-slate-800"><i data-lucide="loader-2"
                                class="w-4 h-4 animate-spin"></i></h3>
                    </div>
                </div>
                <div
                    class="col-span-2 elevate-card bg-white p-4 rounded-xl  border border-slate-200 flex items-center gap-4 relative overflow-hidden">
                    <div
                        class="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0 border border-cyan-100">
                        <i data-lucide="graduation-cap" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Learners
                        </p>
                        <h3 id="statLearners" class="text-xl font-extrabold text-slate-800"><i data-lucide="loader-2"
                                class="w-4 h-4 animate-spin"></i></h3>
                    </div>
                </div>
                <div
                    class="col-span-2 elevate-card bg-white p-4 rounded-xl  border border-slate-200 flex items-center gap-4 relative overflow-hidden">
                    <div
                        class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                        <i data-lucide="layers" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Streams</p>
                        <h3 id="statStreams" class="text-xl font-extrabold text-slate-800"><i data-lucide="loader-2"
                                class="w-4 h-4 animate-spin"></i></h3>
                    </div>
                </div>

                <div
                    class="col-span-2 elevate-card bg-white p-4 rounded-xl  border border-slate-200 flex items-center gap-4 relative overflow-hidden">
                    <div
                        class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                        <i data-lucide="calendar-check" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest mb-0.5">Global
                            Attendance</p>
                        <h3 id="statAttendance" class="text-xl font-extrabold text-slate-800"><i data-lucide="loader-2"
                                class="w-4 h-4 animate-spin"></i></h3>
                    </div>
                </div>
                <div
                    class="col-span-2 elevate-card bg-white p-4 rounded-xl  border border-slate-200 flex items-center gap-4 relative overflow-hidden">
                    <div
                        class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
                        <i data-lucide="award" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-[9px] font-extrabold text-purple-600 uppercase tracking-widest mb-0.5">Avg
                            Subject Achievement</p>
                        <h3 id="statSA" class="text-xl font-extrabold text-slate-800"><i data-lucide="loader-2"
                                class="w-4 h-4 animate-spin"></i></h3>
                    </div>
                </div>
                <div
                    class="col-span-2 elevate-card bg-white p-4 rounded-xl  border border-slate-200 flex items-center gap-4 relative overflow-hidden">
                    <div
                        class="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 border border-rose-100">
                        <i data-lucide="folder-kanban" class="w-5 h-5"></i></div>
                    <div>
                        <p class="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest mb-0.5">Project
                            Score Entries</p>
                        <h3 id="statProjects" class="text-xl font-extrabold text-slate-800"><i data-lucide="loader-2"
                                class="w-4 h-4 animate-spin"></i></h3>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-5 flex-1 min-h-0">

                <div class="col-span-8 flex flex-col bg-white rounded-xl  border border-slate-200 overflow-hidden">
                    <div class="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                        <div>
                            <h3 class="text-base font-extrabold text-slate-800 flex items-center gap-2"><i
                                    data-lucide="sliders" class="w-4 h-4 text-brand"></i> Global Settings</h3>
                            <p class="text-[11px] text-slate-500 mt-0.5">Updates are applied instantly across the entire
                                school app.</p>
                        </div>
                    </div>

                    <div class="p-6 flex-1 overflow-y-auto">
                        <form id="adminSettingsForm" class="space-y-6">
                            <div class="grid grid-cols-2 gap-5">
                                <div class="space-y-1.5">
                                    <label
                                        class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Active
                                        Term</label>
                                    <select id="setTerm"
                                        class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer">
                                        <option value="1">Term 1</option>
                                        <option value="2">Term 2</option>
                                        <option value="3">Term 3</option>
                                    </select>
                                    <p class="text-[9px] text-slate-400 mt-1 leading-tight">Switching terms updates the
                                        dashboard stats to that specific term.</p>
                                </div>
                                <div class="space-y-1.5">
                                    <label
                                        class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Academic
                                        Year</label>
                                    <select id="setYear"
                                        class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer">
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                        <option value="2027">2027</option>
                                        <option value="2028">2028</option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-2.5 pt-2">
                                <div>
                                    <label
                                        class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Project
                                        Competencies Permissions</label>
                                </div>
                                <div class="grid grid-cols-4 gap-3">
                                    <label class="relative cursor-pointer group">
                                        <input type="checkbox" value="1" class="comp-check peer sr-only">
                                        <div
                                            class="bg-slate-50 border border-slate-200 rounded-lg py-2 text-center text-xs font-bold text-slate-500 transition-all peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand peer-checked: peer-checked:-brand/20 group-hover:bg-slate-100">
                                            C1: Planning
                                        </div>
                                    </label>
                                    <label class="relative cursor-pointer group">
                                        <input type="checkbox" value="2" class="comp-check peer sr-only">
                                        <div
                                            class="bg-slate-50 border border-slate-200 rounded-lg py-2 text-center text-xs font-bold text-slate-500 transition-all peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand peer-checked: peer-checked:-brand/20 group-hover:bg-slate-100">
                                            C2: Implement
                                        </div>
                                    </label>
                                    <label class="relative cursor-pointer group">
                                        <input type="checkbox" value="3" class="comp-check peer sr-only">
                                        <div
                                            class="bg-slate-50 border border-slate-200 rounded-lg py-2 text-center text-xs font-bold text-slate-500 transition-all peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand peer-checked: peer-checked:-brand/20 group-hover:bg-slate-100">
                                            C3: Reporting
                                        </div>
                                    </label>
                                    <label class="relative cursor-pointer group">
                                        <input type="checkbox" value="4" class="comp-check peer sr-only">
                                        <div
                                            class="bg-slate-50 border border-slate-200 rounded-lg py-2 text-center text-xs font-bold text-slate-500 transition-all peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand peer-checked: peer-checked:-brand/20 group-hover:bg-slate-100">
                                            C4: Disseminate
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div class="pt-4">
                                <button type="submit" id="saveSettingsBtn"
                                    class="w-auto inline-flex items-center justify-center gap-2 bg-[#0f172a] hover:bg-[#1e293b] text-white px-6 py-2.5 rounded-lg font-bold  active:scale-95 transition-all text-xs">
                                    <i data-lucide="save" class="w-3.5 h-3.5"></i> Apply System Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="col-span-4 flex flex-col gap-5 min-h-0">
                    <div class="elevate-card bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-dark via-brand to-cyan-600 p-5 rounded-xl  text-white relative overflow-hidden group cursor-pointer flex-shrink-0"
                        onclick="navigateTo('admin_export.php')">
                        <i data-lucide="file-spreadsheet"
                            class="w-20 h-20 absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500"></i>
                        <h3 class="text-base font-extrabold mb-1.5 relative z-10 flex items-center gap-2"><i
                                data-lucide="download" class="w-4 h-4"></i> Export Terminal</h3>
                        <p class="text-[11px] text-blue-100 font-medium mb-4 relative z-10 leading-relaxed opacity-90">
                            Download configured Excel reports for AOI, SA, and Projects.</p>
                        <button
                            class="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors w-full flex items-center justify-center gap-2 backdrop-blur-sm relative z-10">
                            Open Exporter <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>

                    <div class="bg-white p-5 rounded-xl  border border-slate-200 flex-1 overflow-y-auto">
                        <h3 class="text-[10px] font-extrabold text-slate-800 mb-4 uppercase tracking-widest">
                            Initialization Pipeline</h3>
                        <ul class="space-y-4">
                            <li class="flex gap-3 items-start">
                                <div
                                    class="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                    1</div>
                                <div>
                                    <p class="text-xs font-bold text-slate-700">Create Structure</p>
                                    <p class="text-[10px] text-slate-500 mt-0.5">Define classes & streams.</p>
                                </div>
                            </li>
                            <li class="flex gap-3 items-start">
                                <div
                                    class="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                    2</div>
                                <div>
                                    <p class="text-xs font-bold text-slate-700">Upload Data</p>
                                    <p class="text-[10px] text-slate-500 mt-0.5">Register staff & learners.</p>
                                </div>
                            </li>
                            <li class="flex gap-3 items-start">
                                <div
                                    class="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                    3</div>
                                <div>
                                    <p class="text-xs font-bold text-slate-700">Assign Workloads</p>
                                    <p class="text-[10px] text-slate-500 mt-0.5">Link teachers to subjects.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    </main>

    <div id="notificationToast"
        class="fixed top-6 right-6 transform bg-slate-900 text-white px-5 py-3 rounded-lg -xl z-[300] transition-all duration-300 opacity-0 translate-x-10 flex items-center gap-2.5 pointer-events-none border border-slate-700">
        <i data-lucide="check-circle" id="toastSuccessIcon" class="w-4 h-4 text-emerald-400 hidden"></i>
        <i data-lucide="alert-triangle" id="toastErrorIcon" class="w-4 h-4 text-rose-400 hidden"></i>
        <span id="toastMessage" class="text-xs font-bold">Message</span>
    </div>

    <script src="admin.js"></script>
</body>

</html>