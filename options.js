const ok = document.getElementById("ok");
const reset = document.getElementById("resetForm")
const form = document.querySelector("form");
let settings = localStorage.getItem("settings") ?? null;

function initForm() {
    if (settings != null) {
        settings = JSON.parse(settings);

        for (const cat in settings) {
            for (const key in settings[cat]) {
                const input = form.elements[cat.substring(0, 3) + "_" + key];
                const type = RadioNodeList.prototype.isPrototypeOf(input) ? "radio" : input.type;

                switch (type) {
                    case "checkbox":
                        input.checked = settings[cat][key]
                        break;
                    case "radio":
                        document.getElementById(key + "_" + settings[cat][key]).click();
                        break;
                }
            }
        }
    }
}

initForm();

reset.addEventListener("click", updateSettings)

ok.addEventListener("click", updateSettings);

function updateSettings(event) {
    if (event.target.id == "resetForm") form.reset();
    settings = Object.fromEntries(new FormData(document.querySelector("form")));
    settings = formatSettings(settings);
    localStorage.setItem("settings", JSON.stringify(settings));
    if (event.target.id == "ok") document.getElementById("back").click();
}

function formatSettings(settings) {
    const formattedSettings = { schedule: {}, display: {}, general: {} }

    for (const entry in settings) {
        const cat = entry.substring(0, 3);
        const setting = entry.substring(4);
        switch (cat) {
            case "sch": formattedSettings.schedule[setting] = settings[entry]; break;
            case "dis": formattedSettings.display[setting] = settings[entry]; break;
            case "gen": formattedSettings.general[setting] = settings[entry]; break;
        }
    }
    return formattedSettings;
}