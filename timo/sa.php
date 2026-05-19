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
    <title>SA Marks Grid | Academic System</title>
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
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
        .app-header { background: linear-gradient(135deg, #0a58ca 0%, #052c54 100%); }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    </style>
</head>
<body class="text-slate-800 antialiased h-screen flex flex-col relative">

    <header class="app-header text-white pt-10 pb-16 px-5 rounded-b-[2rem] flex-shrink-0 z-0 relative shadow-lg overflow-hidden">
        <div class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
        <div class="flex justify-between items-center relative z-10">
            <button id="backBtn" onclick="goBack()" class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                <i data-lucide="arrow-left" class="w-5 h-5"></i>
            </button>
            <h1 class="text-xl font-bold tracking-tight text-white drop-shadow-sm">SA Assessment Matrix</h1>
            <div class="w-9 h-9"></div>
        </div>
    </header>

    <main class="flex-1 -mt-10 px-4 z-10 relative overflow-y-auto pb-28" id="mainContainer">
        
        <div id="step1-streams">
            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Select your Stream</h3>
            <div id="streamsList" class="flex flex-col gap-3">
                <div class="text-center py-10 text-slate-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Loading classes...</div>
            </div>
        </div>

        <div id="step2-matrix" class="hidden">
            <div class="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 flex justify-between items-center sticky top-0 z-20">
                <div>
                    <h2 id="matrixStreamTitle" class="font-bold text-slate-800 text-lg">Stream</h2>
                    <p id="matrixSubjectTitle" class="text-xs text-brand font-semibold uppercase">Subject</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">SA Matrix Scoring</span>
                    <div class="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                        <label for="inpTotalBox" class="text-[10px] font-bold text-slate-500 uppercase">Total:</label>
                        <input type="number" id="inpTotalBox" step="0.5" min="0.1" value="10" 
                            class="w-12 h-6 text-center text-xs font-bold text-brand bg-white border border-slate-300 rounded focus:outline-none focus:border-brand"
                            onkeyup="updateGlobalTotalBox(this.value)" onchange="updateGlobalTotalBox(this.value)">
                    </div>
                </div>
            </div>

            <div id="matrixGrid" class="flex flex-col gap-3"></div>
        </div>

    </main>

    <div id="submitBar" class="fixed bottom-[70px] left-0 w-full px-5 pb-3 hidden z-30">
        <button onclick="submitSA_Scores()" id="submitBtn" class="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-2xl shadow-[0_10px_20px_-10px_rgba(10,88,202,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="save" class="w-5 h-5"></i>
            <span>Save Grid Matrix</span>
        </button>
    </div>

    <nav class="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-between px-6 pt-3 pb-safe z-40">
        <button onclick="window.location.href='index.php'" class="flex flex-col items-center gap-1 text-slate-400 hover:text-brand transition-colors"><i data-lucide="home" class="w-6 h-6"></i><span class="text-[10px] font-semibold">Home</span></button>
        <button class="flex flex-col items-center gap-1 text-brand"><i data-lucide="award" class="w-6 h-6 fill-brand/10"></i><span class="text-[10px] font-bold">SA Marks</span></button>
        <button onclick="window.location.href='reports.php'" class="flex flex-col items-center gap-1 text-slate-400 hover:text-brand transition-colors"><i data-lucide="bar-chart-2" class="w-6 h-6"></i><span class="text-[10px] font-semibold">Reports</span></button>
        <button onclick="window.location.href='profile.php'" class="flex flex-col items-center gap-1 text-slate-400 hover:text-brand transition-colors"><i data-lucide="user" class="w-6 h-6"></i><span class="text-[10px] font-semibold">Profile</span></button>
    </nav>

    <div id="notificationToast" class="fixed top-5 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl z-[300] transition-all duration-300 opacity-0 -translate-y-10 flex items-center gap-3 pointer-events-none">
        <i data-lucide="check-circle" id="toastSuccessIcon" class="w-5 h-5 text-emerald-400 hidden"></i>
        <i data-lucide="alert-triangle" id="toastErrorIcon" class="w-5 h-5 text-rose-400 hidden"></i>
        <span id="toastMessage" class="text-sm font-medium">Message</span>
    </div>

    <script src="sa.js"></script>
</body>
</html>