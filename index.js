import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());

// Serve frontend files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/tailor", async (req, res) => {
  try {
    const { resume, jobDesc } = req.body;

    const prompt = `
You are an expert resume writer. Rewrite this resume to match this job description, emphasizing relevant skills and keywords:

Resume:
${resume}

Job Description:
${jobDesc}

Rewrite the resume accordingly.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4" if you have access
      messages: [{ role: "user", content: prompt }],
    });

    const tailoredResume = completion.choices[0].message.content;

    res.json({ tailoredResume });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to tailor resume" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
