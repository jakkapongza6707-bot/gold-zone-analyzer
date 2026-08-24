const SUPABASE_URL = "https://ctolckvhfojrchzjaqyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_l5UISnbptCI8T6HwE7di2w_0e7ZGyqR";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ======================================================
// GOLD ZONE ANALYZER PRO V3.1
// ======================================================
// ======================================================
// V3.2 — VOLATILITY REGIME
// ======================================================

function calculateVolatilityRegime(atr, sd) {

  if (!atr || !sd || atr <= 0 || sd <= 0) {
    return {
      level: "Unknown",
      icon: "⚪",
      ratio: null,
      reason: "ข้อมูล ATR / SD ไม่เพียงพอ"
    };
  }

  const ratio = sd / atr;

  if (ratio >= 2.0) {
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

  if (ratio >= 1.0) {
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
// V3.2 — MARKET POSITION
// ======================================================

function calculateMarketPosition(price, ma12, atr, sd) {

  if (
    !price ||
    !ma12 ||
    !atr ||
    !sd ||
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
      reason:
        "ราคาอยู่เหนือ MA12 และเข้าใกล้ Upper Volatility Range",
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
        "ราคาอยู่ต่ำกว่า MA12 และเข้าใกล้ Lower Volatility Range",
      atrPosition,
      sdPosition
    };
  }

  return {
    level: "Middle Range",
    icon: "🟡",
    reason:
      "ราคาอยู่ในบริเวณรอบ MA12 และยังไม่เข้า Extreme Range",
    atrPosition,
    sdPosition
  };
}

// ======================================================
// โหลดข้อมูลเก่า
// ======================================================

async function loadSavedData() {

  const { data, error } = await supabaseClient
    .from("gold_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("โหลดข้อมูลไม่สำเร็จ:", error);
    return;
  }

  if (!data) {
    console.log("ยังไม่มีข้อมูลที่บันทึกไว้");
    return;
  }

  document.getElementById("price").value = data.price ?? "";

  document.getElementById("d1ma12").value = data.d1ma12 ?? "";
  document.getElementById("d1atr").value = data.d1atr ?? "";
  document.getElementById("d1sd").value = data.d1sd ?? "";
  document.getElementById("d1ma247").value = data.d1ma247 ?? "";

  document.getElementById("w1ma12").value = data.w1ma12 ?? "";
  document.getElementById("w1atr").value = data.w1atr ?? "";
  document.getElementById("w1sd").value = data.w1sd ?? "";

  console.log("โหลดข้อมูลเก่าเรียบร้อย");
}


// ======================================================
// ฟังก์ชันกำหนดระดับ Strength
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
// คำนวณ Zone Strength
// ======================================================
//
// หลักคิด:
// 1. Base Score
// 2. Timeframe
// 3. Distance
// 4. ATR / SD significance
// 5. Confluence
//
// คะแนนถูกจำกัด 0-100
// ======================================================

function calculateStrength(zone, currentPrice, allZones) {

  let score = 20;

  const reasons = [];

  // ----------------------------------------------------
  // Timeframe
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
  // Distance
  // ----------------------------------------------------

  const distance = Math.abs(
    zone.price - currentPrice
  );

  const referenceATR =
    zone.type === "W1"
      ? zone.atr
      : zone.atr;


  if (referenceATR > 0) {

    const distanceATR =
      distance / referenceATR;


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

    else if (distanceATR <= 1.00) {

      score += 8;

      reasons.push(
        "อยู่ในระยะ 1 ATR"
      );

    }

    else {

      reasons.push(
        "อยู่ห่างจากราคาปัจจุบัน"
      );

    }

  }


  // ----------------------------------------------------
  // Zone Type
  // ----------------------------------------------------

  if (zone.name.includes("MA12")) {

    score += 8;

    reasons.push(
      "เป็น MA12 Reference Zone"
    );

  }


  if (zone.name.includes("ATR")) {

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
  // Standard Deviation
  // ----------------------------------------------------

  if (zone.name.includes("SD")) {

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
  // Confluence
  // ----------------------------------------------------

  const confluence =
    allZones.some(other => {

      if (other === zone) {
        return false;
      }

      if (other.type === zone.type) {
        return false;
      }

      const referenceATR =
        Math.min(
          zone.atr || Infinity,
          other.atr || Infinity
        );

      if (!isFinite(referenceATR) || referenceATR <= 0) {
        return false;
      }

      return (
        Math.abs(
          zone.price - other.price
        ) <= referenceATR * 0.20
      );

    });


  if (confluence) {

    score += 17;

    zone.hasConfluence = true;

    reasons.push(
      "มี D1 + W1 Confluence"
    );

  }


  // ----------------------------------------------------
  // จำกัดคะแนน
  // ----------------------------------------------------

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
// วิเคราะห์ Gold Zones
// ======================================================

document
  .querySelector(".analyze-btn")
  .addEventListener(
    "click",
    async function () {


      const price =
        Number(
          document
            .getElementById("price")
            .value
        );


      // ==================================================
      // อ่าน D1
      // ==================================================

      const d1ma12Value =
        document
          .getElementById("d1ma12")
          .value
          .trim();

      const d1atrValue =
        document
          .getElementById("d1atr")
          .value
          .trim();

      const d1sdValue =
        document
          .getElementById("d1sd")
          .value
          .trim();

      const d1ma247Value =
        document
          .getElementById("d1ma247")
          .value
          .trim();


      const d1HasAny =
        d1ma12Value !== "" ||
        d1atrValue !== "" ||
        d1sdValue !== "" ||
        d1ma247Value !== "";


      const d1Complete =
        d1ma12Value !== "" &&
        d1atrValue !== "" &&
        d1sdValue !== "";


      // ==================================================
      // อ่าน W1
      // ==================================================

      const w1ma12Value =
        document
          .getElementById("w1ma12")
          .value
          .trim();

      const w1atrValue =
        document
          .getElementById("w1atr")
          .value
          .trim();

      const w1sdValue =
        document
          .getElementById("w1sd")
          .value
          .trim();


      const w1HasAny =
        w1ma12Value !== "" ||
        w1atrValue !== "" ||
        w1sdValue !== "";


      const w1Complete =
        w1ma12Value !== "" &&
        w1atrValue !== "" &&
        w1sdValue !== "";


      // ==================================================
      // ตรวจราคา
      // ==================================================

      if (!price) {

        alert(
          "กรุณากรอกราคาทอง"
        );

        return;
      }


      // ==================================================
      // ต้องมีอย่างน้อย 1 TF
      // ==================================================

      if (
        !d1HasAny &&
        !w1HasAny
      ) {

        alert(
          "กรุณากรอกข้อมูล D1 หรือ W1 อย่างน้อย 1 ชุด"
        );

        return;
      }


      // ==================================================
      // D1 ไม่ครบ
      // ==================================================

      if (
        d1HasAny &&
        !d1Complete
      ) {

        alert(
          "ข้อมูล D1 ยังไม่ครบ\n\n" +
          "ต้องมี MA12 + ATR14 + SD20"
        );

        return;
      }


      // ==================================================
      // W1 ไม่ครบ
      // ==================================================

      if (
        w1HasAny &&
        !w1Complete
      ) {

        alert(
          "ข้อมูล W1 ยังไม่ครบ\n\n" +
          "ต้องมี MA12 + ATR14 + SD20"
        );

        return;
      }


      // ==================================================
      // แปลงตัวเลข
      // ==================================================

      const d1ma12 =
        d1Complete
          ? Number(d1ma12Value)
          : null;

      const d1atr =
        d1Complete
          ? Number(d1atrValue)
          : null;

      const d1sd =
        d1Complete
          ? Number(d1sdValue)
          : null;

      const d1ma247 =
        d1ma247Value !== ""
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


      // ==================================================
      // บันทึก Supabase
      // ==================================================

      const {
        error: saveError
      } =
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


      if (saveError) {

        console.error(
          "บันทึกไม่สำเร็จ:",
          saveError
        );

        alert(
          "บันทึกไม่สำเร็จ\n\n" +
          saveError.message
        );

        return;
      }


      // ==================================================
      // D1 Zones
      // ==================================================

      let d1Zones = [];


      if (d1Complete) {

        d1Zones = [

          {
            name: "D1 +1 ATR",
            price: d1ma12 + d1atr,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 +0.75 ATR",
            price: d1ma12 + d1atr * 0.75,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 +0.50 ATR",
            price: d1ma12 + d1atr * 0.50,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 +0.25 ATR",
            price: d1ma12 + d1atr * 0.25,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 MA12",
            price: d1ma12,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 -0.25 ATR",
            price: d1ma12 - d1atr * 0.25,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 -0.50 ATR",
            price: d1ma12 - d1atr * 0.50,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 -0.75 ATR",
            price: d1ma12 - d1atr * 0.75,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 -1 ATR",
            price: d1ma12 - d1atr,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 +1 SD",
            price: d1ma12 + d1sd,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 +2 SD",
            price: d1ma12 + d1sd * 2,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 -1 SD",
            price: d1ma12 - d1sd,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          },

          {
            name: "D1 -2 SD",
            price: d1ma12 - d1sd * 2,
            type: "D1",
            atr: d1atr,
            sd: d1sd
          }

        ];
      }


      // ==================================================
      // W1 Zones
      // ==================================================

      let w1Zones = [];


      if (w1Complete) {

        w1Zones = [

          {
            name: "W1 +1 ATR",
            price: w1ma12 + w1atr,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 +0.75 ATR",
            price: w1ma12 + w1atr * 0.75,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 +0.50 ATR",
            price: w1ma12 + w1atr * 0.50,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 +0.25 ATR",
            price: w1ma12 + w1atr * 0.25,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 MA12",
            price: w1ma12,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 -0.25 ATR",
            price: w1ma12 - w1atr * 0.25,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 -0.50 ATR",
            price: w1ma12 - w1atr * 0.50,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 -0.75 ATR",
            price: w1ma12 - w1atr * 0.75,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 -1 ATR",
            price: w1ma12 - w1atr,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 +1 SD",
            price: w1ma12 + w1sd,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 +2 SD",
            price: w1ma12 + w1sd * 2,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 -1 SD",
            price: w1ma12 - w1sd,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          },

          {
            name: "W1 -2 SD",
            price: w1ma12 - w1sd * 2,
            type: "W1",
            atr: w1atr,
            sd: w1sd
          }

        ];
      }


      // ==================================================
      // รวม Zones
      // ==================================================

      const allZones = [
        ...d1Zones,
        ...w1Zones
      ];


      // ==================================================
      // Distance
      // ==================================================

      allZones.forEach(zone => {

        zone.distance =
          Math.abs(
            zone.price - price
          );

        zone.above =
          zone.price > price;

      });


      // ==================================================
      // คำนวณ Strength
      // ==================================================

      allZones.forEach(zone => {

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

      });


      // ==================================================
      // สร้าง Confluence Groups
      // ======================================================

      const confluenceGroups = [];

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
              difference <= threshold
            ) {

              confluenceGroups.push({

                d1,
                w1,

                low:
                  Math.min(
                    d1.price,
                    w1.price
                  ),

                high:
                  Math.max(
                    d1.price,
                    w1.price
                  ),

                midpoint:
                  (
                    d1.price +
                    w1.price
                  ) / 2

              });

            }

          });

        });

      }


      // ==================================================
      // เรียง Zone ตามระยะห่าง
      // ==================================================

      allZones.sort(
        (a, b) =>
          a.distance -
          b.distance
      );


      // ==================================================
      // หา Support / Resistance
      // ==================================================

      const supports =
        allZones
          .filter(
            zone =>
              zone.price < price
          )
          .sort(
            (a, b) =>
              b.price -
              a.price
          );

      const resistances =
        allZones
          .filter(
            zone =>
              zone.price > price
          )
          .sort(
            (a, b) =>
              a.price -
              b.price
          );


      const nearestSupport =
        supports[0] || null;

      const nearestResistance =
        resistances[0] || null;


      // ==================================================
      // Results
      // ==================================================

      const results =
        document.getElementById(
          "results"
        );

      results.innerHTML = "";


      // ==================================================
      // Mode
      // ==================================================

      let mode = "";

      if (
        d1Complete &&
        w1Complete
      ) {

        mode = "D1 + W1";

      }

      else if (d1Complete) {

        mode = "D1 Only";

      }

      else {

        mode = "W1 Only";

      }


      // ==================================================
      // Header
      // ==================================================

      const header =
        document.createElement(
          "div"
        );

      header.className =
        "result-header";

      header.innerHTML = `

        <div>

          <h2 style="
            margin:0;
            font-size:22px;
          ">
            🎯 Gold Zones
          </h2>

          <div style="
            color:#888;
            font-size:12px;
            margin-top:5px;
          ">
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


      // ==================================================
      // Nearest Support / Resistance
      // ==================================================

      const nearestPanel =
        document.createElement(
          "div"
        );

      nearestPanel.className =
        "nearest-panel";


      nearestPanel.innerHTML = `

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
                  • ${nearestSupport.type}

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
                  • ${nearestResistance.type}

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
        nearestPanel
      );


      // ==================================================
      // Confluence
      // ==================================================

      if (
        confluenceGroups.length > 0
      ) {

        const title =
          document.createElement(
            "div"
          );

        title.innerHTML = `
          <h3 style="
            margin:14px 0 8px;
            font-size:17px;
          ">
            🔗 Zone Confluence
          </h3>
        `;

        results.appendChild(
          title
        );


        confluenceGroups
          .slice(0, 5)
          .forEach(group => {

            const box =
              document.createElement(
                "div"
              );

            box.className =
              "confluence-box";


            const combinedStrength =
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

                ${group.low.toFixed(2)}
                —
                ${group.high.toFixed(2)}

              </div>

              <div style="
                color:#999;
                font-size:11px;
                margin-top:7px;
                line-height:1.6;
              ">

                D1:
                ${group.d1.name}
                (${group.d1.price.toFixed(2)})

                <br>

                W1:
                ${group.w1.name}
                (${group.w1.price.toFixed(2)})

                <br>

                Combined Strength:
                ${combinedStrength}/100

              </div>

            `;

            results.appendChild(
              box
            );

          });

      }


      // ==================================================
      // Zone Cards
      // ==================================================

      const zoneTitle =
        document.createElement(
          "h3"
        );

      zoneTitle.style.cssText =
        `
          margin:18px 0 8px;
          font-size:17px;
        `;

      zoneTitle.textContent =
        "📍 Zone Analysis";

      results.appendChild(
        zoneTitle
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


            const direction =
              zone.above
                ? "⬆️ ด้านบน"
                : "⬇️ ด้านล่าง";


            const directionClass =
              zone.above
                ? "direction-above"
                : "direction-below";


            const badgeColor =
              zone.type === "D1"
                ? "#d6a928"
                : "#9b7cff";


            card.innerHTML = `

              <div class="zone-main">

                <div class="zone-name">

                  ${
                    index === 0
                      ? "⭐ "
                      : ""
                  }

                  ${zone.name}

                  <span style="
                    display:inline-block;
                    margin-left:7px;
                    padding:3px 7px;
                    border-radius:6px;
                    font-size:10px;
                    background:${badgeColor}22;
                    color:${badgeColor};
                  ">
                    ${zone.type}
                  </span>

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

                    <span style="
                      color:#888;
                      font-size:11px;
                      font-weight:600;
                    ">

                      ${zone.strengthLabel.label}

                    </span>

                  </div>


                  <div class="strength-bar">

                    <div
                      class="strength-fill"
                      style="
                        width:${zone.strength}%;
                      "
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
                          reason =>
                            `<li>${reason}</li>`
                        )
                        .join("")
                    }

                  </ul>

                </div>

              </div>


              <div class="zone-distance">

                <div class="${directionClass}">
                  ${direction}
                </div>

                <div style="
                  margin-top:4px;
                  font-size:11px;
                ">

                  ห่าง
                  ${zone.distance.toFixed(2)}

                </div>

              </div>

            `;


            results.appendChild(
              card
            );

          }
        );


      // ==================================================
      // Status
      // ==================================================

      const status =
        document.createElement(
          "div"
        );


      status.style.cssText = `
        margin-top:12px;
        padding:10px;
        border-radius:10px;
        text-align:center;
        background:#151515;
        border:1px solid #292929;
        color:#777;
        font-size:11px;
      `;


      status.textContent =
        "☁️ บันทึกข้อมูลแล้ว • " +
        mode +
        " • V3.1";


      results.appendChild(
        status
      );


      // ==================================================
      // Scroll
      // ==================================================

      window.scrollTo({

        top:
          results.offsetTop - 15,

        behavior:
          "smooth"

      });

    }
  );


// ======================================================
// ปุ่มล้างข้อมูล
// ======================================================

document
  .getElementById("clearDataBtn")
  .addEventListener(
    "click",
    async function () {

      const confirmClear =
        confirm(
          "ต้องการล้างข้อมูลที่บันทึกไว้ใช่ไหม?"
        );


      if (!confirmClear) {
        return;
      }


      const { error } =
        await supabaseClient
          .from("gold_settings")
          .delete()
          .eq("id", 1);


      if (error) {

        console.error(
          "ล้างข้อมูลไม่สำเร็จ:",
          error
        );

        alert(
          "ล้างข้อมูลไม่สำเร็จ\n\n" +
          error.message
        );

        return;
      }


      document.getElementById(
        "price"
      ).value = "";

      document.getElementById(
        "d1ma12"
      ).value = "";

      document.getElementById(
        "d1atr"
      ).value = "";

      document.getElementById(
        "d1sd"
      ).value = "";

      document.getElementById(
        "d1ma247"
      ).value = "";

      document.getElementById(
        "w1ma12"
      ).value = "";

      document.getElementById(
        "w1atr"
      ).value = "";

      document.getElementById(
        "w1sd"
      ).value = "";

      document.getElementById(
        "results"
      ).innerHTML = "";


      alert(
        "ล้างข้อมูลเรียบร้อยแล้ว 🧹"
      );

    }
  );


// ======================================================
// เริ่มต้น
// ======================================================

loadSavedData();
