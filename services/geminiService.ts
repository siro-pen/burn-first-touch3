import { GoogleGenAI } from "@google/genai";
import { PatientData, BurnAssessmentResult } from "../types";

export const getBurnAdvisorResponse = async (
  patientData: PatientData,
  assessment: BurnAssessmentResult
) => {
  // Always create a new instance to use the most up-to-date API key
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    あなたは熱傷専門医（形成外科専門医）として、救急外来での初期対応にあたる医師へ、専門的な臨床コンサルテーション回答を行ってください。
    
    【患者プレゼンテーション】
    - 年齢: ${patientData.age}歳, 性別: ${patientData.sex === 'male' ? '男性' : '女性'}, 体重: ${patientData.weight}kg
    - 熱傷指標: Total TBSA ${assessment.totalTbsa}%, Burn Index ${assessment.burnIndex.toFixed(1)}
    - 気道熱傷の疑い: ${patientData.inhalationInjury ? '強く疑われる' : '現時点では否定的'}
    - 判定重症度: ${assessment.severity}
    
    【コンサルテーション依頼内容】
    以下の形成外科的視点を含めた具体的な初期治療戦略を、Markdown形式で出力してください。
    
    1. **輸液管理**: Parkland法 (${assessment.fluidResuscitation.first24hTotal}ml) の妥当性と、尿量管理の目標。
    2. **呼吸管理**: 気道熱傷が疑われる場合の挿管タイミングと、気管支鏡検査の重要性について。
    3. **外科的介入**: 
       - 減張切開（Escharotomy）を検討すべき具体的な部位（体幹、四肢末梢）の指摘。
       - 早期切除植皮の適応。
    4. **創傷管理**: 深達度（SDB, DDB, DB）に応じた、最新ドレッシング材や外用薬（シルアダジン、アズノール等）の使い分け。
    5. **転送判断**: 専門熱傷センターへの転送の緊急性。
    
    専門的かつ、救急の現場で読みやすい簡潔で具体的な指示を心がけてください。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { 
          thinkingBudget: 32768 
        }
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
        throw new Error("API_KEY_ERROR");
    }
    throw error;
  }
};