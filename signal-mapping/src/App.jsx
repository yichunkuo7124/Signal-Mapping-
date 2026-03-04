"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  User,
  Activity,
  Settings2,
  Copy,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Orbit,
  BarChart3,
  ArrowLeft,
  Users,
  Plus,
  UploadCloud,
  FileSpreadsheet,
  X,
  AlertCircle,
} from "lucide-react";

/**
 * [ 設計規範 Design Tokens ]
 * 背景: #FDFBF7 (溫潤奶油色)
 * 文字: #2D2926 (深炭色)
 * 邊框: #E9E4DB (淺米色)
 * 強調: #FFBF00 (琥珀色)
 * * [ 部署須知 Deployment Note ]
 * 本程式碼已針對 Production 環境優化，
 * 採用原生 Canvas API 進行圖卡繪製，無須擔心跨網域權限問題。
 */

// --- [ 1. 模型與 4*4 矩陣優化設計 ] ---
// 架構不變：仍維持 SIGNAL_DEFS 與 CLUSTER_MAP 的 key / 欄位結構
// 命名策略：避免「分類/貼標籤」語感，改以「運作傾向/支撐傾向」呈現

const SIGNAL_DEFS = {
  HF: {
    // 原：節奏重排 / 焦點分散
    name: "推進節奏",          // 主傾向（主要運作重心）
    secName: "焦點流動",       // 次傾向（次要支撐方式）
    sub: "推進節奏調整頻率較高",   // 中性描述：不帶「反覆被改寫」的問題暗示
    secSub: "注意力切換密度較高",
    tag: "推進節奏",
    orgMeaning:
      "推進節奏具有高度彈性與調整頻率，工作路徑會隨情境快速修正；焦點切換較密集，需仰賴清楚的訊號與節點來維持連續性。",
  },

  ED: {
    // 原：事件牽引 / 接口摩擦
    name: "啟動來源",
    secName: "協作校準",
    sub: "推進動能多由情境觸發啟動", // 把「牽引」改為「啟動來源」的中性敘述
    secSub: "跨界面需要反覆校準理解與節奏",
    tag: "啟動來源",
    orgMeaning:
      "工作節奏多由情境變化或現場回饋啟動，回應能力成為推進關鍵；跨部門介面需要持續校準，協作成本主要來自理解與節奏的對齊。",
  },

  PC: {
    // 原：優先序競逐 / 決策耗能（tag：決策集中）
    name: "定向方式",
    secName: "判斷承接",
    sub: "關鍵取捨多集中於明確節點形成方向", // 讓「集中」變成「明確節點」，降低負面暗示
    secSub: "判斷能量主要由少數角色承接",
    tag: "定向方式",
    orgMeaning:
      "方向與取捨常由核心節點定向推進，能提高一致性與速度；同時判斷承接較集中，長期需要留意決策負荷與授權節奏的平衡。",
  },

  LA: {
    // 原：結構補位 / 壓力承載
    name: "承載結構",
    secName: "壓力流向",
    sub: "運作的連續性常由彈性承接維持", // 避免「制度不足」的診斷語氣
    secSub: "壓力多匯集到特定位置後再被消化",
    tag: "承載結構",
    orgMeaning:
      "運作流暢度部分依賴彈性承接來維持連續性；壓力容易沿著固定流向匯集，適合透過角色分擔、機制設計與節點前移來降低長期磨耗。",
  },
};

const CLUSTER_MAP = {
  HF: [0, 1, 2],
  ED: [3, 4, 5],
  PC: [6, 7, 8],
  LA: [9, 10, 11],
};

const QUESTIONS = [

{ 
text: "回想最近一段時間，當你推動一個重要議題時，那段過程更像哪種畫面？",
opt: [
"路徑大致清楚，依原本設計往前展開",
"途中有變化，但主軸仍能被守住",
"方向在過程中多次被改寫與調整",
"先讓事情動起來，再一邊補脈絡與定義方向"
] 
},

{ 
text: "當你專注處理關鍵工作時，日常節奏更接近哪個場景？",
opt: [
"能完成一段完整閉環後再切換任務",
"需要穿插處理，但仍能回到原本脈絡",
"常在不同任務間跳接，靠短暫記憶維持連續性",
"專注段較短，隨著變動調整節奏"
] 
},

{ 
text: "同一週內，優先順序的變動感受更像？",
opt: [
"優先序大致清楚，只需微調",
"有幾次調整，但主線仍可辨識",
"優先序多次重排，需要重新說明邏輯",
"優先序像持續刷新，每次都要重新定義重點"
] 
},

{ 
text: "最近的一天，通常是怎麼被啟動的？",
opt: [
"依既定策略或目標自然展開",
"依任務排程逐步推進",
"依他人需求與回饋穿插展開",
"依突發事件與現場狀況接續展開"
] 
},

{ 
text: "當事情沒有照原本預期運轉時，你通常在哪個位置？",
opt: [
"先觀察狀況發展，等關鍵資訊浮現後再決定介入時點",
"依既有機制啟動應對，讓運作自然展開",
"進入現場協助調整，幫助狀況回到軌道",
"承接主導角色，協助釐清方向與節奏"
] 
},

{ 
text: "最近你的時間結構，更接近哪種分布？",
opt: [
"有大段時間推進核心事項",
"推進與回應交錯，但仍能安排節點",
"回應需求佔多數，推進被切碎",
"幾乎在即時處理中前進，很難安排長段推進"
] 
},

{ 
text: "當多方意見分歧、需要收斂時，你的角色更像？",
opt: [
"提供觀點，讓團隊自然收斂",
"協助整合，推動形成可接受版本",
"在討論過程中進行取捨，說明判斷依據",
"當討論無法再收斂時，給出最終定向"
] 
},

{ 
text: "在重要議題上，最後的定調通常如何形成？",
opt: [
"在討論中逐漸形成共識",
"由協調者彙整後確認方向",
"需要你出面收斂並明確方向",
"由你確認方向後，團隊再展開推進"
] 
},

{ 
text: "當資源不足或優先序衝突時，你傾向如何因應？",
opt: [
"依既有規則與目標推進",
"透過協調交換調整配置",
"重新排序，明確調整先後",
"重新定義標準或目標，改變原本設定"
] 
},

{ 
text: "跨部門合作時，對齊成本更像哪種狀態？",
opt: [
"語言與理解接近，很快對齊",
"有落差，但一次對齊後能延續",
"需要反覆校準，常在細節上調整",
"對齊像長期工程，靠額外溝通維持"
] 
},

{ 
text: "當事情能順利推進時，你感受到背後主要依賴的是？",
opt: [
"制度與流程自然吸收多數狀況",
"分工清楚，各自守好接口",
"人際協調與臨場判斷打通卡點",
"有人主動補位，讓運作得以延續"
] 
},

{ 
text: "當場域壓力升高時，壓力通常落在哪裡？",
opt: [
"分散在角色與流程中被承載",
"有些集中，但仍透過協作攤開",
"先集中在少數人身上再被消化",
"長期集中在固定位置，需要一次性處理才能回穩"
] 
}

];

