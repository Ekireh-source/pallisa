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
    <title>Excel Export Terminal | Admin Workspace</title>
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
            height: 6px;
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
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
    </style>
</head>

<body class="text-slate-800 antialiased h-screen flex relative">

    <aside
        class="w-64 bg-[#052c54] flex flex-col h-full flex-shrink-0 border-r border-[#041e3a] relative z-20 -xl overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-48 bg-brand rounded-full blur-[60px] opacity-20 -translate-y-1/2">
        </div>
        <div class="h-16 flex items-center px-5 border-b border-white/5 relative z-10">
            <div
                class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-brand flex items-center justify-center mr-3  border border-white/20">
                <i data-lucide="shield-check" class="w-4 h-4 text-white"></i>
            </div>
            <div>
                <h1 class="text-white font-extrabold tracking-tight text-sm drop-">System Admin</h1>
            </div>
        </div>

        <nav class="flex-1 py-4 flex flex-col gap-0.5 px-3 relative z-10 overflow-hidden">
            <p class="px-2 text-[9px] font-extrabold text-blue-400/50 uppercase tracking-widest mb-1.5">Main Menu</p>
            <a href="admin.php"
                class="sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold">
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
                class="sidebar-link active flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left text-cyan-300">
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
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <i data-lucide="download-cloud" class="w-4 h-4"></i>
                </div>
                <h2 class="text-lg font-extrabold text-slate-800 tracking-tight">Report Export Terminal</h2>
            </div>
            <div class="flex items-center gap-4">
                <div
                    class="bg-white text-brand px-3 py-1.5 rounded-lg font-bold text-xs border border-slate-200 flex items-center gap-2 ">
                    <i data-lucide="settings-2" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span id="headerTermBadge">Loading Settings...</span>
                </div>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-8">

            <div
                class="w-full max-w-4xl bg-white rounded-2xl -xl border border-slate-200 overflow-hidden flex flex-shrink-0">

                <div
                    class="w-2/5 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-900 via-brand-dark to-brand p-10 text-white relative overflow-hidden flex flex-col justify-between">
                    <div
                        class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10">
                    </div>
                    <i data-lucide="file-spreadsheet" class="w-40 h-40 absolute -right-10 -bottom-10 opacity-10"></i>

                    <div class="relative z-10">
                        <div
                            class="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/20 backdrop-blur-md">
                            <i data-lucide="table" class="w-6 h-6 text-white"></i>
                        </div>
                        <h2 class="text-3xl font-extrabold tracking-tight mb-3">Formula Engine</h2>
                        <p class="text-blue-100 text-sm leading-relaxed mb-6 font-medium opacity-90">Preview or download
                            perfectly formatted academic records. The engine automatically applies the C1 rule mapping
                            and performs massive grid aggregations.</p>

                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                                <span class="text-xs font-bold text-blue-50">AOI Aggregations</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                                <span class="text-xs font-bold text-blue-50">SA Math: L1..G5 / Total * 100</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                                <span class="text-xs font-bold text-blue-50">Projects (Subject independent)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-3/5 p-8 flex flex-col">
                    <form id="formExport" class="space-y-6 flex-1 flex flex-col justify-center">

                        <div class="space-y-2">
                            <label
                                class="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2"><i
                                    data-lucide="file-bar-chart" class="w-4 h-4"></i> Select Report Type</label>
                            <select id="selReportType" required
                                class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all cursor-pointer">
                                <option value="">-- Choose Mathematical Model --</option>
                                <option value="aoi">Activity of Integration (AOI)</option>
                                <option value="sa">Subject Achievement (SA Grid)</option>
                                <option value="project_1">Project - Competency 1 (Planning)</option>
                                <option value="project_2">Project - Competency 2 (Implementation)</option>
                                <option value="project_3">Project - Competency 3 (Reporting)</option>
                                <option value="project_4">Project - Competency 4 (Dissemination)</option>
                            </select>
                        </div>

                        <div class="grid grid-cols-2 gap-5 transition-all duration-300">
                            <div class="space-y-2 w-full col-span-1" id="wrapStream">
                                <label
                                    class="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Target
                                    Stream</label>
                                <select id="selStream" required
                                    class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:border-brand transition-all cursor-pointer">
                                    <option value="">-- Select Stream --</option>
                                </select>
                            </div>

                            <div class="space-y-2 w-full col-span-1 transition-all duration-300" id="wrapSubject">
                                <label
                                    class="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Subject
                                    Filter</label>
                                <select id="selSubject" required
                                    class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:border-brand transition-all cursor-pointer">
                                    <option value="">-- Select Subject --</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100">
                            <button type="button" onclick="previewData()"
                                class="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3.5 rounded-xl text-sm font-extrabold  active:scale-95 transition-all flex justify-center items-center gap-2 border border-indigo-200">
                                <i data-lucide="eye" class="w-4 h-4"></i> Preview Data
                            </button>
                            <button type="button" onclick="downloadData()"
                                class="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl text-sm font-extrabold  -slate-900/20 active:scale-95 transition-all flex justify-center items-center gap-2">
                                <i data-lucide="download" class="w-4 h-4"></i> Download CSV
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="previewPane"
                class="w-full max-w-6xl bg-white rounded-2xl  border border-slate-200 flex-col elevate-card hidden flex-shrink-0 mb-8">
                <div
                    class="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-t-2xl">
                    <h3 class="font-extrabold text-slate-800 text-sm flex items-center gap-2"><i data-lucide="table"
                            class="w-4 h-4 text-brand"></i> <span id="lblPreviewTitle">Live Data Preview</span></h3>
                    <button onclick="closePreview()" class="text-slate-400 hover:text-rose-500 transition-colors"><i
                            data-lucide="x-circle" class="w-5 h-5"></i></button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse whitespace-nowrap">
                        <thead id="previewThead" class="bg-white">
                        </thead>
                        <tbody id="previewTbody" class="text-sm">
                        </tbody>
                    </table>
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

    <script src="admin_export.js"></script>
</body>

</html>