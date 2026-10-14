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
    label.textContent = getBreakLabel(id, false)
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
    console.log(tt);

    createTable(tt);
}

function createTable(tt) {
    const table = document.querySelector("tbody");
    const todayIndex = (new Date()).getDay() - 1;

    // const daysIndices = [0, 0, 0, 0, 0];
    const daysIndices = [];
    for (let i = 0; i < 5; i++) daysIndices.push({ index: 0, dur: 0 });
    for (let i = 0; i < 36; i++) {
        table.insertRow(i);
    }
    const rows = table.childNodes;

    const maxRow = settings.schedule && settings.schedule.oth_16 ? 32 : 36;
    for (let i = 0; i < maxRow; i++) {
        const row = rows[i];
        for (const d in tt) {
            const day = daysIndices[d];
            console.log(day)
            console.log("d : " + d + "\ti : " + i + "\tdi : " + day.index + "\tdd : " + daysIndices[d].dur)
            if (i == daysIndices[d].dur && tt[d].length > day.index) {
                if (tt[d][day.index].duration == 0) { daysIndices[d].index++; continue; } //skip perdiods with no duration

                const item = tt[d][day.index];
                const cell = row.insertCell();
                cell.textContent = getBreakLabel(item.name, false);
                cell.rowSpan = item.duration;
                cell.classList.add(item.name || "main");
                if (d < todayIndex) cell.classList.add("past");
                if (d == todayIndex && isInPast(day.dur)) cell.classList.add("past");
                daysIndices[d].index++;
                daysIndices[d].dur += item.duration;
            }
        }
    }
    console.log(tt)
    console.log(todayIndex)
}

function isInPast(duration) {
    let now = (new Date()).toTimeString();
    const regex = /^(\d{2}):(\d{2})/;
    now = now.match(regex).slice(1).join("");
    console.error(now)
    const nowDuration = to15MinIntervals(now - 800);
    console.error(nowDuration)
    console.error(nowDuration + " - "+duration)
    return duration <= nowDuration;
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
            p.start = sch[d][e].replaceAll(":", "");
            day.push(p);
        }
        day.sort((a, b) => a.start - b.start);

        let fullDay = day.flatMap((p, i, a) =>
            a[i - 1] && a[i - 1].name == "sport"
                ? p
                : [{
                    name: "",
                    start: i == 0
                        ? "0800"
                        : (() => {
                            console.log(p)
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
        console.log(d.toUpperCase())
        console.log(fullDay)

        for (let i = 0; i < fullDay.length - 1; i++) {
            fullDay[i].duration = calcDuration(fullDay[i].start, fullDay[i + 1].start);
            delete fullDay[i].start;
        }
        fullDay.pop();
        fullDay = fullDay.filter((p) => p.duration != 0);
        arr.push(fullDay);
    }
    console.log(arr)

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

// initTimetable();


main();