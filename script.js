// ======================================================
// GOLD ZONE ANALYZER PRO
// BACKTEST ENGINE V3
// ======================================================
//
// Logic:
//
// Previous Closed Candle
//        ↓
// Calculate MA12 / ATR14 / SD20
//        ↓
// Create valid D1 Zones
//        ↓
// Next Candle Touches Zone
//        ↓
// Entry at Zone Price
//        ↓
// SL / TP based on PREVIOUS CLOSED CANDLE ATR
//
// IMPORTANT:
// - No look-ahead
// - Same candle SL + TP = LOSS
// - One position at a time
// - LONG / SHORT separated
// - MA12 is reference only, not primary entry zone
// - MA247 is not an entry trigger
//
// ======================================================


// ======================================================
// SUPABASE
// ======================================================

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
// ENGINE SETTINGS
// ======================================================

const ENGINE_CONFIG = {

  // Primary zones supported by the new engine
  allowedZones: [

    "D1 +0.50 ATR",
    "D1 +1 ATR",

    "D1 -0.50 ATR",
    "D1 -1 ATR",

    "D1 +1 SD",
    "D1 -1 SD",

    "D1 +2 SD",
    "D1 -2 SD"

  ],

  // MA12 is deliberately excluded
  // because historical edge was almost zero.

  zoneTouchATR: 0.20,

  sameCandleRule:
    "LOSS",

  onePositionAtATime:
    true,

  // Minimum number of trades required
  // before a group is considered meaningful.
  minimumGroupTrades:
    30,

  // Walk Forward
  trainRatio:
    0.70,

  minimumOutOfSampleTrades:
    20

};


// ======================================================
// HELPERS
// ======================================================

function finiteNumber(value) {

  return Number.isFinite(
    Number(value)
  );

}


function safeNumber(value) {

  const n =
    Number(value);

  return Number.isFinite(n)
    ? n
    : null;

}


function round(value, decimals = 2) {

  if (!Number.isFinite(value))
    return null;

  const factor =
    Math.pow(10, decimals);

  return (
    Math.round(
      value * factor
    ) / factor
  );

}


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ======================================================
// VOLATILITY
// ======================================================

