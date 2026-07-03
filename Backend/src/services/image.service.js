import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function generateGrokImage(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the .env file.");
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    let base64Data = null;

    try {
      const response = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/png",
        },
      });

      const generatedImage = response.generatedImages?.[0];
      if (generatedImage && generatedImage.image && generatedImage.image.imageBytes) {
        base64Data = generatedImage.image.imageBytes;
      }
    } catch (apiError) {
      console.warn("⚠️ Gemini Image API failed or quota exceeded. Falling back to public image generator:", apiError.message);
    }

    // Ensure the output directory exists
    const dir = path.join(process.cwd(), "public/images");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generate unique filename
    const filename = `${crypto.randomBytes(16).toString("hex")}.png`;
    const filepath = path.join(dir, filename);

    if (base64Data) {
      // Save image to disk from Gemini
      fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));
    } else {
      // Fallback: Fetch a matching image from loremflickr.com with a multi-tier fallback to picsum.photos
      console.log(`🌐 Fetching fallback image for prompt: "${prompt}"...`);
      
      // Clean up prompt to extract meaningful keywords
      const cleanPrompt = prompt
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\b(generate|image|photo|picture|poster|of|a|an|the|draw|paint|show|me|us|want|please|create)\b/gi, "")
        .trim();
        
      const words = cleanPrompt.split(/\s+/).filter(w => w.length > 2);
      const keywords = words.length > 0 ? words.slice(0, 3).join(",") : "abstract";
      const randomBuster = crypto.randomBytes(4).toString("hex");
      const fallbackUrl = `https://loremflickr.com/800/600/${encodeURIComponent(keywords)}?random=${randomBuster}`;
      
      let res = null;
      let buffer = null;
      try {
        res = await fetch(fallbackUrl);
        if (res.ok) {
          buffer = await res.arrayBuffer();
        }
      } catch (err) {
        console.warn("⚠️ Fetching from LoremFlickr threw an error:", err.message);
      }

      // Check if loremflickr failed (either threw, returned non-ok status, redirected to defaultImage, or returned default file size 126099)
      if (!res || !res.ok || res.url.includes("defaultImage") || !buffer || buffer.byteLength === 126099) {
        console.log("⚠️ LoremFlickr failed, redirected, or returned default placeholder. Falling back to Picsum Photos...");
        const picsumUrl = `https://picsum.photos/800/600`;
        const picsumRes = await fetch(picsumUrl);
        if (!picsumRes.ok) {
          throw new Error(`Failed to fetch fallback image from Picsum: ${picsumRes.statusText}`);
        }
        res = picsumRes;
        buffer = await picsumRes.arrayBuffer();
      }

      fs.writeFileSync(filepath, Buffer.from(buffer));
    }

    // Return the URL to access the image statically
    return `http://localhost:3000/public/images/${filename}`;
  } catch (error) {
    throw new Error(`Gemini Image Generation failed: ${error.message}`);
  }
}
