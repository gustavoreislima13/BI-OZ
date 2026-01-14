import React, { useState } from 'react';
import { Sale } from '../types';
import { generateBusinessInsights } from '../services/gemini';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAnalystProps {
  sales: Sale[];
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ sales }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (sales.length === 0) {
      setAnalysis("Não há dados de vendas suficientes para gerar uma análise.");
      return;
    }
    setLoading(true);
    const result = await generateBusinessInsights(sales);
    setAnalysis(result);
    setLoading(false);
  };

  if (!process.env.API_KEY) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-800 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
        <div>
           <h3 className="font-bold mb-1">IA Indisponível</h3>
           <p className="text-sm">A chave de API do Google Gemini não foi detectada. Por favor, adicione sua <code>API_KEY</code> nas variáveis de ambiente para usar a IA Analista.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#D31145] to-[#003057] rounded-xl shadow-lg p-8 text-white animate-fade-in relative overflow-hidden">
      {/* Abstract Background Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">IA Analista Comercial</h2>
              <p className="text-white/80 text-sm">Insights estratégicos gerados pelo Gemini</p>
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analisando dados...' : 'Gerar Relatório'}
          </button>
        </div>

        {analysis ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-white leading-relaxed prose prose-invert max-w-none">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
            <p className="text-white/80">Clique em "Gerar Relatório" para que a IA analise seus dados de vendas e forneça recomendações.</p>
          </div>
        )}
      </div>
    </div>
  );
};