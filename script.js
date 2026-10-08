const settings = JSON.parse(localStorage.getItem("settings")) ?? null;

async function init() {
    const response = await fetch("./schedule.json");
    let schedule = await response.json();

    schedule = applySchSettings(schedule);

    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const today = days[(new Date()).getDay()];
    const todayBreaks = schedule[today];

    for (const b in todayBreaks) {
        todayBreaks[b] = toDateFormat(todayBreaks[b]);
    }

    return todayBreaks;
}

function applySchSettings(schedule) {
    if (settings == null) return schedule;
    const settingsSchedule = settings.schedule;
    if (settingsSchedule == null) return schedule;

    for (const setting in settingsSchedule) {
        switch (setting) {
            case "sp_mon":
                schedule.lundi.sport = "16:00";
                break;
            case "sp_wed":
                schedule.mercredi.sport = "16:00";
                break;
            case "oth_16":
                for (const day in schedule) schedule[day].fin = day != "vendredi" ? "16:00" : schedule[day].fin;
                break;
            case "en_n":
                switch (settings.en_n) {
                    case "1":
                        schedule.mardi.anglais = "14:00";
                        break;
                    case "2":
                        schedule.mardi.anglais = "15:00";
                        schedule.mardi.pauseAprem = "14:45";
                        break;
                }
                break;
            case "en_c":
                switch (settings.en_c) {
                    case "1":
                        schedule.jeudi.anglais = "08:30";
                        break;
                    case "2":
                        schedule.jeudi.anglais = "10:30";
                        break;
                }
                break;
        }
    }
    console.log(schedule);
    return schedule;
}

function toDateFormat(time) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    return new Date(year, month, day, time.substring(0, 2), time.substring(3, 5));
}

function getNextBreak(breaks) {
    const timerMode = settings.general.timer;
    let next = new Date(3000, 1, 1, 1);
    let nextKey;
    const now = new Date();
    for (const b in breaks) {
        if (breaks[b] < next && breaks[b] > now && (timerMode == "all" || timerMode == "brk" && b.startsWith("pause") || b == "fin")) {
            next = breaks[b];
            nextKey = b;
        }
    }
    if (settings.display.break_name) updateLabel(nextKey);
    return nextKey;
}

function updateLabel(id) {
    const label = document.querySelector(".timer__label");
    const name = getBreakLabel(id)
    label.textContent = name.charAt(0) + name.slice(1).toLowerCase();
}

async function timerOLD(nxt) {
    const display = document.getElementById("display");

    while (true) {
        const diff = nxt - new Date();
        display.textContent = format(diff);
        await new Promise(r => setTimeout(r, 50));
    }
}

async function timer(todayBreaks) {
    const digits = document.querySelectorAll(".digit");
    let nextBreakId = getNextBreak(todayBreaks);
    let nextBreak = todayBreaks[nextBreakId];

    while (true) {
        const diff = nextBreak - new Date();
        let heure = format(diff);
        heure = heure.replaceAll(":", "");
        for (let i = 5; i >= 0; i--) {
            if (digits[i].textContent != heure.substring(i, i + 1))
                digits[i].textContent = heure.substring(i, i + 1);
            else
                break;
        }
        if (diff <= 0) {
            await breakAlert(nextBreakId);
            nextBreak = todayBreaks[getNextBreak(todayBreaks)];
            // const diff2 = nextBreak - new Date();
            // let heure = format(diff2);
            // heure = heure.replaceAll(":", "");
            // for (let i = 5; i >= 0; i--) {
            //     digits[i].textContent = heure.substring(i, i + 1);
            // }
            digits.forEach(d => d.textContent = "")
        }
        await new Promise(r => setTimeout(r, 1));
    }
}

async function breakAlert(id) {
    if (settings.general.blinking) bgBlinking();
    displayBreakLabel(id);
    await new Promise(r => setTimeout(r, 30000));
    restoreTimerDisplay();
}

function bgBlinking() {
    document.body.classList.remove("bg-alert");
    document.body.classList.add("bg-alert");
}

function displayBreakLabel(id) {
    const displaySpans = document.querySelectorAll(".display");
    const displayDiv = document.querySelector(".divsplay");
    displaySpans.forEach(s => s.style.display = "none");
    const txt = document.createElement("span");
    txt.id = "breakLabel";
    txt.textContent = getBreakLabel(id);
    displayDiv.appendChild(txt);
}

function restoreTimerDisplay() {
    const displaySpans = document.querySelectorAll(".display");
    const displayDiv = document.querySelector(".divsplay");
    const txt = document.getElementById("breakLabel");
    displaySpans.forEach(s => s.style.display = "inline");
    displayDiv.removeChild(txt);
}

function getBreakLabel(id) {
    switch (id) {
        case "pauseMatin":
        case "pauseAprem":
            return "PAUSE";
        case "anglais":
            return "ANGLAIS";
        case "sport":
            return "SPORT";
        case "fin":
            return "FIN";
        case "pauseRepas":
            return "REPAS;"
    }
}

function format(time) {
    time /= 1000;
    const ftime = {};
    ftime.h = Math.floor(time / 3600);
    time -= ftime.h * 3600;
    ftime.m = Math.floor(time / 60);
    time -= ftime.m * 60;
    ftime.s = Math.floor(time);

    for (const t in ftime) {
        ftime[t] = String(ftime[t]).padStart(2, "0");
    }

    return ftime.h + ":" + ftime.m + ":" + ftime.s;
    // + "." + String(String(time).slice(-3, -1)).padStart(2, "0")
}

async function main() {
    const todayBreaks = await init();
    let nextBreak = getNextBreak(todayBreaks);

    timer(todayBreaks);
}

main();