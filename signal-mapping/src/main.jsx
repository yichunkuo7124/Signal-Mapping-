import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  Zap, 
  ChevronRight, 
  Activity,
  Layers,
  Settings2,
  CheckCircle2,
  RefreshCw,
  Quote,
  Copy,
  Send,
  ShieldCheck,
  ClipboardCheck,
  ChevronDown,
  Clock,
  Info,
  Orbit,
  ArrowDown,
  MoveRight,
  Focus,
  Target,
  Wind,
  Cpu,
  Waves,
  Unplug,
  MousePointer2,
  Sparkles,
  ChevronUp,
  BarChart3,
  AlertCircle,
  ArrowLeft,
  Users
} from 'lucide-react';

/**
 * [ 設計規範 Design Tokens ]
 * 背景: #FDFBF7 (奶油色)
 * 文字: #2D2926 (深炭色)
 * 邊框: #E9E4DB (淺米色)
 * 輔助: #8B8378 (灰褐色)
 * 強調: #FFBF00 (琥珀色 - 僅用於主標定)
 */

// --- [ Signal Mapping™ v1: 核心計算邏輯 ] ---
const SIGNAL_DEFS = {
  HF: { 
    name: "節奏重排強度", 
    tag: "節奏重排", 
    meaning: "任務路徑被重排頻率",
    orgMeaning: "組織內部執行路徑缺乏慣性，資源配置處於高頻調整狀態。"
  },
  ED: { 
    name: "事件牽引比例", 
    tag: "事件牽引", 
    meaning: "管理活動被突發事件牽引程度",
    orgMeaning: "組織運作重心傾向於反應式處理，策略性推進節奏易被外部脈衝侵蝕。"
  },
  PC: { 
    name: "決策集中度", 
    tag: "決策集中", 
    meaning: "決策權力集中於單點程度",
    orgMeaning: "關鍵推動力高度依賴少數決策節點，系統內部的引力收斂壓力巨大。"
  },
  LA: { 
    name: "隱性摩擦堆積", 
    tag: "隱性摩擦", 
    meaning: "結構未吸收張力而由人補位",
    orgMeaning: "制度支撐力不足，系統運作高度仰賴個人彈性補位以維持表面流暢。"
  }
};

const CLUSTER_MAP = {
  HF: [0, 1, 2],    
  ED: [3, 4, 5],    
  PC: [6, 7, 8],    
  LA: [9, 10, 11]   
};

// --- [ 題庫：高階共識營場景映照版 ] ---
const QUESTIONS = [
  { text: "回想最近一段時間，當你設定一個重要議題的推進路徑，最像哪種畫面？", opt: ["路徑清楚，照設計往前走", "中途會插入議題，但主軸仍能守住", "推進路徑常在進行中被改寫", "推進方向常被迫重定義（先讓事情動起來，再補齊脈絡）"] }, 
  { text: "當你投入處理關鍵工作時，最貼近哪個場景？", opt: ["能完成一段完整閉環再切換", "需要穿插處理，但能回到原本脈絡", "常在不同任務間來回跳接，靠短記憶續航", "很難形成專注段，像在追著變動跑"] }, 
  { text: "同一週內，優先順序的變化更像哪種情境？", opt: ["優先序清晰，少量校正即可", "有幾次調整，但仍看得出主線", "優先序多次重排，常需要重新說明原因", "優先序像被不斷刷新，決策成本很高"] },
  { text: "最近你的一天通常是由什麼啟動？", opt: ["依既定策略/規劃推進", "依任務排程逐項完成", "依他人需求與回饋穿插啟動", "依突發狀況與現場事件接續啟動"] }, 
  { text: "當系統出現例外或異常，你通常處在：", opt: ["後方觀測，等資訊匯整再決定介入點", "依流程啟動處置，讓制度先運作", "主動介入調整，讓現場先回穩", "直接接管主導，快速定調處理方式"] }, 
  { text: "最近你的時間切片更像：", opt: ["大段時間用於推進核心事項", "推進與回應交錯，但仍能安排節點", "回應需求佔據主要時段，推進被切碎", "幾乎在即時處理中前進，難以安排長段推進"] }, 
  { text: "當多方意見分歧、需要收斂時，你更像：", opt: ["提供觀點，讓團隊自行收斂", "協助整合，推動形成可接受版本", "進行取捨，指出取捨依據", "直接裁決，承擔最後定調責任"] }, 
  { text: "在重要議題上，最後定調通常落在：", opt: ["團隊共識自然形成", "由協調者彙整後確認", "需要你來收斂並決定方向", "需要你拍板，否則難以前進"] }, 
  { text: "當資源不足或優先序衝突，你通常會：", opt: ["按既有規則與既定目標推進", "協調交換與調整配置，讓大家可接受", "重新排序，明確調整先後", "重新定義標準/目標，改變遊戲規則"] }, 
  { text: "跨部門合作時，對齊成本更像哪種畫面？", opt: ["語言一致，很快對齊", "有落差，但一次對齊後能繼續走", "需要反覆校準，常在細節上磨", "對齊像長期工程，常靠默契與額外溝通成本維持"] }, 
  { text: "當事情能順利推進，背後更依賴：", opt: ["制度與流程自然吸收多數狀況", "分工清楚，各自把接口守好", "靠人際協調與臨場判斷打通卡點", "靠個人補位把缺口接住，系統才不中斷"] }, 
  { text: "當場域壓力上來，承載的落點更像：", opt: ["能被分散到角色與流程上", "有些集中，但仍透過協作攤開", "多半會先落到少數人身上再處理", "壓力長期集中在固定位置，需要一次性處理才能回穩"] }
];

