import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const {
    prompt = "",
    promptMode = "create",
    imageBase64,
    seed,
  } = req.body || {};

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let systemContext = "";
    if (promptMode === "morph") {
      systemContext = `
        CONTEXT: You are re-assembling an existing pile of lego-like voxels.
        TRY TO USE EXISTING COLORS when appropriate.
      `;
    } else {
      systemContext = `
        CONTEXT: You are creating a brand new voxel art scene from scratch.
        Use a range of colors and aim for organic shapes.
      `;
    }

    const promptText = `
      ${systemContext}
      Task: Generate a 3D voxel art model of: "${prompt || "what is in the image"}".
      Strict Rules:
      1. Use approximately 150 to 600 voxels.
      2. The model must be centered at x=0, z=0.
      3. The bottom of the model must be at y=0 or slightly higher.
      4. Ensure the structure is physically plausible (connected).
      5. Coordinates should be integers.
      Return ONLY a JSON array of objects.`;

    const contents: any[] = [{ text: promptText }];
    if (imageBase64) {
      const base64Data = imageBase64.split(",")[1];
      const mimeType = imageBase64.split(";")[0].split(":")[1];
      contents.unshift({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents,
      config: {
        responseMimeType: "application/json",
        ...(seed !== undefined && { seed }),
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.INTEGER },
              y: { type: Type.INTEGER },
              z: { type: Type.INTEGER },
              color: { type: Type.STRING },
            },
            required: ["x", "y", "z", "color"],
          },
        },
      },
    });

    if (response.text) {
      // Forward the parsed JSON back to the client
      try {
        const parsed = JSON.parse(response.text);
        res.status(200).json({ data: parsed });
      } catch (err) {
        res
          .status(500)
          .json({
            error: "Failed to parse model response",
            raw: response.text,
          });
      }
    } else {
      res.status(500).json({ error: "No response from model" });
    }
  } catch (err: any) {
    console.error("GenAI error", err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
