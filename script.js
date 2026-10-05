const pauses = ["10:15:00", "12:15:00", "15:00:00", "17:00:00"];
let now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = now.getDate();
const breaks = [];
const display = document.getElementById("display");
let nextBreak

async function init() {
    pauses.forEach((p) => {
        breaks.push(new Date(year, month, day, p.substring(0, 2), p.substring(3, 5)));
    });


    // fetch("schedule.json")
    //     .then(res => res.json())
    //     .then(json => { schedule = json });

    const response = await fetch("./schedule.json");
    const schedule = await response.json();


    const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const jour = jours[now.getDay()];
    console.log(schedule[jour])

}

function getNextBreako() {

}

function getNexBreak() {
    let i;
    for (i = 0; (new Date()).getTime() > breaks[i].getTime(); i++) { };
    console.log(i)
    nextBreak = breaks[i];
}

async function timer() {
    while (true) {
        const diff = nextBreak - new Date();

        display.textContent = format(diff);
        // console.log(format(diff))

        await new Promise(r => setTimeout(r, 200));
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

    let formatted = ftime.h + ":" + ftime.m + ":" + ftime.s;
    return formatted;
}

async function main() {
    await init();
    getNexBreak();
    timer();
}

main();