
import React, { useState, useMemo, useEffect } from 'react';
import { BurnDepth, PatientData, BurnAssessmentResult, BodyPartBurn } from './types';
import { BODY_PARTS_NINES_ADULT, calculateParkland, SEVERITY_LEVELS } from './constants';
import { getBurnAdvisorResponse } from './services/geminiService';
import BodyMap from './components/BodyMap';
import { 
  Activity, Calculator, Stethoscope, MessageSquare, AlertTriangle, 
  User, Info, Zap, Copy, Check, RotateCcw, ClipboardList, Key, ShieldAlert
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calc' | 'ai' | 'info'>('calc');
  const [patient, setPatient] = useState<PatientData>({
    age: 45,
    weight: 70,
    sex: 'male',
    burns: [],
    inhalationInjury: false,
    comorbidities: '',
  });
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkKey();
    resetBurns();
  }, []);

  const resetBurns = () => {
    const initialBurns: BodyPartBurn[] = BODY_PARTS_NINES_ADULT.map(part => ({
      partName: part.name,
      percentage: 0,
      depth: BurnDepth.IIa
    }));
    setPatient(prev => ({ ...prev, burns: initialBurns }));
    setAiAdvice(null);
  };

  const assessment = useMemo((): BurnAssessmentResult => {
    const totalTbsa = patient.burns.reduce((sum, b) => sum + b.percentage, 0);
    const iiiPct = patient.burns
      .filter(b => b.depth === BurnDepth.III)
      .reduce((sum, b) => sum + b.percentage, 0);
    const iiPct = patient.burns
      .filter(b => b.depth === BurnDepth.IIa || b.depth === BurnDepth.IIb)
      .reduce((sum, b) => sum + b.percentage, 0);
    
    const burnIndex = iiiPct + (iiPct * 0.5);
    const parkland = calculateParkland(patient.weight, totalTbsa);

    let severity: BurnAssessmentResult['severity'] = 'mild';
    if (burnIndex >= 15 || totalTbsa >= 30 || patient.inhalationInjury) severity = 'critical';
    else if (burnIndex >= 10 || totalTbsa >= 15) severity = 'severe';
    else if (totalTbsa >= 5) severity = 'moderate';

    return {
      totalTbsa,
      burnIndex,
      prognosticIndex: patient.age + totalTbsa,
      fluidResuscitation: parkland,
      severity,
      transferRecommended: severity === 'severe' || severity === 'critical' || patient.inhalationInjury
    };
  }, [patient]);

  const handleUpdateBurn = (index: number, key: keyof BodyPartBurn, value: any) => {
    const newBurns = [...patient.burns];
    newBurns[index] = { ...newBurns[index], [key]: value };
    setPatient(prev => ({ ...prev, burns: newBurns }));
  };

  const handleMapUpdate = (partName: string, percentage: number) => {
    const index = patient.burns.findIndex(b => b.partName === partName);
    if (index !== -1) {
      handleUpdateBurn(index, 'percentage', percentage);
    }
  };

  const generateAdvice = async () => {
    if (!hasApiKey && window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      return;
    }
    
    if (assessment.totalTbsa === 0) {
      alert("Body Mapをタップして熱傷部位を選択してください。");
      return;
    }

    setIsAiLoading(true);
    setActiveTab('ai');
    try {
      const advice = await getBurnAdvisorResponse(patient, assessment);
      setAiAdvice(advice);
    } catch (e) {
      setAiAdvice("## ⚠️ 解析エラー\n\nAPIキーを確認するか、時間をおいて再度お試しください。");
    } finally {
      setIsAiLoading(false);
    }
  };

  const copySummary = () => {
    const summary = `【熱傷評価】${patient.age}歳 ${patient.weight}kg ${patient.inhalationInjury ? '気道熱傷(+) ' : ''} TBSA:${assessment.totalTbsa}% BI:${assessment.burnIndex.toFixed(1)} 輸液:${assessment.fluidResuscitation.first24hTotal}ml`;
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Sidebar for Desktop */}
      <nav className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <Activity className="w-8 h-8 text-blue-600" />
          <span className="font-black text-xl text-slate-800 tracking-tight">BurnFlow<span className="text-blue-600">PRO</span></span>
        </div>
        <div className="space-y-2">
          <button onClick={() => setActiveTab('calc')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'calc' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Calculator className="w-5 h-5" />評価・計算
          </button>
          <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <MessageSquare className="w-5 h-5" />AI分析
          </button>
          <button onClick={() => setActiveTab('info')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Info className="w-5 h-5" />リファレンス
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 max-w-4xl mx-auto w-full custom-scroll">
        {activeTab === 'calc' && (
          <div className="space-y-6">
            <header className="flex justify-between items-center px-1">
              <h1 className="text-xl font-black text-slate-800">熱傷初期評価</h1>
              <button onClick={resetBurns} className="p-2 text-slate-400 active:text-red-500 transition-colors">
                <RotateCcw className="w-5 h-5" />
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Body Map Section */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                <BodyMap burns={patient.burns} onUpdate={handleMapUpdate} />
              </div>

              {/* Patient Data & Fluid Section */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">年齢 (Age)</label>
                      <input type="number" value={patient.age} onChange={e => setPatient({...patient, age: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 p-3 rounded-2xl font-black text-lg text-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">体重 (kg)</label>
                      <input type="number" value={patient.weight} onChange={e => setPatient({...patient, weight: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 p-3 rounded-2xl font-black text-lg text-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <button onClick={() => setPatient({...patient, inhalationInjury: !patient.inhalationInjury})} className={`w-full mt-4 p-4 rounded-2xl font-bold flex justify-between items-center transition-all ${patient.inhalationInjury ? 'bg-red-50 text-red-700 border-2 border-red-500' : 'bg-slate-50 text-slate-400 border-2 border-transparent'}`}>
                    <span>気道熱傷の疑い</span>
                    <AlertTriangle className={`w-5 h-5 ${patient.inhalationInjury ? 'text-red-500' : 'opacity-20'}`} />
                  </button>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group">
                  <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Parkland 輸液目標</p>
                  <div className="text-4xl font-black tracking-tighter">
                    {(assessment.fluidResuscitation.first24hTotal / 1000).toFixed(1)}
                    <span className="text-base font-bold opacity-40 ml-2">L / 24h</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <div className="text-[9px] text-white/40 font-bold uppercase">Initial 8h</div>
                      <div className="text-xl font-black text-blue-400">{(assessment.fluidResuscitation.first8h / 1000).toFixed(1)}L</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/40 font-bold uppercase">Next 16h</div>
                      <div className="text-xl font-black text-blue-400">{(assessment.fluidResuscitation.next16h / 1000).toFixed(1)}L</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Severity Card */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className={`p-3 text-center text-xs font-black uppercase tracking-widest ${SEVERITY_LEVELS[assessment.severity].color}`}>
                  重症度: {SEVERITY_LEVELS[assessment.severity].label}
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase">Total TBSA</div>
                    <div className="text-2xl font-black text-slate-800">{assessment.totalTbsa}<span className="text-xs ml-0.5">%</span></div>
                  </div>
                  <div className="p-4 text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase">Burn Index</div>
                    <div className="text-2xl font-black text-slate-800">{assessment.burnIndex.toFixed(1)}</div>
                  </div>
                </div>
                {assessment.transferRecommended && (
                  <div className="p-3 bg-red-600 text-white text-[11px] font-bold text-center animate-pulse">
                    🚨 専門熱傷センターへの転送を検討してください
                  </div>
                )}
            </div>

            {/* Call to Action */}
            <button 
              onClick={generateAdvice} 
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Stethoscope className="w-6 h-6" /> AI 臨床解析を開始
            </button>
            
            {/* Detailed Table (Optional/Scrollable) */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">深達度別の面積設定</h3>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scroll">
                {patient.burns.map((burn, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                    <span className="text-sm font-bold text-slate-700">{burn.partName}</span>
                    <div className="flex gap-2">
                      <select 
                        value={burn.depth} 
                        onChange={e => handleUpdateBurn(idx, 'depth', e.target.value as BurnDepth)}
                        className="text-xs font-bold bg-slate-50 p-2 rounded-lg outline-none border-none text-slate-600"
                      >
                        {Object.values(BurnDepth).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input 
                        type="number" 
                        value={burn.percentage} 
                        onChange={e => handleUpdateBurn(idx, 'percentage', parseInt(e.target.value) || 0)}
                        className="w-16 bg-blue-50 text-blue-600 font-black p-2 rounded-lg text-center text-sm outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <header className="flex justify-between items-center px-1">
              <h1 className="text-xl font-black text-slate-800">AIアドバイザー</h1>
              {aiAdvice && (
                <button onClick={copySummary} className={`p-2 transition-colors ${isCopied ? 'text-green-500' : 'text-blue-600'}`}>
                  {isCopied ? <Check /> : <Copy />}
                </button>
              )}
            </header>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[50vh]">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600" />
                  <p className="font-black text-slate-400 text-sm animate-pulse">症例データを分析中...</p>
                </div>
              ) : aiAdvice ? (
                <div className="prose prose-slate max-w-none whitespace-pre-wrap">{aiAdvice}</div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
                  <p className="font-bold text-sm">解析結果がここに表示されます</p>
                  <button onClick={generateAdvice} className="mt-6 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-sm active:bg-blue-100 transition-colors">
                    分析を開始する
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-6">
            <h1 className="text-xl font-black text-slate-800">臨床リファレンス</h1>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <h3 className="font-black text-blue-600 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Parkland 法 (初期輸液)
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl font-black text-center text-slate-700 mb-4">
                  4ml × 体重(kg) × %TBSA
                </div>
                <div className="space-y-3 text-sm text-slate-500 font-medium">
                  <p>• 最初の8時間で半量、続く16時間で残りの半量を投与します。</p>
                  <p>• 2度熱傷以上が対象となります。</p>
                  <p>• 目標尿量: 成人 0.5〜1.0 ml/kg/hr を維持するよう調整。</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <h3 className="font-black text-red-600 mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" /> 三次救急転送の目安
                </h3>
                <ul className="space-y-3 text-sm text-slate-500 font-medium list-disc pl-4">
                  <li>2度熱傷 > 20% (小児・高齢者は > 10%)</li>
                  <li>3度熱傷 > 5%</li>
                  <li>特殊部位（顔面、手足、会陰部、主要関節）</li>
                  <li>気道熱傷、電撃傷、化学熱傷の合併</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-slate-100 rounded-2xl text-[10px] text-slate-400 font-bold text-center leading-relaxed">
              本アプリは医師の判断を支援するためのツールであり、最終的な治療方針は必ず担当医が決定してください。
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation (Visible on Small Screens) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around items-center p-3 md:hidden z-50 safe-pb shadow-2xl">
        <button onClick={() => setActiveTab('calc')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'calc' ? 'text-blue-600 scale-105' : 'text-slate-300'}`}>
          <Calculator className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">評価</span>
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'ai' ? 'text-blue-600 scale-105' : 'text-slate-300'}`}>
          <MessageSquare className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">AI分析</span>
        </button>
        <button onClick={() => setActiveTab('info')} className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'info' ? 'text-blue-600 scale-105' : 'text-slate-300'}`}>
          <Info className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">情報</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
