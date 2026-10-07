
async function init() {
    const response = await fetch("./schedule.json");
    let schedule = await response.json();

    schedule = applySettings(schedule);

    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const today = days[(new Date()).getDay()];
    const todayBreaks = schedule[today];

    for (const b in todayBreaks) {
        todayBreaks[b] = toDateFormat(todayBreaks[b]);
    }

    return todayBreaks;
}

function applySettings(schedule) {
    let settings = localStorage.getItem("settings") ?? null;
    if (settings == null) return schedule
    settings = JSON.parse(settings);

    for (const setting in settings) {
        switch (setting) {
            case "sp_mon":
                schedule.lundi.sport = "16:00";
                break;
            case "sp_wed":
                schedule.mercredi.sport = "16:00";
                break;
            case "oth_16":
                for (const day in schedule) schedule[day].fin = "16:00";
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
    console.log(schedule)
    return schedule
}

function toDateFormat(time) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    return new Date(year, month, day, time.substring(0, 2), time.substring(3, 5));
}

function getNextBreak(breaks) {
    console.log("ofedc")
    let next = new Date(3000,1,1,1);
    let nextKey;
    const now = new Date();
    for (const b in breaks) {
        if (breaks[b] < next && breaks[b] > now) {
            next = breaks[b];
            nextKey = b;
        }
    }
    return nextKey;
}

async function timerOLD(nxt) {
    const display = document.getElementById("display");

    while (true) {
        const diff = nxt - new Date();
        display.textContent = format(diff);
        await new Promise(r => setTimeout(r, 50));
    }
}

async function timer(nxt) {
    const digits = document.querySelectorAll(".digit");

    while (true) {
        const diff = nxt - new Date();
        let heure = format(diff);
        heure = heure.replaceAll(":", "");
        for (let i = 5; i >= 0; i--) {
            if (digits[i].textContent != heure.substring(i, i + 1))
                digits[i].textContent = heure.substring(i, i + 1);
            else
                break;
        }
        if (diff <= 0) breakAlert();
        await new Promise(r => setTimeout(r, 1));
    }
}

function breakAlert() {
    document.body.classList.remove("bg-alert");
    document.body.classList.add("bg-alert");
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

    timer(todayBreaks[nextBreak]);
}

main();