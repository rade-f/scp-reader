import axios from "axios";
import { CONFIG } from "./config";

export class GeminiTranslator {
    private static API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    public static async translateHtml(htmlSnippet: string): Promise<string> {
        if (!CONFIG.GEMINI_API_KEY) {
            console.warn("[Translator] No GEMINI_API_KEY provided, skipping translation.");
            return htmlSnippet;
        }

        const prompt = `You are a professional translator for the SCP Foundation Chinese Branch.
Translate the following English SCP document HTML content into Simplified Chinese (zh-CN).
CRITICAL RULES:
1. Preserve ALL HTML tags, attributes, class names, styles, and nested hierarchy EXACTLY as they are. DO NOT strip or rename classes.
2. Only translate human-readable textual content into Chinese.
3. Keep standard SCP terminology:
   - 'Item #:' -> '项目编号：'
   - 'Object Class:' -> '项目等级：'
   - 'Special Containment Procedures:' -> '特殊收容措施：'
   - 'Description:' -> '描述：'
   - 'Addendum' -> '附录'
   - 'Document' -> '文档'
   - 'Safe' -> 'Safe', 'Euclid' -> 'Euclid', 'Keter' -> 'Keter', 'Thaumiel' -> 'Thaumiel', 'Apollyon' -> 'Apollyon'
   - 'Site-XX' -> 'Site-XX'
   - 'Area-XX' -> 'Area-XX'
   - 'Level X' -> 'Level X'
4. Return ONLY the translated HTML content without markdown backticks (e.g. no \`\`\`html) or explanatory commentary.

HTML to translate:
${htmlSnippet}`;

        try {
            console.log(`[Translator] Calling Gemini API (${CONFIG.GEMINI_MODEL}) for translation...`);
            const resp = await axios.post(
                this.API_URL,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2
                    }
                },
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 45000
                }
            );

            if (resp.status === 200 && resp.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                let translated = resp.data.candidates[0].content.parts[0].text.trim();
                // Strip backticks if model accidentally wrapped output in markdown
                if (translated.startsWith("```html")) {
                    translated = translated.replace(/^```html\s*/i, "").replace(/\s*```$/, "");
                } else if (translated.startsWith("```")) {
                    translated = translated.replace(/^```\s*/, "").replace(/\s*```$/, "");
                }
                console.log("[Translator] Gemini translation completed successfully.");
                return translated;
            } else {
                console.warn("[Translator] Gemini unexpected response structure:", resp.data);
                return htmlSnippet;
            }
        } catch (err: any) {
            console.error("[Translator] Gemini translation error:", err.message);
            // Return original snippet as fallback so reader won't break
            return htmlSnippet;
        }
    }
}
