export interface DemoInvoice {
  id: string;
  name: string;
  badge: string;
  demoType: "clean" | "mismatch" | "suspicious";
  description: string;
  faceValue: string;
  svgDataUrl: string;
  referencePo: string;
  expectedRiskScore: string;
}

// 1. Clean B2B Invoice SVG Data URL
const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <!-- Header Banner -->
  <rect x="0" y="0" width="800" height="14" fill="#0A0A0A"/>
  
  <!-- Company Brand -->
  <text x="40" y="55" font-size="22" font-weight="bold" fill="#0A0A0A">PRECISION GEARTECH AUTO ANCILLARIES PVT LTD</text>
  <text x="40" y="75" font-size="11" fill="#52525B">Plot 42, MIDC Chakan Industrial Area, Phase II, Pune, Maharashtra - 410501</text>
  <text x="40" y="90" font-size="11" fill="#52525B">GSTIN: 27AAACP1842Q1Z9 | PAN: AAACP1842Q | Email: accounts@precisiongeartech.co.in</text>
  
  <!-- Document Title -->
  <rect x="540" y="40" width="220" height="40" fill="#F4F4F5" stroke="#E4E4E7"/>
  <text x="650" y="65" font-size="14" font-weight="bold" fill="#0A0A0A" text-anchor="middle">TAX INVOICE</text>
  
  <!-- QR Code & IRN Placeholder -->
  <rect x="680" y="95" width="80" height="80" fill="#FAFAFA" stroke="#0A0A0A" stroke-dasharray="3,3"/>
  <text x="720" y="140" font-size="8" fill="#71717A" text-anchor="middle">NIC e-Invoice</text>
  <text x="720" y="152" font-size="8" font-weight="bold" fill="#059669" text-anchor="middle">QR VERIFIED</text>

  <!-- Metadata Table -->
  <rect x="40" y="115" width="620" height="75" fill="#FAFAFA" stroke="#E4E4E7"/>
  <text x="55" y="138" font-size="10" font-weight="bold" fill="#71717A">INVOICE NO:</text>
  <text x="145" y="138" font-size="11" font-weight="bold" fill="#0A0A0A">PGA/25-26/1104</text>
  <text x="55" y="158" font-size="10" font-weight="bold" fill="#71717A">INVOICE DATE:</text>
  <text x="145" y="158" font-size="11" fill="#0A0A0A">14-AUG-2026</text>
  <text x="55" y="178" font-size="10" font-weight="bold" fill="#71717A">PAYMENT TERMS:</text>
  <text x="145" y="178" font-size="11" fill="#0A0A0A">90 Days Net (TReDS Eligible)</text>

  <text x="350" y="138" font-size="10" font-weight="bold" fill="#71717A">PO NUMBER:</text>
  <text x="445" y="138" font-size="11" font-weight="bold" fill="#2563EB">TM/PUN/CV/PO-98214</text>
  <text x="350" y="158" font-size="10" font-weight="bold" fill="#71717A">PO DATE:</text>
  <text x="445" y="158" font-size="11" fill="#0A0A0A">28-JUL-2026</text>
  <text x="350" y="178" font-size="10" font-weight="bold" fill="#71717A">e-WAY BILL NO:</text>
  <text x="445" y="178" font-size="11" font-weight="bold" fill="#059669">281982740192</text>

  <!-- Buyer Details Box -->
  <rect x="40" y="205" width="720" height="90" fill="#FFFFFF" stroke="#0A0A0A" stroke-width="1.5"/>
  <rect x="40" y="205" width="720" height="24" fill="#0A0A0A"/>
  <text x="55" y="221" font-size="11" font-weight="bold" fill="#FFFFFF">BILL TO / CONSIGNEE DETAILS</text>
  
  <text x="55" y="248" font-size="13" font-weight="bold" fill="#0A0A0A">TATA MOTORS COMMERCIAL VEHICLE FLEET DIVISION</text>
  <text x="55" y="266" font-size="10" fill="#52525B">Pimpri Works, Sector 3, Pune, Maharashtra - 411018</text>
  <text x="55" y="282" font-size="10" font-weight="bold" fill="#0A0A0A">GSTIN: 27AAACT2727Q1ZW <tspan font-weight="normal" fill="#52525B">| State Code: 27 (Maharashtra)</tspan></text>

  <!-- Line Items Table -->
  <rect x="40" y="315" width="720" height="30" fill="#0A0A0A"/>
  <text x="55" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">S.NO</text>
  <text x="100" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">DESCRIPTION OF GOODS</text>
  <text x="430" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">HSN CODE</text>
  <text x="510" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">QTY</text>
  <text x="580" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">RATE (₹)</text>
  <text x="680" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">AMOUNT (₹)</text>

  <!-- Row 1 -->
  <rect x="40" y="345" width="720" height="45" fill="#FFFFFF" stroke="#E4E4E7"/>
  <text x="55" y="372" font-size="11" fill="#0A0A0A">01</text>
  <text x="100" y="365" font-size="11" font-weight="bold" fill="#0A0A0A">High-tensile forged transmission pinions</text>
  <text x="100" y="380" font-size="9" fill="#71717A">Grade 20MnCr5 case hardened auto gears</text>
  <text x="430" y="372" font-size="11" fill="#0A0A0A">87084000</text>
  <text x="510" y="372" font-size="11" fill="#0A0A0A">1,000</text>
  <text x="580" y="372" font-size="11" fill="#0A0A0A">2,542.37</text>
  <text x="680" y="372" font-size="11" font-weight="bold" fill="#0A0A0A">25,42,370.00</text>

  <!-- Row 2 -->
  <rect x="40" y="390" width="720" height="45" fill="#FAFAFA" stroke="#E4E4E7"/>
  <text x="55" y="417" font-size="11" fill="#0A0A0A">02</text>
  <text x="100" y="410" font-size="11" font-weight="bold" fill="#0A0A0A">Differential ring gears assembly</text>
  <text x="100" y="425" font-size="9" fill="#71717A">Hypoid crown wheel ring gear match set</text>
  <text x="430" y="417" font-size="11" fill="#0A0A0A">87084000</text>
  <text x="510" y="417" font-size="11" fill="#0A0A0A">500</text>
  <text x="580" y="417" font-size="11" fill="#0A0A0A">2,542.38</text>
  <text x="680" y="417" font-size="11" font-weight="bold" fill="#0A0A0A">12,71,189.32</text>

  <!-- Financial Calculation Block -->
  <rect x="450" y="455" width="310" height="180" fill="#FFFFFF" stroke="#0A0A0A" stroke-width="1.5"/>
  
  <text x="470" y="480" font-size="11" fill="#52525B">Subtotal (Excl. Tax):</text>
  <text x="740" y="480" font-size="11" font-weight="bold" fill="#0A0A0A" text-anchor="end">₹38,13,559.32</text>

  <text x="470" y="505" font-size="11" fill="#52525B">CGST @ 9%:</text>
  <text x="740" y="505" font-size="11" fill="#0A0A0A" text-anchor="end">₹3,43,220.34</text>

  <text x="470" y="530" font-size="11" fill="#52525B">SGST @ 9%:</text>
  <text x="740" y="530" font-size="11" fill="#0A0A0A" text-anchor="end">₹3,43,220.34</text>

  <line x1="470" y1="545" x2="740" y2="545" stroke="#E4E4E7"/>

  <text x="470" y="565" font-size="11" fill="#52525B">Total GST Tax Amount:</text>
  <text x="740" y="565" font-size="11" font-weight="bold" fill="#0A0A0A" text-anchor="end">₹6,86,440.68</text>

  <rect x="450" y="585" width="310" height="50" fill="#0A0A0A"/>
  <text x="470" y="615" font-size="13" font-weight="bold" fill="#FFFFFF">TOTAL INVOICE AMOUNT:</text>
  <text x="740" y="615" font-size="15" font-weight="bold" fill="#059669" text-anchor="end">₹45,00,000.00</text>

  <!-- Words Amount -->
  <rect x="40" y="455" width="395" height="75" fill="#FAFAFA" stroke="#E4E4E7"/>
  <text x="55" y="475" font-size="9" font-weight="bold" fill="#71717A">AMOUNT IN WORDS:</text>
  <text x="55" y="495" font-size="11" font-weight="bold" fill="#0A0A0A">Forty-Five Lakh Indian Rupees Only</text>
  <text x="55" y="515" font-size="9" fill="#059669">✓ Exact match with Purchase Order TM/PUN/CV/PO-98214</text>

  <!-- Bank Details -->
  <rect x="40" y="545" width="395" height="90" fill="#FAFAFA" stroke="#E4E4E7"/>
  <text x="55" y="565" font-size="9" font-weight="bold" fill="#71717A">BANK / eINR DISBURSEMENT VIRTUAL ACCOUNT:</text>
  <text x="55" y="583" font-size="10" fill="#0A0A0A">Bank Name: HDFC Bank Ltd (Chakan Branch)</text>
  <text x="55" y="598" font-size="10" fill="#0A0A0A">A/C No: 50200049182740 | IFSC: HDFC0000491</text>
  <text x="55" y="613" font-size="10" font-weight="bold" fill="#2563EB">Credexa Solana Escrow: CRDxVaultPGA8821...SPL</text>

  <!-- Footer Signatures -->
  <rect x="40" y="655" width="720" height="90" fill="#FFFFFF" stroke="#E4E4E7"/>
  <text x="60" y="680" font-size="10" fill="#71717A">TERMS &amp; CONDITIONS:</text>
  <text x="60" y="695" font-size="9" fill="#71717A">1. Payment due strictly within 90 days from invoice date.</text>
  <text x="60" y="710" font-size="9" fill="#71717A">2. Subject to Pune jurisdiction. Overdue interest @ 18% p.a.</text>
  
  <line x1="520" y1="720" x2="720" y2="720" stroke="#0A0A0A" stroke-dasharray="2,2"/>
  <text x="620" y="735" font-size="9" font-weight="bold" fill="#0A0A0A" text-anchor="middle">AUTHORIZED SIGNATORY</text>
  <text x="620" y="745" font-size="8" fill="#71717A" text-anchor="middle">Precision Geartech Auto Ancillaries Pvt Ltd</text>
