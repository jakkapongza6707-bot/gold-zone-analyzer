const SUPABASE_URL =
  "https://ctolckvhfojrchzjaqyo.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_l5UISnbptCI8T6HwE7di2w_0e7ZGyqR";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ======================================================
// GLOBAL CONFIG
// ======================================================

const SYSTEM_CONFIG = {

  // ระยะที่ถือว่าแท่งแตะ Zone
  zoneTouchATR: 0.20,

  // Risk / Reward
  defaultRiskR: 1,
  defaultRewardR: 2,

  // จำกัดจำนวน Trade ที่เปิดพร้อมกัน
  oneTradeAtATime: true,

  // ถ้าแท่งเดียวโดน SL และ TP
  // ให้ถือว่า SL เกิดก่อนเพื่อความ conservative
  sameCandlePolicy: "LOSS",

  // Strength
  minimumStrength: 50,

  // MA12
  maPeriod: 12,

  // ATR
  atrPeriod: 14,

  // SD
  sdPeriod: 20,

  // W1
  enableW1: true

};


// ======================================================
// HELPERS
// ======================================================

function finiteNumber(value) {

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;

}


function clamp(value, min, max) {

  return Math.max(
    min,
    Math.min(max, value)
  );

}


function safeFixed(value, digits = 2) {

  return Number.isFinite(value)
    ? Number(value).toFixed(digits)
    : "-";

}


// ======================================================
// VOLATILITY
// ======================================================

