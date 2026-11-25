"use strict";

// Pull classes needed out of VexFlow
const { Renderer, Stave, StaveConnector, StaveNote, Formatter } = VexFlow;

// Pitch letter mappings
const LETTERS = {0: "c", 2: "d", 4: "e", 5: "f", 
    7: "g", 9: "a", 11: "b"};

function midiToNote(midi) {
    const octave = Math.floor(midi / 12) - 1;
    const note = LETTERS[midi % 12];
    return `${note}/${octave}`;
}

function drawScore(message) {
    // text line
    const textElement = document.getElementById("text");
    textElement.textContent = message.text;

    const pageElement = document.getElementById("page");
    pageElement.textContent = `Page ${message.page}`;
    
    // render + context
    const scoreDiv = document.getElementById("score");
    scoreDiv.innerHTML = ""; // clear the old score first
    const renderer = new Renderer(scoreDiv, Renderer.Backends.SVG);
    renderer.resize(window.innerWidth, window.innerWidth - 200);
    const context = renderer.getContext();

    // two staves with clefs
    const treble = new Stave(150, 40, 1000);
    treble.addClef("treble");
    treble.setContext(context).draw();

    const bass = new Stave(150, 150, 1000);
    bass.addClef("bass");
    bass.setContext(context).draw();

    // left line + brace
    const leftLine = new StaveConnector(treble, bass);
    leftLine.setType("singleLeft");
    leftLine.setContext(context).draw();

    const brace = new StaveConnector(treble, bass);
    brace.setType("brace");
    brace.setContext(context).draw();

    // notes
    const trebleMidi = message.chord.filter((n) => n >= 60);
    if (trebleMidi.length > 0) {
        // map to keys before converting to written notes
        const trebleKeys = trebleMidi.map((n) => midiToNote(n));
        const trebleNote = new StaveNote({clef: "treble", keys: trebleKeys, 
            duration: "q"});
        trebleNote.getStem().setVisibility(false);
        Formatter.FormatAndDraw(context, treble, [trebleNote]); 
    }

    const bassMidi = message.chord.filter((n) => n < 60);
    if (bassMidi.length > 0) {
        // map to keys before converting to written notes
        const bassKeys = bassMidi.map((n) => midiToNote(n));
        const bassNote = new StaveNote({clef: "bass", keys: bassKeys, 
            duration: "q"});
        bassNote.getStem().setVisibility(false);
        Formatter.FormatAndDraw(context, bass, [bassNote]);
    }
}

// Font-loading pattern adapted from the VexFlow 5 getting-started guide:
// https://vexflow.github.io/vexflow-examples/guides/getting-started/
VexFlow.loadFonts('Bravura', 'Academico').then(() => {
    VexFlow.setFonts('Bravura', 'Academico');
    console.log("ready");
    drawScore({ type: "score", page: 0, text: "", chord: [] }); // so that I know empty page 
                                                                // means failed loading, empty 
                                                                // staff in next page means 
                                                                // failed connection
    const socket = new WebSocket(SERVER_URL);
    socket.addEventListener("open", () => { // say hello
        socket.send(JSON.stringify({ type: "hello", role: "score" }));
    });
    socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "score") {
            drawScore(message);
        }
    });
});
