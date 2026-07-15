# AE Focus Timer

AE Focus Timer is a small productivity tool I built for Adobe After Effects.

I made it because I kept losing track of how long I had been editing, forgetting to save, and spending far too long polishing projects without a deadline. The panel keeps those three things in one place without adding a complicated workflow.

## Preview

<img width="445" height="602" alt="Screenshot 2026-07-16 035645" src="https://github.com/user-attachments/assets/6d98adf7-f6c2-4ff9-96a8-30679a3488a5" />

## Features

### Project Time Tracker

Tracks how long the current After Effects project has been open and worked on.

- Starts automatically when the panel opens
- Can be paused and resumed
- Can be reset for the current project
- Remembers tracked time for saved projects

### Save Reminder

Lets you choose how often After Effects should remind you to save.

For example, setting the reminder to `3` means the panel will remind you every three minutes.

- Custom reminder interval
- Red flashing warning
- Save prompt when the timer finishes
- `Save Now` button
- Automatically restarts the reminder after it finishes

### Challenge Mode

Challenge Mode gives you a fixed amount of time to finish an edit or complete a task.

- Set custom hours and minutes
- Start, pause, resume and reset the timer
- Orange warning during the final ten minutes
- Red flashing warning when time runs out

## Built With

- **Language:** JavaScript
- **Adobe scripting language:** ExtendScript
- **Adobe APIs:** After Effects Scripting API and ScriptUI
- **External libraries:** None

Everything is contained inside one `.jsx` file. There are no npm packages, installers, external dependencies or paid libraries.

GitHub should recognise the repository mainly as **JavaScript** because the main source file uses the `.jsx` extension. GitHub calculates the language display automatically.

## Requirements

- Adobe After Effects
- Windows or macOS
- Permission to copy a script into the After Effects scripts folder

## Installation

### Windows

1. Download `AEFocusTimer.jsx`.
2. Close After Effects.
3. Copy the file into:

```text
C:\Program Files\Adobe\Adobe After Effects <version>\
Support Files\Scripts\ScriptUI Panels\
```

Example:

```text
C:\Program Files\Adobe\Adobe After Effects 2026\
Support Files\Scripts\ScriptUI Panels\
```

4. Approve the administrator permission request if Windows asks.
5. Restart After Effects.
6. Open:

```text
Window → AEFocusTimer.jsx
```

7. Drag the panel tab into your preferred After Effects workspace to dock it.
<img width="1505" height="964" alt="Screenshot 2026-07-16 035423" src="https://github.com/user-attachments/assets/b3cdafc4-8e50-4b5f-9390-9068c4b9a127" />

### macOS

1. Download `AEFocusTimer.jsx`.
2. Close After Effects.
3. Copy the file into:

```text
/Applications/Adobe After Effects <version>/
Scripts/ScriptUI Panels/
```

4. Restart After Effects.
5. Open:

```text
Window → AEFocusTimer.jsx
```

## Testing Without Installing

You can test the script before copying it into the ScriptUI Panels folder.

In After Effects, open:

```text
File → Scripts → Run Script File...
```

Then select:

```text
AEFocusTimer.jsx
```

When opened this way, it appears as a floating window. To make it dockable, install it inside the `ScriptUI Panels` folder and open it through the `Window` menu.

## How to Use

### Track Project Time

The project timer starts when the panel opens.

- Select **Pause** to stop counting time.
- Select **Resume** to continue.
- Select **Reset** to clear the tracked time for the current project.

The timer is best treated as project session time. It cannot tell whether you are actively editing every second or have stepped away from the computer.

### Set Save Reminders

1. Enter a number in the save reminder field.
2. The number represents minutes.
3. Select **Start Reminder**.
4. When the countdown finishes, the panel flashes red and asks whether you want to save.
5. Select **Save Now** at any time to save manually from the panel.

For a quick test, enter:

```text
0.1
```

That creates a reminder after roughly six seconds.

### Start Challenge Mode

1. Enter the number of hours.
2. Enter the number of minutes.
3. Select **Start**.
4. Use **Pause** and **Resume** when needed.
5. Select **Reset** to stop the challenge and return to the entered duration.

Example:

```text
Hours: 3
Minutes: 0
```

This creates a three-hour editing challenge.

## Project Structure

```text
ae-focus-timer/
├── AEFocusTimer.jsx
├── screenshots/
│   └── AEFocusTimer-preview.png
├── README.md
└── LICENSE
```

## Notes

- Unsaved projects may open the normal After Effects Save As window.
- Saved project time is stored through After Effects' built-in settings system.
- The timer runs while the panel and After Effects are open.
- No internet connection is required.
- No project files or editing data are uploaded anywhere.

## Why I Built It

This started as a simple tool for my own editing workflow. I wanted something that could remind me to save, show how long I had spent on a project, and give me a deadline when I needed to stop overthinking an edit.

It is intentionally small and focused rather than trying to become a full project management system.

Tested on AE version 2021 but should work for all versions, not tested for Mac :(
