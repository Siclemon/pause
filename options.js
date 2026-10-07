// document.querySelector("#ok").addEventListener("click", () => console.table(Object.fromEntries(new FormData(document.querySelector("form")))));

const ok = document.getElementById("ok");
const reset = document.getElementById("resetForm")
const form = document.querySelector("form");
let settings = localStorage.getItem("settings") ?? null;

function initForm() {
    // settings = Object.fromEntries(new FormData(document.querySelector("form")))
    // settings = { sp_mon: "true", sp_wed: "true", en_n: "0", en_c: "2", oth_16: "true" };
    console.log(settings)
    if (settings != null) {
        settings = JSON.parse(settings);

        for (const key in settings) {
            // console.log("key:" + key)
            const input = form.elements[key];
            // console.log(input)
            // console.log(RadioNodeList.prototype.isPrototypeOf(input))
            const type = RadioNodeList.prototype.isPrototypeOf(input) ? "radio" : input.type;
            switch (type) {
                case "checkbox": 
                    console.log("id: " + input.id);
                    input.checked = settings[key]
                    break;
                case "radio":
                    document.getElementById(key + "_" + settings[key]).click();
                    break;
            }
        }
    }
}

initForm();

// settings = {};
// formData.forEach(function(value, key){
//     settings[key] = value;
// });

reset.addEventListener("click", updateSettings)

ok.addEventListener("click", updateSettings);

function updateSettings(event) {
    // event.preventDefault();
    if (event.target.id == "resetForm") form.reset();
    settings = Object.fromEntries(new FormData(document.querySelector("form")));
    localStorage.setItem("settings", JSON.stringify(settings));

}