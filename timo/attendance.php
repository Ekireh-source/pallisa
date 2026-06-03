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
    <title>Attendance | Academic System</title>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: { brand: { light: '#1e6be0', DEFAULT: '#0a58ca', dark: '#052c54' } }
                }
            }
        }
    </script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body {
            -webkit-tap-highlight-color: transparent;
            background-color: #f1f5f9;
            overflow-x: hidden;
        }

        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 16px);
        }

        .app-header {
            background: linear-gradient(135deg, #0a58ca 0%, #052c54 100%);
        }
    </style>
</head>

<body class="text-slate-800 antialiased h-screen flex flex-col relative">

    <header
        class="app-header text-white pt-10 pb-16 px-5 rounded-b-[2rem] flex-shrink-0 z-0 relative  overflow-hidden">
        <div
            class="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl">
        </div>
        <div class="flex justify-between items-center relative z-10">
            <button onclick="window.location.href='index.php'"
                class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                <i data-lucide="arrow-left" class="w-5 h-5"></i>
            </button>
            <h1 class="text-xl font-bold tracking-tight text-white drop-">Record Attendance</h1>
            <div class="w-9 h-9"></div>
        </div>
    </header>

    <main class="flex-1 -mt-10 px-5 z-10 relative overflow-y-auto pb-28" id="mainContainer">

        <div id="step1-streams">
            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Select your Stream</h3>
            <div id="streamsList" class="flex flex-col gap-3">
                <div class="text-center py-10 text-slate-500"><i data-lucide="loader-2"
                        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Loading classes...</div>
            </div>
        </div>

        <div id="step2-roster" class="hidden">

            <div
                class="bg-white/90 backdrop-blur-sm p-4 rounded-2xl  border border-slate-100 mb-4 flex justify-between items-center sticky top-0 z-20">
                <div>
                    <h2 id="rosterTitle" class="font-bold text-slate-800 text-lg">Stream</h2>
                    <p id="rosterSubject" class="text-xs text-brand font-semibold uppercase">Subject</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] text-slate-400 uppercase font-bold">Today</p>
                    <p class="text-sm font-bold text-slate-700" id="currentDate"></p>
                </div>
            </div>

            <div id="editBadge"
                class="hidden bg-amber-50 text-amber-600 text-xs font-bold px-3 py-2 rounded-xl mb-4 text-center border border-amber-100">
                <i data-lucide="edit-3" class="inline w-4 h-4 mr-1 mb-0.5"></i> You have already taken attendance today.
                You are now editing it.
            </div>

            <div id="learnersList" class="flex flex-col gap-2"></div>
        </div>

    </main>

    <div id="submitBar" class="fixed bottom-[70px] left-0 w-full px-5 pb-3 hidden z-30">
        <button onclick="submitAttendance()" id="submitBtn"
            class="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-2xl -[0_10px_20px_-10px_rgba(10,88,202,0.5)] transition-all active:scale-95 flex items-center justify-center gap-2">
            <i data-lucide="save" class="w-5 h-5"></i>
            <span id="submitBtnText">Save Attendance</span>
        </button>
    </div>

    <nav
        class="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-between px-6 pt-3 pb-safe z-40">
        <button onclick="window.location.href='index.php'"
            class="flex flex-col items-center gap-1 text-slate-400 hover:text-brand transition-colors">
            <i data-lucide="home" class="w-6 h-6"></i>
            <span class="text-[10px] font-semibold">Home</span>
        </button>
        <button class="flex flex-col items-center gap-1 text-brand">
            <i data-lucide="users" class="w-6 h-6 fill-brand/10"></i>
            <span class="text-[10px] font-bold">Streams</span>
        </button>
        <button onclick="window.location.href='reports.php'"
            class="flex flex-col items-center gap-1 text-slate-400 hover:text-brand transition-colors">
            <i data-lucide="bar-chart-2" class="w-6 h-6"></i>
            <span class="text-[10px] font-semibold">Reports</span>
        </button>
        <button onclick="confirmLogout()"
            class="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-colors">
            <i data-lucide="user" class="w-6 h-6"></i>
            <span class="text-[10px] font-semibold">Profile</span>
        </button>
    </nav>

    <div id="notificationToast"
        class="fixed top-5 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-full -2xl z-[100] transition-all duration-300 opacity-0 -translate-y-10 flex items-center gap-3 pointer-events-none">
        <i data-lucide="check-circle" id="toastSuccessIcon" class="w-5 h-5 text-emerald-400 hidden"></i>
        <i data-lucide="alert-triangle" id="toastErrorIcon" class="w-5 h-5 text-rose-400 hidden"></i>
        <span id="toastMessage" class="text-sm font-medium tracking-wide">Message</span>
    </div>

    <div id="customModal"
        class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] hidden flex items-center justify-center opacity-0 transition-opacity duration-300">
        <div id="customModalContent"
            class="bg-white rounded-3xl p-6 w-11/12 max-w-sm -2xl transform scale-95 transition-transform duration-300">
            <div class="flex items-center gap-4 mb-4">
                <div
                    class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="log-out" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-My-Black">Sign Out?</h3>
                </div>
            </div>
            <p class="text-sm text-gray-500 mb-8 ml-1">Are you sure you want to log out of your session? You will need
                to enter your password to access your dashboard again.</p>
            <div class="flex gap-3">
                <button onclick="closeModal()"
                    class="flex-1 py-3.5 rounded-xl font-bold text-My-Black bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95">Cancel</button>
                <button onclick="window.location.href='api/logout.php'"
                    class="flex-1 py-3.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600  -rose-500/30 transition-colors active:scale-95">Yes,
                    Sign Out</button>
            </div>
        </div>
    </div>

    <script src="attendance.js"></script>
</body>

</html>