"use strict";

let socket = null;   // created only when an audience presses YES

// Show only one screen, hide all the others
const SCREENS = ["joinScreen", "declinedScreen", "waitScreen", 
                 "voteScreen", "listenScreen", "lockedScreen"];
function showScreen(id) {
    for (const screen of SCREENS) {
        document.getElementById(screen).hidden = (screen !== id);
    }
}

let countdownTimer = null;

function startCountdown(seconds) {
    clearInterval(countdownTimer); // stop any earlier countdown
    let remaining = Math.ceil(seconds);
    const display = document.getElementById("countdown");
    display.textContent = remaining;
    countdownTimer = setInterval(() => {
        remaining -= 1;
        display.textContent = Math.max(remaining, 0);
        if (remaining <= 0) {
            clearInterval(countdownTimer);
        }
    }, 1000);
}

// YES - connect and join the room
document.getElementById("yes").addEventListener("click", () => {
    socket = new WebSocket(SERVER_URL);

    socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ type: "hello", role: "audience" }));
        showScreen("waitScreen");
    });

    socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "locked") {
            showScreen("lockedScreen");

        } else if (message.type === "vote_open") {
            document.getElementById("voteText").textContent = message.text;
            for (const button of document.querySelectorAll(".color")) {
                button.classList.remove("chosen"); // clear last page's choice
            }
            startCountdown(message.seconds);
            showScreen("voteScreen");

        } else if (message.type === "vote_closed") {
            clearInterval(countdownTimer);
            showScreen("listenScreen");
        } else if (message.type === "reset") {
            clearInterval(countdownTimer);
            showScreen("waitScreen");
        }
    });
});

// NO - never connect to the room
document.getElementById("no").addEventListener("click", () => {
    showScreen("declinedScreen");
});

// Color buttons - send this phone's vote (pressing again overrides it)
for (const button of document.querySelectorAll(".color")) {
    button.addEventListener("click", () => {
        socket.send(JSON.stringify({ type: "vote", color: button.dataset.color }));
        for (const other of document.querySelectorAll(".color")) {
            other.classList.remove("chosen");
        }
        button.classList.add("chosen");
    });
}