function calculateVolatilityRegime(
  atr,
  sd
) {

  if (
    !finiteNumber(atr) ||
    !finiteNumber(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {

    return {

      level:
        "Unknown",

      icon:
        "⚪",

      ratio:
        null,

      reason:
        "ข้อมูล ATR / SD ไม่เพียงพอ"

    };

  }


  const ratio =
    sd / atr;


  if (ratio >= 2) {

    return {

      level:
        "Extreme Volatility",

      icon:
        "🔥",

      ratio,

      reason:
        "SD สูงมากเมื่อเทียบกับ ATR"

    };

  }


  if (ratio >= 1.5) {

    return {

      level:
        "High Volatility",

      icon:
        "🔴",

      ratio,

      reason:
        "SD สูงเมื่อเทียบกับ ATR"

    };

  }


  if (ratio >= 1) {

    return {

      level:
        "Normal Volatility",

      icon:
        "🟡",

      ratio,

      reason:
        "ความผันผวนอยู่ในระดับปกติ"

    };

  }


  return {

    level:
      "Low Volatility",

    icon:
      "🟢",

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
    !finiteNumber(price) ||
    !finiteNumber(ma12) ||
    !finiteNumber(atr) ||
    !finiteNumber(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {

    return {

      level:
        "Unknown",

      icon:
        "⚪",

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

      level:
        "Upper Range",

      icon:
        "🔴",

      reason:
        "ราคาอยู่เหนือ MA12 และอยู่โซนด้านบน",

      atrPosition,

      sdPosition

    };

  }


  if (
    atrPosition <= -0.75 ||
    sdPosition <= -1
  ) {

    return {

      level:
        "Lower Range",

      icon:
        "🟢",

      reason:
        "ราคาอยู่ต่ำกว่า MA12 และอยู่โซนด้านล่าง",

      atrPosition,

      sdPosition

    };

  }


  return {

    level:
      "Middle Range",

    icon:
      "🟡",

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
    !finiteNumber(price) ||
    !finiteNumber(ma12) ||
    !finiteNumber(atr) ||
    !finiteNumber(sd) ||
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

      label:
        "Strong",

      icon:
        "🔥"

    };

  }


  if (score >= 60) {

    return {

      label:
        "Moderate",

      icon:
        "🟡"

    };

  }


  if (score >= 40) {

    return {

      label:
        "Weak",

      icon:
        "🟠"

    };

  }


  return {

    label:
      "Low",

    icon:
      "⚪"

  };

}


// ======================================================
// ZONE CREATOR
// ======================================================

function createZones(
  ma12,
  atr,
  sd,
  type = "D1"
) {

  if (
    !finiteNumber(ma12) ||
    !finiteNumber(atr) ||
    !finiteNumber(sd) ||
    atr <= 0 ||
    sd <= 0
  ) {

    return [];

  }


  return [

    {
      name:
        `${type} +0.50 ATR`,
      price:
        ma12 + atr * 0.50,
      type,
      atr,
      sd,
      zoneClass:
        "ATR"
    },

    {
      name:
        `${type} +1 ATR`,
      price:
        ma12 + atr,
      type,
      atr,
      sd,
      zoneClass:
        "ATR"
    },

    {
      name:
        `${type} -0.50 ATR`,
      price:
        ma12 - atr * 0.50,
      type,
      atr,
      sd,
      zoneClass:
        "ATR"
    },

    {
      name:
        `${type} -1 ATR`,
      price:
        ma12 - atr,
      type,
      atr,
      sd,
      zoneClass:
        "ATR"
    },

    {
      name:
        `${type} +1 SD`,
      price:
        ma12 + sd,
      type,
      atr,
      sd,
      zoneClass:
        "SD"
    },

    {
      name:
        `${type} -1 SD`,
      price:
        ma12 - sd,
      type,
      atr,
      sd,
      zoneClass:
        "SD"
    },

    {
      name:
        `${type} +2 SD`,
      price:
        ma12 + sd * 2,
      type,
      atr,
      sd,
      zoneClass:
        "SD"
    },

    {
      name:
        `${type} -2 SD`,
      price:
        ma12 - sd * 2,
      type,
      atr,
      sd,
      zoneClass:
        "SD"
    }

  ].filter(zone =>
    ENGINE_CONFIG.allowedZones.includes(
      zone.name
    )
  );

}


// ======================================================
// ZONE STRENGTH
// ======================================================
//
// Strength is descriptive.
// It is NOT the primary source of the Edge.
//
// This prevents the engine from pretending that
// Strength 80/90 has statistical proof when it doesn't.
//

function calculateZoneStrength(
  zone,
  referencePrice,
  allZones
) {

  let score = 50;

  const reasons = [];


  if (
    zone.name.includes("+0.50 ATR")
  ) {

    score += 13;

    reasons.push(
      "Historical high-performing ATR zone"
    );

  }


  if (
    zone.name.includes("+1 ATR")
  ) {

    score += 10;

    reasons.push(
      "Historical positive ATR zone"
    );

  }


  if (
    zone.name.includes("-1 ATR")
  ) {

    score += 8;

    reasons.push(
      "Historical positive ATR zone"
    );

  }


  if (
    zone.name.includes("-0.50 ATR")
  ) {

    score += 5;

    reasons.push(
      "Historical positive ATR zone"
    );

  }


  if (
    zone.name.includes("SD")
  ) {

    score += 4;

    reasons.push(
      "Standard Deviation reference"
    );

  }


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

    score += 10;

    reasons.push(
      "Zone อยู่ใกล้ราคาปัจจุบัน"
    );

  }
  else if (distanceATR <= 0.50) {

    score += 6;

    reasons.push(
      "Zone อยู่ในระยะใกล้"
    );

  }
  else if (distanceATR <= 1) {

    score += 2;

    reasons.push(
      "Zone อยู่ในระยะ 1 ATR"
    );

  }


  let confluence =
    false;


  allZones.forEach(other => {

    if (
      other === zone
    )
      return;


    if (
      other.type !== zone.type
    )
      return;


    const threshold =
      Math.min(
        zone.atr,
        other.atr
      ) * 0.20;


    if (
      Math.abs(
        zone.price -
        other.price
      ) <= threshold
    ) {

      confluence =
        true;

    }

  });


  if (confluence) {

    score += 8;

    reasons.push(
      "มี Zone Confluence"
    );

  }


  score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(score)
      )
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
        line => line.trim()
      );


  if (
    lines.length < 2
  ) {

    throw new Error(
      "CSV ต้องมี Header และข้อมูลอย่างน้อย 1 แถว"
    );

  }


  const delimiter =
    lines[0].includes(";")
      ? ";"
      : ",";


  const headers =
    lines[0]
      .split(delimiter)
      .map(h =>
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
          headers.indexOf(
            name
          );

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
      "time",
      "timestamp"
    ]);


  const openIndex =
    findColumn([
      "open"
    ]);


  const highIndex =
    findColumn([
      "high"
    ]);


  const lowIndex =
    findColumn([
      "low"
    ]);


  const closeIndex =
    findColumn([
      "close"
    ]);


  if (
    openIndex < 0 ||
    highIndex < 0 ||
    lowIndex < 0 ||
    closeIndex < 0
  ) {

    throw new Error(
      "CSV ต้องมี Date, Open, High, Low, Close"
    );

  }


  const candles =
    [];


  for (
    let i = 1;
    i < lines.length;
    i++
  ) {

    const parts =
      lines[i]
        .split(delimiter)
        .map(v =>
          v
            .trim()
            .replace(/^"|"$/g, "")
        );


    const open =
      Number(
        String(
          parts[openIndex]
        ).replace(
          /,/g,
          ""
        )
      );


    const high =
      Number(
        String(
          parts[highIndex]
        ).replace(
          /,/g,
          ""
        )
      );


    const low =
      Number(
        String(
          parts[lowIndex]
        ).replace(
          /,/g,
          ""
        )
      );


    const close =
      Number(
        String(
          parts[closeIndex]
        ).replace(
          /,/g,
          ""
        )
      );


    if (
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close)
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
      "ไม่สามารถอ่านข้อมูล OHLC จากไฟล์ได้"
    );

  }


  return candles;

}


