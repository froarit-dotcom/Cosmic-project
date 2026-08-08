const { GoogleGenAI } = require('@google/genai');

const parseQuotationImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key is missing from environment constraints.' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = 'gemini-2.0-flash';

        // Prepare image for Gemini
        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype,
            },
        };

        const prompt = `
        You are an intelligent quotation parser for an inventory management system (Hardware & Sanitary materials).
        Read the provided image of a quotation, invoice, or handwritten bill.
        Identify all the line items being requested or sold.
        
        For each line item, extract:
        1. "name": The best possible descriptive product name + size + brand if available.
        2. "quantity": The requested quantity as a number.
        3. "price": The unit price if listed, otherwise 0.
        
        Return the result strictly as a valid JSON array of objects obeying exactly this schema, and NOTHING else:
        [
          { "name": "4 inch Astral PVC Pipe SDR 11", "quantity": 10, "price": 450 },
          { "name": "Ashirvad CPVC Elbow 1/2 inch", "quantity": 5, "price": 60 }
        ]
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: [prompt, imagePart],
        });

        // Parse the JSON array out of the markdown response
        let text = response.text || '';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsedData = [];
        try {
            parsedData = JSON.parse(text);
        } catch (jsonErr) {
            console.error('Failed to parse AI JSON:', text);
            return res.status(500).json({ error: 'AI did not return a valid structured response format.' });
        }

        res.json({ items: parsedData });
    } catch (error) {
        console.error('AI Parsing Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process AI computer vision.' });
    }
};

module.exports = {
    parseQuotationImage
};