const SIGNAL_NARRATIVE = {
  HF: {
    info: [
      "推進中的議題常有插入與調整",
      "節奏容易被切分，需要重新找回主線",
      "優先序調整的頻率偏高"
    ],
    symptoms: [
      "專注段落較短，切換密度高",
      "推進路徑常在過程中被重新整理",
      "對外/對內的計畫敘事需要反覆更新"
    ],
    risks: [
      "焦點容易被分散，管理注意力成本上升",
      "團隊較難形成穩定的執行慣性",
      "長期計畫的可預期性與信任感需要額外維持"
    ],
    explanation:
      "這通常意味著推進仍在持續校準中：路徑會隨情境修正，節奏也需要不斷重新對齊。",
    reflection:
      "在這些調整與重排之中，哪些其實是在提醒我們：對目標的定義或成功標準，還需要再更一致一些？"
  },

  ED: {
    info: [
      "日常節奏常由現場狀況或即時需求啟動",
      "多數精力投入在回應當下狀況",
      "長程規劃需要刻意保留空間才會展開"
    ],
    symptoms: [
      "回應與協調佔比高，規劃時間被擠壓",
      "重要但不緊急的事項較難自然前進",
      "管理節奏偏向即時調整與臨場判斷"
    ],
    risks: [
      "容易形成『一直在解當下』的節奏慣性",
      "預先布局與主動設計的空間變小",
      "策略推進的節奏容易被臨時需求切斷"
    ],
    explanation:
      "這通常意味著組織正處在高回應需求的情境裡：現場訊號更強，計畫節奏需要被刻意守住。",
    reflection:
      "目前這些『即時需求』裡，有哪些其實是可以透過更清楚的規則、界面或預先安排，讓它不用每次都升級成臨時事件？"
  },

  PC: {
    info: [
      "關鍵取捨多依賴特定角色或決策點",
      "推進動能集中在少數定向節點",
      "多方立場通常需要透過核心定調來對齊"
    ],
    symptoms: [
      "資源排序常需要核心節點確認後才會前進",
      "授權雖存在，但在關鍵取捨時仍會回到少數人身上",
      "決策節點的訊息彙整與判斷負荷偏高"
    ],
    risks: [
      "決策節點容易累積疲勞與切換成本",
      "整體運作對核心決策角色的依賴度提高",
      "一旦節點忙碌或缺席，推進可能出現等待或遲滯"
    ],
    explanation:
      "這通常意味著組織的定向能力很集中：能快速一致，但也需要留意核心節點的承載與授權機制的續航。",
    reflection:
      "在目前需要你定調的議題裡，哪些是可以先把『判斷規則』講清楚，讓團隊在規則內自主取捨、你只需要做少數例外處理？"
  },

  LA: {
    info: [
      "推進的順暢度常仰賴個人彈性與臨場協調",
      "人際調整在分工銜接處扮演重要角色",
      "角色之間的責任邊界有時需要靠默契維持"
    ],
    symptoms: [
      "責任分工不夠清晰時，補位會自然出現",
      "對齊成本常以額外溝通的形式存在",
      "少數人容易成為協作的穩定器"
    ],
    risks: [
      "關鍵角色容易累積隱性疲勞與責任外溢",
      "分工設計延後被釐清",
      "協作效率可能逐漸出現慢性摩擦"
    ],
    explanation:
      "這通常意味著組織的承載較依賴『人』的彈性：運作能維持流暢，但結構性的清晰度需要被慢慢補上。",
    reflection:
      "最近你最常出手承接的那個缺口，如果希望未來不用再靠補位，最需要被釐清的是分工方式、交接規則，還是角色責任？"
  }
};

// --- [ 2. 核心計算邏輯層 ] ---

const calculatePersonal = (answers) => {
  if (!answers || Object.keys(answers).length < 12) return null;
  const scores = { HF: 0, ED: 0, PC: 0, LA: 0 };
  Object.entries(CLUSTER_MAP).forEach(([sig, indices]) => {
    indices.forEach((idx) => {
      scores[sig] += answers[idx] || 0;
    });
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
  const scores = { HF: 0, ED: 0, PC: 0, LA: 0 };
  records.forEach((r) => {
    if (r.dom && SIGNAL_DEFS[r.dom]) scores[r.dom] += 2;
    if (r.sec && SIGNAL_DEFS[r.sec]) scores[r.sec] += 1;
  });
  const sorted = Object.entries(scores).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const priority = { PC: 4, ED: 3, HF: 2, LA: 1 };
    return priority[b[0]] - priority[a[0]];
  });
  return { dom: sorted[0][0], sec: sorted[1][0], allScores: scores, total: records.length };
};

const getCombinationEffect = (dom, sec) => {
  const pairs = {

    HF_ED: "節奏調整頻繁且多由情境啟動，使計畫需要不斷重新對齊，推進重心偏向即時回應。",
    HF_PC: "節奏浮動與定向集中同時存在，讓每一次方向確認都伴隨額外的說明與校準成本。",
    HF_LA: "變動頻率較高時，彈性承接的角色更為關鍵，分工與責任邊界需要持續被釐清。",
    ED_HF: "情境啟動為主要動能來源，使優先序調整成為常態，節奏呈現高度動態特性。",
    ED_PC: "回應需求強且定向集中，關鍵節點需要在即時判斷與長程布局之間反覆切換。",
    ED_LA: "情境壓力多透過個人彈性被吸收，運作能維持流暢，但結構優化往往延後發生。",
    PC_HF: "定向集中且節奏浮動，使決策確認後仍需持續調整路徑，校準成本相對提高。",
    PC_ED: "決策重心明確，但在情境頻繁變動下，核心角色需要維持較高的回應敏感度。",
    PC_LA: "定向集中與彈性承接並存，關鍵角色與協作穩定器之間的互動成為運作關鍵。",
    LA_HF: "當承載依賴彈性且節奏浮動時，補位與調整會交錯出現，角色負荷需被持續關注。",
    LA_ED: "壓力多由彈性承接消化，使情境衝擊被平滑處理，但長期結構優化需要刻意安排。",
    LA_PC: "彈性承接與定向集中同時存在，壓力容易向關鍵節點匯集，角色分擔設計變得重要。",
  };

  return pairs[`${dom}_${sec}`] || "場域中多重力的交織，使運作需同時在執行穩定與結構補位間尋求平衡。";
};

