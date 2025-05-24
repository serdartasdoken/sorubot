
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Difficulty, Question, GeminiQuestionFormat } from '../types';
import { GEMINI_TEXT_MODEL } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set.");
  // In a real app, you might want to throw an error or handle this more gracefully
  // For this exercise, we'll proceed, but API calls will fail.
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "AIzaSyAXg4w2tJKOspxywj1ce6layCHagQsWk4s" }); // Fallback for type safety, real key needed at runtime

export const generateQuestionsFromText = async (
  text: string,
  difficulty: Difficulty,
  numQuestions: number
): Promise<Question[]> => {
  if (!API_KEY) throw new Error("Gemini API Anahtarı ayarlanmamış.");

  let difficultyInstruction = "";
  switch (difficulty) {
    case Difficulty.Easy:
      difficultyInstruction = "Sorular metinde açıkça belirtilen bilgileri doğrudan hatırlamaya yönelik olmalı VEYA metindeki temel kavramları/bilgileri benzer yeni durumlara basitçe uygulamayı gerektirmelidir.";
      break;
    case Difficulty.Medium:
      difficultyInstruction = "Sorular, metindeki bilgileri birleştirmeyi, yorumlamayı, basit çıkarımlar yapmayı gerektirmeli VEYA metindeki prensip ve yöntemleri farklı senaryolara uyarlamayı ve uygulamayı test etmelidir.";
      break;
    case Difficulty.Hard:
      difficultyInstruction = "Sorular analiz, sentez, değerlendirme veya karmaşık çıkarımlar yapmayı gerektirmeli VEYA metindeki soyut bilgileri ve ilkeleri kullanarak yeni problemler çözmeyi, özgün durumları değerlendirmeyi veya sonuçlar çıkarmayı içermelidir. Bu tür uygulama soruları, bilginin derinlemesine anlaşıldığını ve transfer edilebildiğini göstermelidir. Çeldiriciler konuya yakın ve makul olmalıdır.";
      break;
  }

  const prompt = `
    Sağlanan metne dayanarak ${numQuestions} adet ${difficulty} zorluk seviyesinde çoktan seçmeli soru oluşturun.
    Her sorunun 5 seçeneği olmalı ve yalnızca bir doğru cevabı bulunmalıdır.
    Sorular tamamen sağlanan metinle ilgili olmalıdır. Sorular hem metindeki bilgiyi ölçmeli hem de bu bilgilerin farklı durumlara uygulanabilmesini (uygulama soruları) sorgulamalıdır.
    ${difficultyInstruction}
    Çıktıyı aşağıdaki formatta bir JSON dizisi olarak verin:
    [
      {
        "question": "Soru metni?",
        "options": ["Seçenek A", "Seçenek B", "Seçenek C", "Seçenek D", "Seçenek E"],
        "correctAnswerIndex": 0
      }
    ]

    Metin:
    """
    ${text.substring(0, 100000)} 
    """
  `; // Limiting text length to avoid exceeding token limits. Max 128k tokens per request typically, text is primary content.

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt, // Simplified: pass prompt string directly
      config: {
        // responseMimeType: "application/json", // Kept removed as per previous state if it caused proxy issues
        temperature: 0.6, 
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData: GeminiQuestionFormat[] = JSON.parse(jsonStr);

    if (!Array.isArray(parsedData) || parsedData.some(q => !q.question || !q.options || q.options.length !== 5 || typeof q.correctAnswerIndex !== 'number' || q.correctAnswerIndex < 0 || q.correctAnswerIndex >= 5 )) {
        throw new Error("Yapay zekadan gelen yanıt beklenen formatta değil. Sorular 5 seçenekli olmalı ve doğru cevap indeksi geçerli bir aralıkta olmalıdır.");
    }

    return parsedData.map((q, index) => ({
      id: `q-${Date.now()}-${index}`,
      questionText: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
    }));

  } catch (error) {
    console.error("Error generating questions:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      throw new Error("API kullanım limiti aşıldı. Lütfen daha sonra tekrar deneyin.");
    }
     if (errorMessage.includes("API key not valid")) {
      throw new Error("Geçersiz Gemini API Anahtarı. Lütfen yapılandırmanızı kontrol edin.");
    }
    // Include the original error message for better debugging from proxy or API
    throw new Error(`Soru üretilirken bir hata oluştu: ${errorMessage}`);
  }
};

export const getExplanationForQuestion = async (
  question: Question,
  documentText: string
): Promise<string> => {
  if (!API_KEY) throw new Error("Gemini API Anahtarı ayarlanmamış.");

  const prompt = `
    Aşağıdaki sorunun doğru cevabının neden "${question.options[question.correctAnswerIndex]}" olduğunu açıkla.
    Açıklamanı SADECE sağlanan belge metnine dayandır.
    Mümkünse, cevabı destekleyen metindeki belirli bölümlere atıfta bulun.
    Açık ve anlaşılır ol.

    Soru: "${question.questionText}"
    Seçenekler:
    ${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')}
    Doğru Cevap: "${question.options[question.correctAnswerIndex]}"

    İlgili Belge Metni (kısaltılmış olabilir):
    """
    ${documentText.substring(0, 100000)}
    """
  `; // Limiting text length

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt, // Simplified: pass prompt string directly
      config: {
        temperature: 0.3,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error getting explanation:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
     if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      throw new Error("API kullanım limiti aşıldı. Lütfen daha sonra tekrar deneyin.");
    }
    if (errorMessage.includes("API key not valid")) {
      throw new Error("Geçersiz Gemini API Anahtarı. Lütfen yapılandırmanızı kontrol edin.");
    }
    throw new Error(`Açıklama alınırken bir hata oluştu: ${errorMessage}`);
  }
};
