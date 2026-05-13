import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";

const apiKey = "";
const ai = new GoogleGenAI({ apiKey });

export async function analyzeDailyLog(content: string, tasks: string[]) {
  if (!apiKey) {
    logger.error("Chave Gemini client-side não configurada.");
    return null;
  }

  const prompt = `Você é um assistente de engenharia civil especializado em diários de obra.
Analise o seguinte relato do diário de obra e identifique o progresso dos serviços listados.

Relato: "${content}"

Serviços em andamento:
${tasks.join("\n")}

Retorne um JSON com a seguinte estrutura:
{
  "tasks_progress": [
    {
      "description": "Nome exato do serviço",
      "progress_increment": 0,
      "notes": "breve observação sobre o que foi feito"
    }
  ],
  "general_summary": "resumo geral do dia"
}

Importante: Apenas retorne o JSON, sem explicações extras.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const jsonStr = text.replace(/```json\n?|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    logger.error("Erro na análise da IA:", error);
    return null;
  }
}