// --- [ 訊號解讀文案庫 ] ---
const SIGNAL_NARRATIVE = {
  LA: {
    info: ["理解落差需要反覆校準", "制度支撐度不足", "部分運作依賴個人彈性補位"],
    symptoms: ["跨部門對齊常需依賴個人默契", "推進感多來自於「人」而非流程", "壓力傾向於在特定交點累積"],
    risks: ["關鍵人才隱性疲勞", "流程漏洞被補位掩蓋", "協作介面產生慢性黏滯"],
    explanation: "這代表系統中未被制度吸收的張力，正在透過個人補位維持運作。",
    reflection: "最近你最常補的「場域缺口」，實際源頭在哪裡？"
  },
  HF: {
    info: ["任務在推進過程中出現多次重排", "計畫穩定度受到影響", "執行路徑需持續修正"],
    symptoms: ["任務排序需隨時重新對齊", "專注工作的時段容易被刷新", "路徑常呈現動態修正狀態"],
    risks: ["管理焦點耗散", "團隊執行慣性難以養成", "長期計畫的可信度降低"],
    explanation: "這表示執行路徑需持續修正，原本的節奏容易被重新定義。",
    reflection: "哪些重排，其實可以透過結構優化減少？"
  },
  PC: {
    info: ["決策權限高度集中於單點", "多方立場拉扯感明顯", "資源排序需由你最終拍板"],
    symptoms: ["分歧最終需由特定位階定調", "協調過程常伴隨多方取捨", "定調的速度決定了場域動能"],
    risks: ["決策疲勞快速累積", "組織依賴單一決策源", "授權機制失效或中斷"],
    explanation: "這反映出系統中的引力失衡，關鍵推動力過度依賴少數決策節點。",
    reflection: "目前的裁決中，哪些是可以透過制度下放來減少的？"
  },
  ED: {
    info: ["管理活動由外部事件觸發", "即時回應時間佔比偏高", "缺乏長程策略性推進感"],
    symptoms: ["一天的啟動多源自突發需求", "計畫易被事件「插隊」處理", "回應型工作佔據多數時鐘時間"],
    risks: ["陷入反應式管理循環", "系統預見能力受損", "重要但不緊急的事項被長期忽略"],
    explanation: "這代表場域處於應激狀態，既有的計畫向量容易被瞬時脈衝取代。",
    reflection: "哪些突發事件，其實是原本流程不完善留下的漏洞？"
  }
};