// 輔助函式：剪貼簿 fallback
const copyTextToClipboard = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    return true;
  } catch (err) {
    return false;
  } finally {
    document.body.removeChild(textArea);
  }
};

// --- [ 3. 子組件 Views ] ---

const StartView = ({ userData, setUserData, onStart }) => (
  <div className="max-w-xl mx-auto py-10 md:py-12 px-5 md:px-6 animate-in fade-in duration-700 text-left">
    <div className="text-center mb-12 md:mb-16 text-[#2D2926]">
      <div className="w-20 h-20 md:w-24 md:h-24 bg-white border border-[#E9E4DB] rounded-[2.2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 md:mb-10 shadow-xl">
        <Orbit size={40} className="md:hidden" />
        <Orbit size={48} className="hidden md:block" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 md:mb-6 leading-none">Signal Mapping™</h1>
      <p className="text-[#8B8378] text-base md:text-xl font-medium italic">「看見場域訊號，找出主導壓力。」</p>
    </div>

    <div className="bg-white p-7 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-[#E9E4DB] shadow-sm space-y-8 md:space-y-10 text-[#2D2926]">
      <div className="space-y-7 md:space-y-8 text-left">
        <div>
          <label className="block text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.2em] mb-3 md:mb-4">觀測者姓名 / 識別碼</label>
          <input
            type="text"
            className="w-full px-6 md:px-8 py-4 md:py-5 bg-[#FDFBF7] border border-[#E9E4DB] rounded-2xl md:rounded-3xl focus:outline-none focus:border-[#2D2926] transition-all text-base md:text-lg font-medium"
            placeholder="請輸入姓名或代號"
            value={userData.name}
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
          />
        </div>

        <div className="relative">
          <label className="block text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.2em] mb-3 md:mb-4">探測主題模組</label>
          <div className="relative group">
            <select className="w-full px-6 md:px-8 py-4 md:py-5 bg-[#FDFBF7] border border-[#E9E4DB] rounded-2xl md:rounded-3xl focus:outline-none focus:border-[#2D2926] appearance-none cursor-default text-base md:text-lg font-medium">
              <option>高階共識營｜Signal Mapping™ v1</option>
            </select>
            <div className="absolute right-5 md:right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#A8A297]">
              <ChevronDown size={22} className="md:hidden" />
              <ChevronDown size={24} className="hidden md:block" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 md:space-y-8 text-sm text-[#8B8378] leading-relaxed border-y border-[#F5F2ED] py-7 md:py-8">
        <div className="space-y-2.5">
          <h4 className="font-bold text-[#2D2926] flex items-center gap-3 tracking-widest text-xs uppercase">
            <Clock size={16} /> 探測說明
          </h4>
          <p className="pl-8">本模組包含 12 題管理場景畫面。請依據「目前真實體感」進行直覺選擇。</p>
        </div>
        <div className="space-y-2.5">
          <h4 className="font-bold text-[#2D2926] flex items-center gap-3 tracking-widest text-xs uppercase">
            <ShieldCheck size={16} /> 教案互動原則
          </h4>
          <p className="pl-8">個人報告僅供自我鏡像參考；請點擊「複製代碼」並前往 Padlet 分享你的觀察圖卡。</p>
        </div>
      </div>

      <div className="flex items-start gap-4 px-1">
        <input
          type="checkbox"
          className="mt-1.5 w-5 h-5 accent-[#2D2926] cursor-pointer"
          checked={userData.consent}
          onChange={(e) => setUserData({ ...userData, consent: e.target.checked })}
        />
        <span className="text-xs text-[#8B8378] leading-relaxed font-medium">我已閱讀並同意數據匿名性與隱私保護原則。</span>
      </div>

      <button
        disabled={!userData.name || !userData.consent}
        onClick={onStart}
        className="w-full bg-[#2D2926] text-[#FDFBF7] py-5 md:py-6 rounded-full font-bold text-lg md:text-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-2xl"
      >
        開始觀測 <ChevronRight size={26} className="md:hidden" />
        <ChevronRight size={28} className="hidden md:block" />
      </button>
    </div>
  </div>
);

const TestView = ({ currentQ, setCurrentQ, answers, setAnswers, onFinish }) => {
  const q = QUESTIONS[currentQ];
  const handleSelect = (idx) => {
    setAnswers({ ...answers, [currentQ]: idx });
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300);
    } else {
      setTimeout(() => onFinish(), 300);
    }
  };
  if (!q) return null;

  return (
    <div className="max-w-xl mx-auto py-10 md:py-16 px-5 md:px-6 animate-in slide-in-from-bottom-4 duration-700 text-[#2D2926]">
      <div className="mb-10 md:mb-16">
        <div className="flex justify-between text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.2em] mb-4">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            className={`flex items-center gap-1.5 ${currentQ === 0 ? "opacity-0 pointer-events-none" : "hover:text-[#2D2926] transition-colors"} text-[#2D2926]`}
          >
            <ArrowLeft size={14} /> 上一題
          </button>
          <span>探測進行中 {currentQ + 1} / 12</span>
          <span>{Math.round(((currentQ + 1) / 12) * 100)}%</span>
        </div>
        <div className="h-1 bg-[#E9E4DB] rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-[#2D2926] transition-all duration-700 ease-out" style={{ width: `${((currentQ + 1) / 12) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-10 md:space-y-16">
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight min-h-[6rem] md:min-h-[8rem]">
          {q.text}
        </h2>

        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {q.opt.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full text-left px-6 md:px-10 py-5 md:py-7 rounded-[1.6rem] md:rounded-[2rem] border-2 transition-all flex items-center justify-between shadow-sm group ${
                answers[currentQ] === i ? "border-[#2D2926] bg-[#FDFBF7] shadow-md" : "border-[#E9E4DB] bg-white hover:border-[#A8A297]"
              }`}
            >
              <span className={`font-bold text-base md:text-xl ${answers[currentQ] === i ? "text-[#2D2926]" : "text-[#4A453E]"}`}>
                {opt}
              </span>
              <div
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  answers[currentQ] === i ? "border-[#2D2926]" : "border-[#E9E4DB]"
                }`}
              >
                <div className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-[#2D2926] transition-transform duration-500 ${answers[currentQ] === i ? "scale-100" : "scale-0"}`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResultView = ({ userData, results, showToast }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!results) return null;

  const domData = SIGNAL_NARRATIVE[results.dom] || {};
  const domName = SIGNAL_DEFS[results.dom]?.name || "";
  const domSub = SIGNAL_DEFS[results.dom]?.sub || "";

  const secName = SIGNAL_DEFS[results.sec]?.secName || "";
  const secSub = SIGNAL_DEFS[results.sec]?.secSub || "";
  const secData = SIGNAL_NARRATIVE[results.sec] || {};

  const oneLineExplain = `${domData.explanation || ""} 同時也顯示出「${secName}」的背景。`;

  const handleCopyCode = () => {
    const text = `主=${results.dom}(${domName}) | 次=${results.sec}(${secName})`;
    const success = copyTextToClipboard(text);
    showToast(success ? "分析訊號已複製： " + text : "複製失敗，請手動抄寫：" + text);
  };

  // ✅ 產出 canvas，回傳 {canvas, dataUrl, blob}
  const buildCanvasAsset = async () => {
    const width = 800;
    const height = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.textBaseline = "top";

    // 1. 底色背景
    ctx.fillStyle = "#1a1715";
    ctx.fillRect(0, 0, width, height);

    // 2. 左側裝飾線
    ctx.fillStyle = "#ffbf00";
    ctx.fillRect(60, 100, 6, 100);

    // 3. 標題渲染
    const titlePrefix = "深度交互鏡像｜";
    const titleMain = `${domName} × ${secName}`;
    const margin = 80;
    const safeWidth = width - margin * 2;

    let titleFontSize = 44;
    ctx.font = `bold ${titleFontSize}px "PingFang TC","Microsoft JhengHei",system-ui,sans-serif`;
    while (ctx.measureText(titlePrefix + titleMain).width > safeWidth && titleFontSize > 32) {
      titleFontSize -= 2;
      ctx.font = `bold ${titleFontSize}px "PingFang TC","Microsoft JhengHei",system-ui,sans-serif`;
    }

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(titlePrefix + titleMain, 90, 115);

    ctx.font = `24px "PingFang TC","Microsoft JhengHei",system-ui,sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("場域共存張力分析", 90, 115 + titleFontSize + 15);

    // 4. 中央圓角卡片
    const cardX = 60;
    const cardY = 250;
    const cardW = width - 120;
    const cardH = 700;
    const r = 40;

    ctx.fillStyle = "#24201d";
    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.lineTo(cardX + cardW - r, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
    ctx.lineTo(cardX + cardW, cardY + cardH - r);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
    ctx.lineTo(cardX + r, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
    ctx.lineTo(cardX, cardY + r);
    ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
    ctx.closePath();
    ctx.fill();

    // 5. 卡片內強調文字
    ctx.fillStyle = "#ffbf00";
    ctx.font = `bold 40px "PingFang TC","Microsoft JhengHei",system-ui,sans-serif`;
    ctx.fillText(`${domName}  ×  ${secName}`, cardX + 60, cardY + 70);

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, cardY + 130);
    ctx.lineTo(cardX + cardW - 60, cardY + 130);
    ctx.stroke();

    // 6. 核心描述內容
    const paragraph = `常見畫面是：${getCombinationEffect(results.dom, results.sec)}`;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `32px "PingFang TC","Microsoft JhengHei",system-ui,sans-serif`;

    const contentMaxWidth = cardW - 120;
    const lineHeight = 55;
    let drawY = cardY + 180;

    let line = "";
    for (let i = 0; i < paragraph.length; i++) {
      const testLine = line + paragraph[i];
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > contentMaxWidth && i > 0) {
        ctx.fillText(line, cardX + 60, drawY);
        line = paragraph[i];
        drawY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, cardX + 60, drawY);

    // 7. 品牌與浮水印
    ctx.font = `14px "PingFang TC","Microsoft JhengHei",system-ui,sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "left";
    ctx.fillText("SIGNAL MAPPING™ COLLECTIVE INTERACTION", 70, height - 60);
    ctx.textAlign = "right";
    ctx.fillText(`OBSERVER: ${String(userData.name || "THINKER")}`, width - 70, height - 60);

    const dataUrl = canvas.toDataURL("image/png", 1.0);

    const blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", 1.0);
    });

    return { canvas, dataUrl, blob };
  };

  /**
 * ✅ 下載鏡像圖卡（桌機：直接下載；手機：優先 Web Share，否則開新分頁長按存圖）
 */
