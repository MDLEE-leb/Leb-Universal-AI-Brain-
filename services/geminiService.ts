
import { GoogleGenAI, Modality } from "@google/genai";
import { ChatMessage, MessageAuthor } from '../types.ts';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

export async function generateText(
    prompt: string, 
    modelName: string, 
    systemInstruction: string, 
    history: ChatMessage[],
    image?: File
): Promise<string> {
    try {
        const contents = await Promise.all(history.map(async (msg) => {
            const role = msg.author === MessageAuthor.USER ? 'user' : 'model';
            const parts: any[] = [{ text: msg.text }];
            if (msg.image && msg.image.file) {
                const imagePart = await fileToGenerativePart(msg.image.file);
                parts.unshift(imagePart);
            }
            return { role, parts };
        }));

        const userMessageParts: any[] = [];
        if (image) {
            const imagePart = await fileToGenerativePart(image);
            userMessageParts.push(imagePart);
        }
        if (prompt) {
            userMessageParts.push({ text: prompt });
        }
        
        if (userMessageParts.length > 0) {
            contents.push({ role: 'user', parts: userMessageParts });
        }
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
                systemInstruction,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error(`Error generating text with ${modelName}:`, error);
        throw new Error("Failed to get response from AI");
    }
}

export async function analyzeImage(prompt: string, images: { imageBase64: string; mimeType: string }[]): Promise<string> {
    try {
        const imageParts = images.map(({ imageBase64, mimeType }) => ({
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        }));

        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, textPart] },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze image");
    }
}

export async function generateSpeech(text: string, voiceName: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("Failed to generate speech");
    }
}

export async function generateImages(prompt: string, aspectRatio: string, numberOfImages: number): Promise<string[]> {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
              numberOfImages,
              outputMimeType: 'image/png',
              aspectRatio,
            },
        });

        const images = response.generatedImages.map(img => img.image.imageBytes);
        if (!images || images.length === 0 || images.some(img => !img)) {
            throw new Error("No image data received from API.");
        }
        return images;
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image");
    }
}

export async function editImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    try {
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType,
            },
        };
        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        
        throw new Error("No edited image data received from API.");

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image");
    }
}