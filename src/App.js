/*
 * Jet Stream Clean Quote Application
 *
 * This React component implements a multi-step form that allows
 * potential customers to build an instant quote for carpet, tile,
 * upholstery, rug and pest control services.  The pricing logic is
 * contained in the RATES constant and the `useMemo` hook below.
 *
 * The user can proceed through four steps: entering their location,
 * selecting services and quantities, providing contact information
 * and viewing a summary of the quote.  The final step includes a
 * button that copies the quote text to the clipboard and opens the
 * booking URL in a new tab.
 */
import React, { useMemo, useState } from "react";

// Helper to format numbers as USD currency strings.
const fmt = (n) => {
  return "$" + (Math.round(n * 100) / 100).toFixed(2);
};

// Helper to join class names conditionally.
const cls = (...xs) => xs.filter(Boolean).join(" ");

// Booking URL that users are directed to after copying their quote.
const SQUARE_BOOKING_URL = "https://jetstreamclean.square.site";

// Rate definitions for all services offered.  These values drive
// the pricing summary constructed in the useMemo hook below.
const RATES = {
  minCharge: 135,
  serviceZones: {
    local: { label: "Local (within 50 miles of Fort Mitchell)", fee: 0 },
    extended: { label: "Extended (55+ miles from Fort Mitchell)", fee: 45 },
  },
  carpets: {
    rooms: {
      standard: { label: "Standard Steam Clean", price: 45, desc: "Professional steam cleaning with truck mounted carpet cleaner using hot water extraction." },
      reset: { label: "Factory Reset Clean", price: 90, desc: "Deep cleaning with truck mounted carpet cleaner using CRB (counter rotating brushes) scrubber that unlocks hair and debris, and deodorizer." },
      deluxe: { label: "Factory Reset Deluxe", price: 135, desc: "Includes everything with the Factory Reset Clean package plus prevacuuming and fiber protection." },
    },
    stairs: {
      standard: { label: "Standard Steam Clean (Stairs)", price: 65, desc: "Professional steam cleaning with truck mounted carpet cleaner using hot water extraction." },
      reset: { label: "Factory Reset Clean (Stairs)", price: 130, desc: "Deep cleaning with truck mounted carpet cleaner using CRB (counter rotating brushes) scrubber that unlocks hair and debris, and deodorizer." },
      deluxe: { label: "Factory Reset Deluxe (Stairs)", price: 170, desc: "Includes everything with the Factory Reset Clean package plus prevacuuming and fiber protection." },
    },
    downHall: {
      standard: { label: "Standard Steam Clean (Downstairs Hallway)", price: 20, desc: "Professional steam cleaning with truck mounted carpet cleaner using hot water extraction." },
      reset: { label: "Factory Reset Clean (Downstairs Hallway)", price: 40, desc: "Deep cleaning with truck mounted carpet cleaner using CRB (counter rotating brushes) scrubber that unlocks hair and debris, and deodorizer." },
      deluxe: { label: "Factory Reset Deluxe (Downstairs Hallway)", price: 60, desc: "Includes everything with the Factory Reset Clean package plus prevacuuming and fiber protection." },
    },
    upLanding: {
      standard: { label: "Standard Steam Clean (Upstairs Landing)", price: 65, desc: "Professional steam cleaning with truck mounted carpet cleaner using hot water extraction." },
      reset: { label: "Factory Reset Clean (Upstairs Landing)", price: 130, desc: "Deep cleaning with truck mounted carpet cleaner using CRB (counter rotating brushes) scrubber that unlocks hair and debris, and deodorizer." },
      deluxe: { label: "Factory Reset Deluxe (Upstairs Landing)", price: 175, desc: "Includes everything with the Factory Reset Clean package plus prevacuuming and fiber protection." },
    },
    walkIn: {
      standard: { label: "Standard Steam Clean (Walk-In Closet)", price: 20, desc: "Professional steam cleaning with truck mounted carpet cleaner using hot water extraction." },
      reset: { label: "Factory Reset Clean (Walk-In Closet)", price: 40, desc: "Deep cleaning with truck mounted carpet cleaner using CRB (counter rotating brushes) scrubber that unlocks hair and debris, and deodorizer." },
      deluxe: { label: "Factory Reset Deluxe (Walk-In Closet)", price: 60, desc: "Includes everything with the Factory Reset Clean package plus prevacuuming and fiber protection." },
    },
  },
  tile: { rate: 0.5 },
  upholstery: {
    ottoman: { label: "Ottoman", price: 40 },
    accentChair: { label: "Accent Chair", price: 40 },
    diningChair: { label: "Dining Chair", price: 25 },
    recliner: { label: "Recliner Chair", price: 65 },
    oversizedChair: { label: "Oversized Double Chair", price: 65 },
    throwPillow: { label: "Throw Pillow", price: 5 },
    loveseat: { label: "Loveseat", price: 85 },
    couch3: { label: "Couch (3 Cushions)", price: 100 },
    couch4: { label: "Couch (4 Cushions)", price: 140 },
    sectional: { label: "Sectional (by cushions)", price: 0 },
    mattressTwin: { label: "Twin Mattress", price: 50 },
    mattressFull: { label: "Full Mattress", price: 65 },
    mattressQueen: { label: "Queen Mattress", price: 80 },
    mattressKing: { label: "King Mattress", price: 95 },
  },
  sectionalPrices: {
    4: 140, 5: 195, 6: 235, 7: 275, 8: 315, 9: 355, 10: 395, 11: 435, 12: 485,
  },
  upholsteryAddOns: {
    deodorizerCap: 20,
    fabricProtectorCap: 50,
    deodorizerPct: 0.15,
    fabricProtectorPct: 0.20,
  },
  rugs: {
    small: { label: "Below 5x8", standard: 50, reset: 75, deluxe: 100 },
    medium: { label: "5x8 to 6x9", standard: 60, reset: 90, deluxe: 120 },
    large: { label: "6x9 to 8x10", standard: 75, reset: 112, deluxe: 150 },
    xlarge: { label: "8x10 to 9x12", standard: 90, reset: 135, deluxe: 180 },
    xxlarge: { label: "9x12 to 10x14", standard: 110, reset: 165, deluxe: 220 },
    huge: { label: "10x14 to 12x18", standard: 162, reset: 243, deluxe: 324 },
    massive: { label: "12x18 to 20x20", standard: 300, reset: 450, deluxe: 600 },
  },
  pest: {
    monthly: { label: "Monthly General Pest Control", price: 49.99 },
    oneTime: { label: "One-Time General Pest Control", price: 129.99 },
    flea1600: 149,
    flea3200: 300,
  },
};