// ======================================================
// HISTORICAL INDICATORS
// ======================================================
//
// index = PREVIOUS CLOSED CANDLE
//
// MA12 = last 12 closes including index
// SD20 = last 20 closes including index
// ATR14 = last 14 True Ranges including index
//
// No future candles are used.
//

function calculateSMA(
  values
) {

  if (
    !values.length
  )
    return null;


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
  )
    return null;


  const mean =
    calculateSMA(
      values
    );


  const variance =
    values.reduce(
      (
        sum,
        value
      ) =>
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


function calculateHistoricalFeatures(
  candles,
  index
) {

  if (
    index < 20
  ) {

    return null;

  }


  const maValues =
    candles
      .slice(
        index - 11,
        index + 1
      )
      .map(
        c => c.close
      );


  const sdValues =
    candles
      .slice(
        index - 19,
        index + 1
      )
      .map(
        c => c.close
      );


  if (
    maValues.length < 12 ||
    sdValues.length < 20
  ) {

    return null;

  }


  const ma12 =
    calculateSMA(
      maValues
    );


  const sd =
    calculateStdDev(
      sdValues
    );


  const trueRanges =
    [];


  for (
    let j = index - 13;
    j <= index;
    j++
  ) {

    if (
      j <= 0
    )
      continue;


    const current =
      candles[j];


    const previous =
      candles[j - 1];


    const tr =
      Math.max(

        current.high -
        current.low,

        Math.abs(
          current.high -
          previous.close
        ),

        Math.abs(
          current.low -
          previous.close
        )

      );


    trueRanges.push(
      tr
    );

  }


  if (
    trueRanges.length < 14
  ) {

    return null;

  }


  const atr =
    calculateSMA(
      trueRanges
    );


  if (
    !finiteNumber(ma12) ||
    !finiteNumber(atr) ||
    !finiteNumber(sd) ||
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


  if (
    !features
  )
    return null;


  const zones =
    createZones(
      features.ma12,
      features.atr,
      features.sd,
      "D1"
    );


  zones.forEach(
    zone => {

      const strength =
        calculateZoneStrength(
          zone,
          candles[index].close,
          zones
        );


      zone.strength =
        strength.score;


      zone.reasons =
        strength.reasons;

    }
  );


  return {

    features,

    zones

  };

}


// ======================================================
// ZONE TOUCH DETECTION
// ======================================================

function candleTouchesZone(
  candle,
  zone,
  atr
) {

  if (
    !candle ||
    !zone ||
    !finiteNumber(atr) ||
    atr <= 0
  ) {

    return false;

  }


  const tolerance =
    atr *
    ENGINE_CONFIG.zoneTouchATR;


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
//
// Zone below previous close = LONG
// Zone above previous close = SHORT
//
// This is deliberately simple.
// No future information is used.
//

function getTradeDirection(
  zone,
  previousCandle
) {

  if (
    zone.price <
    previousCandle.close
  ) {

    return "LONG";

  }


  if (
    zone.price >
    previousCandle.close
  ) {

    return "SHORT";

  }


  return null;

}


// ======================================================
// FIND BEST NEXT-CANDLE SIGNAL
// ======================================================
//
// Only the NEXT candle after the previous
// closed candle is allowed to trigger entry.
//
// If multiple zones are touched:
//
// 1. nearest zone to previous close
// 2. stronger zone
//
// This avoids multiple entries from one candle.
//

function findNextCandleSignal(
  previousCandle,
  nextCandle,
  zones,
  atr
) {

  const candidates =
    zones
      .filter(
        zone =>
          candleTouchesZone(
            nextCandle,
            zone,
            atr
          )
      )
      .map(
        zone => ({

          ...zone,

          direction:
            getTradeDirection(
              zone,
              previousCandle
            ),

          distanceFromPreviousClose:
            Math.abs(
              zone.price -
              previousCandle.close
            )

        })
      )
      .filter(
        zone =>
          zone.direction
      );


  if (
    !candidates.length
  ) {

    return null;

  }


  candidates.sort(
    (a, b) => {

      if (
        b.strength !==
        a.strength
      ) {

        return (
          b.strength -
          a.strength
        );

      }


      return (
        a.distanceFromPreviousClose -
        b.distanceFromPreviousClose
      );

    }
  );


  return candidates[0];

}


// ======================================================
// TRADE SIMULATION
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
    !finiteNumber(entry) ||
    !finiteNumber(atr) ||
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
    let j = entryIndex;
    j < candles.length;
    j++
  ) {

    const candle =
      candles[j];


    const hitStop =
      direction === "LONG"
        ? candle.low <= stop
        : candle.high >= stop;


    const hitTarget =
      direction === "LONG"
        ? candle.high >= target
        : candle.low <= target;


    // --------------------------------------------------
    // Same Candle SL + TP
    // Conservative assumption:
    // LOSS
    // --------------------------------------------------

    if (
      hitStop &&
      hitTarget
    ) {

      return {

        result:
          "LOSS",

        r:
          -riskR,

        exit:
          stop,

        exitIndex:
          j,

        exitReason:
          "SAME_CANDLE_SL_TP"

      };

    }


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
          j,

        exitReason:
          "TP"

      };

    }


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
          j,

        exitReason:
          "SL"

      };

    }

  }


  return null;

}


// ======================================================
// BACKTEST ENGINE V3
// ======================================================

