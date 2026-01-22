import express from "express";
import { serve } from "inngest/express";
import { inngest } from "./client";
import { engineerAnalysis } from "./functions";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const app = express();
app.use(express.json());

const PORT = 3000;

app.use(
    "/api/inngest",
    serve({
        client: inngest,
        functions: [engineerAnalysis],
    })
);

app.listen(PORT, () => {
    console.log(`Inngest server running at http://localhost:${PORT}/api/inngest`);
});
