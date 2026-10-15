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
    label.textContent = getBreakLabel(id, false)
}

// async function timerOLD(nxt) {
//     const display = document.getElementById("display");
//     while (true) {
//         const diff = nxt - new Date();
//         display.textContent = format(diff);
//         await new Promise(r => setTimeout(r, 50));
//     }
// }

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
    txt.textContent = getBreakLabel(id, true);
    displayDiv.appendChild(txt);
}

function restoreTimerDisplay() {
    const displaySpans = document.querySelectorAll(".display");
    const displayDiv = document.querySelector(".divsplay");
    const txt = document.getElementById("breakLabel");
    displaySpans.forEach(s => s.style.display = "inline");
    displayDiv.removeChild(txt);
}

function getBreakLabel(id, uppercase) {
    let ret;
    switch (id) {
        case "pauseMatin":
        case "pauseAprem":
            ret = "Pause";
            break;
        case "anglais":
            ret = "Anglais";
            break;
        case "sport":
            ret = "Sport";
            break;
        case "fin":
            ret = "Fin";
            break;
        case "pauseRepas":
            ret = "Repas";
            break;
        default:
            return "";
    }
    return uppercase ? ret.toUpperCase() : ret;
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

// =============================== TIMETABLE ===============================

// open
timetableBtn.addEventListener('click', () => timetableDialog.showModal());
// close
timetableDialog.addEventListener('click', (event) => {
    if (event.target.contains(timetableDialog)) {
        timetableDialog.close();
    }
});

function initTimetable(sch) {
    const tt = formatTt(sch);
    createTable(tt);
}

function createTable(tt) {
    const table = document.querySelector("tbody");
    const todayIndex = (new Date()).getDay() - 1;
    const maxRow = settings.schedule && settings.schedule.oth_16 ? 32 : 36;

    // index=which period are we on; dur=when should start the next period
    const daysIndices = [];
    for (let i = 0; i < 5; i++) daysIndices.push({ index: 0, dur: 0 });
    // create all tables rows
    for (let i = 0; i < maxRow; i++) {
        table.insertRow(i);
    }
    const rows = table.childNodes;

    for (let i = 0; i < maxRow; i++) { //for each row
        const row = rows[i];
        for (const d in tt) { // for each day
            const day = daysIndices[d];

            if (i == daysIndices[d].dur && tt[d].length > day.index) { // should a new period start? are there still periods for the day?
                const period = tt[d][day.index];
                const cell = row.insertCell();
                cell.textContent = getBreakLabel(period.name, false);
                cell.rowSpan = period.duration;
                cell.classList.add(period.name || "main");

                if (d < todayIndex || d == todayIndex && isInPast(day.dur + period.duration)) cell.classList.add("past");
                if (d == todayIndex && isInPast(day.dur) && !isInPast(day.dur + period.duration)) cell.classList.add("now");

                daysIndices[d].index++;
                daysIndices[d].dur += period.duration;
            }
            // style for today's header
            if (d == todayIndex) document.querySelectorAll("thead th")[d].classList.add("today");
        }
    }
}

function isInPast(duration) {
    let now = (new Date()).toTimeString();
    const regex = /^(\d{2}):(\d{2})/;
    now = now.match(regex).slice(1).join("");
    const nowDuration = to15MinIntervals(now - 800);
    return duration <= nowDuration;
}

function formatTt(sch) {
    const arr = [];

    for (const d in sch) { // for each day
        const day = [];
        for (const e in sch[d]) { // for each item, create period item with name and start time
            const p = {};
            p.name = e;
            p.start = sch[d][e].replaceAll(":", "");
            day.push(p);
        }
        day.sort((a, b) => a.start - b.start); // sort the day's items depending on the start time

        // insert basic periods between all nonconsecutive periods
        let fullDay = day.flatMap((p, i, a) =>
            a[i - 1] && a[i - 1].name == "sport"
                ? p
                : [{
                    name: "",
                    start: i == 0
                        ? "0800"
                        : (() => {
                            switch (a[i - 1].name) {
                                case "pauseMatin":
                                case "pauseAprem":
                                    return parseInt(a[i - 1].start) + 15;
                                case "pauseRepas":
                                    return parseInt(a[i - 1].start) + 100;
                                case "anglais":
                                    return d == "mardi" ? parseInt(a[i - 1].start) + 100 : parseInt(a[i - 1].start) + 170;
                                case "sport":
                                    return 1600;
                            }
                        })()
                },
                    p
                ]
        );

        // calc the duration of each period
        for (let i = 0; i < fullDay.length - 1; i++) {
            fullDay[i].duration = calcDuration(fullDay[i].start, fullDay[i + 1].start);
            delete fullDay[i].start;
        }
        fullDay.pop(); //remove the end
        fullDay = fullDay.filter((p) => p.duration != 0); // remove the empty periods
        arr.push(fullDay);
    }

    return arr;
}

function calcDuration(a, b) {
    a = to15MinIntervals(a);
    b = to15MinIntervals(b);

    return b - a;
}

function to15MinIntervals(t) {
    const h = Math.floor(t / 100);
    let m = t % 100;
    m += h * 60;
    return m / 15;
}

main();