function runBacktestV3(
  candles,
  minStrength,
  riskR,
  rewardR,
  startIndex = 20,
  endIndex = candles.length
) {

  const trades =
    [];


  let i =
    Math.max(
      20,
      startIndex
    );


  const finalIndex =
    Math.min(
      endIndex,
      candles.length - 1
    );


  while (
    i < finalIndex
  ) {

    const previousIndex =
      i - 1;


    const previousCandle =
      candles[previousIndex];


    const nextCandle =
      candles[i];


    const historical =
      createHistoricalZones(
        candles,
        previousIndex
      );


    if (
      !historical
    ) {

      i++;

      continue;

    }


    const signal =
      findNextCandleSignal(
        previousCandle,
        nextCandle,
        historical.zones,
        historical.features.atr
      );


    if (
      !signal
    ) {

      i++;

      continue;

    }


    if (
      signal.strength <
      minStrength
    ) {

      i++;

      continue;

    }


    // --------------------------------------------------
    // Entry at Zone Price
    // --------------------------------------------------

    const entry =
      signal.price;


    const trade =
      simulateTrade(
        candles,
        i,
        signal.direction,
        entry,
        historical.features.atr,
        riskR,
        rewardR
      );


    if (
      !trade
    ) {

      i++;

      continue;

    }


    const record = {

      date:
        nextCandle.date,

      direction:
        signal.direction,

      entry,

      stop:
        signal.direction === "LONG"
          ? entry -
            historical.features.atr *
            riskR
          : entry +
            historical.features.atr *
            riskR,

      target:
        signal.direction === "LONG"
          ? entry +
            historical.features.atr *
            rewardR
          : entry -
            historical.features.atr *
            rewardR,

      zone:
        signal.name,

      strength:
        signal.strength,

      result:
        trade.result,

      r:
        trade.r,

      exit:
        trade.exit,

      exitReason:
        trade.exitReason,

      atr:
        historical.features.atr,

      ma12:
        historical.features.ma12,

      sd:
        historical.features.sd

    };


    trades.push(
      record
    );


    // --------------------------------------------------
    // ONE POSITION AT A TIME
    // --------------------------------------------------
    //
    // Skip candles until this trade has exited.
    //

    if (
      ENGINE_CONFIG.onePositionAtATime &&
      Number.isFinite(
        trade.exitIndex
      )
    ) {

      i =
        trade.exitIndex + 1;

    }
    else {

      i++;

    }

  }


  return trades;

}


// ======================================================
// BACKTEST STATISTICS
// ======================================================

