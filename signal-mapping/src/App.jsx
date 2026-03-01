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

// --- [ 1. 模型與 $4*4$ 矩陣優化設計 ] ---

const SIGNAL_DEFS = {
  HF: {
    name: "節奏重排",
    secName: "焦點分散",
    sub: "工作路徑反覆被改寫",
    secSub: "注意力被切碎",
    tag: "節奏重排",
    orgMeaning:
      "組織內部執行路徑缺乏慣性，資源配置處於高頻調整狀態，執行慣性難以形成。",
  },
  ED: {
    name: "事件牽引",
    secName: "接口摩擦",
    sub: "推進動能多由外部觸發",
    secSub: "協作磨耗反覆出現",
    tag: "事件牽引",
    orgMeaning:
      "運作節奏傾向由突發狀況啟動，回應成本長期高於規劃成本，策略推進易被擠壓。",
  },
  PC: {
    name: "優先序競逐",
    secName: "決策耗能",
    sub: "關鍵方向依賴少數節點",
    secSub: "裁決能量下降",
    tag: "決策集中",
    orgMeaning:
      "關鍵取捨與資源排序高度依賴少數節點，推進動能集中，長期可能造成決策負荷。",
  },
  LA: {
    name: "結構補位",
    secName: "壓力承載",
    sub: "系統未吸收的壓力由人承接",
    secSub: "壓力集中吸收",
    tag: "結構補位",
    orgMeaning:
      "制度支撐力不足，系統運作高度仰賴個人彈性補位以維持表面流暢，長期易累積磨耗。",
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
    text: "回想最近一段時間，當你設定一個重要議題的推進路徑，最像哪種畫面？",
    opt: [
      "路徑清楚，照設計往前走",
      "中途會插入議題，但主軸仍能守住",
      "推進路徑常在進行中被改寫",
      "推進方向常被迫重定義（先讓事情動起來，再補齊脈絡）",
    ],
  },
  {
    text: "當你投入處理關鍵工作時，最貼近哪個場景？",
    opt: [
      "能完成一段完整閉環再切換",
      "需要穿插處理，但能回到原本脈絡",
      "常在不同任務間來回跳接，靠短記憶續航",
      "很難形成專注段，像在追著變動跑",
    ],
  },
  {
    text: "同一週內，優先順序的變化更像哪種情境？",
    opt: [
      "優先序清晰，少量校正即可",
      "有幾次調整，但仍看得出主線",
      "優先序多次重排，常需要重新說明原因",
      "優先序像被不斷刷新，決策成本很高",
    ],
  },
  {
    text: "最近你的一天通常是由什麼啟動？",
    opt: ["依既定策略/規劃推進", "依任務排程逐項完成", "依他人需求與回饋穿插啟動", "依突發狀況與現場事件接續啟動"],
  },
  {
    text: "當系統出現例外或異常，你通常處在：",
    opt: ["後方觀測，等資訊匯整再決定介入點", "依流程啟動處置，讓制度先運作", "主動介入調整，讓現場先回穩", "直接接管主導，快速定調處理方式"],
  },
  {
    text: "最近你的時間切片更像：",
    opt: ["大段時間用於推進核心事項", "推進與回應交錯，但仍能安排節點", "回應需求佔據主要時段，推進被切碎", "幾乎在即時處理中前進，難以安排長段推進"],
  },
  {
    text: "當多方意見分歧、需要收斂時，你更像：",
    opt: ["提供觀點，讓團隊自行收斂", "協助整合，推動形成可接受版本", "進行取捨，指出取捨依據", "直接裁決，承擔最後定調責任"],
  },
  {
    text: "在重要議題上，最後定調通常落在：",
    opt: ["團隊共識自然形成", "由協調者彙整後確認", "需要你來收斂並決定方向", "需要你拍板，否則難以前進"],
  },
  {
    text: "當資源不足或優先序衝突，你通常會：",
    opt: ["按既有規則與既定目標推進", "協調交換與調整配置", "重新排序，明確調整先後", "重新定義標準/目標，改變遊戲規則"],
  },
  {
    text: "跨部門合作時，對齊成本更像哪種畫面？",
    opt: ["語言一致，很快對齊", "有落差，但一次對齊後能繼續走", "需要反覆校準，常在細節上磨", "對齊像長期工程，常靠默契與額外溝通成本維持"],
  },
  {
    text: "當事情能順利推進，背後更依賴：",
    opt: ["制度與流程自然吸收多數狀況", "分工清楚，各自把接口守好", "靠人際協調與臨場判斷打通卡點", "靠個人補位把缺口接住，系統才不中斷"],
  },
  {
    text: "當場域壓力上來，承載的落點更像：",
    opt: ["能被分散到角色與流程上", "有些集中，但仍透過協作攤開", "多半會先落到少數人身上再處理", "壓力長期集中在固定位置，需要一次性處理才能回穩"],
  },
];

