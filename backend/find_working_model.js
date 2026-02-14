import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const candidates = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro-latest"
];

async function findWorkingModel() {
    for (const modelId of candidates) {
        try {
            console.log(`Testing ${modelId}...`);
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent("hi");
            const text = result.response.text();
            console.log(`✓ ${modelId} works! Response: ${text.substring(0, 10)}...`);
            fs.writeFileSync('working_model.txt', modelId);
            return;
        } catch (error) {
            console.log(`✗ ${modelId} failed: ${error.message.substring(0, 100)}`);
        }
    }
    console.log("No working models found among candidates.");
}

findWorkingModel();
