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
    <title>Learner Registry | Admin Workspace</title>
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
                class="sidebar-link active flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4 border-transparent text-xs font-semibold w-full text-left">
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
            <div class="flex items-center gap-3">
                <div
                    class="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                    <i data-lucide="graduation-cap" class="w-4 h-4"></i></div>
                <h2 class="text-lg font-extrabold text-slate-800 tracking-tight">Learners Registry</h2>
            </div>
        </header>

        <div class="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
            <div class="grid grid-cols-12 gap-5 flex-1 min-h-0">

                <div class="col-span-4 flex flex-col gap-5 overflow-y-auto pr-1">

                    <div class="bg-white p-5 rounded-xl  border border-slate-200 elevate-card flex-shrink-0">
                        <div class="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                            <div class="w-7 h-7 rounded-lg bg-blue-50 text-brand flex items-center justify-center"><i
                                    data-lucide="user-plus" class="w-4 h-4"></i></div>
                            <h3 class="font-extrabold text-slate-800 text-sm">Register Single Learner</h3>
                        </div>
                        <form id="formAddLearner" class="space-y-4">
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Full
                                    Name</label>
                                <input type="text" id="inpLearnerName" placeholder="e.g., Kato Paul" required
                                    class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand transition-all">
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">LIN
                                    (Admission No.)</label>
                                <input type="text" id="inpLearnerLIN" placeholder="e.g., U001" required
                                    class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand transition-all uppercase">
                            </div>
                            <div class="space-y-1.5">
                                <label
                                    class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Enroll
                                    to Stream</label>
                                <select id="selLearnerStream" required
                                    class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-brand transition-all cursor-pointer">
                                    <option value="">-- Loading Streams --</option>
                                </select>
                            </div>
                            <button type="submit" id="btnSaveLearner"
                                class="w-full bg-brand hover:bg-brand-dark text-white py-2 rounded-lg text-xs font-bold  active:scale-95 transition-all flex justify-center items-center gap-2 mt-2">
                                <i data-lucide="save" class="w-3.5 h-3.5"></i> Register Learner
                            </button>
                        </form>
                    </div>

                    <div
                        class="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border border-blue-100 flex-shrink-0">
                        <div class="flex items-center gap-2.5 mb-3">
                            <div class="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center"><i
                                    data-lucide="upload-cloud" class="w-4 h-4"></i></div>
                            <h3 class="font-extrabold text-slate-800 text-sm">Bulk Import</h3>
                        </div>
                        <p class="text-[11px] text-slate-600 leading-relaxed mb-4">Download the smart template, fill it
                            out using exact stream names, and upload it to enroll hundreds of learners instantly.</p>

                        <div class="space-y-3">
                            <button onclick="downloadCSVTemplate()"
                                class="w-full bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-200 py-2 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 ">
                                <i data-lucide="download" class="w-3.5 h-3.5"></i> 1. Download Template
                            </button>

                            <label
                                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-bold  cursor-pointer transition-all flex justify-center items-center gap-2">
                                <i data-lucide="file-up" class="w-3.5 h-3.5"></i> 2. Upload Completed CSV
                                <input type="file" id="inpCSVUpload" accept=".csv" class="hidden"
                                    onchange="handleCSVUpload(event)">
                            </label>
                        </div>
                    </div>

                </div>

                <div class="col-span-8 flex flex-col bg-white rounded-xl  border border-slate-200 overflow-hidden">
                    <div class="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                        <div>
                            <h3 class="text-base font-extrabold text-slate-800 flex items-center gap-2">Learner
                                Directory <span id="learnerCountBadge"
                                    class="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">0</span>
                            </h3>
                            <p class="text-[11px] text-slate-500 mt-0.5">Manage enrollment and update profile details.
                            </p>
                        </div>
                        <div class="relative">
                            <i data-lucide="search"
                                class="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                            <input type="text" id="inpSearchLearner" onkeyup="filterLearners()"
                                placeholder="Search name, LIN, or stream..."
                                class="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-brand w-64 ">
                        </div>
                    </div>

                    <div id="learnersContainer"
                        class="flex-1 overflow-y-auto p-5 grid grid-cols-2 gap-4 bg-slate-50/30 content-start">
                        <div class="col-span-2 text-center py-10 text-slate-400"><i data-lucide="loader-2"
                                class="w-5 h-5 animate-spin mx-auto mb-2 text-brand"></i> Compiling directory...</div>
                    </div>
                </div>

            </div>
        </div>
    </main>

    <div id="editModal"
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] hidden items-center justify-center opacity-0 transition-opacity duration-300">
        <div class="bg-white rounded-2xl -2xl w-full max-w-sm p-6 transform scale-95 transition-transform duration-300"
            id="editModalContent">
            <div
                class="w-10 h-10 rounded-full bg-blue-50 text-brand flex items-center justify-center mb-4 border border-blue-100">
                <i data-lucide="edit-2" class="w-5 h-5"></i>
            </div>
            <h3 class="text-lg font-extrabold text-slate-800 mb-1">Edit Learner Profile</h3>

            <div class="space-y-4 mb-6 mt-4">
                <div class="space-y-1.5">
                    <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Full Name</label>
                    <input type="text" id="inpEditName"
                        class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand transition-all">
                </div>
                <div class="space-y-1.5">
                    <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">LIN (Admission
                        No.)</label>
                    <input type="text" id="inpEditLIN"
                        class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand transition-all uppercase">
                </div>
                <div class="space-y-1.5">
                    <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Stream</label>
                    <select id="selEditStream"
                        class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:border-brand transition-all"></select>
                </div>
            </div>

            <div class="flex gap-3 justify-end">
                <button onclick="closeEditModal()"
                    class="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors w-full border border-slate-200">Cancel</button>
                <button id="btnConfirmEdit" onclick="executeEdit()"
                    class="px-4 py-2 rounded-lg text-xs font-bold bg-brand text-white hover:bg-brand-dark transition-all flex items-center justify-center gap-2 w-full ">
                    <i data-lucide="save" class="w-3.5 h-3.5"></i> Update
                </button>
            </div>
        </div>
    </div>

    <div id="deleteModal"
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] hidden items-center justify-center opacity-0 transition-opacity duration-300">
        <div class="bg-white rounded-2xl -2xl w-full max-w-sm p-6 transform scale-95 transition-transform duration-300"
            id="deleteModalContent">
            <div
                class="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100">
                <i data-lucide="user-x" class="w-5 h-5"></i>
            </div>
            <h3 class="text-lg font-extrabold text-slate-800 mb-1">Remove Learner?</h3>
            <p class="text-xs text-slate-500 mb-5 leading-relaxed">You are about to remove <strong id="deleteTargetName"
                    class="text-slate-800"></strong>. <span class="text-rose-500 font-bold">This will permanently erase
                    their attendance and grading history!</span></p>

            <div class="space-y-2 mb-6">
                <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Type "delete" to
                    confirm</label>
                <input type="text" id="inpDeleteConfirm" autocomplete="off" placeholder="delete"
                    class="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-lg px-3 py-2.5 focus:outline-none focus:border-rose-500 transition-all text-center">
            </div>

            <div class="flex gap-3 justify-end">
                <button onclick="closeDeleteModal()"
                    class="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors w-full border border-slate-200">Cancel</button>
                <button id="btnConfirmDelete" onclick="executeDelete()" disabled
                    class="px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 w-full ">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete
                </button>
            </div>
        </div>
    </div>

    <div id="bulkPreviewModal"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] hidden items-center justify-center opacity-0 transition-opacity duration-300">
        <div class="bg-white rounded-2xl -2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform scale-95 transition-transform duration-300"
            id="bulkPreviewContent">

            <div
                class="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50 rounded-t-2xl">
                <div>
                    <h3 class="text-lg font-extrabold text-slate-800 flex items-center gap-2"><i
                            data-lucide="clipboard-check" class="w-5 h-5 text-indigo-600"></i> Import Preview Gate</h3>
                    <p class="text-[11px] text-slate-500 mt-1">Review the parsed data. Only valid rows will be uploaded
                        to the database.</p>
                </div>
                <div class="flex items-center gap-3">
                    <div
                        class="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2 ">
                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span class="text-xs font-bold text-emerald-700"><span id="lblValidCount">0</span> Valid</span>
                    </div>
                    <div class="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-2 ">
                        <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span class="text-xs font-bold text-rose-700"><span id="lblInvalidCount">0</span> Invalid</span>
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-auto p-6 bg-slate-50">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                                Status</th>
                            <th
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                                Full Name</th>
                            <th
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                                LIN</th>
                            <th
                                class="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">
                                Stream / Reason</th>
                        </tr>
                    </thead>
                    <tbody id="previewTableBody" class="text-sm">
                    </tbody>
                </table>
            </div>

            <div
                class="px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-white rounded-b-2xl">
                <button onclick="closeBulkModal()"
                    class="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">Cancel
                    Upload</button>
                <button id="btnConfirmBulk" onclick="executeBulkImport()"
                    class="px-6 py-2.5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2  -indigo-600/20 disabled:opacity-50">
                    <i data-lucide="cloud-lightning" class="w-4 h-4"></i> Upload Valid Data
                </button>
            </div>
        </div>
    </div>

    <div id="notificationToast"
        class="fixed top-6 right-6 transform bg-slate-900 text-white px-5 py-3 rounded-lg -xl z-[300] transition-all duration-300 opacity-0 translate-x-10 flex items-center gap-2.5 pointer-events-none border border-slate-700">
        <i data-lucide="check-circle" id="toastSuccessIcon" class="w-4 h-4 text-emerald-400 hidden"></i>
        <i data-lucide="alert-triangle" id="toastErrorIcon" class="w-4 h-4 text-rose-400 hidden"></i>
        <span id="toastMessage" class="text-xs font-bold">Message</span>
    </div>

    <script src="admin_learners.js"></script>
</body>

</html>