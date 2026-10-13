const settings = JSON.parse(localStorage.getItem("settings")) ?? { schedule: {}, general: {}, display: {} };
const timetableBtn = document.getElementById("ttBtn");
const timetableDialog = document.getElementById("ttDialog");

async function init() {
    const response = await fetch("./schedule.json");
    let schedule = await response.json();

    schedule = applySchSettings(schedule);
    initTimetable(schedule);

    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const today = days[(new Date()).getDay()];
    const todayBreaks = schedule[today];

    for (const b in todayBreaks) {
        todayBreaks[b] = toDateFormat(todayBreaks[b]);
    }

    return todayBreaks;
}

function applySchSettings(schedule) {
    const settingsSchedule = settings.schedule;
    if (settingsSchedule == null) return schedule;

    for (const setting in settingsSchedule) {
        console.log(setting)
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
                switch (settingsSchedule.en_n) {
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
                switch (settingsSchedule.en_c) {
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
    const timerMode = settings.general ? settings.general.timer : "all";
    let next = new Date(3000, 1, 1, 1);
    let nextKey;
    const now = new Date();
    for (const b in breaks) {
        if (breaks[b] < next && breaks[b] > now && (timerMode == "all" || timerMode == "brk" && b.startsWith("pause") || b == "fin")) {
            next = breaks[b];
            nextKey = b;
        }
    }
    if (settings.general && settings.display.break_name) updateLabel(nextKey);
    return nextKey;
}

function updateLabel(id) {
    const label = document.querySelector(".timer__label");
    const name = getBreakLabel(id);
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
            digits.forEach(d => d.textContent = "");
        }
        await new Promise(r => setTimeout(r, 1));
    }
}

async function breakAlert(id) {
    if (settings.display && settings.display.blinking) bgBlinking();
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
            return "REPAS";
        default:
            return "unidentified";
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

    timer(todayBreaks);
}

timetableBtn.addEventListener('click', () => timetableDialog.showModal());

function initTimetable(sch) {
    console.log(sch)
    for (const d in sch) {
        console.log(d)
        for (const e in sch[d])
            console.log(sch[d][e] + " --- " + e)
        console.log(sch[d])
    }
    "hjeccql".split


    const tt = formatTt(sch);
    console.log(tt)
}

function formatTt(sch) {
    const arr = [];

    for (const d in sch) {
        console.log(d)
        const day = [];
        for (const e in sch[d]) {
            console.log(sch[d][e] + " --- " + e)
            const p = {};
            p.name = e;
            p.start = sch[d][e].replaceAll(":","");
            day.push(p);
        }
        day.sort((a, b) => a.start - b.start);

        for (const i in day) {
            if (i == day.length - 1) {
                day[i].duration = calcDuration(day[i].start, 1700)
            } else {
                day[i].duration = calcDuration(day[i].start, day[i+1].start)
            }
        }

        arr.push(day);
    }

    return arr;
}

function calcDuration(a, b) {
    let d;

    return d;
}

initTimetable();


main();