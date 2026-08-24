const SUPABASE_URL = "https://ctolckvhfojrchzjaqyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_l5UISnbptCI8T6HwE7di2w_0e7ZGyqR";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


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
// วิเคราะห์ Gold Zones
// ======================================================

document
  .querySelector(".analyze-btn")
  .addEventListener("click", async function () {

    const price = Number(
      document.getElementById("price").value
    );


    // ==================================================
    // อ่านค่า D1
    // ==================================================

    const d1ma12Value =
      document.getElementById("d1ma12").value.trim();

    const d1atrValue =
      document.getElementById("d1atr").value.trim();

    const d1sdValue =
      document.getElementById("d1sd").value.trim();

    const d1ma247Value =
      document.getElementById("d1ma247").value.trim();


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
    // อ่านค่า W1
    // ==================================================

    const w1ma12Value =
      document.getElementById("w1ma12").value.trim();

    const w1atrValue =
      document.getElementById("w1atr").value.trim();

    const w1sdValue =
      document.getElementById("w1sd").value.trim();


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

      alert("กรุณากรอกราคาทอง");

      return;
    }


    // ==================================================
    // ต้องมีอย่างน้อย 1 TF
    // ==================================================

    if (!d1HasAny && !w1HasAny) {

      alert(
        "กรุณากรอกข้อมูล D1 หรือ W1 อย่างน้อย 1 ชุด"
      );

      return;
    }


    // ==================================================
    // ถ้าเริ่มกรอก D1 ต้องกรอก D1 ให้ครบ
    // ==================================================

    if (d1HasAny && !d1Complete) {

      alert(
        "ข้อมูล D1 ยังไม่ครบ\n\n" +
        "ต้องมี MA12 + ATR14 + SD20"
      );

      return;
    }


    // ==================================================
    // ถ้าเริ่มกรอก W1 ต้องกรอก W1 ให้ครบ
    // ==================================================

    if (w1HasAny && !w1Complete) {

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
    // บันทึกข้อมูล
    // ==================================================

    const { error: saveError } =
      await supabaseClient
        .from("gold_settings")
        .upsert({

          id: 1,

          price: price,

          d1ma12: d1ma12,

          d1atr: d1atr,

          d1sd: d1sd,

          d1ma247: d1ma247,

          w1ma12: w1ma12,

          w1atr: w1atr,

          w1sd: w1sd

        });


    if (saveError) {

      console.error(
        "บันทึกไม่สำเร็จ:",
        saveError
      );

      alert(
        "บันทึกไม่สำเร็จ\n\n" +
        "ข้อความ: " +
        (saveError.message || "") +
        "\n" +
        "รหัส: " +
        (saveError.code || "") +
        "\n" +
        "รายละเอียด: " +
        (saveError.details || "") +
        "\n" +
        "Hint: " +
        (saveError.hint || "")
      );

      return;
    }


    // ==================================================
    // สร้าง D1 Zones
    // ==================================================

    let d1Zones = [];


    if (d1Complete) {

      d1Zones = [

        {
          name: "D1 +1 ATR",
          price: d1ma12 + d1atr,
          type: "D1"
        },

        {
          name: "D1 +0.75 ATR",
          price: d1ma12 + d1atr * 0.75,
          type: "D1"
        },

        {
          name: "D1 +0.50 ATR",
          price: d1ma12 + d1atr * 0.50,
          type: "D1"
        },

        {
          name: "D1 +0.25 ATR",
          price: d1ma12 + d1atr * 0.25,
          type: "D1"
        },

        {
          name: "D1 MA12",
          price: d1ma12,
          type: "D1"
        },

        {
          name: "D1 -0.25 ATR",
          price: d1ma12 - d1atr * 0.25,
          type: "D1"
        },

        {
          name: "D1 -0.50 ATR",
          price: d1ma12 - d1atr * 0.50,
          type: "D1"
        },

        {
          name: "D1 -0.75 ATR",
          price: d1ma12 - d1atr * 0.75,
          type: "D1"
        },

        {
          name: "D1 -1 ATR",
          price: d1ma12 - d1atr,
          type: "D1"
        },

        {
          name: "D1 +1 SD",
          price: d1ma12 + d1sd,
          type: "D1"
        },

        {
          name: "D1 +2 SD",
          price: d1ma12 + d1sd * 2,
          type: "D1"
        },

        {
          name: "D1 -1 SD",
          price: d1ma12 - d1sd,
          type: "D1"
        },

        {
          name: "D1 -2 SD",
          price: d1ma12 - d1sd * 2,
          type: "D1"
        }
      ];
    }


    // ==================================================
    // สร้าง W1 Zones
    // ==================================================

    let w1Zones = [];


    if (w1Complete) {

      w1Zones = [

        {
          name: "W1 +1 ATR",
          price: w1ma12 + w1atr,
          type: "W1"
        },

        {
          name: "W1 +0.75 ATR",
          price: w1ma12 + w1atr * 0.75,
          type: "W1"
        },

        {
          name: "W1 +0.50 ATR",
          price: w1ma12 + w1atr * 0.50,
          type: "W1"
        },

        {
          name: "W1 +0.25 ATR",
          price: w1ma12 + w1atr * 0.25,
          type: "W1"
        },

        {
          name: "W1 MA12",
          price: w1ma12,
          type: "W1"
        },

        {
          name: "W1 -0.25 ATR",
          price: w1ma12 - w1atr * 0.25,
          type: "W1"
        },

        {
          name: "W1 -0.50 ATR",
          price: w1ma12 - w1atr * 0.50,
          type: "W1"
        },

        {
          name: "W1 -0.75 ATR",
          price: w1ma12 - w1atr * 0.75,
          type: "W1"
        },

        {
          name: "W1 -1 ATR",
          price: w1ma12 - w1atr,
          type: "W1"
        },

        {
          name: "W1 +1 SD",
          price: w1ma12 + w1sd,
          type: "W1"
        },

        {
          name: "W1 +2 SD",
          price: w1ma12 + w1sd * 2,
          type: "W1"
        },

        {
          name: "W1 -1 SD",
          price: w1ma12 - w1sd,
          type: "W1"
        },

        {
          name: "W1 -2 SD",
          price: w1ma12 - w1sd * 2,
          type: "W1"
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
    // ระยะห่าง
    // ==================================================

    allZones.forEach(zone => {

      zone.distance =
        Math.abs(zone.price - price);

      zone.above =
        zone.price > price;

    });


    // ==================================================
    // เรียงจากใกล้สุด
    // ==================================================

    allZones.sort(
      (a, b) =>
        a.distance - b.distance
    );


    // ==================================================
    // แสดงผล
    // ==================================================

    const results =
      document.getElementById("results");

    results.innerHTML = "";


    let mode = "";

    if (d1Complete && w1Complete) {

      mode = "D1 + W1";

    } else if (d1Complete) {

      mode = "D1 Only";

    } else {

      mode = "W1 Only";

    }


    const header =
      document.createElement("div");

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


    results.appendChild(header);


    // ==================================================
    // Zone Cards
    // ==================================================

    allZones
      .slice(0, 10)
      .forEach((zone, index) => {

        const card =
          document.createElement("div");


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

              ${index === 0 ? "⭐ " : ""}

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

          </div>

          <div class="zone-distance">

            <div class="${directionClass}">
              ${direction}
            </div>

            <div style="
              margin-top:4px;
              font-size:11px;
            ">
              ห่าง ${zone.distance.toFixed(2)}
            </div>

          </div>

        `;


        results.appendChild(card);

      });


    // ==================================================
    // Status
    // ==================================================

    const status =
      document.createElement("div");


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
      "☁️ บันทึกข้อมูลแล้ว • " + mode;


    results.appendChild(status);


    // ==================================================
    // เลื่อนลงไปดูผล
    // ==================================================

    window.scrollTo({

      top:
        results.offsetTop - 15,

      behavior:
        "smooth"

    });

  });


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


      document.getElementById("price").value = "";

      document.getElementById("d1ma12").value = "";

      document.getElementById("d1atr").value = "";

      document.getElementById("d1sd").value = "";

      document.getElementById("d1ma247").value = "";

      document.getElementById("w1ma12").value = "";

      document.getElementById("w1atr").value = "";

      document.getElementById("w1sd").value = "";

      document.getElementById("results").innerHTML = "";


      alert(
        "ล้างข้อมูลเรียบร้อยแล้ว 🧹"
      );

    }
  );


// ======================================================
// เริ่มต้น
// ======================================================

loadSavedData();