</svg>`;

// 2. Mismatched Amount Invoice SVG Data URL
const mismatchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <rect x="0" y="0" width="800" height="14" fill="#DC2626"/>
  
  <text x="40" y="55" font-size="22" font-weight="bold" fill="#0A0A0A">PRECISION GEARTECH AUTO ANCILLARIES PVT LTD</text>
  <text x="40" y="75" font-size="11" fill="#52525B">Plot 42, MIDC Chakan Industrial Area, Phase II, Pune, Maharashtra - 410501</text>
  <text x="40" y="90" font-size="11" fill="#52525B">GSTIN: 27AAACP1842Q1Z9 | PAN: AAACP1842Q</text>
  
  <rect x="540" y="40" width="220" height="40" fill="#FEF2F2" stroke="#FECACA"/>
  <text x="650" y="65" font-size="14" font-weight="bold" fill="#DC2626" text-anchor="middle">TAX INVOICE</text>

  <!-- Metadata Table -->
  <rect x="40" y="115" width="720" height="75" fill="#FAFAFA" stroke="#E4E4E7"/>
  <text x="55" y="138" font-size="10" font-weight="bold" fill="#71717A">INVOICE NO:</text>
  <text x="145" y="138" font-size="11" font-weight="bold" fill="#0A0A0A">PGA/25-26/9902</text>
  <text x="55" y="158" font-size="10" font-weight="bold" fill="#71717A">INVOICE DATE:</text>
  <text x="145" y="158" font-size="11" fill="#0A0A0A">18-AUG-2026</text>

  <text x="350" y="138" font-size="10" font-weight="bold" fill="#71717A">PO NUMBER:</text>
  <text x="445" y="138" font-size="11" font-weight="bold" fill="#2563EB">TM/PUN/CV/PO-98214</text>
  <text x="350" y="158" font-size="10" font-weight="bold" fill="#71717A">e-WAY BILL NO:</text>
  <text x="445" y="158" font-size="11" font-weight="bold" fill="#059669">281982740192</text>

  <!-- Buyer Details Box -->
  <rect x="40" y="205" width="720" height="90" fill="#FFFFFF" stroke="#0A0A0A" stroke-width="1.5"/>
  <rect x="40" y="205" width="720" height="24" fill="#0A0A0A"/>
  <text x="55" y="221" font-size="11" font-weight="bold" fill="#FFFFFF">BILL TO / CONSIGNEE DETAILS</text>
  
  <text x="55" y="248" font-size="13" font-weight="bold" fill="#0A0A0A">TATA MOTORS COMMERCIAL VEHICLE FLEET DIVISION</text>
  <text x="55" y="266" font-size="10" fill="#52525B">Pimpri Works, Sector 3, Pune, Maharashtra - 411018</text>
  <text x="55" y="282" font-size="10" font-weight="bold" fill="#0A0A0A">GSTIN: 27AAACT2727Q1ZW</text>

  <!-- Line Items Table -->
  <rect x="40" y="315" width="720" height="30" fill="#0A0A0A"/>
  <text x="55" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">S.NO</text>
  <text x="100" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">DESCRIPTION OF GOODS</text>
  <text x="430" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">HSN</text>
  <text x="510" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">QTY</text>
  <text x="580" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">RATE (₹)</text>
  <text x="680" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">AMOUNT (₹)</text>

  <!-- Row 1 -->
  <rect x="40" y="345" width="720" height="45" fill="#FFFFFF" stroke="#E4E4E7"/>
  <text x="55" y="372" font-size="11" fill="#0A0A0A">01</text>
  <text x="100" y="372" font-size="11" font-weight="bold" fill="#0A0A0A">Precision machined transmission pinions batch</text>
  <text x="430" y="372" font-size="11" fill="#0A0A0A">87084000</text>
  <text x="510" y="372" font-size="11" fill="#0A0A0A">100</text>
  <text x="580" y="372" font-size="11" fill="#0A0A0A">1,000.00</text>
  <text x="680" y="372" font-size="11" font-weight="bold" fill="#0A0A0A">1,00,000.00</text>

  <!-- Highlighted Financial Discrepancy Box -->
  <rect x="450" y="420" width="310" height="210" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <rect x="450" y="420" width="310" height="24" fill="#DC2626"/>
  <text x="460" y="436" font-size="10" font-weight="bold" fill="#FFFFFF">⚠️ FINANCIAL DISCREPANCY DETECTED</text>
  
  <text x="470" y="465" font-size="11" fill="#52525B">Subtotal:</text>
  <text x="740" y="465" font-size="11" font-weight="bold" fill="#0A0A0A" text-anchor="end">₹1,00,000.00</text>

  <text x="470" y="490" font-size="11" fill="#52525B">GST Tax Amount (18%):</text>
  <text x="740" y="490" font-size="11" fill="#0A0A0A" text-anchor="end">₹18,000.00</text>

  <line x1="470" y1="505" x2="740" y2="505" stroke="#FECACA"/>

  <text x="470" y="525" font-size="11" font-weight="bold" fill="#DC2626">Calculated Total (Subtotal+GST):</text>
  <text x="740" y="525" font-size="11" font-weight="bold" fill="#DC2626" text-anchor="end">₹1,18,000.00</text>

  <!-- OVERWRITTEN DISPLAYED TOTAL -->
  <rect x="460" y="545" width="290" height="65" fill="#0A0A0A" stroke="#DC2626" stroke-width="2"/>
  <text x="470" y="568" font-size="10" font-weight="bold" fill="#FCA5A5">DISPLAYED INVOICE TOTAL:</text>
  <!-- Overwritten text in heavy font -->
  <text x="740" y="595" font-size="22" font-weight="900" fill="#EF4444" text-anchor="end" font-family="Arial Black">₹1,28,000.00</text>

  <!-- Discrepancy Note -->
  <rect x="40" y="420" width="395" height="120" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="55" y="445" font-size="11" font-weight="bold" fill="#B45309">🔍 INFLATED TOTAL WARNING</text>
  <text x="55" y="470" font-size="10" fill="#92400E">Subtotal (₹1,00,000) + GST (₹18,000) = ₹1,18,000.</text>
  <text x="55" y="488" font-size="10" font-weight="bold" fill="#DC2626">Invoice total box claims: ₹1,28,000 (+₹10,000 error)</text>
  <text x="55" y="510" font-size="9" fill="#B45309">Reference PO TM/PUN/CV/PO-98214 limit is ₹1,18,000.</text>

  <rect x="40" y="555" width="395" height="75" fill="#FAFAFA" stroke="#E4E4E7"/>
  <text x="55" y="575" font-size="9" font-weight="bold" fill="#71717A">BANK / eINR DISBURSEMENT VIRTUAL ACCOUNT:</text>
  <text x="55" y="593" font-size="10" fill="#0A0A0A">A/C No: 50200049182740 | IFSC: HDFC0000491</text>
  <text x="55" y="610" font-size="10" font-weight="bold" fill="#DC2626">STATUS: BLOCKED BY GEMINI VISION ORACLE</text>

  <rect x="40" y="655" width="720" height="90" fill="#FFFFFF" stroke="#E4E4E7"/>
  <text x="60" y="680" font-size="10" fill="#71717A">TERMS &amp; CONDITIONS:</text>
  <text x="60" y="695" font-size="9" fill="#71717A">1. Payment due strictly within 90 days from invoice date.</text>
  <text x="60" y="710" font-size="9" fill="#DC2626">⚠️ Warning: Amount discrepancy subject to fraud verification review.</text>
</svg>`;

