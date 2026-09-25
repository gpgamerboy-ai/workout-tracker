# workout-tracker
ENTRY 001 — Session of September 25, 2026
1. Overview (Plain Language)
What we built today: A complete web application that lets your athletes log their workouts on their phones and lets you review everything from a private coach dashboard.

Why it matters: Before today, you had no digital system. Athletes worked off paper or memory. Now every set they log is timestamped, graded, and stored in a Google Sheet you can review anytime, from anywhere, on any device.

What's live right now:

Athlete app — athletes log in with a name and PIN, pick a plan (A, B, or C), and log sets with weight, reps, grade, and notes.

Coach view — you log in with a key and see every athlete, their session counts, and every set they've logged. You can filter by athlete, plan, or date range. You can also reset an athlete's welcome popup.

Google Sheet — three tabs: Users (who can log in), Lists (master list of program names), Programs (every exercise of every workout), Logs (every set every athlete has ever logged).

Multi-athlete support — 10 athletes currently set up across 5 programs.

Offline support — if an athlete loses signal mid-workout, their sets save to their phone and sync when they're back online.

History — athletes can view their own past sessions grouped by date.

Last Time vs Today — during a workout, each set shows what they lifted last session next to what they're doing today.

Download empty log — athletes can download a blank CSV or print a PDF of the workout to fill in by hand.

What's not yet done:

Lucia's program isn't built yet — she's on a copy of a template but needs her real workout.

The Lopez Fall, Wendler 531, Texas Method, and Weekend Warrior programs only have placeholder rows. They need real exercises.

The welcome popup's "Don't show again" button appears after 30 sessions. That's intentional but worth keeping an eye on.

Known issues resolved today:

Apps Script doGet was missing routes for coachAthletes and coachLogs. Fixed with a full redeploy.

Target rep range field was showing a date instead of a rep range for some sets. Fix is in the sheet (format column H as Plain text).

2. Running To-Do List
🔴 URGENT — By This Weekend
□ Decide which program Lucia should be on (ABC, Lopez Fall, Wendler 531, Texas Method, Weekend Warrior)
□ If new program: add it to the Programs tab with real exercises
□ If ABC: skip Programs tab, just confirm her row in Users
□ Set Lucia's Active column to TRUE
□ Confirm Lucia's PIN (column B)
□ Send her the kickoff message
□ Test her login before sending
🟡 THIS WEEK
Cleanup:

□ Delete unused files from GitHub repo: app.js, program.js, index.html, style.css
□ Save kickoff message template to Google Docs or Notes app
□ Save the coach URL to your phone home screen
□ Save this changelog file
Data:

□ Review Max's first session in coach view
□ Check grades and notes — any patterns to coach on?
□ Confirm his second session logs correctly
Templates:

□ Build out Lopez Fall program with real exercises (replace placeholder)
□ Build out Wendler 531 program with real exercises
□ Build out Texas Method program with real exercises
□ Build out Weekend Warrior program with real exercises
🟢 WHEN YOU HAVE TIME
□ Add per-lift notes on the coach view
□ Add weekly progress charts to the coach view
□ Add a way to reset tutorial from the sheet (currently only in coach view)
□ Add program duplication in the sheet (copy rows, change column A)
□ Fix the "Target" field issue permanently by formatting columns H and I as Plain text
🔵 EACH TIME YOU ADD AN ATHLETE
□ Add row to Users tab: Name, PIN, Program, Active=TRUE
□ If new program: add rows to Programs tab
□ Send kickoff message with their PIN
□ Test their login
⚪ EACH TIME YOU ADD A PROGRAM
□ Add program name to Lists tab, column A
□ Add all workout rows to Programs tab with matching program name
□ Assign athletes to it in Users tab
□ Test one athlete's login
3. Record of Tone
Tone of this session: Direct and technical, but patient. We hit repeated friction points (URL issues, cache problems, deployment confusion, a Chrome extension flooding the console with fake errors). At times you signaled urgency and frustration. I responded by shorting my replies, giving copy-paste blocks instead of line-by-line edits, and — after a few too many back-and-forths — self-correcting on misreadings.

What worked well:

Copy-paste blocks for entire files (rather than line edits) reduced errors dramatically.

Asking for specific screenshots was essential — I couldn't have diagnosed the issues otherwise.

When you said "just give me the block" I should have done that immediately, not after three more diagnostic rounds.

What to do differently next session:

Skip the diagnostics if a file is under 300 lines. Just send the whole replacement.

When you say "we're on a clock," compress to fixes only — no explanations.

Always ask "share your screen" or "paste the console" before guessing at a fix.

Don't write "..." in a URL when showing examples. It gets pasted literally.

