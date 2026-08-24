const SUPABASE_URL = "https://ctolckvhfojrchzjaqyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_l5UISnbptCI8T6HwE7di2w_0e7ZGyqR";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ======================================================
// โหลดข้อมูลที่บันทึกไว้
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

document.querySelector(".analyze-btn").addEventListener(
  "click",
  async function () {

    const price = Number(
      document.getElementById("price").value
    );

    const d1ma12 = Number(
      document.getElementById("d1ma12").value
    );

    const d1atr = Number(
      document.getElementById("d1atr").value
    );

    const d1sd = Number(
      document.getElementById("d1sd").value
    );

    const d1ma247Value =
      document.getElementById("d1ma247").value;

    const d1ma247 =
      d1ma247Value === ""
        ? null
        : Number(d1ma247Value);


    // ==================================================
    // W1
    // ==================================================

    const w1ma12Value =
      document.getElementById("w1ma12").value;

    const w1atrValue =
      document.getElementById("w1atr").value;

    const w1sdValue =
      document.getElementById("w1sd").value;


    const hasW1 =
      w1ma12Value !== "" &&
      w1atrValue !== "" &&
      w1sdValue !== "";


    const w1ma12 =
      hasW1 ? Number(w1ma12Value) : null;

    const w1atr =
      hasW1 ? Number(w1atrValue) : null;

    const w1sd =
      hasW1 ? Number(w1sdValue) : null;


    // ==================================================
    // ตรวจ D1
    // ==================================================

    if (
      !price ||
      !d1ma12 ||
      !d1atr ||
      !d1sd
    ) {

      alert(
        "กรุณากรอก ราคา + D1 MA12 + D1 ATR14 + D1 SD20"
      );

      return;
    }


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
    // D1 ZONES
    // ==================================================

    const d1Zones = [

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


    // ==================================================
    // W1 ZONES
    // ==================================================

    let w1Zones = [];


    if (hasW1) {

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
    // คำนวณระยะห่าง
    // ==================================================

    allZones.forEach(zone => {

      zone.distance =
        Math.abs(zone.price - price);

      zone.above =
        zone.price > price;

    });


    // ==================================================
    // เรียงจากใกล้ที่สุด
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


    const title =
      document.createElement("div");

    title.className =
      "result-header";


    title.innerHTML = `
      <div>
        <h2 style="margin:0;">
          🎯 Gold Zones
        </h2>

        <div style="
          color:#888;
          font-size:12px;
          margin-top:4px;
        ">
          ราคาอ้างอิง
          ${price.toFixed(2)}
        </div>
      </div>

      <div class="result-count">
        ${hasW1 ? "D1 + W1" : "D1 Only"}
      </div>
    `;


    results.appendChild(title);


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

              ห่าง
              ${zone.distance.toFixed(2)}

            </div>

          </div>

        `;


        results.appendChild(card);

      });


    // ==================================================
    // สถานะ
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
      hasW1
        ? "☁️ บันทึกข้อมูลแล้ว • วิเคราะห์ D1 + W1"
        : "☁️ บันทึกข้อมูลแล้ว • วิเคราะห์ D1";


    results.appendChild(status);


    window.scrollTo({
      top: results.offsetTop - 15,
      behavior: "smooth"
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
// โหลดข้อมูลเมื่อเปิดเว็บ
// ======================================================

loadSavedData();