const handleDownloadImage = async () => {
  if (isExporting) return;
  setIsExporting(true);
  showToast("正在生成鏡像圖卡...");

  try {
    const { dataUrl, blob } = await buildCanvasAsset();
    const filename = `SignalMapping_${userData.name || "User"}.png`;

    // ✅ 0) 桌機：直接下載儲存（不跳分享視窗）
    // 用 coarse pointer / UA 做保守判斷：多數桌機為 false、手機為 true
    const isMobileDevice =
      (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(pointer: coarse)").matches) ||
      (typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || ""));

    if (!isMobileDevice) {
      // 以 Blob 觸發下載（Chrome / Edge / Firefox / Safari(較新)）
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast("已下載鏡像圖卡");
        return;
      }

      // fallback：沒有 blob 就用 dataUrl
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("已下載鏡像圖卡");
      return;
    }

    // ✅ 1) 手機：支援 Web Share API（iOS 16+ / 部分 Android）
    const canShareFiles =
      typeof navigator !== "undefined" &&
      navigator.share &&
      blob &&
      typeof File !== "undefined" &&
      (!navigator.canShare ||
        navigator.canShare({
          files: [new File([blob], filename, { type: "image/png" })],
        }));

    if (canShareFiles) {
      const file = new File([blob], filename, { type: "image/png" });
      await navigator.share({
        files: [file],
        title: "Signal Mapping™",
        text: "鏡像圖卡已生成，可選擇儲存到照片或分享至 Padlet。",
      });
      showToast("已開啟分享面板：可儲存到照片或分享");
      return;
    }

    // ✅ 2) 手機 fallback：開新分頁顯示圖片（iOS 最穩），用長按儲存
    const win = window.open();
    if (win) {
      win.document.write(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Signal Mapping™ Image</title>
            <style>
              body{margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;}
              img{max-width:100%;height:auto;display:block;}
              .tip{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
                background:rgba(0,0,0,0.65);color:#fff;padding:10px 14px;border-radius:999px;
                font: 600 12px system-ui;letter-spacing:.06em}
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="Signal Mapping" />
            <div class="tip">手機請長按圖片 → 儲存到照片</div>
          </body>
        </html>
      `);
      showToast("已開啟圖片：手機請長按圖片儲存");
    } else {
      window.location.href = dataUrl;
      showToast("已開啟圖片：手機請長按圖片儲存");
    }
  } catch (err) {
    console.error(err);
    showToast("圖卡生成失敗，建議使用螢幕截圖。");
  } finally {
    setIsExporting(false);
  }
};

  return (
    <div className="max-w-4xl mx-auto py-10 md:py-12 px-5 md:px-6 animate-in fade-in duration-1000 space-y-10 md:space-y-12 pb-24 md:pb-32 text-left text-[#2D2926]">
      <section className="bg-[#2D2926] text-white p-8 md:p-16 rounded-[2.8rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <Orbit className="absolute -top-16 -right-16 w-64 h-64 opacity-10 animate-pulse text-white" />
        <div className="relative z-10 space-y-8 md:space-y-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] bg-white/10 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md inline-block">
            個人場域鏡像結果 Personal Mirror
          </span>

          <div className="space-y-8 md:space-y-12">
            <h2 className="text-2xl md:text-6xl font-bold tracking-tighter leading-[1.15]">
              目前你的工作場域以
              <br />
              <span className="text-amber-400 underline underline-offset-[10px] md:underline-offset-[12px] decoration-4 decoration-amber-400/20">
                「{domName}」
              </span>
              為主要特徵，
              <br />
              並伴隨一定程度的<span className="opacity-80">「{secName}」</span>。
            </h2>
            <div className="bg-white/5 p-7 md:p-10 rounded-[2.2rem] md:rounded-[2.5rem] border border-white/10 backdrop-blur-sm">
              <p className="text-base md:text-2xl font-light leading-relaxed opacity-90 italic">「{oneLineExplain}」</p>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-white rounded-[2.8rem] md:rounded-[3.5rem] border border-[#E9E4DB] shadow-sm overflow-hidden divide-y divide-[#F5F2ED]">
        <div className="p-8 md:p-16 space-y-10 md:space-y-12 text-[#2D2926]">
          <div className="space-y-2">
            <div className="flex items-center gap-5">
              <div className="w-1.5 h-10 bg-[#2D2926] rounded-full" />
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">主狀態解讀｜{domName}</h3>
            </div>
            <p className="pl-7 text-[#8B8378] font-bold text-base md:text-lg italic">{domSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            <section className="space-y-6 md:space-y-8">
              <h4 className="text-[11px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">代表資訊</h4>
              <ul className="space-y-4 md:space-y-6 font-medium">
                {(domData.info || []).map((line, i) => (
                  <li key={i} className="flex gap-5 items-start text-base md:text-xl leading-snug">
                    <span className="text-[#A8A297] text-sm mt-1.5 opacity-40 font-mono">0{i + 1} /</span> {String(line)}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-6 md:space-y-8">
              <h4 className="text-[11px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">結構視角</h4>
              <ul className="space-y-4 md:space-y-6 font-medium">
                {(domData.symptoms || []).map((line, i) => (
                  <li key={i} className="flex gap-5 items-start text-base md:text-xl text-[#8B8378] leading-snug font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-3 shrink-0" /> {String(line)}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ✅ 加回：主狀態反思 */}
          <div className="p-7 md:p-10 bg-[#FDFBF7] rounded-[2.2rem] md:rounded-[2.5rem] border border-[#E9E4DB]">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-500" size={20} />
              <h4 className="text-base md:text-lg font-bold text-[#2D2926]">反思問題（主狀態）</h4>
            </div>
            <p className="mt-4 text-sm md:text-base text-[#4A453E] leading-relaxed font-medium italic">
              「{String(domData.reflection || "")}」
            </p>
          </div>
        </div>

        <div className="p-8 md:p-16 space-y-10 md:space-y-12 bg-[#FDFBF7]/30 text-[#2D2926]">
          <div className="space-y-2">
            <div className="flex items-center gap-5">
              <div className="w-1.5 h-10 bg-[#8B8378] rounded-full" />
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">次狀態補充｜{secName}</h3>
            </div>
            <p className="pl-7 text-[#8B8378] font-bold text-base md:text-lg italic">{secSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {(secData.symptoms || []).map((line, i) => (
              <div
                key={i}
                className="p-6 md:p-8 bg-white rounded-2xl md:rounded-3xl border border-[#E9E4DB]/50 text-sm md:text-lg font-bold text-[#4A453E] leading-relaxed shadow-sm hover:translate-y-[-2px] transition-transform"
              >
                {String(line)}
              </div>
            ))}
          </div>

          {/* ✅ 加回：次狀態反思 */}
          <div className="p-7 md:p-10 bg-white rounded-[2.2rem] md:rounded-[2.5rem] border border-[#E9E4DB] shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-500" size={20} />
              <h4 className="text-base md:text-lg font-bold text-[#2D2926]">反思問題（次狀態）</h4>
            </div>
            <p className="mt-4 text-sm md:text-base text-[#4A453E] leading-relaxed font-medium italic">
              「{String(secData.reflection || "")}」
            </p>
          </div>
        </div>

        <div className="p-8 md:p-16 space-y-10 md:space-y-12 bg-[#2D2926] text-white overflow-hidden relative">
          <div className="relative z-10 space-y-8 md:space-y-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-5">
                  <div className="w-1.5 h-10 bg-amber-400 rounded-full" />
                  <h3 className="text-xl md:text-3xl font-bold tracking-tight text-white">深度交互鏡像｜{domName} × {secName}</h3>
                </div>
                <p className="pl-7 text-white/60 font-bold text-base md:text-lg italic">場域共存張力分析</p>
              </div>
              <div className="text-right opacity-40"><Orbit size={40} className="md:hidden" /><Orbit size={48} className="hidden md:block" /></div>
            </div>

            <div className="p-7 md:p-10 bg-white/5 rounded-[2.6rem] md:rounded-[3rem] border border-white/10 backdrop-blur-xl shadow-inner">
              <p className="text-lg md:text-3xl font-light leading-relaxed text-white/90">
                <span className="font-bold text-amber-400">{domName}</span> + <span className="font-bold opacity-80 text-white">{secName}</span>
                <br />
                <span className="mt-6 md:mt-8 block opacity-90 leading-relaxed italic border-t border-white/10 pt-6 md:pt-8 text-base md:text-2xl font-medium">
                  「常見畫面是：{getCombinationEffect(results.dom, results.sec)}」
                </span>
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 opacity-30 border-t border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Signal Mapping™ Collective Interaction</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.5em]">{String(userData.name || "Thinker")}</span>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 bg-[#FDFBF7] space-y-8 md:space-y-10">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-500" size={20} />
            <h4 className="text-base md:text-lg font-bold text-[#2D2926]">Padlet 互動任務</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex flex-col items-center gap-4 p-7 md:p-8 bg-white border-2 border-[#E9E4DB] rounded-[2.2rem] md:rounded-[2.5rem] hover:border-[#2D2926] hover:bg-zinc-50 transition-all shadow-sm group active:scale-95 disabled:opacity-50"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-[#2D2926] rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Download size={24} className="md:hidden" />
                <Download size={28} className="hidden md:block" />
              </div>
              <div className="text-center">
                <span className="block font-bold text-base md:text-lg">1. 下載鏡像圖卡</span>
                <span className="text-xs text-[#8B8378] mt-1">手機會開啟圖片：長按儲存 / 或使用分享儲存到照片</span>
              </div>
            </button>

            <button
              onClick={handleCopyCode}
              className="flex flex-col items-center gap-4 p-7 md:p-8 bg-white border-2 border-[#E9E4DB] rounded-[2.2rem] md:rounded-[2.5rem] hover:border-[#2D2926] hover:bg-zinc-50 transition-all shadow-sm group active:scale-95"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-[#2D2926] group-hover:scale-110 transition-transform">
                <Copy size={24} className="md:hidden" />
                <Copy size={28} className="hidden md:block" />
              </div>
              <div className="text-center">
                <span className="block font-bold text-base md:text-lg">2. 複製分析訊號</span>
                <span className="text-xs text-[#8B8378] mt-1">複製代碼，準備貼在 Padlet 留言區</span>
              </div>
            </button>
          </div>

          <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              💡 操作建議：請先下載圖片並上傳至 Padlet，再在圖片留言處貼上複製的訊號代碼，以完成組織全景匯流。
            </p>
          </div>
        </div>

        <div className="p-8 md:p-10 bg-[#FDFBF7] flex justify-center">
          <button
            onClick={() => window.location.reload()}
            className="text-[10px] font-bold text-[#A8A297] uppercase tracking-widest hover:text-[#2D2926] transition-all underline underline-offset-8"
          >
            重新校準觀測 Re-Mirror
          </button>
        </div>
      </div>
    </div>
  );
};

const OrgView = ({ records, setRecords, aggregate, showToast }) => {
  const [manualInput, setManualInput] = useState({ dom: "HF", sec: "ED" });
  const [showAdmin, setShowAdmin] = useState(true);
  const fileInputRef = useRef(null);

  const handleAdd = () => {
    setRecords((prev) => [...prev, { dom: manualInput.dom, sec: manualInput.sec, name: "Admin Entry" }]);
    showToast("數據已加入匯流池");
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const lines = (content || "").split(/\r?\n/).filter((line) => line.trim() !== "");
      const newRecords = [];
      lines.forEach((line) => {
        const parts = line.split(/[,\s]+/).map((s) => s.trim().toUpperCase());
        if (parts.length >= 2 && SIGNAL_DEFS[parts[0]] && SIGNAL_DEFS[parts[1]]) {
          newRecords.push({ dom: parts[0], sec: parts[1], name: "CSV Import" });
        }
      });
      if (newRecords.length > 0) {
        setRecords((prev) => [...prev, ...newRecords]);
        showToast(`成功匯入 ${newRecords.length} 筆數據`);
      } else {
        showToast("無效代碼，請檢查格式。");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto py-10 md:py-12 px-5 md:px-6 animate-in fade-in duration-1000 space-y-10 md:space-y-12 pb-24 md:pb-32 text-left text-[#2D2926]">
      <section className="bg-white rounded-[2.8rem] md:rounded-[3rem] border border-[#E9E4DB] shadow-sm overflow-hidden divide-y divide-[#F5F2ED]">
        <div className="p-7 md:p-10 flex justify-between items-center bg-[#FDFBF7]/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#2D2926] rounded-xl flex items-center justify-center text-white">
              <Settings2 size={22} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">組織聚合管理控制台 (Admin Only)</h2>
          </div>
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="text-xs font-bold text-[#A8A297] uppercase tracking-widest hover:text-[#2D2926] transition-colors"
          >
            {showAdmin ? "收合面板" : "展開面板"}
          </button>
        </div>

        {showAdmin && (
          <div className="p-7 md:p-10 space-y-10 md:space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.3em] flex items-center gap-2">
                  <Plus size={14} /> 單筆數據填入
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold opacity-40">主狀態代碼</label>
                    <select
                      value={manualInput.dom}
                      onChange={(e) => setManualInput({ ...manualInput, dom: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E9E4DB] rounded-xl focus:outline-none font-bold"
                    >
                      {Object.keys(SIGNAL_DEFS).map((k) => (
                        <option key={k} value={k}>
                          {k}｜{SIGNAL_DEFS[k].name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold opacity-40">次狀態代碼</label>
                    <select
                      value={manualInput.sec}
                      onChange={(e) => setManualInput({ ...manualInput, sec: e.target.value })}
                      className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E9E4DB] rounded-xl focus:outline-none font-bold"
                    >
                      {Object.keys(SIGNAL_DEFS).map((k) => (
                        <option key={k} value={k}>
                          {k}｜{SIGNAL_DEFS[k].secName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAdd}
                  className="w-full py-4 bg-[#2D2926] text-white font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Plus size={18} /> 加入數據池
                </button>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-[#A8A297] uppercase tracking-[0.3em] flex items-center gap-2">
                  <UploadCloud size={14} /> CSV 批量匯入
                </h4>
                <div className="p-7 md:p-8 border-2 border-dashed border-[#E9E4DB] rounded-[2.2rem] md:rounded-[2.5rem] bg-[#FDFBF7]/50 flex flex-col items-center justify-center space-y-4 group transition-all">
                  <FileSpreadsheet className="text-[#A8A297]" size={40} />
                  <div className="text-center">
                    <p className="text-sm font-bold">選取匯入檔案</p>
                    <p className="text-[10px] text-[#A8A297] mt-1">格式：主代碼,次代碼 (如 HF,ED)</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileImport} />
                  <button
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="px-8 py-3 bg-white border-2 border-[#E9E4DB] text-[#2D2926] font-bold rounded-xl hover:bg-zinc-50 transition-all shadow-sm"
                  >
                    瀏覽檔案
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[#F5F2ED] space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">匯流數據池 ({records.length} 筆)</h4>
                {records.length > 0 && (
                  <button
                    onClick={() => setRecords([])}
                    className="text-[10px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    清空數據
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {records.map((r, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 bg-[#FDFBF7] border border-[#E9E4DB] rounded-full flex items-center gap-3 group animate-in zoom-in-50 duration-300"
                  >
                    <span className="text-[10px] font-bold font-mono text-[#2D2926]">
                      {r.dom}/{r.sec}
                    </span>
                    <button
                      onClick={() => setRecords((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-[#A8A297] hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {!aggregate ? (
        <div className="py-20 md:py-24 text-center space-y-8 animate-in fade-in duration-700">
          <BarChart3 className="mx-auto text-[#E9E4DB]" size={80} />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#2D2926]">等待數據匯流...</h2>
          <p className="text-base md:text-xl text-[#8B8378] font-medium">個人測驗採 Padlet 轉 CSV 回報，請由管理者匯入數據生成報表。</p>
        </div>
      ) : (
        <div className="space-y-10 md:space-y-12 animate-in fade-in duration-1000">
          <section className="bg-[#2D2926] text-white p-8 md:p-16 rounded-[2.8rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <Users className="absolute -top-16 -right-16 w-80 h-80 opacity-5 text-white" />
            <div className="relative z-10 space-y-8 md:space-y-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] bg-white/10 px-5 py-2 rounded-full border border-white/10 inline-block">
                組織場域標定 Organizational Profile
              </span>

              <div className="space-y-8 md:space-y-12">
                <h2 className="text-2xl md:text-6xl font-bold tracking-tighter leading-tight">
                  目前組織場域以
                  <br />
                  <span className="text-amber-400 underline underline-offset-[10px] md:underline-offset-[12px] decoration-4 decoration-amber-400/20">
                    「{SIGNAL_DEFS[aggregate.dom]?.name || ""}」
                  </span>
                  為核心特徵，
                  <br />
                  並伴隨一定程度的<span className="opacity-80">「{SIGNAL_DEFS[aggregate.sec]?.secName || ""}」</span>。
                </h2>

                <div className="bg-white/5 p-7 md:p-10 rounded-[2.2rem] md:rounded-[2.5rem] border border-white/10 backdrop-blur-sm font-medium">
                  <p className="text-base md:text-2xl font-light leading-relaxed opacity-90 italic">
                    「{SIGNAL_DEFS[aggregate.dom]?.orgMeaning || ""}」
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="bg-white rounded-[2.8rem] md:rounded-[3.5rem] border border-[#E9E4DB] shadow-sm overflow-hidden divide-y divide-[#F5F2ED]">
            <div className="p-8 md:p-16 space-y-10 md:space-y-12 text-[#2D2926]">
              <div className="flex items-center gap-5">
                <div className="w-1.5 h-10 bg-[#2D2926] rounded-full" />
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">組織主狀態解讀｜{SIGNAL_DEFS[aggregate.dom]?.name || ""}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                <section className="space-y-6 md:space-y-8">
                  <h4 className="text-[11px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">代表結構特徵</h4>
                  <ul className="space-y-4 md:space-y-6 font-bold">
                    {(SIGNAL_NARRATIVE[aggregate.dom]?.info || []).map((line, i) => (
                      <li key={i} className="flex gap-5 items-start text-base md:text-xl leading-snug">
                        <span className="text-[#A8A297] text-sm mt-1.5 opacity-40 font-mono">/</span> {String(line)}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-6 md:space-y-8">
                  <h4 className="text-[11px] font-bold text-[#A8A297] uppercase tracking-[0.3em]">可能風險軌跡</h4>
                  <ul className="space-y-4 md:space-y-6 font-medium text-[#8B8378]">
                    <li className="flex gap-5 items-start text-base md:text-xl leading-snug font-bold">
                      <Activity size={20} className="mt-1.5 shrink-0 opacity-30 text-[#2D2926]" /> 系統性決策成本緩步攀升
                    </li>
                    <li className="flex gap-5 items-start text-base md:text-xl leading-snug font-bold">
                      <Activity size={20} className="mt-1.5 shrink-0 opacity-30 text-[#2D2926]" /> 長期戰略目標易被短線重排稀釋
                    </li>
                  </ul>
                </section>
              </div>
            </div>

            <div className="p-8 md:p-16 space-y-10 bg-[#FDFBF7]/30 text-center">
              <h4 className="text-[11px] font-bold text-[#A8A297] uppercase tracking-[0.4em] mb-10 md:mb-12">
                組織場域訊號權重分佈 (N={aggregate.total})
              </h4>

              <div className="flex justify-center items-end gap-10 md:gap-16 h-56 md:h-64 border-b border-[#E9E4DB] pb-2">
                {["PC", "ED", "HF", "LA"].map((k) => {
                  const weight = aggregate.allScores[k] || 0;
                  const maxVal = Math.max(...Object.values(aggregate.allScores)) || 1;
                  const height = (weight / maxVal) * 100;
                  const isDom = k === aggregate.dom;
                  const isSec = k === aggregate.sec;

                  return (
                    <div key={k} className="flex flex-col items-center gap-5 md:gap-6 group">
                      <div className="flex flex-col items-center gap-3 md:gap-4 relative w-16 md:w-20">
                        <div className={`text-xs font-black transition-all duration-1000 ${isDom ? "text-[#2D2926]" : "text-[#8B8378]"}`}>
                          {weight}
                        </div>
                        <div
                          className={`w-full rounded-t-3xl transition-all duration-1000 ease-out shadow-2xl relative ${
                            isDom ? "bg-[#2D2926]" : isSec ? "bg-[#8B8378]" : "bg-[#E9E4DB]"
                          }`}
                          style={{ height: `${height}%`, minHeight: "12px" }}
                        >
                          {isDom && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 w-2 h-2 rounded-full ring-4 ring-amber-400/20" />}
                        </div>
                      </div>
                      <span className={`text-xs font-bold transition-colors ${isDom ? "text-[#2D2926]" : "text-[#A8A297]"}`}>
                        {SIGNAL_DEFS[k]?.tag || ""}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4 mt-8">
                <p className="text-[11px] text-[#8B8378] font-medium leading-relaxed max-w-sm mx-auto italic">
                  註：圖表根據主訊號 (2分) 與次訊號 (1分) 加權顯示，以反映真實場域張力分佈。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- [ 4. 主程式 ] ---

export default function App() {
  const [view, setView] = useState("start");
  const [userData, setUserData] = useState({ name: "", sessionId: "2026共識營", consent: false });
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [records, setRecords] = useState([]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(!!mq.matches);
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", sync);
      else mq.removeListener(sync);
    };
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg: String(msg || "") });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

  const personalResult = useMemo(() => calculatePersonal(answers), [answers]);
  const orgAggregate = useMemo(() => calculateOrgAggregate(records), [records]);

  // ✅ 手機版：上方功能列（個人/組織）
  const MobileTopBar = () => (
    <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur border-b border-[#E9E4DB]">
      <div className="px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2D2926] rounded-xl shadow-lg flex items-center justify-center text-white">
              <Orbit size={18} />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-base tracking-tight text-[#2D2926]">TURNCLOUD</div>
              <div className="text-[10px] text-[#A8A297] font-mono uppercase tracking-tight">Signal Mapping™ v1</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-[#A8A297] font-mono uppercase tracking-tight">v1.0.4 - LOCAL</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={() => setView("start")}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              view !== "org" ? "bg-[#FDFBF7] border border-[#E9E4DB] shadow-sm text-[#2D2926]" : "bg-white border border-[#F5F2ED] text-[#A8A297]"
            }`}
          >
            <Activity size={18} /> 個人鏡像
          </button>
          <button
            onClick={() => setView("org")}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
              view === "org" ? "bg-[#FDFBF7] border border-[#E9E4DB] shadow-sm text-[#2D2926]" : "bg-white border border-[#F5F2ED] text-[#A8A297]"
            }`}
          >
            <Users size={18} /> 組織聚合
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#2D2926] overflow-x-hidden">
      {/* Toast：手機避開瀏海 */}
      {toast.show && (
        <div className="fixed left-1/2 -translate-x-1/2 z-[100] border border-white/10 text-center animate-in fade-in slide-in-from-top-6
                        top-[max(env(safe-area-inset-top),12px)] md:top-12
                        bg-[#2D2926] text-white px-6 md:px-10 py-4 md:py-5 rounded-full text-xs md:text-sm font-bold shadow-2xl">
          {toast.msg}
        </div>
      )}

      {/* Mobile top bar */}
      <MobileTopBar />

      {/* Desktop sidebar（md+） */}
      <aside className="hidden md:flex w-80 border-r border-[#E9E4DB] h-screen fixed left-0 top-0 flex-col bg-white z-50 shadow-sm">
        <div className="p-10 border-b border-[#F5F2ED]">
          <div className="flex items-center gap-4 text-[#2D2926]">
            <div className="w-10 h-10 bg-[#2D2926] rounded-xl shadow-lg flex items-center justify-center text-white">
              <Orbit size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tighter">Think Studio</span>
          </div>
        </div>

        <nav className="flex-1 p-8 space-y-6 text-[#2D2926]">
          <div className="space-y-3">
            <button
              onClick={() => setView("start")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                view !== "org" ? "bg-[#FDFBF7] border border-[#E9E4DB] shadow-sm" : "text-[#A8A297] hover:text-[#2D2926]"
              }`}
            >
              <Activity size={20} /> 個人鏡像模式
            </button>
            <button
              onClick={() => setView("org")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                view === "org" ? "bg-[#FDFBF7] border border-[#E9E4DB] shadow-sm" : "text-[#A8A297] hover:text-[#2D2926]"
              }`}
            >
              <Users size={20} /> 組織聚合模式
            </button>
          </div>

          <div className="p-8 mt-12 rounded-[2.5rem] border border-[#F5F2ED] bg-zinc-50/40 space-y-4">
            <h4 className="text-[11px] font-bold text-[#A8A297] uppercase tracking-[0.2em]">Signal Mapping™ v1</h4>
            <p className="text-[11px] text-[#8B8378] leading-relaxed font-medium">
              本平台採「本地運算」模式。個人數據不自動上傳，請透過 Padlet 進行教案互動匯流。
            </p>
          </div>
        </nav>

        <div className="p-10 border-t border-[#F5F2ED] flex items-center gap-5 text-[#2D2926]">
          <div className="w-12 h-12 rounded-full border-2 border-[#E9E4DB] overflow-hidden flex items-center justify-center bg-[#FDFBF7] shadow-sm">
            <User size={24} />
          </div>
          <div className="text-xs">
            <div className="font-bold text-sm text-[#2D2926]">{String(userData.name || "觀測者 Guest")}</div>
            <div className="text-[#A8A297] mt-1 font-mono uppercase tracking-tighter text-[10px]">v1.0.4 - Local Mode</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main
        className={`
          flex flex-col justify-center min-h-screen relative bg-[#FDFBF7] overflow-x-hidden
          px-0
          md:ml-80
          pt-28 md:pt-0
        `}
      >
        {/* 手機：讓內容不要被 top bar 壓住，並保持寬度滿版 */}
        <div className="w-full">
          {view === "start" && <StartView userData={userData} setUserData={setUserData} onStart={() => setView("test")} />}
          {view === "test" && <TestView currentQ={currentQ} setCurrentQ={setCurrentQ} answers={answers} setAnswers={setAnswers} onFinish={() => setView("result")} />}
          {view === "result" && <ResultView userData={userData} results={personalResult} showToast={showToast} />}
          {view === "org" && <OrgView records={records} setRecords={setRecords} aggregate={orgAggregate} showToast={showToast} />}
        </div>
      </main>
    </div>
  );
}
