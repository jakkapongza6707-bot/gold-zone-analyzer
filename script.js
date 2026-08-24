const SUPABASE_URL = "https://ctolckvhfojrchzjaqyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_l5UISnbptCI8T6HwE7di2w_0e7ZGyqR";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ================================
// โหลดข้อมูลเก่าเมื่อเปิดเว็บ
// ================================

async function loadSavedData() {

  const { data, error } = await supabaseClient
    .from("gold_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

if (saveError) {
  console.error("บันทึกไม่สำเร็จ:", saveError);

  alert(
    "บันทึกไม่สำเร็จ\n\n" +
    "ข้อความ: " + (saveError.message || "") + "\n" +
    "รหัส: " + (saveError.code || "") + "\n" +
    "รายละเอียด: " + (saveError.details || "") + "\n" +
    "Hint: " + (saveError.hint || "")
  );

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


// ================================
// วิเคราะห์
// ================================

document.querySelector("button").addEventListener("click", async function () {

  const price = Number(document.getElementById("price").value);

  const d1ma12 = Number(document.getElementById("d1ma12").value);
  const d1atr = Number(document.getElementById("d1atr").value);
  const d1sd = Number(document.getElementById("d1sd").value);

  const d1ma247Value = document.getElementById("d1ma247").value;
  const d1ma247 = d1ma247Value === "" ? null : Number(d1ma247Value);

  const w1ma12 = Number(document.getElementById("w1ma12").value);
  const w1atr = Number(document.getElementById("w1atr").value);
  const w1sd = Number(document.getElementById("w1sd").value);


  if (
    !price ||
    !d1ma12 ||
    !d1atr ||
    !d1sd ||
    !w1ma12 ||
    !w1atr ||
    !w1sd
  ) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }


  // ================================
  // บันทึกข้อมูลลง Supabase
  // ================================

  const { error: saveError } = await supabaseClient
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
    console.error("บันทึกไม่สำเร็จ:", saveError);
    alert("บันทึกข้อมูลไม่สำเร็จ");
    return;
  }


  // ================================
  // คำนวณ D1 Zones
  // ================================

  const d1Zones = [
    ["D1 +1 ATR", d1ma12 + d1atr],
    ["D1 +0.75 ATR", d1ma12 + d1atr * 0.75],
    ["D1 +0.50 ATR", d1ma12 + d1atr * 0.50],
    ["D1 +0.25 ATR", d1ma12 + d1atr * 0.25],
    ["D1 MA12", d1ma12],
    ["D1 -0.25 ATR", d1ma12 - d1atr * 0.25],
    ["D1 -0.50 ATR", d1ma12 - d1atr * 0.50],
    ["D1 -0.75 ATR", d1ma12 - d1atr * 0.75],
    ["D1 -1 ATR", d1ma12 - d1atr],

    ["D1 +1 SD", d1ma12 + d1sd],
    ["D1 +2 SD", d1ma12 + d1sd * 2],
    ["D1 -1 SD", d1ma12 - d1sd],
    ["D1 -2 SD", d1ma12 - d1sd * 2]
  ];


  // ================================
  // คำนวณ W1 Zones
  // ================================

  const w1Zones = [
    ["W1 +1 ATR", w1ma12 + w1atr],
    ["W1 +0.75 ATR", w1ma12 + w1atr * 0.75],
    ["W1 +0.50 ATR", w1ma12 + w1atr * 0.50],
    ["W1 +0.25 ATR", w1ma12 + w1atr * 0.25],
    ["W1 MA12", w1ma12],
    ["W1 -0.25 ATR", w1ma12 - w1atr * 0.25],
    ["W1 -0.50 ATR", w1ma12 - w1atr * 0.50],
    ["W1 -0.75 ATR", w1ma12 - w1atr * 0.75],
    ["W1 -1 ATR", w1ma12 - w1atr],

    ["W1 +1 SD", w1ma12 + w1sd],
    ["W1 +2 SD", w1ma12 + w1sd * 2],
    ["W1 -1 SD", w1ma12 - w1sd],
    ["W1 -2 SD", w1ma12 - w1sd * 2]
  ];


  const allZones = [...d1Zones, ...w1Zones];


  allZones.sort((a, b) =>
    Math.abs(a[1] - price) - Math.abs(b[1] - price)
  );


  // ================================
  // แสดงผล
  // ================================

  let html = `
    <h2>ผลการวิเคราะห์</h2>
    <p>ราคาปัจจุบัน: <strong>${price.toFixed(2)}</strong></p>
  `;


  allZones.slice(0, 10).forEach((zone, index) => {

    const distance = Math.abs(zone[1] - price);

    const direction =
      zone[1] > price
        ? "⬆️ ด้านบน"
        : "⬇️ ด้านล่าง";


    html += `
      <div style="
        padding:10px;
        margin:6px 0;
        border:1px solid #ccc;
        border-radius:8px;
      ">
        <strong>#${index + 1} ${zone[0]}</strong><br>
        ราคา: <strong>${zone[1].toFixed(2)}</strong><br>
        ${direction} | ห่าง ${distance.toFixed(2)}
      </div>
    `;
  });


  document.body.insertAdjacentHTML("beforeend", html);

  alert("บันทึกข้อมูลเรียบร้อยแล้ว ☁️");
});


// ================================
// เรียกโหลดข้อมูลเก่า
// ================================

loadSavedData();
