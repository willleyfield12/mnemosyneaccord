const eye = document.getElementById("aegis-eye");
const pupil = document.getElementById("aegis-pupil");
const messageBox = document.getElementById("aegis-message");

if (eye && pupil) {
    document.addEventListener("mousemove", (e) => {
        const maxOffset = 8;
        const x = ((e.clientX / window.innerWidth) - 0.5) * 2 * maxOffset;
        const y = ((e.clientY / window.innerHeight) - 0.5) * 2 * maxOffset;

        pupil.style.transform = `translate(${x}px, ${y}px)`;
    });
}

function aegisMessage(text, duration = 3200) {
    if (!messageBox) return;

    messageBox.textContent = text;
    messageBox.classList.add("visible");

    clearTimeout(window.__aegisMessageTimer);
    window.__aegisMessageTimer = setTimeout(() => {
        messageBox.classList.remove("visible");
    }, duration);
}

function aegisFocus(duration = 900) {
    if (!eye) return;
    eye.classList.add("focused");

    clearTimeout(window.__aegisFocusTimer);
    window.__aegisFocusTimer = setTimeout(() => {
        eye.classList.remove("focused");
    }, duration);
}

function aegisWarning(message = "Unauthorised behaviour detected.") {
    if (!eye) return;
    eye.classList.add("warning");
    aegisMessage(message, 2600);

    setTimeout(() => {
        eye.classList.remove("warning");
    }, 1200);
}

window.aegisMessage = aegisMessage;
window.aegisFocus = aegisFocus;
window.aegisWarning = aegisWarning;