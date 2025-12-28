
import React from 'react';
import { BodyPartBurn } from '../types';

interface BodyMapProps {
  burns: BodyPartBurn[];
  onUpdate: (partName: string, percentage: number) => void;
}

const BodyMap: React.FC<BodyMapProps> = ({ burns, onUpdate }) => {
  const regions = [
    { id: 'head', name: '頭頸部', pct: 9, d: "M50,5 Q55,5 58,10 Q60,15 60,20 Q60,25 55,30 Q50,32 45,30 Q40,25 40,20 Q40,15 42,10 Q45,5 50,5", view: 'front' },
    { id: 'trunk_front', name: '前体幹', pct: 18, d: "M35,35 L65,35 L70,70 L30,70 Z", view: 'front' },
    { id: 'arm_l', name: '左上肢', pct: 9, d: "M28,35 L33,35 L38,65 L33,68 Z", view: 'front' },
    { id: 'arm_r', name: '右上肢', pct: 9, d: "M72,35 L67,35 L62,65 L67,68 Z", view: 'front' },
    { id: 'leg_l', name: '左下肢', pct: 18, d: "M32,72 L48,72 L45,120 L35,120 Z", view: 'front' },
    { id: 'leg_r', name: '右下肢', pct: 18, d: "M68,72 L52,72 L55,120 L65,120 Z", view: 'front' },
    { id: 'genitals', name: '会陰部', pct: 1, d: "M45,70 L55,70 L52,78 L48,78 Z", view: 'front' },
    { id: 'head_back', name: '頭頸部', pct: 9, d: "M150,5 Q155,5 158,10 Q160,15 160,20 Q160,25 155,30 Q150,32 145,30 Q140,25 140,20 Q140,15 142,10 Q145,5 150,5", view: 'back' },
    { id: 'trunk_back', name: '後体幹', pct: 18, d: "M135,35 L165,35 L170,70 L130,70 Z", view: 'back' },
  ];

  const handleClick = (name: string, maxPct: number) => {
    const current = burns.find(b => b.partName === name)?.percentage || 0;
    const next = current === 0 ? maxPct : 0;
    onUpdate(name, next);
  };

  const getColorClass = (name: string) => {
    const current = burns.find(b => b.partName === name)?.percentage || 0;
    return current > 0 ? "fill-red-500 stroke-red-700" : "fill-slate-200 stroke-slate-300";
  };

  return (
    <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
      <div className="flex gap-4 sm:gap-8 justify-center w-full py-2">
        <div className="text-center">
          <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest">Front</p>
          <svg viewBox="0 0 100 130" className="w-28 h-36 sm:w-40 sm:h-52 drop-shadow-sm">
            {regions.filter(r => r.view === 'front').map(r => (
              <path
                key={r.id}
                d={r.d}
                className={`cursor-pointer transition-all duration-200 hover:opacity-80 ${getColorClass(r.name)}`}
                onClick={() => handleClick(r.name, r.pct)}
              />
            ))}
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest">Back</p>
          <svg viewBox="100 0 100 130" className="w-28 h-36 sm:w-40 sm:h-52 drop-shadow-sm">
            {regions.filter(r => r.view === 'back' || r.id === 'trunk_back').map(r => (
              <path
                key={r.id}
                d={r.d}
                className={`cursor-pointer transition-all duration-200 hover:opacity-80 ${getColorClass(r.name)}`}
                onClick={() => handleClick(r.name, r.pct)}
              />
            ))}
          </svg>
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-500 mt-4 bg-white px-3 py-1 rounded-full border border-slate-100 text-center">部位をタップして面積を自動入力</p>
    </div>
  );
};

export default BodyMap;