// 3. Suspicious Altered Invoice SVG Data URL
const suspiciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" style="background:#ffffff; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <rect x="0" y="0" width="800" height="14" fill="#991B1B"/>
  
  <!-- Suspicious Font Inconsistency in Header -->
  <text x="40" y="55" font-size="22" font-weight="bold" fill="#0A0A0A">SURAT WEAVECRAFT SYNTHETICS LLP</text>
  <text x="40" y="75" font-size="11" fill="#52525B">Plot 18, Pandesara GIDC, Surat, Gujarat - 394221</text>
  <text x="40" y="90" font-size="11" fill="#52525B">GSTIN: 24AABCS4412K1ZT</text>

  <rect x="540" y="40" width="220" height="40" fill="#FEF2F2" stroke="#991B1B"/>
  <text x="650" y="65" font-size="14" font-weight="bold" fill="#991B1B" text-anchor="middle">TAX INVOICE</text>

  <!-- MISSING QR CODE ALERT -->
  <rect x="680" y="95" width="80" height="80" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <text x="720" y="130" font-size="9" font-weight="bold" fill="#DC2626" text-anchor="middle">NO QR</text>
  <text x="720" y="145" font-size="7" fill="#991B1B" text-anchor="middle">IRN MISSING</text>

  <!-- Metadata Table -->
  <rect x="40" y="115" width="620" height="75" fill="#FAFAFA" stroke="#E4E4E7"/>
  <text x="55" y="138" font-size="10" font-weight="bold" fill="#71717A">INVOICE NO:</text>
  <text x="145" y="138" font-size="11" font-weight="bold" fill="#0A0A0A">SWS/TEX/2026/999</text>
  <text x="55" y="158" font-size="10" font-weight="bold" fill="#71717A">INVOICE DATE:</text>
  <text x="145" y="158" font-size="11" font-weight="bold" fill="#DC2626">25-AUG-2026</text>

  <text x="350" y="138" font-size="10" font-weight="bold" fill="#71717A">PO NUMBER:</text>
  <text x="445" y="138" font-size="11" font-weight="bold" fill="#0A0A0A">RR/APP/SUR/26-8800</text>
  <text x="350" y="158" font-size="10" font-weight="bold" fill="#71717A">e-WAY BILL NO:</text>
  <text x="445" y="158" font-size="11" font-weight="bold" fill="#DC2626">341829014872 (EXPIRED)</text>

  <!-- BUYER DETAILS WITH VISUAL GHOSTING & ALIGNED FONT ARTIFACTS -->
  <rect x="40" y="205" width="720" height="95" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <rect x="40" y="205" width="720" height="24" fill="#991B1B"/>
  <text x="55" y="221" font-size="11" font-weight="bold" fill="#FFFFFF">⚠️ BILL TO / CONSIGNEE DETAILS (DIGITAL EDIT SIGNAL)</text>
  
  <!-- Inconsistent serif font pasted over sans-serif -->
  <text x="55" y="250" font-size="14" font-weight="bold" fill="#991B1B" font-family="Georgia, serif">RELIANCE RETAIL TRENDS APPAREL SCM</text>
  <text x="55" y="268" font-size="10" fill="#52525B">Reliance Corporate Park, Navi Mumbai, MH</text>
  <!-- Distorted GSTIN -->
  <text x="55" y="286" font-size="12" font-weight="900" fill="#DC2626" font-family="Courier, monospace">BUYER GSTIN: 24AAACR1214G1ZU <tspan font-size="9" font-weight="bold" fill="#991B1B">(UNVERIFIED GSTN RECORD)</tspan></text>

  <!-- Line Items Table -->
  <rect x="40" y="315" width="720" height="30" fill="#0A0A0A"/>
  <text x="55" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">S.NO</text>
  <text x="100" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">DESCRIPTION OF GOODS</text>
  <text x="430" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">HSN</text>
  <text x="510" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">QTY</text>
  <text x="580" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">RATE (₹)</text>
  <text x="680" y="335" font-size="10" font-weight="bold" fill="#FFFFFF">AMOUNT (₹)</text>

  <!-- Row 1 -->
  <rect x="40" y="345" width="720" height="45" fill="#FFFFFF" stroke="#E4E4E7"/>
  <text x="55" y="372" font-size="11" fill="#0A0A0A">01</text>
  <text x="100" y="372" font-size="11" font-weight="bold" fill="#0A0A0A">Recycled polyester blended twill fabric rolls</text>
  <text x="430" y="372" font-size="11" fill="#0A0A0A">54075200</text>
  <text x="510" y="372" font-size="11" fill="#0A0A0A">10,000</text>
  <text x="580" y="372" font-size="11" fill="#0A0A0A">240.00</text>
  <text x="680" y="372" font-size="11" font-weight="bold" fill="#0A0A0A">24,00,000.00</text>

  <!-- Financial Block -->
  <rect x="450" y="420" width="310" height="180" fill="#FFFFFF" stroke="#0A0A0A" stroke-width="1.5"/>
  <text x="470" y="445" font-size="11" fill="#52525B">Subtotal:</text>
  <text x="740" y="445" font-size="11" font-weight="bold" fill="#0A0A0A" text-anchor="end">₹24,00,000.00</text>

  <text x="470" y="470" font-size="11" fill="#52525B">IGST (18%):</text>
  <text x="740" y="470" font-size="11" fill="#0A0A0A" text-anchor="end">₹4,32,000.00</text>

  <rect x="450" y="520" width="310" height="50" fill="#991B1B"/>
  <text x="470" y="550" font-size="12" font-weight="bold" fill="#FFFFFF">TOTAL AMOUNT:</text>
  <text x="740" y="550" font-size="16" font-weight="bold" fill="#FFFFFF" text-anchor="end">₹28,32,000.00</text>

  <rect x="40" y="420" width="395" height="150" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.5"/>
  <text x="55" y="445" font-size="11" font-weight="bold" fill="#991B1B">🚨 CRITICAL FORENSIC FORENSICS</text>
  <text x="55" y="468" font-size="10" fill="#DC2626">• Buyer Name / GSTIN replaced using Serif overlay font.</text>
  <text x="55" y="486" font-size="10" fill="#DC2626">• Missing mandatory e-invoice IRN &amp; QR code.</text>
  <text x="55" y="504" font-size="10" fill="#DC2626">• e-Way Bill 341829014872 expired 3 days prior.</text>
  <text x="55" y="522" font-size="10" font-weight="bold" fill="#991B1B">• Potential duplicate submission of token CRDxMint4491.</text>