const getCombinationEffect = (dom, sec) => {
  const pairs = {
    'LA_HF': "常見畫面是：短期重排先讓系統繼續走，但結構缺口需要另外處理。",
    'PC_ED': "常見畫面是：決策節點在救火中超載，使長期結構優化被迫延後。",
    'HF_LA': "常見畫面是：頻繁的重排加劇了理解落差，更仰賴個人彈性承載。",
    'ED_PC': "常見畫面是：反應式需求擠壓了決策空間，增加優先序裁決成本。"
  };
  return pairs[`${dom}_${sec}`] || "場域中多重力的交織，使運作需同時在執行穩定與結構補位間尋求平衡。";
};

// --- [ 核心計算邏輯實作 ] ---
const calculatePersonal = (answers) => {
  if (!answers || Object.keys(answers).length < 12) return null;
  const scores = { HF: 0, ED: 0, PC: 0, LA: 0 };
  Object.entries(CLUSTER_MAP).forEach(([sig, indices]) => {
    indices.forEach(idx => { scores[sig] += (answers[idx] || 0); });
  });
  const sorted = Object.entries(scores).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const priority = { PC: 4, ED: 3, HF: 2, LA: 1 };
    return priority[b[0]] - priority[a[0]];
  });
  return { dom: sorted[0][0], sec: sorted[1][0], allScores: scores };
};

const calculateOrgAggregate = (records) => {
  if (!records || records.length === 0) return null;
  const orgScores = { HF: 0, ED: 0, PC: 0, LA: 0 };
  records.forEach(r => {
    if (r.dom) orgScores[r.dom] += 2;
    if (r.sec) orgScores[r.sec] += 1;
  });
  const sorted = Object.entries(orgScores).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const priority = { PC: 4, ED: 3, HF: 2, LA: 1 };
    return priority[b[0]] - priority[a[0]];
  });
  return { dom: sorted[0][0], sec: sorted[1][0], allScores: orgScores };
};

// --- [ UI 組件 ] ---
const AvatarContainer = () => (
  <div className="relative">
    <div className="w-10 h-10 rounded-full border-2 border-[#E9E4DB] overflow-hidden bg-white shadow-sm">
      <div className="w-full h-full bg-[#FDFBF7] flex items-center justify-center text-[#2D2926]">
        <User size={20} />
      </div>
    </div>
  </div>
);

