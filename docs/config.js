"use strict";
const SERVER_URL = location.hostname === "localhost"
    ? "ws://localhost:8765"
    : "wss://a-score-for-all-of-us-server.onrender.com";