</svg>`;

export function getSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

export const DEMO_INVOICES: DemoInvoice[] = [
  {
    id: "demo-clean",
    name: "01 // Authentic MSME Invoice",
    badge: "LOW RISK (12/100)",
    demoType: "clean",
    description: "Authentic B2B supply invoice with verified GSTIN, matching Tata Motors PO, active NIC e-Way bill, and clean typography.",
    faceValue: "₹45,00,000",
    svgDataUrl: getSvgDataUrl(cleanSvg),
    referencePo: "TM/PUN/CV/PO-98214",
    expectedRiskScore: "12 (Low Risk)",
  },
  {
    id: "demo-mismatch",
    name: "02 // Inflated Amount Mismatch",
    badge: "HIGH RISK (74/100)",
    demoType: "mismatch",
    description: "Subtotal ₹1,00,000 + 18% GST = ₹1,18,000, but total box claims ₹1,28,000 (+₹10,000 inflation discrepancy vs PO limit).",
    faceValue: "₹1,28,000",
    svgDataUrl: getSvgDataUrl(mismatchSvg),
    referencePo: "TM/PUN/CV/PO-98214",
    expectedRiskScore: "74 (High Risk)",
  },
  {
    id: "demo-suspicious",
    name: "03 // Digitally Altered / Forged",
    badge: "CRITICAL RISK (91/100)",
    demoType: "suspicious",
    description: "Document exhibits visual ghosting on buyer GSTIN header, missing mandatory e-invoicing QR code, and duplicate submission signals.",
    faceValue: "₹28,32,000",
    svgDataUrl: getSvgDataUrl(suspiciousSvg),
    referencePo: "RR/APP/SUR/26-8800",
    expectedRiskScore: "91 (Critical Risk)",
  },
];