Chosen tone for future sessions: Direct, technical, no filler. Short sentences. Skip the encouragement if you're mid-problem. Assume competence — you've built this thing and know what every part does. When you say "give me the block," send the block. Only explain after the fix has landed.

4. Glossary
Apps Script — The code that runs on Google's servers and connects the athlete app to the Google Sheet. Lives inside the sheet under Extensions → Apps Script.

Athlete app — The webpage athletes open on their phones. URL: https://gpgamerboy-ai.github.io/workout-tracker/index2.html

Coach view — Your private dashboard. URL: https://gpgamerboy-ai.github.io/workout-tracker/coach.html

Coach key — Your password for the coach view: 053100KGC030772

Commit — Saving a change to a file on GitHub. Every commit creates a recoverable version.

Deploy (Apps Script) — Publishing updated code so the live URL serves it. Must be done after every Apps Script change, even if you saved the code.

ENDPOINT — The Apps Script URL that the app sends requests to. Lives on line 5 of app2.js and coach.js.

GitHub — The website that hosts your app's code. Repo name: gpgamerboy-ai/workout-tracker

GitHub Pages — The feature that turns GitHub code into a live website. Takes 30–60 seconds to update after a commit.

Grade — The athlete's self-assessment of a set: A+ through F. Stored in the Logs sheet.

Hard refresh — Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows). Forces the browser to reload everything, ignoring cache.

Last Time — The "previous session" panel on each exercise card. Shows what the athlete did last time for that lift.

Lists tab — The master list of program names. Add a new program here first.

Logs tab — Where every set gets stored. Auto-populated by Apps Script. Read-only from your perspective.

PIN — The 4-digit code each athlete uses to log in. Set by you in the Users tab, column B.

Programs tab — Every exercise of every workout template. Each row is one set of one exercise.

Session count — How many unique days an athlete has logged at least one set.

Target — The target rep range for a set (e.g. 8-10). Lives in column H of the Programs tab.

TargetNote — The coaching cue attached to a set (e.g. 4 in tank, to failure). Lives in column I of the Programs tab.

Users tab — Who can log in. Columns: Name, PIN, Program, Active.

Welcome popup — The tutorial that appears every time an athlete opens the app until they've logged 30 sessions. Then a "Don't show again" button appears.

5. Prompt to Start the Next Session
Copy this entire block and paste it as the first message when you come back:

text
CONTEXT: Continuing work on the Workout Tracker project. Reference Entry 001 of the changelog for full context.

CURRENT STATE:
- Athlete app is live: https://gpgamerboy-ai.github.io/workout-tracker/index2.html
- Coach view is live: https://gpgamerboy-ai.github.io/workout-tracker/coach.html
- Coach key: 053100KGC030772
- Google Sheet: "Workout Logs" with tabs Users, Lists, Programs, Logs
- GitHub repo: gpgamerboy-ai/workout-tracker
- 10 athletes set up, 5 programs (ABC is the only one with real exercises)
- Backend is a Google Apps Script deployment

TONE FOR THIS SESSION: Direct, technical, no filler. Short sentences. Skip encouragement if I'm mid-problem. Assume I'm competent — I built this. When I say "give me the block," send the whole file, not line-by-line edits. Only explain after the fix has landed.

TOOLING RULES:
- When updating long files, always send the full copy-paste block. Never ask me to find line numbers.
- When showing example URLs, don't use "..." — I'll paste it literally.
- If you need diagnostic info from me, ask for ONE specific thing at a time — a screenshot, a console paste, or a URL test.
- If a Chrome extension might be interfering, tell me to test in Incognito.

TODAY'S GOAL: [FILL IN WHAT YOU WANT TO ACCOMPLISH]

Anything unclear before we start?
HOW TO SAVE THIS
Option 1 — Save to Desktop (recommended):

Open TextEdit on your Mac.

Format → Make Plain Text (Cmd+Shift+T).

Paste this whole document.

File → Save As → name it workout-tracker-changelog.txt → save to Desktop.

Email it to yourself as an attachment.

Option 2 — Save to Google Drive:

Create a Google Doc called "Workout Tracker — Changelog."

Paste the content.

Share it with yourself (it'll appear in your Drive).

Option 3 — Save to GitHub:

Open your repo gpgamerboy-ai/workout-tracker.

Click README.md.

Click the pencil icon.

Paste the content.

Commit changes.

My recommendation: do Option 1 AND Option 3. Desktop is easy to find. GitHub is permanent and can't get lost.

What Happens Next Time
When you come back, I'll:

Read your starting prompt (from Section 5).

Ask what you accomplished and what broke.

Update this changelog — adding Entry 002 with today's work, updating the running to-do, and refreshing the tone notes and glossary.

Give you the new full changelog file to replace this one on your Desktop.

The changelog grows by one entry each session. Always the latest version is what lives on your machine.

