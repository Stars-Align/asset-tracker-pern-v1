import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { BadRequestError } from '../middleware/errorHandler.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export const analyzeImage = async (req, res, next) => {
    try {
        const { image } = req.body; // Expecting Base64 string

        if (!image) {
            throw new BadRequestError('Image data is required');
        }

        console.log("AI Analysis Request received...");
        // Remove data:image/jpeg;base64, prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `Analyze this image and identify the item. Return a JSON object with the following fields:
        - name: A short, descriptive name of the item.
        - category: A broad category for the item (e.g., Electronics, Furniture, tools).
        - price: An estimated value in USD (number only, no symbols).
        - description: A brief description of the item and its condition.
        - tags: An array of 3-5 keywords describing the item.
        
        Ensure the response is valid JSON and nothing else.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if Gemini returns them
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let data;
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            data = {
                name: "Unknown Item",
                category: "Uncategorized",
                price: "0",
                description: text,
                tags: []
            };
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error("AI Analysis Error:", error);
        // Extract meaningful error message from Gemini error
        const message = error.message || "Failed to analyze image";
        const status = error.status || 500;
        res.status(status).json({
            success: false,
            message: message,
            error: error.toString()
        });
    }
};