const SIGNAL_NARRATIVE = {
  HF: {
    info: ["推進中的議題經常被插入或調整", "原本的節奏難以長時間維持", "優先序刷新頻率高"],
    symptoms: ["優先序刷新頻率高", "專注段落不易拉長", "計畫穩定度受影響"],
    risks: ["管理焦點耗散", "團隊執行慣性難以養成", "長期計畫的可信度弱化"],
    explanation: "這代表執行路徑正在持續修正中，原本的節奏難以維持。",
    reflection: "哪些重排的背後，反映的是我們對目標定調的共識尚不穩固？",
  },
  ED: {
    info: ["日常管理節奏由突發狀況啟動", "即時需求佔據主要心智帶寬", "長程規劃難以自然展開"],
    symptoms: ["回應成本高於規劃成本", "重要但不緊急事項被擠壓", "管理節奏偏反應式"],
    risks: ["系統預見能力受損", "陷入反應式管理循環", "長程戰略動能被脈衝侵蝕"],
    explanation: "這反映出場域正處於應激狀態，既有的計畫節奏容易被瞬時需求取代。",
    reflection: "目前的「即時需求」中，有哪些其實是流程漏洞留下的隱患？",
  },
  PC: {
    info: ["關鍵取捨高度依賴特定角色", "推進動能集中於核心決策點", "多方立場需經由單點定調"],
    symptoms: ["資源排序需單點裁決", "中層授權承載度有限", "決策節點負荷上升"],
    risks: ["決策疲勞快速累積", "系統依賴單一決策源", "授權機制失效或中斷"],
    explanation: "這代表系統中的引力失衡，關鍵推動力過度集中於少數決策節點。",
    reflection: "目前的裁決點中，哪些是可以透過定義規則來實現「授權下放」的？",
  },
  LA: {
    info: ["協作摩擦多由個人彈性消化", "推進感依賴人際調整而非制度", "接口定義不夠清晰"],
    symptoms: ["接口定義不夠清晰", "對齊成本隱性存在", "補位行為成為穩定器"],
    risks: ["關鍵人才隱性疲勞", "流程漏洞被補位行為掩蓋", "協作介面產生慢性黏滯"],
    explanation: "這代表系統中未被制度吸收的張力，正在透過個人的補位來維持流暢。",
    reflection: "最近你最常補的那個「場域缺口」，它的制度根源在哪裡？",
  },
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
    HF_ED: "外部需求高頻切入，導致內部計畫難以生根，運作重心持續在響應中消耗。",
    HF_PC: "頻繁的計畫調整與集中的決策路徑產生碰撞，使每一輪重排的溝通成本顯著上升。",
    HF_LA: "高頻變動不斷擠壓制度空間，迫使團隊必須以個人彈性填補執行中的隱性缺口。",
    ED_HF: "突發事件主導了場域節奏，迫使優先序不斷重新定義，系統處於應激性的重組中。",
    ED_PC: "外部衝擊頻繁且決策高度集中，導致關鍵節點在即時回應中過載，長程優化被迫延後。",
    ED_LA: "事件帶來的張力多半由個人私下接住，導致系統漏洞被表面的應變成功所掩蓋。",
    PC_HF: "裁決壓力集中且執行路徑不穩，使得每一次的拍板都伴隨極高的動態修正成本。",
    PC_ED: "決策節點過於飽和，面對突發事件時反應速度受限，使場域處於被動追趕狀態。",
    PC_LA: "理解落差導致集體更依賴單點拍板，而集中的裁決又加劇了系統內部的隱性摩擦。",
    LA_HF: "制度缺口使得執行變動顯得異常沈重，補位慣性成為維持系統運作的唯一來源。",
    LA_ED: "系統長期仰賴個人吸收壓力，使外部衝擊被淡化，難以觸發結構性的優化契機。",
    LA_PC: "理解落差導致對單點裁決的依賴上升，進一步強化了壓力在決策節點的集中。",
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
   * ✅ 手機下載：優先 Web Share（可存到相簿/檔案），否則開新分頁長按存圖
   */
  const handleDownloadImage = async () => {
    if (isExporting) return;
    setIsExporting(true);
    showToast("正在生成鏡像圖卡...");

    try {
      const { dataUrl, blob } = await buildCanvasAsset();

      // 1) 支援 Web Share API（iOS 16+ / 部分 Android）
      const canShareFiles =
        typeof navigator !== "undefined" &&
        navigator.share &&
        blob &&
        typeof File !== "undefined" &&
        // iOS/Chrome 多數情況 navigator.canShare 可用；沒有也不阻擋
        (!navigator.canShare || navigator.canShare({ files: [new File([blob], "SignalMapping.png", { type: "image/png" })] }));

      if (canShareFiles) {
        const file = new File([blob], `SignalMapping_${userData.name || "User"}.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "Signal Mapping™",
          text: "鏡像圖卡已生成，可選擇儲存到照片或分享至 Padlet。",
        });
        showToast("已開啟分享面板：可儲存到照片或分享");
        return;
      }

      // 2) 不支援：開新分頁顯示圖片（iOS 最穩），用長按儲存
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
        // 被瀏覽器阻擋彈窗時：退回直接導向 dataUrl
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
              <div className="font-bold text-base tracking-tight text-[#2D2926]">Think Studio</div>
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