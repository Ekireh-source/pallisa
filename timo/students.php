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
    <title>My Students Directory | Academic System</title>
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
        body {
            -webkit-tap-highlight-color: transparent;
            background-color: #f1f5f9;
            overflow-x: hidden;
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
            <button id="backBtn" onclick="goBack()"
                class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
                <i data-lucide="arrow-left" class="w-5 h-5"></i>
            </button>
            <h1 class="text-xl font-bold tracking-tight text-white drop-">My Students</h1>
            <div class="w-9 h-9"></div>
        </div>
    </header>

    <main class="flex-1 -mt-10 px-4 z-10 relative overflow-y-auto pb-10" id="mainContainer">

        <div id="step1-streams">
            <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Select a Stream to view
                roster</h3>
            <div id="streamsList" class="flex flex-col gap-3">
                <div class="text-center py-10 text-slate-500"><i data-lucide="loader-2"
                        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand"></i> Loading classes...</div>
            </div>
        </div>

        <div id="step2-directory" class="hidden space-y-4">

            <div
                class="bg-white p-4 rounded-2xl  border border-slate-100 flex justify-between items-center sticky top-0 z-20 backdrop-blur-sm bg-white/90">
                <div>
                    <h2 id="dirStreamTitle" class="font-bold text-slate-800 text-lg">Stream</h2>
                    <p id="dirSubjectTitle" class="text-xs text-brand font-semibold uppercase">Subject</p>
                </div>
                <div
                    class="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-cyan-100/50">
                    <i data-lucide="users" class="w-3.5 h-3.5"></i>
                    <span id="lblRosterCount">0 Learners</span>
                </div>
            </div>

            <div
                class="relative flex items-center bg-white border border-slate-200 rounded-2xl px-4 py-3  focus-within:border-brand transition-colors">
                <i data-lucide="search" class="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0"></i>
                <input type="text" id="inpDirectorySearch" placeholder="Search name or admission number..."
                    class="w-full text-sm font-medium bg-transparent focus:outline-none text-slate-700 placeholder-slate-400"
                    onkeyup="filterDirectoryLive(this.value)">
            </div>

            <div id="directoryRosterGrid" class="flex flex-col gap-2.5"></div>

        </div>

    </main>

    <script src="students.js"></script>
</body>

</html>