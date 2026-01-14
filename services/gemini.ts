import { GoogleGenAI } from "@google/genai";
import { Sale } from '../types';

const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.API_KEY) {
      // @ts-ignore
      return import.meta.env.API_KEY;
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}

  return '';
};

export const generateBusinessInsights = async (sales: Sale[]): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return "Erro: Chave de API (API_KEY) não configurada no ambiente.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare data summary for the AI
    const salesSummary = JSON.stringify(sales.map(s => ({
      consultor: s.consultantName,
      tipo: s.type,
      valor: s.value,
      status: s.status,
      data: s.date
    })));

    const prompt = `
      Atue como um Gerente Comercial Sênior de uma administradora de consórcios.
      Analise os seguintes dados de vendas (em formato JSON) e forneça um relatório estratégico em Markdown.
      
      Dados de Vendas:
      ${salesSummary}

      O relatório deve conter:
      1. **Resumo Executivo**: Visão geral rápida da performance.
      2. **Análise por Produto**: Qual tipo de consórcio está vendendo mais e qual está parado.
      3. **Performance da Equipe**: Destaque quem está indo bem e quem precisa de apoio.
      4. **Recomendação Estratégica**: 3 ações práticas para aumentar as vendas no próximo mês.

      Seja direto, profissional e use formatação (negrito, listas) para facilitar a leitura.
      Escreva em Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao comunicar com a Inteligência Artificial. Verifique sua conexão ou chave de API.";
  }
};