<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] === 'admin') {
    header("Location: login.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Class Reports & Analytics | Academic System</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: { fontFamily: { sans: ['Inter', 'sans-serif'] }, colors: { brand: { DEFAULT: '#0a58ca', dark: '#052c54' } } }
            }
        }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { -webkit-tap-highlight-color: transparent; background-color: #f1f5f9; overflow-x: hidden; }
        .app-header { background: linear-gradient(135deg, #0a58ca 0%, #052c54 100%); }
        .pie-chart {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: #cbd5e1;
            transition: background 0.3s ease;
        }
    </style>
</head>
<body class="text-slate-800 antialiased h-screen flex flex-col relative">

    <header class="app-header text-white pt-10 pb-16 px-5 rounded-b-[2rem] flex-shrink-0 z-0 relative shadow-lg overflow-hidden">
        <div class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
        <div class="flex justify-between items-center relative z-10">
            <button id="backBtn" onclick="goBack()" class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                <i data-lucide="arrow-left" class="w-5 h-5"></i>
            </button>
            <h1 class="text-xl font-bold tracking-tight text-white drop-shadow-sm">Class Analytics</h1>
            <div class="w-9 h-9"></div>
        </div>
    </header>

    <main class="flex-1 -mt-10 px-4 z-10 relative overflow-y-auto pb-10" id="mainContainer">
        
        <div id="step1-streams">
            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Select a Stream for Insights</h3>
            <div id="streamsList" class="flex flex-col gap-3">
                <div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Loading classes...</div>
            </div>
        </div>

        <div id="step2-analytics" class="hidden space-y-4">
            
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h2 id="reportStreamTitle" class="font-bold text-slate-800 text-lg">Stream</h2>
                    <p id="reportSubjectTitle" class="text-xs text-brand font-semibold uppercase">Subject</p>
                </div>
                <div class="bg-blue-50 text-brand px-3 py-1.5 rounded-xl font-bold text-xs" id="termInfoBadge">
                    Term --
                </div>
            </div>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Insights</h3>
                    
                    <div class="relative w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer">
                        <i data-lucide="calendar" class="w-4 h-4 text-slate-500"></i>
                        <input type="date" id="inpAttDatePicker" 
                            class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            onchange="filterAttendanceByCustomDate(this.value)">
                    </div>
                </div>

                <div class="bg-slate-100 p-1 rounded-xl flex gap-1 mb-4 text-center border border-slate-200 shadow-inner">
                    <button onclick="toggleAttendanceFilter('day')" id="btnAttDay" class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-slate-500 transition-all">Today</button>
                    <button onclick="toggleAttendanceFilter('week')" id="btnAttWeek" class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg text-slate-500 transition-all">This Week</button>
                    <button onclick="toggleAttendanceFilter('term')" id="btnAttTerm" class="flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-white text-brand shadow-sm transition-all">This Term</button>
                </div>

                <div class="flex items-center gap-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div id="attPieChart" class="pie-chart flex-shrink-0 shadow-sm"></div>
                    <div class="flex-1 space-y-1.5">
                        <div class="flex items-baseline gap-1 text-slate-800">
                            <span id="txtAttendanceRate" class="text-2xl font-bold tracking-tight">--%</span>
                            <span class="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rate</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-500 font-medium">
                            <div class="flex items-center justify-between"><span>Present:</span> <span id="lblPresentCount" class="font-bold text-slate-700">0</span></div>
                            <div class="flex items-center justify-between"><span>Absent:</span> <span id="lblAbsentCount" class="font-bold text-rose-500">0</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">AOI Scores Performance</h3>
                    <i data-lucide="target" class="w-4 h-4 text-purple-600"></i>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4 border-b border-slate-50 pb-3">
                    <div>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Class Average</p>
                        <p id="txtAoiClassAvg" class="text-2xl font-bold text-purple-600">--%</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Logged</p>
                        <p id="txtAoiCount" class="text-2xl font-bold text-slate-800">0</p>
                    </div>
                </div>

                <div id="aoiBreakdownContainer" class="space-y-2.5"></div>

                <div id="aoiPaginationControls" class="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 hidden">
                    <button onclick="paginateAoi(-1)" id="btnAoiPrev" class="flex items-center gap-1 text-xs font-bold text-brand disabled:text-slate-300">
                        <i data-lucide="chevron-left" class="w-4 h-4"></i> Prev
                    </button>
                    <span id="txtAoiPageIndicator" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page 1 of 1</span>
                    <button onclick="paginateAoi(1)" id="btnAoiNext" class="flex items-center gap-1 text-xs font-bold text-brand disabled:text-slate-300">
                        Next <i data-lucide="chevron-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Achievements</h3>
                    <i data-lucide="award" class="w-4 h-4 text-amber-600"></i>
                </div>
                
                <div class="flex items-baseline gap-2 mb-3">
                    <span id="txtSaOverallAvg" class="text-3xl font-bold tracking-tight text-slate-800">--%</span>
                </div>

                <div id="saInsightBox" class="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs leading-relaxed text-slate-600">
                    Evaluating records profiles dataset entries...
                </div>
            </div>

        </div>

    </main>

    <script src="reports.js"></script>
</body>
</html>