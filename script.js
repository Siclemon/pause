
async function init() {
    const response = await fetch("./schedule.json");
    const schedule = await response.json();

    const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const today = days[(new Date()).getDay()];
    const todayBreaks = schedule[today];

    for (const b in todayBreaks) {
        todayBreaks[b] = toDateFormat(todayBreaks[b]);
    }

    return todayBreaks;
}

function toDateFormat(time) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    return new Date(year, month, day, time.substring(0, 2), time.substring(3, 5));
}

function getNextBreak(breaks) {
    let next = Infinity;
    const now = (new Date()).getTime();
    for (const b in breaks) {
        if (breaks[b].getTime() < next && breaks[b].getTime() > now)
            next = b;
    }
    return next;
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
        await new Promise(r => setTimeout(r, 1));
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

    timer(todayBreaks[nextBreak]);
}

main();