// --- [ 視圖：開始頁 ] ---
const StartView = ({ userData, setUserData, onStart }) => (
  <div className="max-w-xl mx-auto py-12 px-6 animate-in fade-in duration-700">
    <div className="text-center mb-12">
      <div className="w-20 h-20 bg-white border border-[#E9E4DB] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
        <Orbit className="text-[#2D2926]" size={36} />
      </div>
      <h1 className="text-5xl font-bold tracking-tighter text-[#2D2926] mb-6 leading-[0.9]">Signal Mapping™</h1>
      <p className="text-[#8B8378] text-lg font-medium italic">「看見場域訊號，找出主導壓力。」</p>
    </div>

    <div className="bg-white p-10 rounded-[2.5rem] border border-[#E9E4DB] shadow-sm space-y-8">
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold text-[#A8A297] uppercase tracking-widest mb-3">觀測者姓名 / 識別碼</label>
          <input 
            type="text" 
            className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E9E4DB] rounded-2xl focus:outline-none focus:border-[#2D2926] transition-all text-[#2D2926] font-medium"
            placeholder="請輸入姓名或代號"
            value={userData.name}
            onChange={(e) => setUserData({...userData, name: e.target.value})}
          />
        </div>
        <div className="relative">
          <label className="block text-[10px] font-bold text-[#A8A297] uppercase tracking-widest mb-3">探測主題模組</label>
          <select className="w-full px-6 py-4 bg-[#FDFBF7] border border-[#E9E4DB] rounded-2xl focus:outline-none focus:border-[#2D2926] appearance-none cursor-default text-[#2D2926] font-medium">
            <option>高階共識營｜Signal Mapping™ v1</option>
          </select>
          <div className="absolute right-5 bottom-4 pointer-events-none text-[#A8A297]"><ChevronDown size={18} /></div>
        </div>
      </div>

      <div className="space-y-6 text-xs text-[#8B8378] leading-relaxed border-y border-[#F5F2ED] py-6 px-2">
        <div className="space-y-2">
          <h4 className="font-bold text-[#2D2926] flex items-center gap-2 tracking-widest text-[10px] uppercase"><Clock size={12} /> 探測說明</h4>
          <p className="pl-6">本模組包含 12 題管理場景映照。請依據「目前真實體感」進行直覺選擇。</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-[#2D2926] flex items-center gap-2 tracking-widest text-[10px] uppercase"><ShieldCheck size={12} /> 資料匯流原則</h4>
          <p className="pl-6">個人報告僅供自我鏡像；送出後將採去識別化處理，僅匯入組織全景分析。</p>
        </div>
      </div>

      <div className="flex items-start gap-4 px-2">
        <input type="checkbox" className="mt-1.5 w-5 h-5 accent-[#2D2926] cursor-pointer" checked={userData.consent} onChange={(e) => setUserData({...userData, consent: e.target.checked})} />
        <span className="text-xs text-[#8B8378] leading-relaxed">我已閱讀並同意數據匿名聚合與隱私保護原則。</span>
      </div>

      <button disabled={!userData.name || !userData.consent} onClick={onStart} className="w-full bg-[#2D2926] text-[#FDFBF7] py-6 rounded-full font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-2xl">開始觀測 <ChevronRight size={24} /></button>
    </div>
  </div>
);

// --- [ 視圖：測驗頁 ] ---
const TestView = ({ currentQ, setCurrentQ, answers, setAnswers, onFinish }) => {
  const q = QUESTIONS[currentQ];
  const handleSelect = (idx) => {
    setAnswers({...answers, [currentQ]: idx});
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300);
    } else {
      setTimeout(() => onFinish(), 300);
    }
  };
  return (
    <div className="max-w-xl mx-auto py-16 px-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12">
        <div className="flex justify-between text-[10px] font-bold text-[#A8A297] uppercase tracking-widest mb-3">
          <button onClick={() => setCurrentQ(Math.max(0, currentQ-1))} className={`flex items-center gap-1 ${currentQ===0 ? 'opacity-0' : 'hover:text-[#2D2926] transition-colors'}`}><ArrowLeft size={12} /> 上一題</button>
          <span>探測中 {currentQ + 1} / 12</span>
          <span>{Math.round(((currentQ + 1) / 12) * 100)}%</span>
        </div>
        <div className="h-0.5 bg-[#E9E4DB] rounded-full overflow-hidden"><div className="h-full bg-[#2D2926] transition-all duration-500" style={{ width: `${((currentQ + 1) / 12) * 100}%` }} /></div>
      </div>
      <div className="space-y-12">
        <h2 className="text-3xl font-bold text-[#2D2926] leading-snug tracking-tight min-h-[6rem]">{q.text}</h2>
        <div className="grid grid-cols-1 gap-4">
          {q.opt.map((opt, i) => (
            <button key={i} onClick={() => handleSelect(i)} className={`w-full text-left px-8 py-6 rounded-3xl border transition-all flex items-center justify-between shadow-sm group ${answers[currentQ] === i ? 'border-[#2D2926] bg-[#FDFBF7]' : 'border-[#E9E4DB] bg-white hover:border-[#A8A297]'}`}>
              <span className={`font-medium text-lg ${answers[currentQ] === i ? 'text-[#2D2926]' : 'text-[#4A453E]'}`}>{opt}</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[currentQ] === i ? 'border-[#2D2926]' : 'border-[#E9E4DB] group-hover:border-[#A8A297]'}`}><div className={`w-2.5 h-2.5 rounded-full bg-[#2D2926] transition-transform ${answers[currentQ] === i ? 'scale-100' : 'scale-0'}`} /></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- [ 視圖：個人結果頁 ] ---
const ResultView = ({ userData, results, onSend }) => {
  if (!results) return null;
  const dom = SIGNAL_NARRATIVE[results.dom];
  const sec = SIGNAL_NARRATIVE[results.sec];
  const oneLineExplain = `${dom.explanation} 同時也顯示出「${SIGNAL_DEFS[results.sec].name}」的干擾背景。`;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-1000 space-y-10 pb-24 text-[#2D2926]">
      {/* ① 場域特徵標定 */}
      <section className="bg-[#2D2926] text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <Orbit className="absolute -top-10 -right-10 w-48 h-48 opacity-10 animate-pulse" />
        <div className="relative z-10 space-y-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] bg-white/10 px-4 py-1.5 rounded-full">場域特徵標定 Signal Position</span>
          <div className="space-y-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">目前你的工作場域以<br /><span className="text-amber-300 underline underline-offset-8 decoration-2 decoration-amber-300/30">「{SIGNAL_DEFS[results.dom].name}」</span>為主要特徵，<br />並伴隨一定程度的<span className="opacity-80">「{SIGNAL_DEFS[results.sec].name}」</span>。</h2>
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm"><p className="text-xl font-light leading-relaxed opacity-90 italic">{oneLineExplain}</p></div>
          </div>
        </div>
      </section>

      <div className="bg-white rounded-[3rem] border border-[#E9E4DB] shadow-sm overflow-hidden divide-y divide-[#F5F2ED]">
        {/* ② 主訊號解讀 */}
        <div className="p-12 space-y-12">
          <div className="flex items-center gap-3"><div className="w-1 h-6 bg-[#2D2926] rounded-full" /><h3 className="text-xl font-bold">主訊號解讀｜{SIGNAL_DEFS[results.dom].name}</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <section className="space-y-6"><h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">代表資訊</h4><ul className="space-y-5">{dom.info.map((line, i) => (<li key={i} className="flex gap-4 items-start text-lg font-medium leading-snug"><span className="text-[#A8A297] text-xs mt-1.5 opacity-50">/</span> {line}</li>))}</ul></section>
            <section className="space-y-6"><h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">潛在風險軌跡</h4><ul className="space-y-5">{dom.risks.map((line, i) => (<li key={i} className="flex gap-4 items-start text-lg font-medium text-[#8B8378]"><Activity size={16} className="mt-1.5 shrink-0 opacity-40" /> {line}</li>))}</ul></section>
          </div>
        </div>

        {/* ③ 次訊號補充 */}
        <div className="p-12 space-y-12">
          <div className="flex items-center gap-3"><div className="w-1 h-6 bg-[#8B8378] rounded-full" /><h3 className="text-xl font-bold">次訊號補充｜{SIGNAL_DEFS[results.sec].name}</h3></div>
          <section className="space-y-6">
            <h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">現象列點</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sec.symptoms.map((line, i) => (
                <div key={i} className="p-6 bg-[#FDFBF7] rounded-2xl border border-[#E9E4DB]/50 text-base font-bold text-[#4A453E] leading-relaxed shadow-sm hover:translate-y-[-2px] transition-transform">
                  {line}
                </div>
              ))}
            </div>
          </section>
          <section className="pt-8 border-t border-[#F5F2ED] space-y-4">
            <h4 className="text-[10px] font-bold text-[#2D2926] uppercase tracking-[0.3em]">當兩者同時存在時</h4>
            <div className="p-8 bg-[#2D2926] text-white rounded-[2.5rem]">
              <p className="text-xl font-light leading-relaxed">
                <span className="font-bold text-amber-300">{SIGNAL_DEFS[results.dom].tag}</span> + <span className="font-bold opacity-80">{SIGNAL_DEFS[results.sec].tag}</span>
                <br />
                <span className="mt-4 block opacity-90">{getCombinationEffect(results.dom, results.sec)}</span>
              </p>
            </div>
          </section>
        </div>

        {/* ④ 場域意識引導 */}
        <div className="p-12 bg-[#2D2926] text-white relative overflow-hidden">
          <Quote size={60} className="absolute -top-6 -right-6 opacity-5" />
          <div className="relative z-10 space-y-10">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">場域意識引導 / Gentle Guide</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4"><span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest font-mono">Question 01</span><p className="text-2xl font-light leading-snug">{dom.reflection}</p></div>
              <div className="space-y-4"><span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest font-mono">Question 02</span><p className="text-2xl font-light leading-snug">{sec.reflection}</p></div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-10 bg-[#FDFBF7] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <button 
                onClick={() => {
                    const text = `${userData.name},${SIGNAL_DEFS[results.dom].name},${SIGNAL_DEFS[results.sec].name}`;
                    navigator.clipboard.writeText(text);
                }}
                className="flex items-center gap-2 text-xs font-bold text-[#2D2926] bg-white border border-[#E9E4DB] px-6 py-4 rounded-full hover:bg-zinc-100 transition-all shadow-sm"
            >
                <Copy size={16} /> 複製分析訊號
            </button>
            <button onClick={onSend} className="flex items-center gap-2 text-xs font-bold bg-[#2D2926] text-white px-8 py-4 rounded-full hover:opacity-80 transition-all shadow-lg"><Send size={16} /> 送出（納入組織匿名聚合）</button>
          </div>
          <button onClick={() => window.location.reload()} className="text-[10px] font-bold text-[#A8A297] uppercase tracking-widest hover:text-[#2D2926] transition-all underline underline-offset-4">重新校準觀測</button>
        </div>
      </div>
    </div>
  );
};

// --- [ 視圖：組織聚合頁 ] ---
const OrgView = ({ aggregate }) => {
  if (!aggregate) return (
    <div className="max-w-xl mx-auto py-24 text-center space-y-8 animate-in fade-in duration-700">
      <BarChart3 className="mx-auto text-[#E9E4DB]" size={64} />
      <h2 className="text-3xl font-bold text-[#2D2926]">尚未匯入組織數據</h2>
      <p className="text-[#8B8378]">組織聚合頁僅在完成個人鏡像並由管理者操作揭露後顯示。</p>
    </div>
  );

  const dom = aggregate.dom;
  const sec = aggregate.sec;
  const domData = SIGNAL_NARRATIVE[dom];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-1000 space-y-12 pb-24 text-[#2D2926]">
      <section className="bg-[#2D2926] text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <Users className="absolute -top-10 -right-10 w-64 h-64 opacity-5" />
        <div className="relative z-10 space-y-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] bg-white/10 px-4 py-1.5 rounded-full">組織場域標定 Organizational Profile</span>
          <div className="space-y-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">目前組織場域以<br /><span className="text-amber-300 underline underline-offset-8 decoration-2 decoration-amber-300/30">「{SIGNAL_DEFS[dom].name}」</span>為核心特徵，<br />並伴隨一定程度的<span className="opacity-80">「{SIGNAL_DEFS[sec].name}」</span>。</h2>
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm"><p className="text-xl font-light leading-relaxed opacity-90 italic">{SIGNAL_DEFS[dom].orgMeaning}</p></div>
          </div>
        </div>
      </section>

      <div className="bg-white rounded-[3rem] border border-[#E9E4DB] shadow-sm overflow-hidden divide-y divide-[#F5F2ED]">
        <div className="p-12 space-y-12">
          <div className="flex items-center gap-3"><div className="w-1 h-6 bg-[#2D2926] rounded-full" /><h3 className="text-xl font-bold">組織主訊號解讀｜{SIGNAL_DEFS[dom].name}</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <section className="space-y-6"><h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">代表結構特徵</h4><ul className="space-y-5">{domData.info.map((line, i) => (<li key={i} className="flex gap-4 items-start text-lg font-medium leading-snug"><span className="text-[#A8A297] text-xs mt-1.5 opacity-50">/</span> {line}</li>))}</ul></section>
            <section className="space-y-6"><h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">可能風險軌跡</h4><ul className="space-y-5">{domData.risks.map((line, i) => (<li key={i} className="flex gap-4 items-start text-lg font-medium text-[#8B8378]"><Activity size={16} className="mt-1.5 shrink-0 opacity-40" /> {line}</li>))}</ul></section>
          </div>
        </div>

        <div className="p-12 space-y-6">
          <h3 className="text-xl font-bold">次訊號交織說明：{SIGNAL_DEFS[sec].name}</h3>
          <div className="p-8 bg-[#FDFBF7] rounded-[2.5rem] border border-[#E9E4DB] shadow-inner"><p className="text-lg leading-relaxed text-[#4A453E]">{getCombinationEffect(dom, sec)} 這在組織層面意味著流程優化可能長期讓位於即時的補位與重排，導致結構性債務的累積。</p></div>
        </div>

        <div className="p-12 bg-[#FDFBF7]/30 space-y-8 text-center">
          <h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">場域訊號相對強度示意 (非比例)</h4>
          <div className="flex justify-center items-end gap-12 h-32">
            {['PC', 'ED', 'HF', 'LA'].map(k => {
              const weight = aggregate.allScores[k];
              const max = Math.max(...Object.values(aggregate.allScores));
              const height = (weight / max) * 100;
              return (
                <div key={k} className="flex flex-col items-center gap-4">
                  <div className={`w-10 rounded-t-xl transition-all duration-1000 ease-out ${k===dom ? 'bg-[#2D2926]' : k===sec ? 'bg-[#8B8378]' : 'bg-[#E9E4DB]'}`} style={{ height: `${height}%` }} />
                  <span className="text-[9px] font-bold text-[#A8A297] uppercase tracking-tighter">{SIGNAL_DEFS[k].tag}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [ 主程式 ] ---
export default function App() {
  const [view, setView] = useState('start'); 
  const [userData, setUserData] = useState({ name: '', sessionId: '2026共識營', consent: false });
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [records, setRecords] = useState([]); 

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const personalResult = useMemo(() => calculatePersonal(answers), [answers]);
  const orgAggregate = useMemo(() => calculateOrgAggregate(records), [records]);

  const handleSend = () => {
    if (personalResult) {
      setRecords(prev => [...prev, { ...userData, dom: personalResult.dom, sec: personalResult.sec }]);
      showToast("數據已成功匯流至組織全景圖");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex font-sans text-[#2D2926]">
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-[#2D2926] text-white px-8 py-4 rounded-full text-xs font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 border border-white/20">{toast.msg}</div>
      )}

      {/* Sidebar */}
      <aside className="w-72 border-r border-[#E9E4DB] h-screen fixed left-0 top-0 flex flex-col bg-white shadow-sm">
        <div className="p-8 border-b border-[#F5F2ED]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2D2926] rounded-lg shadow-lg flex items-center justify-center text-white"><Orbit size={18} /></div>
            <span className="font-bold text-xl tracking-tighter text-[#2D2926]">Think Studio</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-4">
            <div className="space-y-1">
              <button onClick={() => setView('start')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${view !== 'org' ? 'bg-[#FDFBF7] text-[#2D2926] border border-[#E9E4DB] shadow-sm' : 'text-[#A8A297] hover:text-[#2D2926]'}`}><Activity size={18} /> 個人鏡像模式</button>
              <button onClick={() => setView('org')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${view === 'org' ? 'bg-[#FDFBF7] text-[#2D2926] border border-[#E9E4DB] shadow-sm' : 'text-[#A8A297] hover:text-[#2D2926]'}`}><Users size={18} /> 組織聚合模式</button>
            </div>
            <div className="p-6 mt-10 rounded-[2rem] border border-[#F5F2ED] bg-zinc-50/30">
              <h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-widest mb-3">Signal Mapping™ v1</h4>
              <p className="text-[10px] text-[#A8A297] leading-relaxed">場域模型旨在透過個人體感的匯流，看見組織最真實的能量瓶頸。不對個人進行評價。</p>
            </div>
        </nav>

        <div className="p-8 border-t border-[#F5F2ED] flex items-center gap-4">
          <AvatarContainer />
          <div className="text-xs">
            <div className="font-bold">{userData.name || '觀測者 Guest'}</div>
            <div className="text-[#A8A297] mt-0.5 font-mono uppercase tracking-tighter text-[9px]">{view === 'org' ? 'Admin Access' : 'Engine v1.0.4'}</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 flex flex-col justify-center min-h-screen">
        {view === 'start' && <StartView userData={userData} setUserData={setUserData} onStart={() => setView('test')} />}
        {view === 'test' && <TestView currentQ={currentQ} setCurrentQ={setCurrentQ} answers={answers} setAnswers={setAnswers} onFinish={() => setView('result')} />}
        {view === 'result' && <ResultView userData={userData} results={personalResult} onSend={handleSend} />}
        {view === 'org' && <OrgView aggregate={orgAggregate} />}
      </main>
    </div>
  );
}