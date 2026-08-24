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
// VOLATILITY
// ======================================================

function calculateVolatilityRegime(atr, sd) {

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
      reason: "ข้อมูล ATR / SD ไม่เพียงพอ"
    };
  }

  const ratio = sd / atr;

  if (ratio >= 2) {
    return {
      level: "Extreme Volatility",
      icon: "🔥",
      ratio,
      reason: "SD สูงมากเมื่อเทียบกับ ATR"
    };
  }

  if (ratio >= 1.5) {
    return {
      level: "High Volatility",
      icon: "🔴",
      ratio,
      reason: "SD สูงเมื่อเทียบกับ ATR"
    };
  }

  if (ratio >= 1) {
    return {
      level: "Normal Volatility",
      icon: "🟡",
      ratio,
      reason: "ความผันผวนอยู่ในระดับปกติ"
    };
  }

  return {
    level: "Low Volatility",
    icon: "🟢",
    ratio,
    reason: "SD ต่ำเมื่อเทียบกับ ATR"
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
      reason: "ข้อมูลไม่เพียงพอ"
    };
  }

  const distance = price - ma12;

  const atrPosition = distance / atr;
  const sdPosition = distance / sd;

  if (
    atrPosition >= 0.75 ||
    sdPosition >= 1
  ) {
    return {
      level: "Upper Range",
      icon: "🔴",
      reason: "ราคาอยู่เหนือ MA12 และเข้าใกล้ Upper Range",
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
      reason: "ราคาอยู่ต่ำกว่า MA12 และเข้าใกล้ Lower Range",
      atrPosition,
      sdPosition
    };
  }

  return {
    level: "Middle Range",
    icon: "🟡",
    reason: "ราคาอยู่บริเวณรอบ MA12",
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

  const distance = price - ma12;

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
// STRENGTH LABEL
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
// STRENGTH
// ======================================================

function calculateStrength(
  zone,
  currentPrice,
  allZones
) {

  let score = 20;

  const reasons = [];


  // ----------------------------------------------------
  // TYPE
  // ----------------------------------------------------

  if (zone.type === "W1") {

    score += 25;

    reasons.push(
      "W1 Zone มีน้ำหนักสูงกว่า D1"
    );

  } else {

    score += 15;

    reasons.push(
      "D1 Zone"
    );
  }


  // ----------------------------------------------------
  // DISTANCE
  // ----------------------------------------------------

  const distance =
    Math.abs(
      zone.price -
      currentPrice
    );

  const distanceATR =
    distance /
    zone.atr;


  if (distanceATR <= 0.25) {

    score += 20;

    reasons.push(
      "อยู่ใกล้ราคาปัจจุบันมาก"
    );

  } else if (distanceATR <= 0.50) {

    score += 15;

    reasons.push(
      "อยู่ใกล้ราคาปัจจุบัน"
    );

  } else if (distanceATR <= 1) {

    score += 8;

    reasons.push(
      "อยู่ในระยะ 1 ATR"
    );

  } else {

    reasons.push(
      "อยู่ห่างจากราคาปัจจุบัน"
    );
  }


  // ----------------------------------------------------
  // MA12
  // ----------------------------------------------------

  if (
    zone.name.includes("MA12")
  ) {

    score += 8;

    reasons.push(
      "เป็น MA12 Reference Zone"
    );
  }


  // ----------------------------------------------------
  // ATR
  // ----------------------------------------------------

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
          "เป็น ATR Level ที่มีนัยสำคัญ"
        );
      }
    }
  }


  // ----------------------------------------------------
  // SD
  // ----------------------------------------------------

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
          "อยู่บน Standard Deviation Level"
        );
      }
    }
  }


  // ----------------------------------------------------
  // CONFLUENCE
  // ----------------------------------------------------

  const confluence =
    allZones.some(other => {

      if (other === zone)
        return false;

      if (
        other.type === zone.type
      )
        return false;

      const referenceATR =
        Math.min(
          zone.atr,
          other.atr
        );

      return (
        Math.abs(
          zone.price -
          other.price
        ) <=
        referenceATR * 0.20
      );
    });


  if (confluence) {

    score += 17;

    zone.hasConfluence = true;

    reasons.push(
      "มี D1 + W1 Confluence"
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
// ZONE CREATOR
// ======================================================

function createZones(
  ma12,
  atr,
  sd,
  type
) {

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
// LOAD SAVED DATA
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
        .eq("id", 1)
        .maybeSingle();


    if (error) {

      console.error(
        "โหลดข้อมูลไม่สำเร็จ:",
        error
      );

      return;
    }


    if (!data)
      return;


    const ids = {

      price: data.price,

      d1ma12: data.d1ma12,
      d1atr: data.d1atr,
      d1sd: data.d1sd,
      d1ma247: data.d1ma247,

      w1ma12: data.w1ma12,
      w1atr: data.w1atr,
      w1sd: data.w1sd

    };


    Object.entries(ids)
      .forEach(([id, value]) => {

        const element =
          document.getElementById(id);

        if (element)
          element.value =
            value ?? "";

      });

  } catch (error) {

    console.error(error);

  }
}


// ======================================================
// ANALYZE BUTTON
// ======================================================

const analyzeButton =
  document.querySelector(
    ".analyze-btn"
  );


if (analyzeButton) {

  analyzeButton.addEventListener(
    "click",
    async function() {

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


      if (!price) {

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
        Number(d1ma12Value);

      const d1atr =
        Number(d1atrValue);

      const d1sd =
        Number(d1sdValue);

      const d1ma247 =
        d1ma247Value
          ? Number(d1ma247Value)
          : null;


      const w1ma12 =
        w1Complete
          ? Number(w1ma12Value)
          : null;

      const w1atr =
        w1Complete
          ? Number(w1atrValue)
          : null;

      const w1sd =
        w1Complete
          ? Number(w1sdValue)
          : null;


      await supabaseClient
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


      const allZones = [
        ...d1Zones,
        ...w1Zones
      ];


      allZones.forEach(zone => {

        zone.distance =
          Math.abs(
            zone.price -
            price
          );

        zone.above =
          zone.price >
          price;

      });


      allZones.forEach(zone => {

        const result =
          calculateStrength(
            zone,
            price,
            allZones
          );

        zone.strength =
          result.score;

        zone.reasons =
          result.reasons;

        zone.strengthLabel =
          getStrengthLabel(
            zone.strength
          );

      });


      allZones.sort(
        (a, b) =>
          a.distance -
          b.distance
      );


      const supports =
        allZones
          .filter(
            z =>
              z.price < price
          )
          .sort(
            (a, b) =>
              b.price -
              a.price
          );


      const resistances =
        allZones
          .filter(
            z =>
              z.price > price
          )
          .sort(
            (a, b) =>
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


      results.innerHTML = "";


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

      `;


      results.appendChild(
        nearest
      );


      // --------------------------------------------------
      // CONFLUENCE
      // --------------------------------------------------

      const confluences = [];


      if (
        d1Complete &&
        w1Complete
      ) {

        d1Zones.forEach(d1 => {

          w1Zones.forEach(w1 => {

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

          });

        });

      }


      if (
        confluences.length
      ) {

        const title =
          document.createElement(
            "h3"
          );

        title.textContent =
          "🔗 Zone Confluence";

        results.appendChild(
          title
        );


        confluences
          .slice(0, 5)
          .forEach(group => {

            const box =
              document.createElement(
                "div"
              );

            box.className =
              "confluence-box";


            const strength =
              Math.round(
                (
                  group.d1.strength +
                  group.w1.strength
                ) / 2
              );


            box.innerHTML = `

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

            `;


            results.appendChild(
              box
            );

          });

      }


      const title =
        document.createElement(
          "h3"
        );

      title.textContent =
        "📍 Zone Analysis";

      results.appendChild(
        title
      );


      allZones
        .slice(0, 10)
        .forEach(
          (zone, index) => {

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
                      style="width:${zone.strength}%"
                    ></div>

                  </div>

                  <div class="why-title">
                    WHY THIS ZONE?
                  </div>

                  <ul class="why-list">

                    ${
                      zone.reasons
                        .slice(0, 5)
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

            `;


            results.appendChild(
              card
            );

          }
        );

    }
  );

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
      "ไฟล์ CSV ต้องมี Header และข้อมูลอย่างน้อย 1 แถว"
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
          headers.indexOf(
            name
          );

        if (index >= 0)
          return index;

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
      Number(
        String(
          parts[openIndex]
        )
        .replace(/,/g, "")
      );


    const high =
      Number(
        String(
          parts[highIndex]
        )
        .replace(/,/g, "")
      );


    const low =
      Number(
        String(
          parts[lowIndex]
        )
        .replace(/,/g, "")
      );


    const close =
      Number(
        String(
          parts[closeIndex]
        )
        .replace(/,/g, "")
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
// ROLLING MA
// ======================================================

function calculateMA(
  candles,
  index,
  period
) {

  if (
    index <
    period - 1
  ) {

    return null;

  }


  let sum = 0;


  for (
    let i =
      index - period + 1;
    i <= index;
    i++
  ) {

    sum +=
      candles[i].close;

  }


  return sum / period;
}


// ======================================================
// ROLLING SD
// ======================================================

function calculateSD(
  candles,
  index,
  period
) {

  if (
    index <
    period - 1
  ) {

    return null;

  }


  const values = [];


  for (
    let i =
      index - period + 1;
    i <= index;
    i++
  ) {

    values.push(
      candles[i].close
    );

  }


  const mean =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    period;


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
    period;


  return Math.sqrt(
    variance
  );
}


// ======================================================
// ROLLING ATR
// ======================================================

function calculateATR(
  candles,
  index,
  period
) {

  if (
    index <
    period
  ) {

    return null;

  }


  const trueRanges = [];


  for (
    let i =
      index - period + 1;
    i <= index;
    i++
  ) {

    const current =
      candles[i];

    const previous =
      candles[i - 1];


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


  return (
    trueRanges.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    trueRanges.length
  );
}


// ======================================================
// BACKTEST ZONES
// ======================================================

function createBacktestZones(
  ma12,
  atr,
  sd
) {

  return [

    {
      name: "D1 +1 ATR",
      price: ma12 + atr,
      atr,
      sd
    },

    {
      name: "D1 +0.50 ATR",
      price: ma12 + atr * 0.50,
      atr,
      sd
    },

    {
      name: "D1 MA12",
      price: ma12,
      atr,
      sd
    },

    {
      name: "D1 -0.50 ATR",
      price: ma12 - atr * 0.50,
      atr,
      sd
    },

    {
      name: "D1 -1 ATR",
      price: ma12 - atr,
      atr,
      sd
    },

    {
      name: "D1 +1 SD",
      price: ma12 + sd,
      atr,
      sd
    },

    {
      name: "D1 +2 SD",
      price: ma12 + sd * 2,
      atr,
      sd
    },

    {
      name: "D1 -1 SD",
      price: ma12 - sd,
      atr,
      sd
    },

    {
      name: "D1 -2 SD",
      price: ma12 - sd * 2,
      atr,
      sd
    }

  ];
}


// ======================================================
// BACKTEST ENGINE — IMPROVED
// ======================================================

function runBacktest(
  candles,
  minStrength,
  riskR,
  rewardR
) {

  const results = [];


  if (
    !candles ||
    candles.length < 30
  ) {

    return results;

  }


  let lastTradeIndex =
    -999;


  for (
    let i = 20;
    i < candles.length - 1;
    i++
  ) {

    /*
      ใช้ข้อมูลที่ "ปิดแล้ว" ถึงแท่ง i เท่านั้น
    */

    const ma12 =
      calculateMA(
        candles,
        i,
        12
      );


    const atr =
      calculateATR(
        candles,
        i,
        14
      );


    const sd =
      calculateSD(
        candles,
        i,
        20
      );


    if (
      !Number.isFinite(ma12) ||
      !Number.isFinite(atr) ||
      !Number.isFinite(sd) ||
      atr <= 0 ||
      sd <= 0
    ) {

      continue;

    }


    const candle =
      candles[i];


    const zones =
      createBacktestZones(
        ma12,
        atr,
        sd
      );


    let nearest =
      null;


    for (
      const zone of zones
    ) {

      const distance =
        Math.abs(
          candle.close -
          zone.price
        );


      /*
        ต้องอยู่ใกล้ Zone
        ไม่เกิน 20% ATR
      */

      if (
        distance <=
        atr * 0.20
      ) {

        if (
          !nearest ||
          distance <
          nearest.distance
        ) {

          nearest = {

            ...zone,

            distance

          };

        }

      }

    }


    if (!nearest)
      continue;


    /*
      กันการเปิด Trade
      ซ้ำติดกันเกินไป
    */

    if (
      i -
      lastTradeIndex <
      3
    ) {

      continue;

    }


    /*
      คำนวณ Strength
      เฉพาะข้อมูล ณ จุดนั้น
    */

    const strength =
      calculateStrength(
        nearest,
        candle.close,
        zones
      );


    if (
      strength.score <
      minStrength
    ) {

      continue;

    }


    /*
      Direction
    */

    const direction =
      nearest.price <
      candle.close
        ? "LONG"
        : "SHORT";


    const risk =
      atr * riskR;


    const reward =
      atr * rewardR;


    const entry =
      candle.close;


    const stop =
      direction === "LONG"
        ? entry - risk
        : entry + risk;


    const target =
      direction === "LONG"
        ? entry + reward
        : entry - reward;


    let outcome =
      null;


    /*
      ตรวจแท่งถัดไป
    */

    for (
      let j = i + 1;
      j < candles.length;
      j++
    ) {

      const next =
        candles[j];


      if (
        direction === "LONG"
      ) {

        const hitStop =
          next.low <=
          stop;


        const hitTarget =
          next.high >=
          target;


        /*
          ถ้าชนทั้งคู่
          ถือ LOSS
        */

        if (
          hitStop &&
          hitTarget
        ) {

          outcome = {

            result: "LOSS",

            r: -riskR,

            exit: stop

          };

          break;

        }


        if (
          hitTarget
        ) {

          outcome = {

            result: "WIN",

            r: rewardR,

            exit: target

          };

          break;

        }


        if (
          hitStop
        ) {

          outcome = {

            result: "LOSS",

            r: -riskR,

            exit: stop

          };

          break;

        }

      } else {

        const hitStop =
          next.high >=
          stop;


        const hitTarget =
          next.low <=
          target;


        if (
          hitStop &&
          hitTarget
        ) {

          outcome = {

            result: "LOSS",

            r: -riskR,

            exit: stop

          };

          break;

        }


        if (
          hitTarget
        ) {

          outcome = {

            result: "WIN",

            r: rewardR,

            exit: target

          };

          break;

        }


        if (
          hitStop
        ) {

          outcome = {

            result: "LOSS",

            r: -riskR,

            exit: stop

          };

          break;

        }

      }

    }


    if (!outcome)
      continue;


    lastTradeIndex =
      i;


    results.push({

      date:
        candle.date,

      direction,

      entry,

      stop,

      target,

      zone:
        nearest.name,

      strength:
        strength.score,

      atr,

      sd,

      ma12,

      result:
        outcome.result,

      r:
        outcome.r,

      exit:
        outcome.exit

    });

  }


  return results;
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
      totalR: 0

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
      (sum, t) =>
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
      (sum, t) =>
        sum + t.r,
      0
    );


  const grossLoss =
    Math.abs(
      losses.reduce(
        (sum, t) =>
          sum + t.r,
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

    totalR

  };
}


// ======================================================
// FILE SELECT
// ======================================================

let selectedCSV = "";


const backtestFile =
  document.getElementById(
    "backtestFile"
  );


if (backtestFile) {

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

      } catch (error) {

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
// BACKTEST BUTTON
// ======================================================

const runBacktestButton =
  document.getElementById(
    "runBacktestBtn"
  );


if (runBacktestButton) {

  runBacktestButton.addEventListener(
    "click",
    function() {

      try {

        if (!selectedCSV) {

          alert(
            "กรุณาเลือกไฟล์ CSV ก่อนครับ"
          );

          return;

        }


        const candles =
          parseCSV(
            selectedCSV
          );


        /*
          Minimum Strength
        */

        const minStrength =
          Number(
            document.getElementById(
              "minStrength"
            ).value
          );


        const riskR =
          Number(
            document.getElementById(
              "riskR"
            ).value
          );


        const rewardR =
          Number(
            document.getElementById(
              "rewardR"
            ).value
          );


        /*
          Validate
        */

        if (
          !Number.isFinite(
            minStrength
          ) ||
          minStrength < 0 ||
          minStrength > 100
        ) {

          alert(
            "Minimum Strength ต้องอยู่ระหว่าง 0 - 100"
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
            "Risk R ต้องมากกว่า 0"
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
            "Reward R ต้องมากกว่า 0"
          );

          return;

        }


        /*
          RUN
        */

        const trades =
          runBacktest(
            candles,
            minStrength,
            riskR,
            rewardR
          );


        const stats =
          calculateBacktestStats(
            trades
          );


        const output =
          document.getElementById(
            "backtestResults"
          );


        if (!output)
          return;


        output.innerHTML = `

          <div class="panel">

            <div class="panel-title">
              🧪 BACKTEST RESULTS
            </div>


            <div class="nearest-info">

              Dataset:
              ${candles.length.toLocaleString()}
              candles

              <br>

              Minimum Strength:
              ${minStrength}

              <br>

              Risk:
              ${riskR}R

              <br>

              Reward:
              ${rewardR}R

            </div>


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
                  AVERAGE R
                </div>

                <div class="feature-value">

                  ${stats.averageR.toFixed(2)}R

                </div>

              </div>


              <div class="stat-card">

                <div class="feature-label">
                  EXPECTANCY
                </div>

                <div class="feature-value">

                  ${stats.expectancy.toFixed(2)}R

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


            ${
              trades.length

                ? `

                  <table class="backtest-table">

                    <thead>

                      <tr>

                        <th>Date</th>

                        <th>Side</th>

                        <th>Entry</th>

                        <th>Zone</th>

                        <th>Strength</th>

                        <th>ATR</th>

                        <th>Result</th>

                        <th>R</th>

                      </tr>

                    </thead>


                    <tbody>

                      ${
                        trades
                          .slice(-100)
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

                                <td>
                                  ${t.atr.toFixed(2)}
                                </td>

                                <td class="${
                                  t.result ===
                                  "WIN"
                                    ? "win"
                                    : "loss"
                                }">

                                  ${t.result}

                                </td>

                                <td class="${
                                  t.r > 0
                                    ? "win"
                                    : "loss"
                                }">

                                  ${t.r.toFixed(2)}

                                </td>

                              </tr>

                            `
                          )
                          .join("")
                      }

                    </tbody>

                  </table>

                `

                : `

                  <div
                    class="nearest-info"
                    style="margin-top:15px"
                  >

                    ไม่พบ Trade ที่ผ่านเงื่อนไข

                    <br>

                    Minimum Strength:
                    ${minStrength}

                  </div>

                `
            }

          </div>

        `;


        output.scrollIntoView({
          behavior: "smooth"
        });


      } catch (error) {

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


if (clearDataButton) {

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
      ]
      .forEach(
        id => {

          const el =
            document.getElementById(
              id
            );

          if (el)
            el.value = "";

        }
      );


      const results =
        document.getElementById(
          "results"
        );


      if (results)
        results.innerHTML = "";


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