// Helper to build the quote text for copying.  It assembles the
// line-by-line summary along with the customer's contact information.
function buildQuoteText(summary, customerName, customerPhone, customerEmail, address, zip) {
  const lines = summary.lines.map(l => {
    const eachStr = l.each !== undefined ? " x " + fmt(l.each) : "";
    return l.label + " - " + l.qty + eachStr + " = " + fmt(l.total);
  }).join("\n");
  const contactInfo = "\n\nCUSTOMER INFORMATION:\nName: " + customerName + "\nPhone: " + customerPhone + "\nEmail: " + customerEmail + "\nAddress: " + address + ", " + zip;
  return "Jet Stream Clean - Quote\n" + lines + "\nTOTAL: " + fmt(summary.total) + contactInfo + "\n\nThis quote is an estimate. Minimum charge $135 applies.";
}

function App() {
  // Form step state
  const [step, setStep] = useState(1);
  // Zone and location details
  const [zone, setZone] = useState("local");
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState("");
  // Service selection toggles
  const [active, setActive] = useState({
    carpet: false,
    tile: false,
    upholstery: false,
    rugs: false,
    pest: false,
  });
  // Carpet area quantities
  const [carpetRooms, setCarpetRooms] = useState({ standard: 0, reset: 0, deluxe: 0 });
  const [carpetStairs, setCarpetStairs] = useState({ standard: 0, reset: 0, deluxe: 0 });
  const [downHall, setDownHall] = useState({ standard: 0, reset: 0, deluxe: 0 });
  const [upLanding, setUpLanding] = useState({ standard: 0, reset: 0, deluxe: 0 });
  const [walkIn, setWalkIn] = useState({ standard: 0, reset: 0, deluxe: 0 });
  const [selectedCarpetType, setSelectedCarpetType] = useState("rooms");
  // Tile total square footage
  const [tileTotalSqft, setTileTotalSqft] = useState(0);
  // Upholstery quantities and add-ons
  const uphKeys = ["ottoman","accentChair","diningChair","recliner","oversizedChair","throwPillow","loveseat","couch3","couch4","mattressTwin","mattressFull","mattressQueen","mattressKing"];
  const [uphQty, setUphQty] = useState({
    ottoman:0, accentChair:0, diningChair:0, recliner:0, oversizedChair:0, throwPillow:0, loveseat:0, couch3:0, couch4:0, mattressTwin:0, mattressFull:0, mattressQueen:0, mattressKing:0
  });
  const [uphDeo, setUphDeo] = useState({
    ottoman:false, accentChair:false, diningChair:false, recliner:false, oversizedChair:false, throwPillow:false, loveseat:false, couch3:false, couch4:false, mattressTwin:false, mattressFull:false, mattressQueen:false, mattressKing:false
  });
  const [uphProt, setUphProt] = useState({
    ottoman:false, accentChair:false, diningChair:false, recliner:false, oversizedChair:false, throwPillow:false, loveseat:false, couch3:false, couch4:false, mattressTwin:false, mattressFull:false, mattressQueen:false, mattressKing:false
  });
  // Sectional settings
  const [sectionalCushions, setSectionalCushions] = useState(6);
  const [sectionalQty, setSectionalQty] = useState(0);
  const [sectionalDeo, setSectionalDeo] = useState(false);
  const [sectionalProt, setSectionalProt] = useState(false);
  // Rug selections
  const rugSizes = ["small", "medium", "large", "xlarge", "xxlarge", "huge", "massive"];
  const [rugPackages, setRugPackages] = useState({
    small: { standard: 0, reset: 0, deluxe: 0 },
    medium: { standard: 0, reset: 0, deluxe: 0 },
    large: { standard: 0, reset: 0, deluxe: 0 },
    xlarge: { standard: 0, reset: 0, deluxe: 0 },
    xxlarge: { standard: 0, reset: 0, deluxe: 0 },
    huge: { standard: 0, reset: 0, deluxe: 0 },
    massive: { standard: 0, reset: 0, deluxe: 0 },
  });
  const [selectedRugSize, setSelectedRugSize] = useState("small");
  const [selectedRugMaterial, setSelectedRugMaterial] = useState("synthetic");
  // Pest control options
  const [pestMonthly, setPestMonthly] = useState(false);
  const [pestOneTime, setPestOneTime] = useState(false);
  const [pestHomeSqft, setPestHomeSqft] = useState(0);
  // Copy/booking state and contact info
  const [copied, setCopied] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Calculate summary whenever any of the dependencies change.  This
  // hook returns an object containing individual line items as well
  // as subtotal and total values.
  const summary = useMemo(() => {
    const lines = [];
    let sub = 0;
    // Carpet rooms
    Object.keys(RATES.carpets.rooms).forEach((k) => {
      const qty = carpetRooms[k] || 0; 
      if(qty === 0) return;
      const each = RATES.carpets.rooms[k].price; 
      const total = qty * each;
      lines.push({label: RATES.carpets.rooms[k].label, qty, each, total}); 
      sub = sub + total;
    });
    // Carpet stairs
    Object.keys(RATES.carpets.stairs).forEach((k) => {
      const qty = carpetStairs[k] || 0; 
      if(qty === 0) return;
      const each = RATES.carpets.stairs[k].price; 
      const total = qty * each;
      lines.push({label: RATES.carpets.stairs[k].label, qty, each, total}); 
      sub = sub + total;
    });
    // Down hall
    Object.keys(RATES.carpets.downHall).forEach((k) => {
      const qty = downHall[k] || 0; 
      if(qty === 0) return;
      const each = RATES.carpets.downHall[k].price; 
      const total = qty * each;
      lines.push({label: RATES.carpets.downHall[k].label, qty, each, total}); 
      sub = sub + total;
    });
    // Up landing
    Object.keys(RATES.carpets.upLanding).forEach((k) => {
      const qty = upLanding[k] || 0; 
      if(qty === 0) return;
      const each = RATES.carpets.upLanding[k].price; 
      const total = qty * each;
      lines.push({label: RATES.carpets.upLanding[k].label, qty, each, total}); 
      sub = sub + total;
    });
    // Walk-in closet
    Object.keys(RATES.carpets.walkIn).forEach((k) => {
      const qty = walkIn[k] || 0; 
      if(qty === 0) return;
      const each = RATES.carpets.walkIn[k].price; 
      const total = qty * each;
      lines.push({label: RATES.carpets.walkIn[k].label, qty, each, total}); 
      sub = sub + total;
    });
    // Tile
    const t = Math.max(0, Number(tileTotalSqft) || 0);
    if (t > 0) { 
      const total = t * RATES.tile.rate; 
      sub = sub + total; 
      lines.push({label:"Tile and Grout Cleaning", qty:t, each:RATES.tile.rate, total});
    }
    // Upholstery add-on pricing caps and percentages
    const deoPct = RATES.upholsteryAddOns.deodorizerPct;
    const fabricPct = RATES.upholsteryAddOns.fabricProtectorPct;
    const deoCap = RATES.upholsteryAddOns.deodorizerCap;
    const fabricCap = RATES.upholsteryAddOns.fabricProtectorCap;
    // Sectional pricing
    if (sectionalQty > 0) {
      const sectionalBase = RATES.sectionalPrices[sectionalCushions] || 0;
      const sectionalTotal = sectionalBase * sectionalQty;
      sub = sub + sectionalTotal;
      lines.push({label: "Sectional - " + sectionalCushions + " cushions", qty: sectionalQty, each: sectionalBase, total: sectionalTotal});
      if (sectionalDeo) {
        const deoEach = Math.min(deoCap, Math.round(sectionalBase * deoPct));
        const total = deoEach * sectionalQty;
        sub = sub + total;
        lines.push({label: "Sectional - Deodorizer", qty: sectionalQty, each: deoEach, total});
      }
      if (sectionalProt) {
        const fabricEach = Math.min(fabricCap, Math.round(sectionalBase * fabricPct));
        const total = fabricEach * sectionalQty;
        sub = sub + total;
        lines.push({label: "Sectional - Fabric Protector", qty: sectionalQty, each: fabricEach, total});
      }
    }
    // Other upholstery items
    uphKeys.forEach((k) => {
      let base = RATES.upholstery[k].price;
      const qty = uphQty[k] || 0; 
      if(qty === 0) return;
      const baseTotal = base * qty; 
      sub = sub + baseTotal; 
      lines.push({label: RATES.upholstery[k].label, qty, each: base, total: baseTotal});
      if (uphDeo[k]) { 
        const deoEach = Math.min(deoCap, Math.round(base * deoPct));
        const total = deoEach * qty; 
        sub = sub + total; 
        lines.push({label: RATES.upholstery[k].label + " - Deodorizer", qty, each:deoEach, total});
      }
      if (uphProt[k]) { 
        const fabricEach = Math.min(fabricCap, Math.round(base * fabricPct));
        const total = fabricEach * qty; 
        sub = sub + total; 
        lines.push({label: RATES.upholstery[k].label + " - Fabric Protector", qty, each:fabricEach, total});
      }
    });
    // Rug pricing
    rugSizes.forEach((size) => {
      ["standard", "reset", "deluxe"].forEach((pkg) => {
        const qty = rugPackages[size][pkg] || 0;
        if (qty === 0) return;
        const each = RATES.rugs[size][pkg];
        const total = qty * each;
        lines.push({ label: `Area Rug ${RATES.rugs[size].label} - ${pkg === "standard" ? "Standard Steam Clean" : pkg === "reset" ? "Factory Reset Clean" : "Factory Reset Deluxe"}`, qty, each, total });
        sub = sub + total;
      });
    });
    // Pest control selections
    if (pestMonthly) { 
      const each = RATES.pest.monthly.price; 
      sub = sub + each; 
      lines.push({label:"Monthly General Pest Control (AL only)", qty:1, each, total:each});
    }
    if (pestOneTime) { 
      const each = RATES.pest.oneTime.price; 
      sub = sub + each; 
      lines.push({label:"One-Time General Pest Control (AL only)", qty:1, each, total:each});
    }
    if (pestHomeSqft > 0) {
      let label = "Move-Out Flea and Tick (AL only)"; 
      let price = 0;
      if (pestHomeSqft <= 1600) {
        price = RATES.pest.flea1600;
      } else if (pestHomeSqft <= 3200) {
        price = RATES.pest.flea3200;
      } else {
        label = label + " - custom quote";
      }
      if (price > 0) { 
        sub = sub + price; 
        lines.push({label, qty:1, each:price, total:price});
      }
    }
    // Zone fee and minimum charge
    const zoneFee = zone === "extended" ? RATES.serviceZones.extended.fee : 0;
    if (zoneFee > 0) { 
      sub = sub + zoneFee; 
      lines.push({label: "Service Zone Fee", qty:1, each: zoneFee, total: zoneFee});
    }
    if (sub < RATES.minCharge && sub > 0) {
      const diff = RATES.minCharge - sub; 
      sub = sub + diff; 
      lines.push({label:"Minimum Charge Adjustment", qty:1, each: diff, total: diff});
    }
    return { lines, subtotal: sub, total: sub };
  }, [
    carpetRooms, carpetStairs, downHall, upLanding, walkIn,
    tileTotalSqft,
    uphQty, uphDeo, uphProt, 
    sectionalCushions, sectionalQty, sectionalDeo, sectionalProt,
    rugPackages,
    pestMonthly, pestOneTime, pestHomeSqft,
    zone
  ]);

  // Handle copying the quote and opening the booking page.
  const handleCopyAndProceed = () => {
    navigator.clipboard.writeText(buildQuoteText(summary, customerName, customerPhone, customerEmail, address, zip)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open(SQUARE_BOOKING_URL, "_blank");
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-slate-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">JET STREAM CLEAN</h1>
        <p className="text-sm text-slate-600">Get your instant quote in 4 easy steps. Minimum charge of $135 applies to all jobs.</p>
      </div>
      <div className="flex items-center justify-center mb-8 gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={cls("w-10 h-10 rounded-full flex items-center justify-center font-semibold", step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500")}>
              {s}
            </div>
            {s < 4 && <div className={cls("w-12 h-1 mx-1", step > s ? "bg-blue-600" : "bg-gray-200")} />}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-blue-900">Step 1: Location Details</h2>
            <input 
              placeholder="ZIP Code" 
              value={zip} 
              onChange={(e) => setZip(e.target.value)} 
              className="border border-gray-300 rounded-lg h-12 px-4 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <input 
              placeholder="Street Address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              className="border border-gray-300 rounded-lg h-12 px-4 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <div className="grid md:grid-cols-2 gap-3">
              <button 
                className={cls("h-14 rounded-lg border-2 px-4 text-left transition-all", zone === "local" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:border-blue-400")} 
                onClick={() => setZone("local")}
              >
                <div className="font-semibold">Local Service</div>
                <div className="text-sm opacity-90">Within 50 miles - No fee</div>
              </button>
              <button 
                className={cls("h-14 rounded-lg border-2 px-4 text-left transition-all", zone === "extended" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:border-blue-400")} 
                onClick={() => setZone("extended")}
              >
                <div className="font-semibold">Extended Service</div>
                <div className="text-sm opacity-90">55+ miles - $45 travel fee</div>
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)} 
                className="h-12 px-8 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-blue-900">Step 2: Select Services</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {Object.keys(active).map((s) => (
                <button
                  key={s}
                  onClick={() => setActive((p) => ({ ...p, [s]: !p[s] }))}
                  className={cls("h-14 rounded-lg border-2 text-left px-4 transition-all font-semibold", active[s] ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:border-blue-400")}
                >
                  {s === "carpet" && "Carpet Cleaning"}
                  {s === "tile" && "Tile and Grout Cleaning"}
                  {s === "upholstery" && "Upholstery Cleaning"}
                  {s === "rugs" && "Area Rug Cleaning"}
                  {s === "pest" && "Pest Control (Alabama)"}
                </button>
              ))}
            </div>
            {active.carpet && (
              <section className="mt-6 space-y-6 bg-blue-50 p-6 rounded-lg">
                <div>
                  <h3 className="font-semibold text-xl mb-2 text-blue-900">Carpet Cleaning</h3>
                  <p className="text-sm text-slate-600 mb-4">Select carpet area below, then choose a cleaning package. Each room priced up to 300 sq ft.</p>
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-blue-900">Select Area Type:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <button
                        onClick={() => setSelectedCarpetType("rooms")}
                        className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedCarpetType === "rooms" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                      >
                        Rooms
                      </button>
                      <button
                        onClick={() => setSelectedCarpetType("stairs")}
                        className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedCarpetType === "stairs" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                      >
                        Stairs
                      </button>
                      <button
                        onClick={() => setSelectedCarpetType("downHall")}
                        className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedCarpetType === "downHall" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                      >
                        Downstairs Hallway
                      </button>
                      <button
                        onClick={() => setSelectedCarpetType("upLanding")}
                        className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedCarpetType === "upLanding" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                      >
                        Upstairs Landing
                      </button>
                      <button
                        onClick={() => setSelectedCarpetType("walkIn")}
                        className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedCarpetType === "walkIn" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                      >
                        Walk-In Closet
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-blue-900">
                      Packages for {selectedCarpetType === "rooms" ? "Rooms" : selectedCarpetType === "stairs" ? "Stairs" : selectedCarpetType === "downHall" ? "Downstairs Hallway" : selectedCarpetType === "upLanding" ? "Upstairs Landing" : "Walk-In Closet"}:
                    </h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      { ["standard", "reset", "deluxe"].map((k) => {
                        const state = selectedCarpetType === "rooms" ? carpetRooms : selectedCarpetType === "stairs" ? carpetStairs : selectedCarpetType === "downHall" ? downHall : selectedCarpetType === "upLanding" ? upLanding : walkIn;
                        const setState = selectedCarpetType === "rooms" ? setCarpetRooms : selectedCarpetType === "stairs" ? setCarpetStairs : selectedCarpetType === "downHall" ? setDownHall : selectedCarpetType === "upLanding" ? setUpLanding : setWalkIn;
                        return (
                          <div key={k} className="p-4 border-2 border-blue-200 rounded-lg bg-white">
                            <div className="font-semibold mb-1">{RATES.carpets[selectedCarpetType][k].label}</div>
                            <p className="text-xs text-slate-600 mb-2">{RATES.carpets[selectedCarpetType][k].desc}</p>
                            <div className="text-lg font-bold text-blue-600 mb-3">{fmt(RATES.carpets[selectedCarpetType][k].price)}</div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setState((p) => ({ ...p, [k]: Math.max(0, p[k] - 1) }))} 
                                className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                              >
                                -
                              </button>
                              <input 
                                type="number" 
                                value={state[k]} 
                                onChange={(e) => setState((p) => ({ ...p, [k]: Math.max(0, parseInt(e.target.value || "0", 10)) }))} 
                                className="border-2 border-gray-300 rounded text-center w-16 h-10 font-semibold" 
                              />
                              <button 
                                onClick={() => setState((p) => ({ ...p, [k]: p[k] + 1 }))} 
                                className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      }) }
                    </div>
                  </div>
                </div>
              </section>
            )}
            {active.tile && (
              <section className="mt-6 bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-2 text-blue-900">Tile and Grout Cleaning</h3>
                <p className="text-sm text-slate-600 mb-4">Single rate: {fmt(RATES.tile.rate)} / sq ft. Enter your total tile area below.</p>
                <label className="block text-sm font-medium">
                  <span>Total Tile Area (sq ft)</span>
                  <input 
                    type="number" 
                    className="mt-2 border-2 border-gray-300 rounded-lg h-12 px-4 w-full md:w-60 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={tileTotalSqft} 
                    onChange={(e) => setTileTotalSqft(Math.max(0, parseInt(e.target.value || "0", 10)))} 
                  />
                </label>
              </section>
            )}
            {active.upholstery && (
              <section className="mt-6 bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-2 text-blue-900">Upholstery Cleaning</h3>
                <p className="text-sm text-slate-600 mb-4">Add Deodorizer (15% of base, max $20) and Fabric Protector (20% of base, max $50) per item.</p>
                <div className="space-y-3">
                  <div className="p-4 border-2 border-blue-300 rounded-lg bg-white">
                    <div className="font-medium mb-3 text-blue-900">Sectional Configuration</div>
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <label className="text-sm">
                        <span className="font-medium block mb-2">Cushions per sectional:</span>
                        <input 
                          type="number" 
                          min={4} 
                          max={12} 
                          className="border-2 border-gray-300 rounded-lg h-10 px-3 w-full" 
                          value={sectionalCushions} 
                          onChange={(e) => setSectionalCushions(Math.max(4, Math.min(12, parseInt(e.target.value || "6", 10))))} 
                        />
                        <span className="text-xs text-slate-500 mt-1 block">Price: {fmt(RATES.sectionalPrices[sectionalCushions] || 0)}</span>
                      </label>
                      <div>
                        <span className="font-medium block mb-2 text-sm">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSectionalQty(Math.max(0, sectionalQty - 1))} 
                            className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            className="border-2 border-gray-300 rounded text-center w-20 h-10 font-semibold" 
                            value={sectionalQty} 
                            onChange={(e) => setSectionalQty(Math.max(0, parseInt(e.target.value || "0", 10)))} 
                          />
                          <button 
                            onClick={() => setSectionalQty(sectionalQty + 1)} 
                            className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <label className="inline-flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={sectionalDeo} 
                          onChange={(e) => setSectionalDeo(e.target.checked)} 
                          className="w-4 h-4"
                        />
                        <span>Deodorizer +{fmt(Math.min(RATES.upholsteryAddOns.deodorizerCap, Math.round((RATES.sectionalPrices[sectionalCushions] || 0) * RATES.upholsteryAddOns.deodorizerPct)))}</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={sectionalProt} 
                          onChange={(e) => setSectionalProt(e.target.checked)} 
                          className="w-4 h-4"
                        />
                        <span>Fabric Protector +{fmt(Math.min(RATES.upholsteryAddOns.fabricProtectorCap, Math.round((RATES.sectionalPrices[sectionalCushions] || 0) * RATES.upholsteryAddOns.fabricProtectorPct)))}</span>
                      </label>
                    </div>
                  </div>
                  {uphKeys.map((k) => {
                    const basePrice = RATES.upholstery[k].price;
                    const deoPrice = Math.min(RATES.upholsteryAddOns.deodorizerCap, Math.round(basePrice * RATES.upholsteryAddOns.deodorizerPct));
                    const fabricPrice = Math.min(RATES.upholsteryAddOns.fabricProtectorCap, Math.round(basePrice * RATES.upholsteryAddOns.fabricProtectorPct));
                    return (
                      <div key={k} className="p-4 border-2 border-blue-200 rounded-lg bg-white">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <div className="font-medium text-lg">{RATES.upholstery[k].label}</div>
                            <div className="text-xs text-slate-500">
                              Base {fmt(basePrice)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setUphQty(p => ({ ...p, [k]: Math.max(0, p[k] - 1) }))} 
                              className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              className="border-2 border-gray-300 rounded text-center w-16 h-10 font-semibold" 
                              value={uphQty[k]} 
                              onChange={(e) => setUphQty(p => ({ ...p, [k]: Math.max(0, parseInt(e.target.value || "0", 10)) }))} 
                            />
                            <button 
                              onClick={() => setUphQty(p => ({ ...p, [k]: (p[k] || 0) + 1 }))} 
                              className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <label className="inline-flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={uphDeo[k]} 
                              onChange={(e) => setUphDeo(p => ({ ...p, [k]: e.target.checked }))} 
                              className="w-4 h-4"
                            />
                            <span>Deodorizer +{fmt(deoPrice)}</span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              checked={uphProt[k]} 
                              onChange={(e) => setUphProt(p => ({ ...p, [k]: e.target.checked }))} 
                              className="w-4 h-4"
                            />
                            <span>Fabric Protector +{fmt(fabricPrice)}</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {active.rugs && (
              <section className="mt-6 bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-2 text-blue-900">Area Rug Cleaning</h3>
                <p className="text-sm text-slate-600 mb-4">Select your rug material and size below, then choose a cleaning package.</p>
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-blue-900">Select Rug Material:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      onClick={() => setSelectedRugMaterial("synthetic")}
                      className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedRugMaterial === "synthetic" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                    >
                      Synthetic/Nylon
                    </button>
                    <button
                      onClick={() => setSelectedRugMaterial("wool")}
                      className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedRugMaterial === "wool" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                    >
                      Wool/Oriental
                    </button>
                    <button
                      onClick={() => setSelectedRugMaterial("cotton")}
                      className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedRugMaterial === "cotton" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                    >
                      Cotton
                    </button>
                    <button
                      onClick={() => setSelectedRugMaterial("silk")}
                      className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedRugMaterial === "silk" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                    >
                      Silk/Delicate
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-blue-900">Select Rug Size:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {rugSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedRugSize(size)}
                        className={cls("p-3 rounded-lg border-2 text-center transition-all font-medium text-sm", selectedRugSize === size ? "bg-blue-600 text-white border-blue-600" : "bg-white border-blue-200 hover:border-blue-400")}
                      >
                        {RATES.rugs[size].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-3 text-blue-900">
                    Packages for {RATES.rugs[selectedRugSize].label} Rugs:
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Standard package */}
                    <div className="p-4 border-2 border-blue-200 rounded-lg bg-white">
                      <div className="font-semibold mb-1">Standard Steam Clean</div>
                      <p className="text-xs text-slate-600 mb-2">Professional steam cleaning with truck mounted carpet cleaner using hot water extraction.</p>
                      <div className="text-lg font-bold text-blue-600 mb-3">{fmt(RATES.rugs[selectedRugSize].standard)}</div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], standard: Math.max(0, p[selectedRugSize].standard - 1) } }))} 
                          className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          value={rugPackages[selectedRugSize].standard} 
                          onChange={(e) => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], standard: Math.max(0, parseInt(e.target.value || "0", 10)) } }))} 
                          className="border-2 border-gray-300 rounded text-center w-16 h-10 font-semibold" 
                        />
                        <button 
                          onClick={() => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], standard: p[selectedRugSize].standard + 1 } }))} 
                          className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {/* Reset package */}
                    <div className="p-4 border-2 border-blue-200 rounded-lg bg-white">
                      <div className="font-semibold mb-1">Factory Reset Clean</div>
                      <p className="text-xs text-slate-600 mb-2">Deep cleaning with truck mounted carpet cleaner using CRB (counter rotating brushes) scrubber that unlocks hair and debris, and deodorizer.</p>
                      <div className="text-lg font-bold text-blue-600 mb-3">{fmt(RATES.rugs[selectedRugSize].reset)}</div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], reset: Math.max(0, p[selectedRugSize].reset - 1) } }))} 
                          className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          value={rugPackages[selectedRugSize].reset} 
                          onChange={(e) => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], reset: Math.max(0, parseInt(e.target.value || "0", 10)) } }))} 
                          className="border-2 border-gray-300 rounded text-center w-16 h-10 font-semibold" 
                        />
                        <button 
                          onClick={() => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], reset: p[selectedRugSize].reset + 1 } }))} 
                          className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {/* Deluxe package */}
                    <div className="p-4 border-2 border-blue-200 rounded-lg bg-white">
                      <div className="font-semibold mb-1">Factory Reset Deluxe</div>
                      <p className="text-xs text-slate-600 mb-2">Includes everything with the Factory Reset Clean package plus prevacuuming and fiber protection.</p>
                      <div className="text-lg font-bold text-blue-600 mb-3">{fmt(RATES.rugs[selectedRugSize].deluxe)}</div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], deluxe: Math.max(0, p[selectedRugSize].deluxe - 1) } }))} 
                          className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                        >
                          -
                        </button>
                        <input 
                          type="number" 
                          value={rugPackages[selectedRugSize].deluxe} 
                          onChange={(e) => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], deluxe: Math.max(0, parseInt(e.target.value || "0", 10)) } }))} 
                          className="border-2 border-gray-300 rounded text-center w-16 h-10 font-semibold" 
                        />
                        <button 
                          onClick={() => setRugPackages(p => ({ ...p, [selectedRugSize]: { ...p[selectedRugSize], deluxe: p[selectedRugSize].deluxe + 1 } }))} 
                          className="border-2 border-gray-300 rounded w-10 h-10 grid place-items-center hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
            {active.pest && (
              <section className="mt-6 bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-2 text-blue-900">Pest Control (Alabama)</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <label className="inline-flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg bg-white">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5" 
                      checked={pestMonthly} 
                      onChange={(e) => setPestMonthly(e.target.checked)} 
                    />
                    <div>
                      <div className="font-medium">Monthly General Pest Control</div>
                      <div className="text-sm text-blue-600 font-bold">{fmt(RATES.pest.monthly.price)}/month</div>
                    </div>
                  </label>
                  <label className="inline-flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg bg-white">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5" 
                      checked={pestOneTime} 
                      onChange={(e) => setPestOneTime(e.target.checked)} 
                    />
                    <div>
                      <div className="font-medium">One-Time General Pest Control</div>
                      <div className="text-sm text-blue-600 font-bold">{fmt(RATES.pest.oneTime.price)}</div>
                    </div>
                  </label>
                </div>
                <div className="p-4 border-2 border-blue-200 rounded-lg bg-white">
                  <label className="block text-sm font-medium mb-2">
                    Move-Out Flea and Tick Treatment - enter home sq ft
                    <input 
                      type="number" 
                      className="mt-2 border-2 border-gray-300 rounded-lg h-12 px-4 w-full focus:ring-2 focus:ring-blue-500" 
                      value={pestHomeSqft} 
                      onChange={(e) => setPestHomeSqft(Math.max(0, parseInt(e.target.value || "0", 10)))} 
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-2">
                    Under 1600 sq ft: {fmt(RATES.pest.flea1600)} - Under 3200 sq ft: {fmt(RATES.pest.flea3200)} - Over 3200: custom quote
                  </p>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg mt-4">
                  Serviced through our sister company Jet Stream Exterminators, Alabama License 2025-7001296 Household Pest Control. Alabama clients only.
                </p>
              </section>
            )}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button 
                onClick={() => setStep(1)} 
                className="h-12 px-6 rounded-lg border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)} 
                className="h-12 px-8 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to Contact Info
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-blue-900">Step 3: Contact Information</h2>
            <p className="text-sm text-slate-600">Please provide your contact details to receive your quote.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input 
                  type="text"
                  placeholder="John Doe" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  className="border-2 border-gray-300 rounded-lg h-12 px-4 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input 
                  type="tel"
                  placeholder="(555) 123-4567" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)} 
                  className="border-2 border-gray-300 rounded-lg h-12 px-4 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email"
                  placeholder="john@example.com" 
                  value={customerEmail} 
                  onChange={(e) => setCustomerEmail(e.target.value)} 
                  className="border-2 border-gray-300 rounded-lg h-12 px-4 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            </div>
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button 
                onClick={() => setStep(2)} 
                className="h-12 px-6 rounded-lg border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(4)} 
                className="h-12 px-8 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to Quote
              </button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-blue-900">Step 4: Your Quote</h2>
            <div className="bg-blue-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-lg text-blue-900 mb-3">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {customerName || "Not provided"}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {customerPhone || "Not provided"}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Email:</span> {customerEmail || "Not provided"}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Address:</span> {address || "Not provided"}, {zip || "Not provided"}
                </div>
              </div>
            </div>
            <div className="border-2 border-blue-200 rounded-lg divide-y bg-white">
              {summary.lines.length === 0 && (
                <div className="p-6 text-center text-slate-600">
                  No services selected yet. Go back and add quantities.
                </div>
              )}
              {summary.lines.map((l, i) => (
                <div key={i} className="flex justify-between p-4 hover:bg-blue-50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{l.label}</div>
                    {l.each !== undefined && (
                      <div className="text-sm text-slate-500">
                        {l.qty} x {fmt(l.each)}
                      </div>
                    )}
                  </div>
                  <div className="font-bold text-lg text-blue-900">{fmt(l.total)}</div>
                </div>
              ))}
            </div>
            {summary.lines.length > 0 && (
              <div className="bg-blue-600 text-white rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">Total:</span>
                  <span className="text-3xl font-bold">{fmt(summary.total)}</span>
                </div>
              </div>
            )}
            <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
              <p className="font-semibold mb-3 text-blue-900">For a more accurate estimate, please check all that apply:</p>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <label className="inline-flex items-center gap-2 bg-white p-3 rounded">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>No nearby parking available</span>
                </label>
                <label className="inline-flex items-center gap-2 bg-white p-3 rounded">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>Area is on 3rd floor or higher</span>
                </label>
                <label className="inline-flex items-center gap-2 bg-white p-3 rounded">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>I have guaranteed parking</span>
                </label>
              </div>
              <p className="text-xs text-slate-600 mt-3">
                (If we need to park across/down the street, or clean above the 2nd floor, portable equipment may be required.)
              </p>
            </div>
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <button 
                onClick={() => setStep(3)} 
                className="h-12 px-6 rounded-lg border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCopyAndProceed}
                className="h-12 px-8 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                {copied ? "Copied!" : "Copy Quote and Book Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;