function calculateBacktestStats(
  trades
) {

  if (
    !trades.length
  ) {

    return {

      total:
        0,

      wins:
        0,

      losses:
        0,

      winRate:
        0,

      averageR:
        0,

      expectancy:
        0,

      profitFactor:
        0,

      maxDrawdown:
        0,

      totalR:
        0

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
      (
        sum,
        t
      ) =>
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
      (
        sum,
        t
      ) =>
        sum + t.r,
      0
    );


  const grossLoss =
    Math.abs(
      losses.reduce(
        (
          sum,
          t
        ) =>
          sum + t.r,
        0
      )
    );


  const profitFactor =
    grossLoss > 0
      ? grossProfit /
        grossLoss
      : Infinity;


  let equity =
    0;


  let peak =
    0;


  let maxDrawdown =
    0;


  trades.forEach(
    trade => {

      equity +=
        trade.r;


      peak =
        Math.max(
          peak,
          equity
        );


      maxDrawdown =
        Math.max(
          maxDrawdown,
          peak -
          equity
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

    totalR

  };

}


// ======================================================
// SIDE STATISTICS
// ======================================================

function calculateSideStats(
  trades
) {

  const sides = {};


  ["LONG", "SHORT"]
    .forEach(
      side => {

        const subset =
          trades.filter(
            t =>
              t.direction === side
          );


        const stats =
          calculateBacktestStats(
            subset
          );


        sides[side] =
          stats;

      }
    );


  return sides;

}


// ======================================================
// ZONE STATISTICS
// ======================================================

function calculateZoneStats(
  trades
) {

  const groups =
    {};


  trades.forEach(
    trade => {

      if (
        !groups[trade.zone]
      ) {

        groups[trade.zone] = {

          zone:
            trade.zone,

          total:
            0,

          wins:
            0,

          losses:
            0,

          totalR:
            0

        };

      }


      const g =
        groups[trade.zone];


      g.total++;


      if (
        trade.result === "WIN"
      ) {

        g.wins++;

      }
      else {

        g.losses++;

      }


      g.totalR +=
        trade.r;

    }
  );


  return Object.values(
    groups
  )
    .map(
      group => {

        const winRate =
          group.total > 0
            ? group.wins /
              group.total *
              100
            : 0;


        const expectancy =
          group.total > 0
            ? group.totalR /
              group.total
            : 0;


        const grossProfit =
          group.wins * 2;


        const grossLoss =
          group.losses;


        const profitFactor =
          grossLoss > 0
            ? grossProfit /
              grossLoss
            : Infinity;


        return {

          ...group,

          winRate,

          expectancy,

          profitFactor

        };

      }
    )
    .sort(
      (
        a,
        b
      ) =>
        b.totalR -
        a.totalR
    );

}


// ======================================================
// STRENGTH DISTRIBUTION
// ======================================================

function calculateStrengthDistribution(
  trades
) {

  const ranges = [

    {
      name:
        "50-59",
      min:
        50,
      max:
        59
    },

    {
      name:
        "60-69",
      min:
        60,
      max:
        69
    },

    {
      name:
        "70-79",
      min:
        70,
      max:
        79
    },

    {
      name:
        "80-89",
      min:
        80,
      max:
        89
    },

    {
      name:
        "90-100",
      min:
        90,
      max:
        100
    }

  ];


  return ranges.map(
    range => {

      const subset =
        trades.filter(
          trade =>
            trade.strength >=
              range.min &&
            trade.strength <=
              range.max
        );


      const stats =
        calculateBacktestStats(
          subset
        );


      return {

        strength:
          range.name,

        trades:
          stats.total,

        winRate:
          stats.winRate,

        expectancy:
          stats.expectancy,

        totalR:
          stats.totalR

      };

    }
  );

}


// ======================================================
// EQUITY CURVE
// ======================================================

function calculateEquityCurve(
  trades
) {

  let equity =
    0;


  let peak =
    0;


  let maxDrawdown =
    0;


  const curve =
    [];


  trades.forEach(
    (
      trade,
      index
    ) => {

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
// WALK FORWARD TEST
// ======================================================
//
// 70% = development / training
// 30% = unseen out-of-sample
//
// The OOS section is NOT used to choose parameters.
//

function runWalkForwardTest(
  candles,
  minStrength,
  riskR,
  rewardR
) {

  if (
    candles.length < 100
  ) {

    return {

      train:
        [],

      test:
        [],

      trainStats:
        calculateBacktestStats([]),

      testStats:
        calculateBacktestStats([])

    };

  }


  const split =
    Math.floor(
      candles.length *
      ENGINE_CONFIG.trainRatio
    );


  const trainTrades =
    runBacktestV3(
      candles,
      minStrength,
      riskR,
      rewardR,
      20,
      split
    );


  const testTrades =
    runBacktestV3(
      candles,
      minStrength,
      riskR,
      rewardR,
      split,
      candles.length
    );


  return {

    split,

    train:
      trainTrades,

    test:
      testTrades,

    trainStats:
      calculateBacktestStats(
        trainTrades
      ),

    testStats:
      calculateBacktestStats(
        testTrades
      )

  };

}


// ======================================================
// ANALYZE CURRENT MARKET
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
    async function() {

      try {

        const price =
          Number(
            document.getElementById(
              "price"
            ).value
          );


        const d1ma12Value =
          document.getElementById(
            "d1ma12"
          ).value.trim();


        const d1atrValue =
          document.getElementById(
            "d1atr"
          ).value.trim();


        const d1sdValue =
          document.getElementById(
            "d1sd"
          ).value.trim();


        const d1ma247Value =
          document.getElementById(
            "d1ma247"
          ).value.trim();


        const w1ma12Value =
          document.getElementById(
            "w1ma12"
          ).value.trim();


        const w1atrValue =
          document.getElementById(
            "w1atr"
          ).value.trim();


        const w1sdValue =
          document.getElementById(
            "w1sd"
          ).value.trim();


        const d1HasAny =
          d1ma12Value ||
          d1atrValue ||
          d1sdValue ||
          d1ma247Value;


        const w1HasAny =
          w1ma12Value ||
          w1atrValue ||
          w1sdValue;


        const d1Complete =
          d1ma12Value &&
          d1atrValue &&
          d1sdValue;


        const w1Complete =
          w1ma12Value &&
          w1atrValue &&
          w1sdValue;


        if (
          !Number.isFinite(price) ||
          price <= 0
        ) {

          alert(
            "กรุณากรอกราคาทอง"
          );

          return;

        }


        if (
          !d1HasAny &&
          !w1HasAny
        ) {

          alert(
            "กรุณากรอก D1 หรือ W1"
          );

          return;

        }


        if (
          d1HasAny &&
          !d1Complete
        ) {

          alert(
            "ข้อมูล D1 ต้องมี MA12 + ATR14 + SD20"
          );

          return;

        }


        if (
          w1HasAny &&
          !w1Complete
        ) {

          alert(
            "ข้อมูล W1 ต้องมี MA12 + ATR14 + SD20"
          );

          return;

        }


        const d1ma12 =
          Number(
            d1ma12Value
          );


        const d1atr =
          Number(
            d1atrValue
          );


        const d1sd =
          Number(
            d1sdValue
          );


        const d1ma247 =
          d1ma247Value
            ? Number(
                d1ma247Value
              )
            : null;


        const w1ma12 =
          w1Complete
            ? Number(
                w1ma12Value
              )
            : null;


        const w1atr =
          w1Complete
            ? Number(
                w1atrValue
              )
            : null;


        const w1sd =
          w1Complete
            ? Number(
                w1sdValue
              )
            : null;

        // ======================================================
// SAVE ANALYSIS HISTORY
// PREVENT DUPLICATE ANALYSIS
// ======================================================

if (window.GoldZoneHistory) {

  const historyResult =
    window.GoldZoneHistory.add({

      price,

      d1ma12,
      d1atr,
      d1sd,
      d1ma247,

      w1ma12,
      w1atr,
      w1sd

    });


  if (
    historyResult &&
    historyResult.duplicate
  ) {

    console.log(
      "⏭️ ข้อมูลการวิเคราะห์เดิม ไม่บันทึกซ้ำ"
    );

  }

}

        
       await supabaseClient
          .from(
            "gold_settings"
          )
          .upsert({

            id:
              1,

            price,

            d1ma12,

            d1atr,

            d1sd,

            d1ma247,

            w1ma12,

            w1atr,

            w1sd

          });


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
          w1Complete
            ? createZones(
                w1ma12,
                w1atr,
                w1sd,
                "W1"
              )
            : [];


        const allZones =
          [
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
              calculateZoneStrength(
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


        allZones.sort(
          (
            a,
            b
          ) =>
            a.distance -
            b.distance
        );


        const supports =
          allZones
            .filter(
              zone =>
                zone.price <
                price
            )
            .sort(
              (
                a,
                b
              ) =>
                b.price -
                a.price
            );


        const resistances =
          allZones
            .filter(
              zone =>
                zone.price >
                price
            )
            .sort(
              (
                a,
                b
              ) =>
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


        if (!results)
          return;


        results.innerHTML =
          "";


        const mode =
          d1Complete &&
          w1Complete
            ? "D1 + W1"
            : d1Complete
              ? "D1 Only"
              : "W1 Only";


        const analysis =
          document.createElement(
            "div"
          );


        analysis.className =
          "market-analysis";


        analysis.innerHTML = `

          <div class="panel">

            <div class="panel-title">
              📊 MARKET ANALYSIS V3
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
                      ? "SD / ATR = " +
                        volatility.ratio.toFixed(2)
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


            <div
              class="feature-card"
              style="margin-top:10px"
            >

              <div class="feature-label">
                📐 MARKET FEATURES
              </div>

              ${
                marketFeatures
                  ? `

                    <div
                      class="analysis-grid"
                      style="margin-top:10px"
                    >

                      <div>
                        ATR
                        <strong>
                          ${marketFeatures.atr.toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        SD
                        <strong>
                          ${marketFeatures.sd.toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        SD / ATR
                        <strong>
                          ${marketFeatures.sdAtrRatio.toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        Distance / ATR
                        <strong>
                          ${marketFeatures.distanceATR.toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        Distance / SD
                        <strong>
                          ${marketFeatures.distanceSD.toFixed(2)}
                        </strong>
                      </div>

                      <div>
                        Price − MA12
                        <strong>
                          ${marketFeatures.priceDistance.toFixed(2)}
                        </strong>
                      </div>

                    </div>

                  `
                  : `

                    <div class="nearest-info">
                      ข้อมูลไม่เพียงพอ
                    </div>

                  `
              }

            </div>

          </div>

        `;


        results.appendChild(
          analysis
        );


        const header =
          document.createElement(
            "div"
          );


        header.className =
          "result-header";


        header.innerHTML = `

          <div>

            <h2 style="margin:0">
              🎯 Gold Zones V3
            </h2>

            <div class="nearest-info">
              ราคาอ้างอิง
              ${price.toFixed(2)}
            </div>

          </div>

          <div class="result-count">
            ${mode}
          </div>

        `;


        results.appendChild(
          header
        );


        const nearest =
          document.createElement(
            "div"
          );


        nearest.className =
          "nearest-panel";


        nearest.innerHTML = `

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

                    ${escapeHTML(
                      nearestSupport.name
                    )}

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

                    ${escapeHTML(
                      nearestResistance.name
                    )}

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

        `;


        results.appendChild(
          nearest
        );


        const title =
          document.createElement(
            "h3"
          );


        title.textContent =
          "📍 Valid Entry Zones";


        results.appendChild(
          title
        );


        allZones
          .slice(
            0,
            10
          )
          .forEach(
            (
              zone,
              index
            ) => {

              const card =
                document.createElement(
                  "div"
                );


              card.className =
                "zone " +
                (
                  zone.above
                    ? "above"
                    : "below"
                );


              card.innerHTML = `

                <div class="zone-main">

                  <div class="zone-name">

                    ${
                      index === 0
                        ? "⭐ "
                        : ""
                    }

                    ${escapeHTML(
                      zone.name
                    )}

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
                          .slice(
                            0,
                            5
                          )
                          .map(
                            reason =>
                              `<li>${escapeHTML(reason)}</li>`
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

              `;


              results.appendChild(
                card
              );

            }
          );

        // เลื่อนหน้าจอมาหาผลวิเคราะห์ทั้งหมด
setTimeout(() => {

  const results =
    document.getElementById("results");

  if (!results)
    return;

  const y =
    results.getBoundingClientRect().top +
    window.pageYOffset -
    20;

  window.scrollTo({

    top: y,

    behavior: "smooth"

  });

}, 100);
      }
      catch(error) {

        console.error(
          error
        );


        alert(
          "Analysis Error\n\n" +
          error.message
        );

      }

    }
  );

}


// ======================================================
// BACKTEST FILE
// ======================================================

let selectedCSV =
  "";


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

        selectedCSV =
          "";


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

        selectedCSV =
          "";


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
// RENDER STAT CARD
// ======================================================

function renderStatCard(
  label,
  value,
  extraClass = ""
) {

  return `

    <div class="stat-card">

      <div class="feature-label">
        ${label}
      </div>

      <div class="feature-value ${extraClass}">
        ${value}
      </div>

    </div>

  `;

}


// ======================================================
// RENDER BACKTEST
// ======================================================

function renderBacktestResults(
  output,
  candles,
  trades,
  walkForward,
  minStrength,
  riskR,
  rewardR
) {

  const stats =
    calculateBacktestStats(
      trades
    );


  const sides =
    calculateSideStats(
      trades
    );


  const zoneStats =
    calculateZoneStats(
      trades
    );


  const strengthDistribution =
    calculateStrengthDistribution(
      trades
    );


  const equity =
    calculateEquityCurve(
      trades
    );


  output.innerHTML =
    "";


  const panel =
    document.createElement(
      "div"
    );


  panel.className =
    "panel";


  panel.innerHTML = `

    <div class="panel-title">
      🧪 BACKTEST RESULTS — ENGINE V3
    </div>


    <div class="nearest-info">

      Dataset:
      <strong>
        ${candles.length.toLocaleString()}
      </strong>
      candles

      <br>

      Logic:
      Previous Closed Candle →
      Zone →
      Next Candle Touch →
      Entry

      <br>

      Risk:
      ${riskR}R
      |
      Reward:
      ${rewardR}R

      <br>

      Same Candle SL + TP:
      Conservative LOSS

      <br>

      Position Model:
      One Position at a Time

    </div>


    <h3>
      📊 Overall Performance
    </h3>


    <div class="stats-grid">

      ${renderStatCard(
        "TOTAL TRADES",
        stats.total
      )}

      ${renderStatCard(
        "WIN RATE",
        stats.winRate.toFixed(2) + "%"
      )}

      ${renderStatCard(
        "WINS",
        stats.wins,
        "win"
      )}

      ${renderStatCard(
        "LOSSES",
        stats.losses,
        "loss"
      )}

      ${renderStatCard(
        "TOTAL R",
        stats.totalR.toFixed(2) + "R",
        stats.totalR >= 0
          ? "win"
          : "loss"
      )}

      ${renderStatCard(
        "EXPECTANCY",
        stats.expectancy.toFixed(3) + "R",
        stats.expectancy >= 0
          ? "win"
          : "loss"
      )}

      ${renderStatCard(
        "PROFIT FACTOR",
        Number.isFinite(
          stats.profitFactor
        )
          ? stats.profitFactor.toFixed(2)
          : "∞"
      )}

      ${renderStatCard(
        "MAX DRAWDOWN",
        stats.maxDrawdown.toFixed(2) + "R"
      )}

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
            <th>DD</th>

          </tr>

        </thead>


        <tbody>

          ${["LONG","SHORT"]
            .map(
              side => {

                const s =
                  sides[side];


                return `

                  <tr>

                    <td>
                      ${side}
                    </td>

                    <td>
                      ${s.total}
                    </td>

                    <td>
                      ${s.winRate.toFixed(1)}%
                    </td>

                    <td class="${
                      s.totalR >= 0
                        ? "win"
                        : "loss"
                    }">

                      ${s.totalR.toFixed(2)}R

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

                    <td>
                      ${s.maxDrawdown.toFixed(2)}R
                    </td>

                  </tr>

                `;

              }
            )
            .join("")}

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

          </tr>

        </thead>


        <tbody>

          ${
            zoneStats
              .map(
                z => `

                  <tr>

                    <td>
                      ${escapeHTML(z.zone)}
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
            <th>Expectancy</th>
            <th>Total R</th>

          </tr>

        </thead>


        <tbody>

          ${
            strengthDistribution
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
      🔬 Walk-Forward Test
    </h3>


    <div class="confluence-box">

      <div class="confluence-title">
        🧪 OUT-OF-SAMPLE TEST
      </div>


      <div class="nearest-info">

        Train:
        ${
          walkForward.train.length
        }
        trades

        <br>

        Test:
        ${
          walkForward.test.length
        }
        trades

        <br><br>

        <strong>
          TRAIN PERFORMANCE
        </strong>

        <br>

        Win Rate:
        ${
          walkForward.trainStats.winRate.toFixed(2)
        }%

        <br>

        Expectancy:
        ${
          walkForward.trainStats.expectancy.toFixed(3)
        }R

        <br>

        Total:
        ${
          walkForward.trainStats.totalR.toFixed(2)
        }R

        <br>

        Max DD:
        ${
          walkForward.trainStats.maxDrawdown.toFixed(2)
        }R

        <br><br>

        <strong>
          OUT-OF-SAMPLE PERFORMANCE
        </strong>

        <br>

        Win Rate:
        ${
          walkForward.testStats.winRate.toFixed(2)
        }%

        <br>

        Expectancy:
        ${
          walkForward.testStats.expectancy.toFixed(3)
        }R

        <br>

        Total:
        ${
          walkForward.testStats.totalR.toFixed(2)
        }R

        <br>

        Max DD:
        ${
          walkForward.testStats.maxDrawdown.toFixed(2)
        }R

      </div>


      <div class="confluence-price">

        ${
          walkForward.test.length >=
          ENGINE_CONFIG.minimumOutOfSampleTrades &&
          walkForward.testStats.expectancy > 0
            ? "🟢 OOS EDGE SURVIVED"
            : "🟠 OOS EVIDENCE INSUFFICIENT"
        }

      </div>

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
              point => {

                const sign =
                  point.equity >= 0
                    ? "+"
                    : "";


                const blocks =
                  Math.min(
                    40,
                    Math.max(
                      0,
                      Math.round(
                        point.equity
                      )
                    )
                  );


                return (

                  "#" +
                  String(
                    point.trade
                  ).padStart(
                    3,
                    "0"
                  ) +
                  " " +
                  sign +
                  point.equity.toFixed(2) +
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


    ${
      trades.length
        ? `

          <h3 style="margin-top:25px">
            📋 Trade History
          </h3>

          <div style="overflow-x:auto">

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
                  <th>Exit</th>

                </tr>

              </thead>


              <tbody>

                ${
                  trades
                    .slice(-150)
                    .map(
                      trade => `

                        <tr>

                          <td>
                            ${escapeHTML(
                              trade.date
                            )}
                          </td>

                          <td>
                            ${trade.direction}
                          </td>

                          <td>
                            ${trade.entry.toFixed(2)}
                          </td>

                          <td>
                            ${escapeHTML(
                              trade.zone
                            )}
                          </td>

                          <td>
                            ${trade.strength}
                          </td>

                          <td class="${
                            trade.result ===
                            "WIN"
                              ? "win"
                              : "loss"
                          }">

                            ${trade.result}

                          </td>

                          <td class="${
                            trade.r > 0
                              ? "win"
                              : "loss"
                          }">

                            ${trade.r.toFixed(2)}

                          </td>

                          <td>

                            ${trade.exit.toFixed(2)}

                            <br>

                            <span
                              class="nearest-info"
                            >
                              ${trade.exitReason}
                            </span>

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

          <div
            class="nearest-info"
            style="margin-top:15px"
          >

            ไม่พบ Trade ที่ผ่านเงื่อนไข
            Strength ${minStrength}

          </div>

        `
    }

  `;


  output.appendChild(
    panel
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


        const minStrengthElement =
          document.getElementById(
            "minStrength"
          );


        const riskElement =
          document.getElementById(
            "riskR"
          );


        const rewardElement =
          document.getElementById(
            "rewardR"
          );


        const minStrength =
          minStrengthElement
            ? Number(
                minStrengthElement.value
              )
            : 50;


        const riskR =
          riskElement
            ? Number(
                riskElement.value
              )
            : 1;


        const rewardR =
          rewardElement
            ? Number(
                rewardElement.value
              )
            : 2;


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
        // MAIN V3 BACKTEST
        // ------------------------------------------------

        const trades =
          runBacktestV3(
            candles,
            minStrength,
            riskR,
            rewardR
          );


        // ------------------------------------------------
        // WALK FORWARD
        // ------------------------------------------------

        const walkForward =
          runWalkForwardTest(
            candles,
            minStrength,
            riskR,
            rewardR
          );


        const output =
          document.getElementById(
            "backtestResults"
          );


        if (
          !output
        )
          return;


        renderBacktestResults(
          output,
          candles,
          trades,
          walkForward,
          minStrength,
          riskR,
          rewardR
        );


        output.scrollIntoView({

          behavior:
            "smooth"

        });

      }
      catch(error) {

        console.error(
          "Backtest V3 Error:",
          error
        );


        alert(
          "Backtest V3 Error\n\n" +
          error.message
        );

      }

    }
  );

}


// ======================================================
// LOAD SAVED DATA
// ======================================================

async function loadSavedData() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "gold_settings"
        )
        .select("*")
        .eq(
          "id",
          1
        )
        .maybeSingle();


    if (
      error
    ) {

      console.error(
        "โหลดข้อมูลไม่สำเร็จ:",
        error
      );

      return;

    }


    if (
      !data
    )
      return;


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
    )
      .forEach(
        (
          [
            id,
            value
          ]
        ) => {

          const element =
            document.getElementById(
              id
            );


          if (
            element
          ) {

            element.value =
              value ??
              "";

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
          .from(
            "gold_settings"
          )
          .delete()
          .eq(
            "id",
            1
          );


      if (
        error
      ) {

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

      ]
      .forEach(
        id => {

          const element =
            document.getElementById(
              id
            );


          if (
            element
          ) {

            element.value =
              "";

          }

        }
      );


      const results =
        document.getElementById(
          "results"
        );


      if (
        results
      ) {

        results.innerHTML =
          "";

      }


      const backtestResults =
        document.getElementById(
          "backtestResults"
        );


      if (
        backtestResults
      ) {

        backtestResults.innerHTML =
          "";

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


// ======================================================
// DEBUG EXPORT
// ======================================================
//
// เปิด Console แล้วสามารถเรียก:
//
// runBacktestV3(...)
//
// calculateBacktestStats(...)
//
// runWalkForwardTest(...)
//
// ได้หากต้องการตรวจสอบเพิ่มเติม
//

window.GoldZoneEngineV3 = {

  runBacktestV3,

  calculateBacktestStats,

  calculateSideStats,

  calculateZoneStats,

  calculateStrengthDistribution,

  runWalkForwardTest,

  createHistoricalZones,

  calculateHistoricalFeatures,

  createZones,

  ENGINE_CONFIG

};
