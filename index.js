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
You are an expert UK-based CV writer. Rewrite the following resume in a UK-style CV format that matches the given job description. Must the output includes whatever the heading of original cv include:


Name and contact details
Personal Profile or Professional Overview
Education
Experience or employment
Skills
Additional Information

additional information mut be the last output of the resume.
Tailor the language and keywords to match the job description.

Resume:
${resume}

Job Description:
${jobDesc}

Return only the UK-style CV especially for edinburgh with appropriate formatting."

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
