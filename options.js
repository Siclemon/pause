// document.querySelector("#ok").addEventListener("click", () => console.table(Object.fromEntries(new FormData(document.querySelector("form")))));

const ok = document.getElementById("ok");
const reset = document.getElementById("resetForm")
const form = document.querySelector("form");
let settings = localStorage.getItem("settings") ?? null;

function initForm() {
    // settings = Object.fromEntries(new FormData(document.querySelector("form")))
    // settings = { sp_mon: "true", sp_wed: "true", en_n: "0", en_c: "2", oth_16: "true" };
    // console.log(settings)
    if (settings != null) {
        settings = JSON.parse(settings);
        // console.log(settings)

        for (const cat in settings) {
            for (const key in settings[cat]) {

                const input = form.elements[cat.substring(0, 3) + "_" + key];
                // console.log(input)
                // console.log(RadioNodeList.prototype.isPrototypeOf(input))
                const type = RadioNodeList.prototype.isPrototypeOf(input) ? "radio" : input.type;
                switch (type) {
                    case "checkbox":
                        // console.log("id: " + input.id);
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
    // event.preventDefault();
    if (event.target.id == "resetForm") form.reset();
    settings = Object.fromEntries(new FormData(document.querySelector("form")));
    settings = formatSettings(settings);
    localStorage.setItem("settings", JSON.stringify(settings));

}

function formatSettings(settings) {
    const formattedSettings = { schedule: {}, display: {}, general: {} }

    for (const entry in settings) {
        const cat = entry.substring(0, 3);
        const setting = entry.substring(4);
        // console.log(entry + "---" + cat + "---" + setting)
        switch (cat) {
            case "sch": formattedSettings.schedule[setting] = settings[entry]; break;
            case "dis": formattedSettings.display[setting] = settings[entry]; break;
            case "gen": formattedSettings.general[setting] = settings[entry]; break;
        }
    }
    // console.log(formattedSettings)
    return formattedSettings;
}