function calculateVolatilityRegime(
  atr,
  sd
) {

  if (
    !Number.isFinite(atr) ||
    !Number.isFinite(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {

    return {

      level: "Unknown",
      icon: "⚪",
      ratio: null,
      reason:
        "ข้อมูล ATR / SD ไม่เพียงพอ"

    };

  }


  const ratio =
    sd / atr;


  if (ratio >= 2) {

    return {

      level: "Extreme Volatility",
      icon: "🔥",
      ratio,
      reason:
        "SD สูงมากเมื่อเทียบกับ ATR"

    };

  }


  if (ratio >= 1.5) {

    return {

      level: "High Volatility",
      icon: "🔴",
      ratio,
      reason:
        "SD สูงเมื่อเทียบกับ ATR"

    };

  }


  if (ratio >= 1) {

    return {

      level: "Normal Volatility",
      icon: "🟡",
      ratio,
      reason:
        "ความผันผวนอยู่ในระดับปกติ"

    };

  }


  return {

    level: "Low Volatility",
    icon: "🟢",
    ratio,
    reason:
      "SD ต่ำเมื่อเทียบกับ ATR"

  };

}


// ======================================================
// MARKET POSITION
// ======================================================

function calculateMarketPosition(
  price,
  ma12,
  atr,
  sd
) {

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(ma12) ||
    !Number.isFinite(atr) ||
    !Number.isFinite(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {

    return {

      level: "Unknown",
      icon: "⚪",
      reason:
        "ข้อมูลไม่เพียงพอ"

    };

  }


  const distance =
    price - ma12;


  const atrPosition =
    distance / atr;


  const sdPosition =
    distance / sd;


  if (
    atrPosition >= 0.75 ||
    sdPosition >= 1
  ) {

    return {

      level: "Upper Range",
      icon: "🔴",

      reason:
        "ราคาอยู่เหนือ MA12 และเข้า Upper Range",

      atrPosition,
      sdPosition

    };

  }


  if (
    atrPosition <= -0.75 ||
    sdPosition <= -1
  ) {

    return {

      level: "Lower Range",
      icon: "🟢",

      reason:
        "ราคาอยู่ต่ำกว่า MA12 และเข้า Lower Range",

      atrPosition,
      sdPosition

    };

  }


  return {

    level: "Middle Range",
    icon: "🟡",

    reason:
      "ราคาอยู่บริเวณรอบ MA12",

    atrPosition,
    sdPosition

  };

}


// ======================================================
// MARKET FEATURES
// ======================================================

function calculateMarketFeatures(
  price,
  ma12,
  atr,
  sd
) {

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(ma12) ||
    !Number.isFinite(atr) ||
    !Number.isFinite(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {

    return null;

  }


  const distance =
    price - ma12;


  return {

    atr,
    sd,

    sdAtrRatio:
      sd / atr,

    priceDistance:
      distance,

    absoluteDistance:
      Math.abs(distance),

    distanceATR:
      Math.abs(distance) / atr,

    distanceSD:
      Math.abs(distance) / sd

  };

}


// ======================================================
// STRENGTH
// ======================================================

function getStrengthLabel(score) {

  if (score >= 80) {

    return {

      label: "Strong",
      icon: "🔥"

    };

  }


  if (score >= 60) {

    return {

      label: "Moderate",
      icon: "🟡"

    };

  }


  if (score >= 40) {

    return {

      label: "Weak",
      icon: "🟠"

    };

  }


  return {

    label: "Low",
    icon: "⚪"

  };

}


// ======================================================
// ZONE CREATOR
// ======================================================

function createZones(
  ma12,
  atr,
  sd,
  type
) {

  if (
    !Number.isFinite(ma12) ||
    !Number.isFinite(atr) ||
    !Number.isFinite(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {

    return [];

  }


  return [

    {
      name: `${type} +1 ATR`,
      price: ma12 + atr,
      type,
      atr,
      sd
    },

    {
      name: `${type} +0.75 ATR`,
      price: ma12 + atr * 0.75,
      type,
      atr,
      sd
    },

    {
      name: `${type} +0.50 ATR`,
      price: ma12 + atr * 0.50,
      type,
      atr,
      sd
    },

    {
      name: `${type} +0.25 ATR`,
      price: ma12 + atr * 0.25,
      type,
      atr,
      sd
    },

    {
      name: `${type} MA12`,
      price: ma12,
      type,
      atr,
      sd
    },

    {
      name: `${type} -0.25 ATR`,
      price: ma12 - atr * 0.25,
      type,
      atr,
      sd
    },

    {
      name: `${type} -0.50 ATR`,
      price: ma12 - atr * 0.50,
      type,
      atr,
      sd
    },

    {
      name: `${type} -0.75 ATR`,
      price: ma12 - atr * 0.75,
      type,
      atr,
      sd
    },

    {
      name: `${type} -1 ATR`,
      price: ma12 - atr,
      type,
      atr,
      sd
    },

    {
      name: `${type} +1 SD`,
      price: ma12 + sd,
      type,
      atr,
      sd
    },

    {
      name: `${type} +2 SD`,
      price: ma12 + sd * 2,
      type,
      atr,
      sd
    },

    {
      name: `${type} -1 SD`,
      price: ma12 - sd,
      type,
      atr,
      sd
    },

    {
      name: `${type} -2 SD`,
      price: ma12 - sd * 2,
      type,
      atr,
      sd
    }

  ];

}


// ======================================================
// STRENGTH ENGINE
// ======================================================

function calculateStrength(
  zone,
  referencePrice,
  allZones
) {

  let score = 20;

  const reasons = [];


  // --------------------------------------------------
  // TIMEFRAME
  // --------------------------------------------------

  if (zone.type === "W1") {

    score += 25;

    reasons.push(
      "W1 Zone มีน้ำหนักสูง"
    );

  } else {

    score += 15;

    reasons.push(
      "D1 Zone"
    );

  }


  // --------------------------------------------------
  // DISTANCE
  // --------------------------------------------------

  const distance =
    Math.abs(
      zone.price -
      referencePrice
    );


  const distanceATR =
    zone.atr > 0
      ? distance / zone.atr
      : Infinity;


  if (distanceATR <= 0.25) {

    score += 20;

    reasons.push(
      "อยู่ใกล้ราคาปัจจุบันมาก"
    );

  }

  else if (distanceATR <= 0.50) {

    score += 15;

    reasons.push(
      "อยู่ใกล้ราคาปัจจุบัน"
    );

  }

  else if (distanceATR <= 1) {

    score += 8;

    reasons.push(
      "อยู่ในระยะ 1 ATR"
    );

  }


  // --------------------------------------------------
  // MA12
  // --------------------------------------------------

  if (
    zone.name.includes("MA12")
  ) {

    score += 8;

    reasons.push(
      "MA12 Reference"
    );

  }


  // --------------------------------------------------
  // ATR
  // --------------------------------------------------

  if (
    zone.name.includes("ATR")
  ) {

    const match =
      zone.name.match(
        /([+-]?[0-9.]+) ATR/
      );


    if (match) {

      const multiple =
        Math.abs(
          Number(match[1])
        );


      if (
        multiple === 0.5 ||
        multiple === 1
      ) {

        score += 8;

        reasons.push(
          "ATR Level สำคัญ"
        );

      }

    }

  }


  // --------------------------------------------------
  // SD
  // --------------------------------------------------

  if (
    zone.name.includes("SD")
  ) {

    const match =
      zone.name.match(
        /([+-]?[0-9.]+) SD/
      );


    if (match) {

      const multiple =
        Math.abs(
          Number(match[1])
        );


      if (multiple >= 1) {

        score += 7;

        reasons.push(
          "Standard Deviation Level"
        );

      }

    }

  }


  // --------------------------------------------------
  // CONFLUENCE
  // --------------------------------------------------

  const confluence =
    allZones.some(
      other => {

        if (
          other === zone
        ) {
          return false;
        }


        if (
          other.type === zone.type
        ) {
          return false;
        }


        const referenceATR =
          Math.min(
            zone.atr,
            other.atr
          );


        if (
          !Number.isFinite(
            referenceATR
          ) ||
          referenceATR <= 0
        ) {

          return false;

        }


        return (
          Math.abs(
            zone.price -
            other.price
          ) <=
          referenceATR * 0.20
        );

      }
    );


  if (confluence) {

    score += 17;

    zone.hasConfluence =
      true;

    reasons.push(
      "D1 + W1 Confluence"
    );

  }


  score =
    clamp(
      Math.round(score),
      0,
      100
    );


  return {

    score,
    reasons

  };

}


// ======================================================
// CSV PARSER
// ======================================================

function parseCSV(text) {

  if (
    !text ||
    !text.trim()
  ) {

    throw new Error(
      "ไฟล์ CSV ว่างเปล่า"
    );

  }


  const lines =
    text
      .replace(/^\uFEFF/, "")
      .trim()
      .split(/\r?\n/)
      .filter(
        line =>
          line.trim()
      );


  if (
    lines.length < 2
  ) {

    throw new Error(
      "CSV ต้องมี Header และข้อมูล"
    );

  }


  const delimiter =
    lines[0].includes(";")
      ? ";"
      : ",";


  const headers =
    lines[0]
      .split(delimiter)
      .map(
        h =>
          h
            .trim()
            .replace(/^"|"$/g, "")
            .toLowerCase()
      );


  const findColumn =
    names => {

      for (
        const name of names
      ) {

        const index =
          headers.indexOf(name);


        if (
          index >= 0
        ) {

          return index;

        }

      }


      return -1;

    };


  const dateIndex =
    findColumn([
      "date",
      "datetime",
      "time"
    ]);


  const openIndex =
    findColumn(["open"]);


  const highIndex =
    findColumn(["high"]);


  const lowIndex =
    findColumn(["low"]);


  const closeIndex =
    findColumn(["close"]);


  if (
    openIndex < 0 ||
    highIndex < 0 ||
    lowIndex < 0 ||
    closeIndex < 0
  ) {

    throw new Error(
      "CSV ต้องมี Open, High, Low, Close"
    );

  }


  const candles = [];


  for (
    let i = 1;
    i < lines.length;
    i++
  ) {

    const parts =
      lines[i]
        .split(delimiter)
        .map(
          v =>
            v
              .trim()
              .replace(/^"|"$/g, "")
        );


    const open =
      finiteNumber(
        String(
          parts[openIndex]
        ).replace(/,/g, "")
      );


    const high =
      finiteNumber(
        String(
          parts[highIndex]
        ).replace(/,/g, "")
      );


    const low =
      finiteNumber(
        String(
          parts[lowIndex]
        ).replace(/,/g, "")
      );


    const close =
      finiteNumber(
        String(
          parts[closeIndex]
        ).replace(/,/g, "")
      );


    if (
      open === null ||
      high === null ||
      low === null ||
      close === null
    ) {

      continue;

    }


    if (
      high < low ||
      high < open ||
      high < close ||
      low > open ||
      low > close
    ) {

      continue;

    }


    candles.push({

      date:
        dateIndex >= 0
          ? parts[dateIndex]
          : String(i),

      open,
      high,
      low,
      close

    });

  }


  if (
    !candles.length
  ) {

    throw new Error(
      "ไม่พบข้อมูล OHLC"
    );

  }


  return candles;

}


// ======================================================
// INDICATORS
// ======================================================

function calculateSMA(
  values
) {

  if (
    !values.length
  ) {

    return null;

  }


  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    values.length
  );

}


function calculateStdDev(
  values
) {

  if (
    !values.length
  ) {

    return null;

  }


  const mean =
    calculateSMA(
      values
    );


  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - mean,
          2
        ),
      0
    ) /
    values.length;


  return Math.sqrt(
    variance
  );

}


// ======================================================
// HISTORICAL FEATURES
//
// IMPORTANT:
// index = candle ที่ปิดแล้ว
// ทุก indicator ใช้ข้อมูลถึง index เท่านั้น
// ไม่มีข้อมูลอนาคต
// ======================================================

function calculateHistoricalFeatures(
  candles,
  index
) {

  const maPeriod =
    SYSTEM_CONFIG.maPeriod;


  const atrPeriod =
    SYSTEM_CONFIG.atrPeriod;


  const sdPeriod =
    SYSTEM_CONFIG.sdPeriod;


  if (
    index <
    Math.max(
      maPeriod - 1,
      atrPeriod,
      sdPeriod
    )
  ) {

    return null;

  }


  // --------------------------------------------------
  // MA12
  // --------------------------------------------------

  const maValues =
    candles
      .slice(
        index - maPeriod + 1,
        index + 1
      )
      .map(
        c => c.close
      );


  if (
    maValues.length <
    maPeriod
  ) {

    return null;

  }


  const ma12 =
    calculateSMA(
      maValues
    );


  // --------------------------------------------------
  // SD20
  // --------------------------------------------------

  const sdValues =
    candles
      .slice(
        index - sdPeriod + 1,
        index + 1
      )
      .map(
        c => c.close
      );


  if (
    sdValues.length <
    sdPeriod
  ) {

    return null;

  }


  const sd =
    calculateStdDev(
      sdValues
    );


  // --------------------------------------------------
  // ATR14
  // --------------------------------------------------

  const trueRanges = [];


  const start =
    index -
    atrPeriod +
    1;


  for (
    let j = start;
    j <= index;
    j++
  ) {

    if (
      j <= 0
    ) {

      continue;

    }


    const candle =
      candles[j];


    const previous =
      candles[j - 1];


    const tr =
      Math.max(

        candle.high -
        candle.low,

        Math.abs(
          candle.high -
          previous.close
        ),

        Math.abs(
          candle.low -
          previous.close
        )

      );


    trueRanges.push(
      tr
    );

  }


  if (
    trueRanges.length <
    atrPeriod
  ) {

    return null;

  }


  const atr =
    calculateSMA(
      trueRanges
    );


  if (
    !Number.isFinite(ma12) ||
    !Number.isFinite(atr) ||
    !Number.isFinite(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {

    return null;

  }


  return {

    ma12,
    atr,
    sd

  };

}


// ======================================================
// HISTORICAL ZONES
// ======================================================

function createHistoricalZones(
  candles,
  index
) {

  const features =
    calculateHistoricalFeatures(
      candles,
      index
    );


  if (!features) {

    return null;

  }


  const zones =
    createZones(
      features.ma12,
      features.atr,
      features.sd,
      "D1"
    );


  return {

    features,
    zones

  };

}


// ======================================================
// ZONE TOUCH
// ======================================================

function candleTouchesZone(
  candle,
  zone
) {

  const tolerance =
    zone.atr *
    SYSTEM_CONFIG.zoneTouchATR;


  return (

    candle.low <=
    zone.price + tolerance &&

    candle.high >=
    zone.price - tolerance

  );

}


// ======================================================
// ENTRY DIRECTION
// ======================================================

function getZoneDirection(
  zone,
  referencePrice
) {

  if (
    zone.price <
    referencePrice
  ) {

    return "LONG";

  }


  if (
    zone.price >
    referencePrice
  ) {

    return "SHORT";

  }


  return null;

}


// ======================================================
// TRADE SIMULATOR
// ======================================================

function simulateTrade(
  candles,
  entryIndex,
  direction,
  entry,
  atr,
  riskR,
  rewardR
) {

  if (
    !Number.isFinite(entry) ||
    !Number.isFinite(atr) ||
    atr <= 0
  ) {

    return null;

  }


  const risk =
    atr *
    riskR;


  const reward =
    atr *
    rewardR;


  const stop =
    direction === "LONG"
      ? entry - risk
      : entry + risk;


  const target =
    direction === "LONG"
      ? entry + reward
      : entry - reward;


  for (
    let j =
      entryIndex;
    j < candles.length;
    j++
  ) {

    const candle =
      candles[j];


    let hitStop = false;
    let hitTarget = false;


    if (
      direction === "LONG"
    ) {

      hitStop =
        candle.low <= stop;


      hitTarget =
        candle.high >= target;

    }

    else {

      hitStop =
        candle.high >= stop;


      hitTarget =
        candle.low <= target;

    }


    // ------------------------------------------------
    // Both hit in same candle
    // ------------------------------------------------

    if (
      hitStop &&
      hitTarget
    ) {

      return {

        result:
          SYSTEM_CONFIG.sameCandlePolicy,

        r:
          SYSTEM_CONFIG.sameCandlePolicy === "WIN"
            ? rewardR
            : -riskR,

        exit:
          SYSTEM_CONFIG.sameCandlePolicy === "WIN"
            ? target
            : stop,

        exitIndex:
          j

      };

    }


    // ------------------------------------------------
    // Target
    // ------------------------------------------------

    if (
      hitTarget
    ) {

      return {

        result:
          "WIN",

        r:
          rewardR,

        exit:
          target,

        exitIndex:
          j

      };

    }


    // ------------------------------------------------
    // Stop
    // ------------------------------------------------

    if (
      hitStop
    ) {

      return {

        result:
          "LOSS",

        r:
          -riskR,

        exit:
          stop,

        exitIndex:
          j

      };

    }

  }


  return null;

}


// ======================================================
// BACKTEST ENGINE
//
// NEW LOGIC
//
// 1. Candle i-1 ปิด
// 2. ใช้ข้อมูลถึง i-1 สร้าง Zone
// 3. Candle i เป็น candle ที่ตรวจ Zone touch
// 4. Entry ที่ราคา Zone
// 5. SL / TP เริ่มตรวจจาก candle i
// 6. ระหว่าง Trade ไม่เปิด Trade ใหม่
// ======================================================

function runBacktest(
  candles,
  minStrength,
  riskR,
  rewardR
) {

  const trades = [];


  if (
    !Array.isArray(candles) ||
    candles.length < 50
  ) {

    return trades;

  }


  let nextAvailableIndex = 0;


  for (
    let i = 1;
    i < candles.length;
    i++
  ) {

    if (
      i <
      nextAvailableIndex
    ) {

      continue;

    }


    const previousIndex =
      i - 1;


    const historical =
      createHistoricalZones(
        candles,
        previousIndex
      );


    if (!historical) {

      continue;

    }


    const referenceCandle =
      candles[previousIndex];


    const signalCandle =
      candles[i];


    const zones =
      historical.zones;


    // ------------------------------------------------
    // Strength calculated BEFORE trade
    // ------------------------------------------------

    zones.forEach(
      zone => {

        const strength =
          calculateStrength(
            zone,
            referenceCandle.close,
            zones
          );


        zone.strength =
          strength.score;


        zone.reasons =
          strength.reasons;

      }
    );


    // ------------------------------------------------
    // Find zones touched by next candle
    // ------------------------------------------------

    const touchedZones =
      zones
        .filter(
          zone =>
            zone.strength >=
            minStrength
        )
        .filter(
          zone =>
            candleTouchesZone(
              signalCandle,
              zone
            )
        );


    if (
      !touchedZones.length
    ) {

      continue;

    }


    // ------------------------------------------------
    // Select strongest touched zone
    // ------------------------------------------------

    touchedZones.sort(
      (a,b) => {

        if (
          b.strength !==
          a.strength
        ) {

          return (
            b.strength -
            a.strength
          );

        }


        const da =
          Math.abs(
            a.price -
            referenceCandle.close
          );


        const db =
          Math.abs(
            b.price -
            referenceCandle.close
          );


        return da - db;

      }
    );


    const selectedZone =
      touchedZones[0];


    const direction =
      getZoneDirection(
        selectedZone,
        referenceCandle.close
      );


    if (!direction) {

      continue;

    }


    // ------------------------------------------------
    // Entry
    // ------------------------------------------------

    const entry =
      selectedZone.price;


    // ------------------------------------------------
    // Simulate
    // ------------------------------------------------

    const outcome =
      simulateTrade(
        candles,
        i,
        direction,
        entry,
        historical.features.atr,
        riskR,
        rewardR
      );


    if (!outcome) {

      continue;

    }


    const trade = {

      date:
        signalCandle.date,

      side:
        direction,

      direction,

      entry,

      stop:
        direction === "LONG"
          ? entry -
            historical.features.atr *
            riskR
          : entry +
            historical.features.atr *
            riskR,

      target:
        direction === "LONG"
          ? entry +
            historical.features.atr *
            rewardR
          : entry -
            historical.features.atr *
            rewardR,

      zone:
        selectedZone.name,

      zoneType:
        selectedZone.type,

      strength:
        selectedZone.strength,

      reasons:
        selectedZone.reasons,

      result:
        outcome.result,

      r:
        outcome.r,

      exit:
        outcome.exit,

      entryIndex:
        i,

      exitIndex:
        outcome.exitIndex,

      atr:
        historical.features.atr,

      ma12:
        historical.features.ma12,

      sd:
        historical.features.sd,

      referenceClose:
        referenceCandle.close

    };


    trades.push(
      trade
    );


    // ------------------------------------------------
    // One Trade At A Time
    // ------------------------------------------------

    if (
      SYSTEM_CONFIG.oneTradeAtATime
    ) {

      nextAvailableIndex =
        outcome.exitIndex + 1;

    }

  }


  return trades;

}


// ======================================================
// BACKTEST STATS
// ======================================================

function calculateBacktestStats(
  trades
) {

  if (
    !trades.length
  ) {

    return {

      total: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      averageR: 0,
      expectancy: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      totalR: 0,
      grossProfit: 0,
      grossLoss: 0

    };

  }


  const wins =
    trades.filter(
      t =>
        t.result === "WIN"
    );


  const losses =
    trades.filter(
      t =>
        t.result === "LOSS"
    );


  const totalR =
    trades.reduce(
      (sum,t) =>
        sum + t.r,
      0
    );


  const averageR =
    totalR /
    trades.length;


  const winRate =
    wins.length /
    trades.length *
    100;


  const grossProfit =
    wins.reduce(
      (sum,t) =>
        sum + Math.max(0,t.r),
      0
    );


  const grossLoss =
    Math.abs(
      losses.reduce(
        (sum,t) =>
          sum + Math.min(0,t.r),
        0
      )
    );


  const profitFactor =
    grossLoss > 0
      ? grossProfit /
        grossLoss
      : Infinity;


  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;


  trades.forEach(
    trade => {

      equity +=
        trade.r;


      peak =
        Math.max(
          peak,
          equity
        );


      const drawdown =
        peak -
        equity;


      maxDrawdown =
        Math.max(
          maxDrawdown,
          drawdown
        );

    }
  );


  return {

    total:
      trades.length,

    wins:
      wins.length,

    losses:
      losses.length,

    winRate,

    averageR,

    expectancy:
      averageR,

    profitFactor,

    maxDrawdown,

    totalR,

    grossProfit,

    grossLoss

  };

}


// ======================================================
// DIRECTION STATS
// ======================================================

function calculateDirectionStats(
  trades
) {

  const directions = {

    LONG: [],
    SHORT: []

  };


  trades.forEach(
    trade => {

      if (
        directions[trade.direction]
      ) {

        directions[
          trade.direction
        ].push(
          trade
        );

      }

    }
  );


  return Object.entries(
    directions
  )
    .map(
      ([direction,list]) => {

        const stats =
          calculateBacktestStats(
            list
          );


        return {

          direction,

          ...stats

        };

      }
    );

}


// ======================================================
// ZONE STATS
// ======================================================

function calculateZoneStats(
  trades
) {

  const groups = {};


  trades.forEach(
    trade => {

      if (
        !groups[trade.zone]
      ) {

        groups[trade.zone] = [];

      }


      groups[
        trade.zone
      ].push(
        trade
      );

    }
  );


  return Object.entries(
    groups
  )
    .map(
      ([zone,list]) => {

        return {

          zone,

          ...calculateBacktestStats(
            list
          )

        };

      }
    )
    .sort(
      (a,b) =>
        b.totalR -
        a.totalR
    );

}


// ======================================================
// STRENGTH STATS
// ======================================================

function calculateStrengthStats(
  trades
) {

  const ranges = {

    "50-59": [],
    "60-69": [],
    "70-79": [],
    "80-89": [],
    "90-100": []

  };


  trades.forEach(
    trade => {

      const strength =
        trade.strength;


      if (
        strength < 60
      ) {

        ranges["50-59"].push(
          trade
        );

      }

      else if (
        strength < 70
      ) {

        ranges["60-69"].push(
          trade
        );

      }

      else if (
        strength < 80
      ) {

        ranges["70-79"].push(
          trade
        );

      }

      else if (
        strength < 90
      ) {

        ranges["80-89"].push(
          trade
        );

      }

      else {

        ranges["90-100"].push(
          trade
        );

      }

    }
  );


  return Object.entries(
    ranges
  )
    .map(
      ([range,list]) => {

        return {

          range,

          ...calculateBacktestStats(
            list
          )

        };

      }
    );

}


// ======================================================
// STRENGTH SWEEP
// ======================================================

function runStrengthSweep(
  candles,
  riskR,
  rewardR
) {

  const rows = [];


  for (
    let strength = 40;
    strength <= 80;
    strength += 5
  ) {

    const trades =
      runBacktest(
        candles,
        strength,
        riskR,
        rewardR
      );


    const stats =
      calculateBacktestStats(
        trades
      );


    rows.push({

      strength,

      trades:
        stats.total,

      wins:
        stats.wins,

      losses:
        stats.losses,

      winRate:
        stats.winRate,

      expectancy:
        stats.expectancy,

      profitFactor:
        stats.profitFactor,

      totalR:
        stats.totalR,

      maxDrawdown:
        stats.maxDrawdown

    });

  }


  return rows;

}


// ======================================================
// EQUITY CURVE
// ======================================================

function calculateEquityCurve(
  trades
) {

  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;


  const curve = [];


  trades.forEach(
    (trade,index) => {

      equity +=
        trade.r;


      peak =
        Math.max(
          peak,
          equity
        );


      const drawdown =
        peak -
        equity;


      maxDrawdown =
        Math.max(
          maxDrawdown,
          drawdown
        );


      curve.push({

        trade:
          index + 1,

        date:
          trade.date,

        equity,

        drawdown

      });

    }
  );


  return {

    curve,

    finalEquity:
      equity,

    maxDrawdown

  };

}


// ======================================================
// SUPABASE LOAD
// ======================================================

async function loadSavedData() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("gold_settings")
        .select("*")
        .eq("id",1)
        .maybeSingle();


    if (error) {

      console.error(
        "โหลดข้อมูลไม่สำเร็จ:",
        error
      );

      return;

    }


    if (!data) {

      return;

    }


    const ids = {

      price:
        data.price,

      d1ma12:
        data.d1ma12,

      d1atr:
        data.d1atr,

      d1sd:
        data.d1sd,

      d1ma247:
        data.d1ma247,

      w1ma12:
        data.w1ma12,

      w1atr:
        data.w1atr,

      w1sd:
        data.w1sd

    };


    Object.entries(
      ids
    ).forEach(
      ([id,value]) => {

        const element =
          document.getElementById(
            id
          );


        if (element) {

          element.value =
            value ?? "";

        }

      }
    );

  }

  catch(error) {

    console.error(
      error
    );

  }

}


// ======================================================
// LIVE ANALYSIS
// ======================================================

function runLiveAnalysis() {

  const price =
    finiteNumber(
      document.getElementById(
        "price"
      )?.value
    );


  const d1ma12 =
    finiteNumber(
      document.getElementById(
        "d1ma12"
      )?.value
    );


  const d1atr =
    finiteNumber(
      document.getElementById(
        "d1atr"
      )?.value
    );


  const d1sd =
    finiteNumber(
      document.getElementById(
        "d1sd"
      )?.value
    );


  const d1ma247 =
    finiteNumber(
      document.getElementById(
        "d1ma247"
      )?.value
    );


  const w1ma12 =
    finiteNumber(
      document.getElementById(
        "w1ma12"
      )?.value
    );


  const w1atr =
    finiteNumber(
      document.getElementById(
        "w1atr"
      )?.value
    );


  const w1sd =
    finiteNumber(
      document.getElementById(
        "w1sd"
      )?.value
    );


  if (
    price === null
  ) {

    alert(
      "กรุณากรอกราคาทอง"
    );

    return;

  }


  const d1Complete =
    d1ma12 !== null &&
    d1atr !== null &&
    d1sd !== null;


  const w1Complete =
    w1ma12 !== null &&
    w1atr !== null &&
    w1sd !== null;


  if (
    !d1Complete &&
    !w1Complete
  ) {

    alert(
      "กรุณากรอก D1 หรือ W1 ให้ครบ"
    );

    return;

  }


  if (
    d1ma12 !== null ||
    d1atr !== null ||
    d1sd !== null
  ) {

    if (!d1Complete) {

      alert(
        "ข้อมูล D1 ต้องมี MA12 + ATR14 + SD20"
      );

      return;

    }

  }


  if (
    w1ma12 !== null ||
    w1atr !== null ||
    w1sd !== null
  ) {

    if (!w1Complete) {

      alert(
        "ข้อมูล W1 ต้องมี MA12 + ATR14 + SD20"
      );

      return;

    }

  }


  // --------------------------------------------------
  // Save
  // --------------------------------------------------

  supabaseClient
    .from("gold_settings")
    .upsert({

      id: 1,

      price,

      d1ma12,
      d1atr,
      d1sd,
      d1ma247,

      w1ma12,
      w1atr,
      w1sd

    })
    .then(
      response => {

        if (
          response.error
        ) {

          console.error(
            response.error
          );

        }

      }
    );


  // --------------------------------------------------
  // Zones
  // --------------------------------------------------

  const d1Zones =
    d1Complete
      ? createZones(
          d1ma12,
          d1atr,
          d1sd,
          "D1"
        )
      : [];


  const w1Zones =
    w1Complete &&
    SYSTEM_CONFIG.enableW1
      ? createZones(
          w1ma12,
          w1atr,
          w1sd,
          "W1"
        )
      : [];


  const allZones = [

    ...d1Zones,
    ...w1Zones

  ];


  allZones.forEach(
    zone => {

      zone.distance =
        Math.abs(
          zone.price -
          price
        );


      zone.above =
        zone.price >
        price;


      const strength =
        calculateStrength(
          zone,
          price,
          allZones
        );


      zone.strength =
        strength.score;


      zone.reasons =
        strength.reasons;


      zone.strengthLabel =
        getStrengthLabel(
          zone.strength
        );

    }
  );


  const supports =
    allZones
      .filter(
        z =>
          z.price <
          price
      )
      .sort(
        (a,b) =>
          b.price -
          a.price
      );


  const resistances =
    allZones
      .filter(
        z =>
          z.price >
          price
      )
      .sort(
        (a,b) =>
          a.price -
          b.price
      );


  const nearestSupport =
    supports[0] ||
    null;


  const nearestResistance =
    resistances[0] ||
    null;


  const analysisMA12 =
    d1Complete
      ? d1ma12
      : w1ma12;


  const analysisATR =
    d1Complete
      ? d1atr
      : w1atr;


  const analysisSD =
    d1Complete
      ? d1sd
      : w1sd;


  const volatility =
    calculateVolatilityRegime(
      analysisATR,
      analysisSD
    );


  const marketPosition =
    calculateMarketPosition(
      price,
      analysisMA12,
      analysisATR,
      analysisSD
    );


  const marketFeatures =
    calculateMarketFeatures(
      price,
      analysisMA12,
      analysisATR,
      analysisSD
    );


  const results =
    document.getElementById(
      "results"
    );


  if (!results) {

    return;

  }


  results.innerHTML = "";


  const mode =
    d1Complete &&
    w1Complete
      ? "D1 + W1"
      : d1Complete
        ? "D1 Only"
        : "W1 Only";


  results.innerHTML += `

    <div class="panel">

      <div class="panel-title">
        📊 MARKET ANALYSIS
      </div>

      <div class="analysis-grid">

        <div class="feature-card">

          <div class="feature-label">
            VOLATILITY REGIME
          </div>

          <div class="feature-value">
            ${volatility.icon}
            ${volatility.level}
          </div>

          <div class="nearest-info">

            ${volatility.reason}

            <br>

            ${
              volatility.ratio !== null
                ? `SD / ATR =
                   ${volatility.ratio.toFixed(2)}`
                : ""
            }

          </div>

        </div>


        <div class="feature-card">

          <div class="feature-label">
            MARKET POSITION
          </div>

          <div class="feature-value">
            ${marketPosition.icon}
            ${marketPosition.level}
          </div>

          <div class="nearest-info">
            ${marketPosition.reason}
          </div>

        </div>

      </div>


      ${
        marketFeatures
          ? `

            <div
              class="feature-card"
              style="margin-top:10px"
            >

              <div class="feature-label">
                📐 MARKET FEATURES
              </div>

              <div
                class="analysis-grid"
                style="margin-top:10px"
              >

                <div>
                  ATR
                  <strong>
                    ${safeFixed(
                      marketFeatures.atr
                    )}
                  </strong>
                </div>

                <div>
                  SD
                  <strong>
                    ${safeFixed(
                      marketFeatures.sd
                    )}
                  </strong>
                </div>

                <div>
                  SD / ATR
                  <strong>
                    ${safeFixed(
                      marketFeatures.sdAtrRatio
                    )}
                  </strong>
                </div>

                <div>
                  Distance / ATR
                  <strong>
                    ${safeFixed(
                      marketFeatures.distanceATR
                    )}
                  </strong>
                </div>

                <div>
                  Distance / SD
                  <strong>
                    ${safeFixed(
                      marketFeatures.distanceSD
                    )}
                  </strong>
                </div>

                <div>
                  Price − MA12
                  <strong>
                    ${safeFixed(
                      marketFeatures.priceDistance
                    )}
                  </strong>
                </div>

              </div>

            </div>

          `
          : ""
      }

    </div>

  `;


  results.innerHTML += `

    <div class="result-header">

      <div>

        <h2 style="margin:0">
          🎯 Gold Zones
        </h2>

        <div class="nearest-info">

          ราคาอ้างอิง
          ${price.toFixed(2)}

        </div>

      </div>

      <div class="result-count">
        ${mode}
      </div>

    </div>

  `;


  results.innerHTML += `

    <div class="nearest-panel">

      <div class="nearest-card">

        <div class="nearest-label">
          🟢 NEAREST SUPPORT
        </div>

        ${
          nearestSupport
            ? `

              <div class="nearest-price">
                ${nearestSupport.price.toFixed(2)}
              </div>

              <div class="nearest-info">

                ${nearestSupport.name}

                <br>

                Distance:
                ${nearestSupport.distance.toFixed(2)}

                <br>

                Strength:
                ${nearestSupport.strength}/100

              </div>

            `
            : `
              <div class="nearest-info">
                ไม่พบ Support
              </div>
            `
        }

      </div>


      <div class="nearest-card">

        <div class="nearest-label">
          🔴 NEAREST RESISTANCE
        </div>

        ${
          nearestResistance
            ? `

              <div class="nearest-price">
                ${nearestResistance.price.toFixed(2)}
              </div>

              <div class="nearest-info">

                ${nearestResistance.name}

                <br>

                Distance:
                ${nearestResistance.distance.toFixed(2)}

                <br>

                Strength:
                ${nearestResistance.strength}/100

              </div>

            `
            : `
              <div class="nearest-info">
                ไม่พบ Resistance
              </div>
            `
        }

      </div>

    </div>

  `;


  // --------------------------------------------------
  // CONFLUENCE
  // --------------------------------------------------

  const confluences = [];


  if (
    d1Complete &&
    w1Complete
  ) {

    d1Zones.forEach(
      d1 => {

        w1Zones.forEach(
          w1 => {

            const threshold =
              Math.min(
                d1.atr,
                w1.atr
              ) * 0.20;


            const difference =
              Math.abs(
                d1.price -
                w1.price
              );


            if (
              difference <=
              threshold
            ) {

              confluences.push({
                d1,
                w1
              });

            }

          }
        );

      }
    );

  }


  if (
    confluences.length
  ) {

    results.innerHTML += `

      <h3>
        🔗 Zone Confluence
      </h3>

    `;


    confluences
      .slice(0,5)
      .forEach(
        group => {

          const strength =
            Math.round(
              (
                group.d1.strength +
                group.w1.strength
              ) / 2
            );


          results.innerHTML += `

            <div class="confluence-box">

              <div class="confluence-title">
                🔥 D1 + W1 CONFLUENCE
              </div>

              <div class="confluence-price">

                ${Math.min(
                  group.d1.price,
                  group.w1.price
                ).toFixed(2)}

                —

                ${Math.max(
                  group.d1.price,
                  group.w1.price
                ).toFixed(2)}

              </div>

              <div class="nearest-info">

                D1:
                ${group.d1.name}

                <br>

                W1:
                ${group.w1.name}

                <br>

                Combined Strength:
                ${strength}/100

              </div>

            </div>

          `;

        }
      );

  }


  // --------------------------------------------------
  // ZONE LIST
  // --------------------------------------------------

  results.innerHTML += `

    <h3>
      📍 Zone Analysis
    </h3>

  `;


  allZones
    .sort(
      (a,b) =>
        a.distance -
        b.distance
    )
    .slice(0,15)
    .forEach(
      (zone,index) => {

        results.innerHTML += `

          <div
            class="zone ${
              zone.above
                ? "above"
                : "below"
            }"
          >

            <div class="zone-main">

              <div class="zone-name">

                ${
                  index === 0
                    ? "⭐ "
                    : ""
                }

                ${zone.name}

              </div>

              <div class="zone-price">
                ${zone.price.toFixed(2)}
              </div>

              <div class="strength-box">

                <div class="strength-title">

                  ${zone.strengthLabel.icon}

                  Strength

                </div>

                <div class="strength-score">

                  ${zone.strength}/100

                  ${zone.strengthLabel.label}

                </div>

                <div class="strength-bar">

                  <div
                    class="strength-fill"
                    style="
                      width:${zone.strength}%
                    "
                  ></div>

                </div>

                <div class="why-title">
                  WHY THIS ZONE?
                </div>

                <ul class="why-list">

                  ${
                    zone.reasons
                      .slice(0,5)
                      .map(
                        r =>
                          `<li>${r}</li>`
                      )
                      .join("")
                  }

                </ul>

              </div>

            </div>

            <div class="zone-distance">

              ${
                zone.above
                  ? "⬆️ ด้านบน"
                  : "⬇️ ด้านล่าง"
              }

              <br>

              ห่าง
              ${zone.distance.toFixed(2)}

            </div>

          </div>

        `;

      }

    );

}


// ======================================================
// ANALYZE BUTTON
// ======================================================

const analyzeButton =
  document.querySelector(
    ".analyze-btn"
  );


if (
  analyzeButton
) {

  analyzeButton.addEventListener(
    "click",
    runLiveAnalysis
  );

}


// ======================================================
// FILE SELECT
// ======================================================

let selectedCSV = "";


const backtestFile =
  document.getElementById(
    "backtestFile"
  );


if (
  backtestFile
) {

  backtestFile.addEventListener(
    "change",
    async function(event) {

      const file =
        event.target.files[0];


      if (!file) {

        selectedCSV = "";


        const status =
          document.getElementById(
            "fileStatus"
          );


        if (status) {

          status.textContent =
            "ยังไม่ได้เลือกไฟล์";

        }


        return;

      }


      try {

        selectedCSV =
          await file.text();


        const candles =
          parseCSV(
            selectedCSV
          );


        const status =
          document.getElementById(
            "fileStatus"
          );


        if (status) {

          status.textContent =
            `✅ ${file.name} • อ่านได้ ${candles.length.toLocaleString()} แท่ง`;

        }

      }

      catch(error) {

        selectedCSV = "";


        const status =
          document.getElementById(
            "fileStatus"
          );


        if (status) {

          status.textContent =
            "❌ อ่านไฟล์ไม่ได้: " +
            error.message;

        }

      }

    }
  );

}


// ======================================================
// BACKTEST RENDER
// ======================================================

function renderBacktest(
  output,
  candles,
  trades,
  strengthSweep
) {

  const stats =
    calculateBacktestStats(
      trades
    );


  const directionStats =
    calculateDirectionStats(
      trades
    );


  const zoneStats =
    calculateZoneStats(
      trades
    );


  const strengthStats =
    calculateStrengthStats(
      trades
    );


  const equity =
    calculateEquityCurve(
      trades
    );


  const best =
    [...strengthSweep]
      .filter(
        s =>
          s.trades >= 10
      )
      .sort(
        (a,b) =>
          b.expectancy -
          a.expectancy
      )[0];


  const section =
    document.createElement(
      "div"
    );


  section.className =
    "panel";


  section.style.marginTop =
    "20px";


  section.innerHTML = `

    <div class="panel-title">
      🧪 BACKTEST RESULTS — NEW ENGINE
    </div>


    <div class="nearest-info">

      Dataset:
      <strong>
        ${candles.length.toLocaleString()}
      </strong>
      candles

      <br>

      Logic:
      Previous Closed Candle → Zone →
      Next Candle Touch → Entry

      <br>

      Risk:
      ${SYSTEM_CONFIG.defaultRiskR}R

      |

      Reward:
      ${SYSTEM_CONFIG.defaultRewardR}R

      <br>

      Same Candle SL + TP:
      Conservative LOSS

    </div>


    <h3>
      📊 Overall Performance
    </h3>


    <div class="stats-grid">

      <div class="stat-card">

        <div class="feature-label">
          TOTAL TRADES
        </div>

        <div class="feature-value">
          ${stats.total}
        </div>

      </div>


      <div class="stat-card">

        <div class="feature-label">
          WIN RATE
        </div>

        <div class="feature-value">
          ${stats.winRate.toFixed(2)}%
        </div>

      </div>


      <div class="stat-card">

        <div class="feature-label">
          WINS
        </div>

        <div class="feature-value win">
          ${stats.wins}
        </div>

      </div>


      <div class="stat-card">

        <div class="feature-label">
          LOSSES
        </div>

        <div class="feature-value loss">
          ${stats.losses}
        </div>

      </div>


      <div class="stat-card">

        <div class="feature-label">
          TOTAL R
        </div>

        <div class="feature-value">
          ${stats.totalR.toFixed(2)}R
        </div>

      </div>


      <div class="stat-card">

        <div class="feature-label">
          EXPECTANCY
        </div>

        <div class="feature-value">
          ${stats.expectancy.toFixed(3)}R
        </div>

      </div>


      <div class="stat-card">

        <div class="feature-label">
          PROFIT FACTOR
        </div>

        <div class="feature-value">

          ${
            Number.isFinite(
              stats.profitFactor
            )
              ? stats.profitFactor.toFixed(2)
              : "∞"
          }

        </div>

      </div>


      <div class="stat-card">

        <div class="feature-label">
          MAX DRAWDOWN
        </div>

        <div class="feature-value">
          ${stats.maxDrawdown.toFixed(2)}R
        </div>

      </div>

    </div>


    <h3 style="margin-top:25px">
      ↔️ LONG vs SHORT
    </h3>


    <div style="overflow-x:auto">

      <table class="backtest-table">

        <thead>

          <tr>

            <th>Side</th>
            <th>Trades</th>
            <th>Win Rate</th>
            <th>Total R</th>
            <th>Expectancy</th>
            <th>PF</th>

          </tr>

        </thead>

        <tbody>

          ${
            directionStats
              .map(
                d => `

                  <tr>

                    <td>
                      ${d.direction}
                    </td>

                    <td>
                      ${d.total}
                    </td>

                    <td>
                      ${d.winRate.toFixed(1)}%
                    </td>

                    <td class="${
                      d.totalR >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${d.totalR.toFixed(2)}R

                    </td>

                    <td class="${
                      d.expectancy >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${d.expectancy.toFixed(3)}R

                    </td>

                    <td>

                      ${
                        Number.isFinite(
                          d.profitFactor
                        )
                          ? d.profitFactor.toFixed(2)
                          : "∞"
                      }

                    </td>

                  </tr>

                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>


    <h3 style="margin-top:25px">
      🏆 Zone Performance
    </h3>


    <div style="overflow-x:auto">

      <table class="backtest-table">

        <thead>

          <tr>

            <th>Zone</th>
            <th>Trades</th>
            <th>Win Rate</th>
            <th>Total R</th>
            <th>Exp.</th>
            <th>PF</th>
            <th>DD</th>

          </tr>

        </thead>

        <tbody>

          ${
            zoneStats
              .map(
                z => `

                  <tr>

                    <td>
                      ${z.zone}
                    </td>

                    <td>
                      ${z.total}
                    </td>

                    <td>
                      ${z.winRate.toFixed(1)}%
                    </td>

                    <td class="${
                      z.totalR >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${z.totalR.toFixed(2)}R

                    </td>

                    <td class="${
                      z.expectancy >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${z.expectancy.toFixed(3)}R

                    </td>

                    <td>

                      ${
                        Number.isFinite(
                          z.profitFactor
                        )
                          ? z.profitFactor.toFixed(2)
                          : "∞"
                      }

                    </td>

                    <td>
                      ${z.maxDrawdown.toFixed(2)}R
                    </td>

                  </tr>

                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>


    <h3 style="margin-top:25px">
      💪 Strength Distribution
    </h3>


    <div style="overflow-x:auto">

      <table class="backtest-table">

        <thead>

          <tr>

            <th>Strength</th>
            <th>Trades</th>
            <th>Win Rate</th>
            <th>Exp.</th>
            <th>Total R</th>

          </tr>

        </thead>

        <tbody>

          ${
            strengthStats
              .map(
                s => `

                  <tr>

                    <td>
                      ${s.range}
                    </td>

                    <td>
                      ${s.total}
                    </td>

                    <td>
                      ${s.winRate.toFixed(1)}%
                    </td>

                    <td class="${
                      s.expectancy >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${s.expectancy.toFixed(3)}R

                    </td>

                    <td class="${
                      s.totalR >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${s.totalR.toFixed(2)}R

                    </td>

                  </tr>

                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>


    <h3 style="margin-top:25px">
      🎯 Minimum Strength Sweep
    </h3>


    ${
      best
        ? `

          <div class="confluence-box">

            <div class="confluence-title">
              🔥 BEST CANDIDATE
            </div>

            <div class="confluence-price">

              Strength ≥
              ${best.strength}

            </div>

            <div class="nearest-info">

              Trades:
              ${best.trades}

              <br>

              Win Rate:
              ${best.winRate.toFixed(2)}%

              <br>

              Expectancy:
              ${best.expectancy.toFixed(3)}R

              <br>

              Profit Factor:
              ${
                Number.isFinite(
                  best.profitFactor
                )
                  ? best.profitFactor.toFixed(2)
                  : "∞"
              }

              <br>

              Total:
              ${best.totalR.toFixed(2)}R

              <br>

              Max DD:
              ${best.maxDrawdown.toFixed(2)}R

            </div>

          </div>

        `
        : ""
    }


    <div style="overflow-x:auto">

      <table class="backtest-table">

        <thead>

          <tr>

            <th>Min Strength</th>
            <th>Trades</th>
            <th>Win Rate</th>
            <th>Exp.</th>
            <th>PF</th>
            <th>Total R</th>
            <th>Max DD</th>

          </tr>

        </thead>

        <tbody>

          ${
            strengthSweep
              .map(
                s => `

                  <tr>

                    <td>
                      ${s.strength}
                    </td>

                    <td>
                      ${s.trades}
                    </td>

                    <td>
                      ${s.winRate.toFixed(1)}%
                    </td>

                    <td class="${
                      s.expectancy >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${s.expectancy.toFixed(3)}R

                    </td>

                    <td>

                      ${
                        Number.isFinite(
                          s.profitFactor
                        )
                          ? s.profitFactor.toFixed(2)
                          : "∞"
                      }

                    </td>

                    <td class="${
                      s.totalR >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${s.totalR.toFixed(2)}R

                    </td>

                    <td>
                      ${s.maxDrawdown.toFixed(2)}R
                    </td>

                  </tr>

                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>


    <h3 style="margin-top:25px">
      📈 Equity Curve
    </h3>


    <div class="feature-card">

      <div class="analysis-grid">

        <div>

          Final Equity

          <strong>
            ${equity.finalEquity.toFixed(2)}R
          </strong>

        </div>


        <div>

          Max Drawdown

          <strong>
            ${equity.maxDrawdown.toFixed(2)}R
          </strong>

        </div>

      </div>


      <div
        style="
          margin-top:15px;
          font-family:monospace;
          white-space:pre-wrap;
          line-height:1.6;
          overflow-x:auto;
        "
      >

        ${
          equity.curve
            .slice(-50)
            .map(
              p => {

                const sign =
                  p.equity >= 0
                    ? "+"
                    : "";


                const blocks =
                  Math.min(
                    40,
                    Math.max(
                      0,
                      Math.round(
                        p.equity
                      )
                    )
                  );


                return (

                  "#" +
                  String(
                    p.trade
                  ).padStart(
                    3,
                    "0"
                  ) +
                  " " +
                  sign +
                  p.equity.toFixed(2) +
                  "R " +
                  "█".repeat(
                    blocks
                  )

                );

              }
            )
            .join("\n")
        }

      </div>

    </div>


    <h3 style="margin-top:25px">
      📋 Trade History
    </h3>


    ${
      trades.length
        ? `

          <div
            style="
              overflow-x:auto;
              max-height:600px;
              overflow-y:auto;
            "
          >

            <table class="backtest-table">

              <thead>

                <tr>

                  <th>Date</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Zone</th>
                  <th>Strength</th>
                  <th>Result</th>
                  <th>R</th>

                </tr>

              </thead>

              <tbody>

                ${
                  trades
                    .slice(-150)
                    .map(
                      t => `

                        <tr>

                          <td>
                            ${t.date}
                          </td>

                          <td>
                            ${t.direction}
                          </td>

                          <td>
                            ${t.entry.toFixed(2)}
                          </td>

                          <td>
                            ${t.zone}
                          </td>

                          <td>
                            ${t.strength}
                          </td>

                          <td class="${
                            t.result === "WIN"
                              ? "win"
                              : "loss"
                          }">

                            ${t.result}

                          </td>

                          <td class="${
                            t.r >= 0
                              ? "win"
                              : "loss"
                          }">

                            ${t.r.toFixed(2)}R

                          </td>

                        </tr>

                      `
                    )
                    .join("")
                }

              </tbody>

            </table>

          </div>

        `
        : `

          <div class="nearest-info">

            ไม่พบ Trade ที่ผ่านเงื่อนไข

          </div>

        `
    }

  `;


  output.appendChild(
    section
  );

}


// ======================================================
// BACKTEST BUTTON
// ======================================================

const runBacktestButton =
  document.getElementById(
    "runBacktestBtn"
  );


if (
  runBacktestButton
) {

  runBacktestButton.addEventListener(
    "click",
    function() {

      try {

        if (
          !selectedCSV
        ) {

          alert(
            "กรุณาเลือกไฟล์ CSV ก่อนครับ"
          );

          return;

        }


        const candles =
          parseCSV(
            selectedCSV
          );


        const minStrengthInput =
          document.getElementById(
            "minStrength"
          );


        const riskInput =
          document.getElementById(
            "riskR"
          );


        const rewardInput =
          document.getElementById(
            "rewardR"
          );


        const minStrength =
          minStrengthInput
            ? Number(
                minStrengthInput.value
              )
            : SYSTEM_CONFIG.minimumStrength;


        const riskR =
          riskInput
            ? Number(
                riskInput.value
              )
            : SYSTEM_CONFIG.defaultRiskR;


        const rewardR =
          rewardInput
            ? Number(
                rewardInput.value
              )
            : SYSTEM_CONFIG.defaultRewardR;


        if (
          !Number.isFinite(
            minStrength
          ) ||
          minStrength < 0 ||
          minStrength > 100
        ) {

          alert(
            "Minimum Strength ต้องอยู่ระหว่าง 0–100"
          );

          return;

        }


        if (
          !Number.isFinite(
            riskR
          ) ||
          riskR <= 0
        ) {

          alert(
            "Risk ต้องมากกว่า 0"
          );

          return;

        }


        if (
          !Number.isFinite(
            rewardR
          ) ||
          rewardR <= 0
        ) {

          alert(
            "Reward ต้องมากกว่า 0"
          );

          return;

        }


        // ------------------------------------------------
        // MAIN BACKTEST
        // ------------------------------------------------

        const trades =
          runBacktest(
            candles,
            minStrength,
            riskR,
            rewardR
          );


        const output =
          document.getElementById(
            "backtestResults"
          );


        if (!output) {

          return;

        }


        output.innerHTML = "";


        // ------------------------------------------------
        // Strength Sweep
        // ------------------------------------------------

        const strengthSweep =
          runStrengthSweep(
            candles,
            riskR,
            rewardR
          );


        // ------------------------------------------------
        // Render
        // ------------------------------------------------

        renderBacktest(
          output,
          candles,
          trades,
          strengthSweep
        );


        output.scrollIntoView({
          behavior:
            "smooth"
        });

      }

      catch(error) {

        console.error(
          "Backtest Error:",
          error
        );


        alert(
          "Backtest Error\n\n" +
          error.message
        );

      }

    }
  );

}


// ======================================================
// CLEAR DATA
// ======================================================

const clearDataButton =
  document.getElementById(
    "clearDataBtn"
  );


if (
  clearDataButton
) {

  clearDataButton.addEventListener(
    "click",
    async function() {

      if (
        !confirm(
          "ต้องการล้างข้อมูลที่บันทึกไว้ใช่ไหม?"
        )
      ) {

        return;

      }


      const {
        error
      } =
        await supabaseClient
          .from("gold_settings")
          .delete()
          .eq("id",1);


      if (error) {

        alert(
          "ล้างข้อมูลไม่สำเร็จ\n\n" +
          error.message
        );

        return;

      }


      [

        "price",

        "d1ma12",
        "d1atr",
        "d1sd",
        "d1ma247",

        "w1ma12",
        "w1atr",
        "w1sd"

      ].forEach(
        id => {

          const element =
            document.getElementById(
              id
            );


          if (element) {

            element.value = "";

          }

        }
      );


      const results =
        document.getElementById(
          "results"
        );


      if (results) {

        results.innerHTML = "";

      }


      alert(
        "ล้างข้อมูลเรียบร้อยแล้ว 🧹"
      );

    }
  );

}


// ======================================================
// INIT
// ======================================================

loadSavedData();
