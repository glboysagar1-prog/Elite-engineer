import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
    id: "wecraft-dashboard",
    isDev: true,
    baseUrl: "http://localhost:8289"
});
