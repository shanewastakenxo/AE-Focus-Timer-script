#target aftereffects

/*
AE Focus Timer

I made this because I kept forgetting to save projects and sometimes
spent way too long tweaking an edit. It keeps the project timer, save
reminders and challenge timer in one place.
*/

(function AEFocusTimer(thisObj) {
    var SCRIPT_NAME = "AE Focus Timer";
    var SETTINGS_SECTION = "AEFocusTimer_ProjectTimes";
    var TICK_RATE_MS = 500;
    var SETTINGS_SAVE_INTERVAL_MS = 30000;

    var COLORS = {
        normal: [0.12, 0.15, 0.20, 1],
        blue: [0.12, 0.28, 0.65, 1],
        orange: [0.70, 0.31, 0.05, 1],
        red: [0.72, 0.08, 0.10, 1],
        redDark: [0.24, 0.04, 0.05, 1],
        white: [0.95, 0.96, 1.00, 1],
        muted: [0.66, 0.70, 0.78, 1]
    };

    // incase the script gets opened twice, stop the old timer first
    if (
        $.global.AEFocusTimerController &&
        $.global.AEFocusTimerController.shutdown
    ) {
        try {
            $.global.AEFocusTimerController.shutdown();
        } catch (oldControllerError) {
            // not a huge problem, AE may have already stopped it
        }
    }

    function nowMilliseconds() {
        return new Date().getTime();
    }

    function parsePositiveNumber(text) {
        var number = parseFloat(text);

        if (isNaN(number) || number <= 0) {
            return null;
        }

        return number;
    }

    function parseNonNegativeInteger(text) {
        var number = parseInt(text, 10);

        if (isNaN(number) || number < 0) {
            return null;
        }

        return number;
    }

    function padNumber(number) {
        return number < 10 ? "0" + number : String(number);
    }

    function formatDuration(milliseconds) {
        var totalSeconds = Math.max(
            0,
            Math.floor(milliseconds / 1000)
        );

        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        return (
            padNumber(hours) +
            ":" +
            padNumber(minutes) +
            ":" +
            padNumber(seconds)
        );
    }

    function formatCountdown(milliseconds) {
        var totalSeconds = Math.max(
            0,
            Math.ceil(milliseconds / 1000)
        );

        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        if (hours > 0) {
            return (
                padNumber(hours) +
                ":" +
                padNumber(minutes) +
                ":" +
                padNumber(seconds)
            );
        }

        return padNumber(minutes) + ":" + padNumber(seconds);
    }

    // makes a small seperate key for each project path
    function hashString(text) {
        var hash = 0;
        var index;

        for (index = 0; index < text.length; index += 1) {
            hash = ((hash << 5) - hash) + text.charCodeAt(index);
            hash = hash & hash;
        }

        if (hash < 0) {
            hash = hash * -1;
        }

        return "project_" + String(hash);
    }

    function getCurrentProjectPath() {
        if (
            app.project &&
            app.project.file
        ) {
            return app.project.file.fsName;
        }

        return "UNSAVED_PROJECT";
    }

    function getCurrentProjectName() {
        if (
            app.project &&
            app.project.file
        ) {
            return app.project.file.name;
        }

        return "Untitled Project";
    }

    function getSettingsKey(projectPath) {
        return hashString(projectPath);
    }

    function loadTrackedTime(projectPath) {
        var key = getSettingsKey(projectPath);

        try {
            if (app.settings.haveSetting(SETTINGS_SECTION, key)) {
                var savedValue = parseInt(
                    app.settings.getSetting(
                        SETTINGS_SECTION,
                        key
                    ),
                    10
                );

                if (!isNaN(savedValue) && savedValue >= 0) {
                    return savedValue;
                }
            }
        } catch (settingsReadError) {
            // if AE cant read it, just start from zero
        }

        return 0;
    }

    function saveTrackedTime(projectPath, elapsedMilliseconds) {
        var key = getSettingsKey(projectPath);

        try {
            app.settings.saveSetting(
                SETTINGS_SECTION,
                key,
                String(Math.floor(elapsedMilliseconds))
            );
        } catch (settingsWriteError) {
            // timer still works even if AE dosent save the setting
        }
    }

    function setTextColour(control, colour) {
        try {
            var graphics = control.graphics;

            graphics.foregroundColor = graphics.newPen(
                graphics.PenType.SOLID_COLOR,
                colour,
                1
            );
        } catch (colourError) {
            // some AE themes are a bit weird with custom colours
        }
    }

    function setBackgroundColour(control, colour) {
        try {
            var graphics = control.graphics;

            graphics.backgroundColor = graphics.newBrush(
                graphics.BrushType.SOLID_COLOR,
                colour
            );

            control.notify("onDraw");
        } catch (colourError) {
            // the message still changes even if the colour dosent
        }
    }

    function setBoldFont(control, size) {
        try {
            control.graphics.font = ScriptUI.newFont(
                "Arial",
                "BOLD",
                size
            );
        } catch (fontError) {
            // just use AE's normal font if Arial isnt there
        }
    }

    function createDivider(parent) {
        var divider = parent.add("panel");
        divider.alignment = ["fill", "top"];
        divider.minimumSize.height = 1;
        divider.maximumSize.height = 1;
        return divider;
    }

    function buildInterface(thisObject) {
        var panel = (
            thisObject instanceof Panel
        )
            ? thisObject
            : new Window(
                "palette",
                SCRIPT_NAME,
                undefined,
                {resizeable: true}
            );

        panel.orientation = "column";
        panel.alignChildren = ["fill", "top"];
        panel.spacing = 10;
        panel.margins = 12;

        var titleGroup = panel.add("group");
        titleGroup.orientation = "column";
        titleGroup.alignChildren = ["fill", "top"];
        titleGroup.spacing = 3;

        var titleText = titleGroup.add(
            "statictext",
            undefined,
            "AE FOCUS TIMER"
        );
        setBoldFont(titleText, 18);

        var subtitleText = titleGroup.add(
            "statictext",
            undefined,
            "Remember to save your project because ae is mentally unstable"
        );
        setTextColour(subtitleText, COLORS.muted);

        var warningBanner = panel.add("group");
        warningBanner.orientation = "row";
        warningBanner.alignChildren = ["fill", "center"];
        warningBanner.margins = [10, 8, 10, 8];
        warningBanner.minimumSize.height = 38;
        setBackgroundColour(warningBanner, COLORS.normal);

        var warningText = warningBanner.add(
            "statictext",
            undefined,
            "READY"
        );
        warningText.alignment = ["fill", "center"];
        warningText.justify = "center";
        setBoldFont(warningText, 13);
        setTextColour(warningText, COLORS.white);

        // project time section
        var sessionPanel = panel.add(
            "panel",
            undefined,
            "PROJECT TIME"
        );
        sessionPanel.orientation = "column";
        sessionPanel.alignChildren = ["fill", "top"];
        sessionPanel.spacing = 8;
        sessionPanel.margins = 12;

        var projectNameText = sessionPanel.add(
            "statictext",
            undefined,
            "Project: Untitled Project"
        );
        projectNameText.characters = 42;
        setTextColour(projectNameText, COLORS.muted);

        var sessionTimeText = sessionPanel.add(
            "statictext",
            undefined,
            "00:00:00"
        );
        sessionTimeText.justify = "center";
        sessionTimeText.alignment = ["fill", "top"];
        setBoldFont(sessionTimeText, 28);

        var sessionButtons = sessionPanel.add("group");
        sessionButtons.orientation = "row";
        sessionButtons.alignChildren = ["fill", "center"];
        sessionButtons.spacing = 8;

        var sessionPauseButton = sessionButtons.add(
            "button",
            undefined,
            "Pause"
        );

        var sessionResetButton = sessionButtons.add(
            "button",
            undefined,
            "Reset"
        );

        // save reminder section
        var savePanel = panel.add(
            "panel",
            undefined,
            "SAVE REMINDER"
        );
        savePanel.orientation = "column";
        savePanel.alignChildren = ["fill", "top"];
        savePanel.spacing = 8;
        savePanel.margins = 12;

        var saveInputGroup = savePanel.add("group");
        saveInputGroup.orientation = "row";
        saveInputGroup.alignChildren = ["left", "center"];

        saveInputGroup.add(
            "statictext",
            undefined,
            "Remind me every"
        );

        var saveMinutesInput = saveInputGroup.add(
            "edittext",
            undefined,
            "3"
        );
        saveMinutesInput.characters = 6;

        saveInputGroup.add(
            "statictext",
            undefined,
            "minutes"
        );

        var saveStatusText = savePanel.add(
            "statictext",
            undefined,
            "Reminder stopped"
        );
        setTextColour(saveStatusText, COLORS.muted);

        var saveCountdownText = savePanel.add(
            "statictext",
            undefined,
            "Next reminder: --:--"
        );
        setBoldFont(saveCountdownText, 15);

        var saveButtons = savePanel.add("group");
        saveButtons.orientation = "row";
        saveButtons.alignChildren = ["fill", "center"];
        saveButtons.spacing = 8;

        var saveStartButton = saveButtons.add(
            "button",
            undefined,
            "Start Reminder"
        );

        var saveNowButton = saveButtons.add(
            "button",
            undefined,
            "Save Now"
        );

        // challenge mode section
        var challengePanel = panel.add(
            "panel",
            undefined,
            "CHALLENGE MODE"
        );
        challengePanel.orientation = "column";
        challengePanel.alignChildren = ["fill", "top"];
        challengePanel.spacing = 8;
        challengePanel.margins = 12;

        var challengeInputGroup = challengePanel.add("group");
        challengeInputGroup.orientation = "row";
        challengeInputGroup.alignChildren = ["left", "center"];

        challengeInputGroup.add(
            "statictext",
            undefined,
            "Hours"
        );

        var challengeHoursInput = challengeInputGroup.add(
            "edittext",
            undefined,
            "3"
        );
        challengeHoursInput.characters = 4;

        challengeInputGroup.add(
            "statictext",
            undefined,
            "Minutes"
        );

        var challengeMinutesInput = challengeInputGroup.add(
            "edittext",
            undefined,
            "0"
        );
        challengeMinutesInput.characters = 4;

        var challengeStatusText = challengePanel.add(
            "statictext",
            undefined,
            "Set a deadline and start your challenge."
        );
        setTextColour(challengeStatusText, COLORS.muted);

        var challengeTimeText = challengePanel.add(
            "statictext",
            undefined,
            "03:00:00"
        );
        challengeTimeText.justify = "center";
        challengeTimeText.alignment = ["fill", "top"];
        setBoldFont(challengeTimeText, 28);

        var challengeButtons = challengePanel.add("group");
        challengeButtons.orientation = "row";
        challengeButtons.alignChildren = ["fill", "center"];
        challengeButtons.spacing = 8;

        var challengeStartButton = challengeButtons.add(
            "button",
            undefined,
            "Start"
        );

        var challengePauseButton = challengeButtons.add(
            "button",
            undefined,
            "Pause"
        );
        challengePauseButton.enabled = false;

        var challengeResetButton = challengeButtons.add(
            "button",
            undefined,
            "Reset"
        );

        panel.onResizing = panel.onResize = function () {
            this.layout.resize();
        };

        return {
            panel: panel,
            warningBanner: warningBanner,
            warningText: warningText,

            projectNameText: projectNameText,
            sessionTimeText: sessionTimeText,
            sessionPauseButton: sessionPauseButton,
            sessionResetButton: sessionResetButton,

            saveMinutesInput: saveMinutesInput,
            saveStatusText: saveStatusText,
            saveCountdownText: saveCountdownText,
            saveStartButton: saveStartButton,
            saveNowButton: saveNowButton,

            challengeHoursInput: challengeHoursInput,
            challengeMinutesInput: challengeMinutesInput,
            challengeStatusText: challengeStatusText,
            challengeTimeText: challengeTimeText,
            challengeStartButton: challengeStartButton,
            challengePauseButton: challengePauseButton,
            challengeResetButton: challengeResetButton
        };
    }

    var ui = buildInterface(thisObj);

    var state = {
        taskId: null,
        lastTickMilliseconds: nowMilliseconds(),
        lastSettingsSaveMilliseconds: nowMilliseconds(),

        currentProjectPath: getCurrentProjectPath(),
        sessionElapsedMilliseconds: 0,
        sessionRunning: true,

        saveReminderRunning: false,
        saveReminderIntervalMilliseconds: 0,
        nextSaveReminderMilliseconds: 0,
        saveFlashUntilMilliseconds: 0,

        challengeRunning: false,
        challengePaused: false,
        challengeExpired: false,
        challengeEndMilliseconds: 0,
        challengeRemainingMilliseconds: 0
    };

    state.sessionElapsedMilliseconds = loadTrackedTime(
        state.currentProjectPath
    );

    function updateProjectIdentity() {
        var newProjectPath = getCurrentProjectPath();

        if (newProjectPath !== state.currentProjectPath) {
            saveTrackedTime(
                state.currentProjectPath,
                state.sessionElapsedMilliseconds
            );

            // keep the time we already counted when an untitled project gets saved
            if (state.currentProjectPath === "UNSAVED_PROJECT") {
                state.currentProjectPath = newProjectPath;

                saveTrackedTime(
                    state.currentProjectPath,
                    state.sessionElapsedMilliseconds
                );
            } else {
                state.currentProjectPath = newProjectPath;
                state.sessionElapsedMilliseconds = loadTrackedTime(
                    state.currentProjectPath
                );
            }
        }

        ui.projectNameText.text =
            "Project: " + getCurrentProjectName();
    }

    function performProjectSave() {
        if (!app.project) {
            alert("No After Effects project is currently open.");
            return false;
        }

        try {
            if (app.project.file) {
                app.project.save();
                ui.saveStatusText.text =
                    "Project saved at " +
                    new Date().toLocaleTimeString();
                return true;
            }

            var didSave = app.project.saveWithDialog();

            if (didSave) {
                updateProjectIdentity();
                ui.saveStatusText.text =
                    "Project saved at " +
                    new Date().toLocaleTimeString();
                return true;
            }

            ui.saveStatusText.text = "Save was cancelled.";
            return false;
        } catch (saveError) {
            alert(
                "The project could not be saved.\n\n" +
                saveError.toString()
            );
            return false;
        }
    }

    // reset the countdown straight away so the next reminder is already lined up
    function triggerSaveReminder(currentTime) {
        state.saveFlashUntilMilliseconds =
            currentTime + 10000;

        state.nextSaveReminderMilliseconds =
            currentTime +
            state.saveReminderIntervalMilliseconds;

        ui.saveStatusText.text =
            "SAVE REMINDER — the countdown has restarted.";

        var wantsToSave = confirm(
            "AE Focus Timer\n\n" +
            "This is your save reminder.\n" +
            "Save the current project now?"
        );

        if (wantsToSave) {
            performProjectSave();
        }
    }

    function updateWarningBanner(currentTime) {
        var flashOn =
            Math.floor(currentTime / 500) % 2 === 0;

        if (state.challengeExpired) {
            ui.warningText.text = "TIME IS UP";

            setBackgroundColour(
                ui.warningBanner,
                flashOn ? COLORS.red : COLORS.redDark
            );

            setTextColour(ui.warningText, COLORS.white);
            return;
        }

        if (currentTime < state.saveFlashUntilMilliseconds) {
            ui.warningText.text = "SAVE YOUR PROJECT";

            setBackgroundColour(
                ui.warningBanner,
                flashOn ? COLORS.red : COLORS.redDark
            );

            setTextColour(ui.warningText, COLORS.white);
            return;
        }

        // orange warning for the last 10 mins
        if (
            state.challengeRunning &&
            state.challengeRemainingMilliseconds <= 600000
        ) {
            ui.warningText.text = "FINAL 10 MINUTES";

            setBackgroundColour(
                ui.warningBanner,
                COLORS.orange
            );

            setTextColour(ui.warningText, COLORS.white);
            return;
        }

        ui.warningText.text = "FOCUS MODE ACTIVE";

        setBackgroundColour(
            ui.warningBanner,
            COLORS.normal
        );

        setTextColour(ui.warningText, COLORS.white);
    }

    function updateInterface(currentTime) {
        ui.sessionTimeText.text = formatDuration(
            state.sessionElapsedMilliseconds
        );

        ui.sessionPauseButton.text =
            state.sessionRunning ? "Pause" : "Resume";

        if (state.saveReminderRunning) {
            var saveTimeRemaining =
                state.nextSaveReminderMilliseconds -
                currentTime;

            ui.saveCountdownText.text =
                "Next reminder: " +
                formatCountdown(saveTimeRemaining);

            ui.saveStartButton.text = "Stop Reminder";
        } else {
            ui.saveCountdownText.text =
                "Next reminder: --:--";

            ui.saveStartButton.text = "Start Reminder";
        }

        if (state.challengeRunning) {
            state.challengeRemainingMilliseconds = Math.max(
                0,
                state.challengeEndMilliseconds - currentTime
            );
        }

        ui.challengeTimeText.text = formatDuration(
            state.challengeRemainingMilliseconds
        );

        ui.challengePauseButton.enabled =
            state.challengeRunning ||
            state.challengePaused;

        ui.challengePauseButton.text =
            state.challengePaused ? "Resume" : "Pause";

        updateWarningBanner(currentTime);

        try {
            ui.panel.layout.layout(true);
        } catch (layoutError) {
            // panel is probably closing, so theres nothing else to do
        }
    }

    // one repeating tick updates all 3 timers
    function tick() {
        var currentTime = nowMilliseconds();
        var elapsedSinceLastTick =
            currentTime - state.lastTickMilliseconds;

        // prevents one massive time jump if AE was asleep for ages
        if (
            elapsedSinceLastTick < 0 ||
            elapsedSinceLastTick > 86400000
        ) {
            elapsedSinceLastTick = 0;
        }

        state.lastTickMilliseconds = currentTime;

        updateProjectIdentity();

        if (state.sessionRunning) {
            state.sessionElapsedMilliseconds +=
                elapsedSinceLastTick;
        }

        if (
            state.saveReminderRunning &&
            currentTime >= state.nextSaveReminderMilliseconds
        ) {
            triggerSaveReminder(currentTime);
        }

        if (
            state.challengeRunning &&
            currentTime >= state.challengeEndMilliseconds
        ) {
            state.challengeRunning = false;
            state.challengePaused = false;
            state.challengeExpired = true;
            state.challengeRemainingMilliseconds = 0;

            ui.challengeStatusText.text =
                "Time is up. Reset or begin another challenge.";
        }

        if (
            currentTime -
            state.lastSettingsSaveMilliseconds >=
            SETTINGS_SAVE_INTERVAL_MS
        ) {
            saveTrackedTime(
                state.currentProjectPath,
                state.sessionElapsedMilliseconds
            );

            state.lastSettingsSaveMilliseconds =
                currentTime;
        }

        updateInterface(currentTime);
    }

    function shutdown() {
        saveTrackedTime(
            state.currentProjectPath,
            state.sessionElapsedMilliseconds
        );

        if (state.taskId !== null) {
            try {
                app.cancelTask(state.taskId);
            } catch (cancelError) {
                // it might already be cancled
            }

            state.taskId = null;
        }
    }

    // project timer buttons
    ui.sessionPauseButton.onClick = function () {
        state.sessionRunning = !state.sessionRunning;
        state.lastTickMilliseconds = nowMilliseconds();

        updateInterface(nowMilliseconds());
    };

    ui.sessionResetButton.onClick = function () {
        var shouldReset = confirm(
            "Reset the tracked time for this project?"
        );

        if (!shouldReset) {
            return;
        }

        state.sessionElapsedMilliseconds = 0;

        saveTrackedTime(
            state.currentProjectPath,
            state.sessionElapsedMilliseconds
        );

        updateInterface(nowMilliseconds());
    };

    // save reminder buttons
    ui.saveStartButton.onClick = function () {
        if (state.saveReminderRunning) {
            state.saveReminderRunning = false;
            state.saveFlashUntilMilliseconds = 0;
            ui.saveStatusText.text = "Reminder stopped.";

            updateInterface(nowMilliseconds());
            return;
        }

        var minutes = parsePositiveNumber(
            ui.saveMinutesInput.text
        );

        if (minutes === null) {
            alert(
                "Enter a save interval greater than zero.\n\n" +
                "Example: 3"
            );
            return;
        }

        state.saveReminderIntervalMilliseconds =
            minutes * 60 * 1000;

        state.nextSaveReminderMilliseconds =
            nowMilliseconds() +
            state.saveReminderIntervalMilliseconds;

        state.saveReminderRunning = true;
        state.saveFlashUntilMilliseconds = 0;

        ui.saveStatusText.text =
            "Reminder running every " +
            minutes +
            " minute" +
            (minutes === 1 ? "." : "s.");

        updateInterface(nowMilliseconds());
    };

    ui.saveNowButton.onClick = function () {
        performProjectSave();
    };

    // challenge mode buttons
    ui.challengeStartButton.onClick = function () {
        var hours = parseNonNegativeInteger(
            ui.challengeHoursInput.text
        );

        var minutes = parseNonNegativeInteger(
            ui.challengeMinutesInput.text
        );

        if (
            hours === null ||
            minutes === null ||
            minutes > 59
        ) {
            alert(
                "Enter valid challenge values.\n\n" +
                "Hours must be zero or greater.\n" +
                "Minutes must be between 0 and 59."
            );
            return;
        }

        var totalMilliseconds =
            ((hours * 60) + minutes) * 60 * 1000;

        if (totalMilliseconds <= 0) {
            alert(
                "The challenge must be at least one minute long."
            );
            return;
        }

        state.challengeRemainingMilliseconds =
            totalMilliseconds;

        state.challengeEndMilliseconds =
            nowMilliseconds() + totalMilliseconds;

        state.challengeRunning = true;
        state.challengePaused = false;
        state.challengeExpired = false;

        ui.challengeStatusText.text =
            "Challenge running. Finish before time expires.";

        updateInterface(nowMilliseconds());
    };

    ui.challengePauseButton.onClick = function () {
        var currentTime = nowMilliseconds();

        if (state.challengeRunning) {
            state.challengeRemainingMilliseconds = Math.max(
                0,
                state.challengeEndMilliseconds - currentTime
            );

            state.challengeRunning = false;
            state.challengePaused = true;

            ui.challengeStatusText.text =
                "Challenge paused.";
        } else if (
            state.challengePaused &&
            state.challengeRemainingMilliseconds > 0
        ) {
            state.challengeEndMilliseconds =
                currentTime +
                state.challengeRemainingMilliseconds;

            state.challengeRunning = true;
            state.challengePaused = false;

            ui.challengeStatusText.text =
                "Challenge resumed.";
        }

        updateInterface(currentTime);
    };

    ui.challengeResetButton.onClick = function () {
        state.challengeRunning = false;
        state.challengePaused = false;
        state.challengeExpired = false;

        var hours = parseNonNegativeInteger(
            ui.challengeHoursInput.text
        );

        var minutes = parseNonNegativeInteger(
            ui.challengeMinutesInput.text
        );

        if (
            hours !== null &&
            minutes !== null &&
            minutes <= 59
        ) {
            state.challengeRemainingMilliseconds =
                ((hours * 60) + minutes) * 60 * 1000;
        } else {
            state.challengeRemainingMilliseconds = 0;
        }

        ui.challengeStatusText.text =
            "Challenge reset.";

        updateInterface(nowMilliseconds());
    };

    // scheduleTask only runs a string, so the timer function has to be globaly available
    $.global.AEFocusTimerController = {
        tick: tick,
        shutdown: shutdown,
        state: state,
        ui: ui
    };

    $.global.AEFocusTimer_tick = function () {
        if (
            $.global.AEFocusTimerController &&
            $.global.AEFocusTimerController.tick
        ) {
            $.global.AEFocusTimerController.tick();
        }
    };

    state.taskId = app.scheduleTask(
        "AEFocusTimer_tick()",
        TICK_RATE_MS,
        true
    );

    if (ui.panel instanceof Window) {
        ui.panel.onClose = function () {
            shutdown();
            return true;
        };

        ui.panel.center();
        ui.panel.show();
    } else {
        ui.panel.layout.layout(true);
        ui.panel.layout.resize();
    }

    updateInterface(nowMilliseconds());
})(this);
