
export const BODY_PARTS_NINES_ADULT = [
  { id: 'head', name: '頭頸部', pct: 9 },
  { id: 'trunk_front', name: '前体幹', pct: 18 },
  { id: 'trunk_back', name: '後体幹', pct: 18 },
  { id: 'arm_l', name: '左上肢', pct: 9 },
  { id: 'arm_r', name: '右上肢', pct: 9 },
  { id: 'leg_l', name: '左下肢', pct: 18 },
  { id: 'leg_r', name: '右下肢', pct: 18 },
  { id: 'genitals', name: '会陰部', pct: 1 },
];

export const SEVERITY_LEVELS = {
  mild: { label: '軽症', color: 'bg-green-100 text-green-800 border-green-200' },
  moderate: { label: '中等症', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  severe: { label: '重症', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  critical: { label: '最重症', color: 'bg-red-100 text-red-800 border-red-200' },
};

export const calculateParkland = (weight: number, tbsa: number) => {
  const first24hTotal = 4 * weight * tbsa;
  return {
    first24hTotal,
    first8h: first24hTotal / 2,
    next16h: first24hTotal / 2,
  };
};
