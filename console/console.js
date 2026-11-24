"use strict";

const COLORS = ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"];
const CONSOLE_KEY = location.hash.slice(1);   // the text after "#"
const socket = new WebSocket(SERVER_URL);

//  Read the seven color boxes into {color: count}
function readCounts() {
    const counts = {};
    for (const color of COLORS) {
        counts[color] = Number(document.getElementById(color).value);
    }
    
    return counts;
}

socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "hello", 
                                 role: "console", 
                                 key: CONSOLE_KEY 
    }));
});

socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "score") {
        document.getElementById("status").textContent =
            `Page ${message.page}: ${message.text}`;

    } else if (message.type === "room") {
        const state = message.started ? "started" : "open";
        document.getElementById("room").textContent = 
            `Joined: ${message.joined} (${state})`;

    } else if (message.type === "voting") {
        const state = message.open ? "OPEN" : "closed";
        const votes = Object.entries(message.counts)
                .map(([color, n]) => `${color} ${n}`)
                .join(", ");
        document.getElementById("voting").textContent =
            `Vote for page ${message.page}: ${state}, 
                           ${message.voted} voted (${votes})`;
        document.getElementById("next").disabled = message.open;
    }
});

// Start Piece: lock the room
document.getElementById("start").addEventListener("click", () => {
    socket.send(JSON.stringify({ type: "start_piece" }));
});

// Reset: back to before Start Piece (asks first to prevent accidental clicks)
document.getElementById("reset").addEventListener("click", () => {
    if (confirm("Reset the piece? Page 0, no vote, room open again.")) {
        socket.send(JSON.stringify({ type: "reset" }));
    }
});

// X cues next page
document.getElementById("next").addEventListener("click", () => {
    socket.send(JSON.stringify({ type: "next_page", 
                                 counts: readCounts(),
                                 override: document.getElementById("override").checked
    }));
});

//Go to any page
document.getElementById("goTo").addEventListener("click", () => {
    const page = Number(document.getElementById("pageInput").value);
    socket.send(JSON.stringify({type: "go_to_page", 
                                page: page, 
                                counts: readCounts()
    }));
});
