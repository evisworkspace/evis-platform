import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeDailyLog(content: string, tasks: string[]) {
  const prompt = `
    Você é um assistente de engenharia civil especializado em diários de obra.
    Analise o seguinte relato do diário de obra e identifique o progresso dos serviços listados.
    
    Relato: "${content}"
    
    Serviços em andamento:
    ${tasks.join("\n")}
    
    Retorne um JSON com a seguinte estrutura:
    {
      "tasks_progress": [
        {
          "description": "Nome exato do serviço",
          "progress_increment": número de 0 a 100 representando o quanto avançou hoje,
          "notes": "breve observação sobre o que foi feito"
        }
      ],
      "general_summary": "resumo geral do dia"
    }
    
    Importante: Apenas retorne o JSON, sem explicações extras.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const text = response.text || "";
    // Clean potential markdown code blocks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Erro na análise da IA:", error);
    return null;
  }
}
