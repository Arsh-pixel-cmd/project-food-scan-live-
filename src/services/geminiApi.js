const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export const geminiApi = {
    /**
     * Analyze an image to detect if it's food and extract details.
     * @param {string} base64Image - Base64 encoded image string (without data:image/jpeg;base64, prefix if possible, but Google API often handles checks. Better to send pure base64).
     * @returns {Promise<Object>} - { isFood: boolean, name: string, freshness: string, ingredients: string[] }
     */
    analyzeImage: async (base64Image) => {
        if (!API_KEY) {
            console.error("Gemini API Key is missing");
            // Fallback for demo if key is missing
            return {
                isFood: true,
                name: "Demo Food",
                freshness: "Unknown (No Key)",
                ingredients: ["Unknown"],
                confidence: 0
            };
        }

        const prompt = `
            Analyze this image. 
            Strictly determine if this is a food item. 
            If it is NOT food (e.g., a laptop, person, car, non-edible object), return JSON: {"isFood": false}.
            If it IS food, return JSON: 
            {
                "isFood": true,
                "name": "Name of the dish",
                "freshness": "Fresh, Stale, or Rotten",
                "ingredients": ["List", "of", "visible", "ingredients"],
                "visual_defects": "Any visible mold or issues, or 'None'"
            }
            Return ONLY raw JSON, no markdown formatting.
        `;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("No response from Gemini");
            }

            const text = data.candidates[0].content.parts[0].text;
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(jsonStr);

        } catch (error) {
            console.error("Gemini Analysis Failed:", error);
            // Default error object
            return { isFood: false, error: "Analysis failed" };
        }
    }
};
