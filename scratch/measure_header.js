// Measure header widths for 1280px, 1366px, 1440px, and 1920px viewports
const viewports = [1280, 1366, 1440, 1920];
const headerPadding = 32; // 16px left + 16px right

// Region 1: Logo
const logoWidth = 125; // "CREDExA PROT-V2" + margin
const logoMargin = 12;

// Region 3: Account
const accountWidth = 165; // User icon + truncated name + role badge + chevron
const accountMargin = 12;

// Region 2: Navigation Items (FINANCER role - 7 items)
// Font size: 12px font-mono, padding: px-[8px] (16px per item), gap: 6px
const navItems = [
  { name: "Dashboard", charCount: 9, approxWidth: 72 },
  { name: "Fractional Hub 💎", charCount: 16, approxWidth: 115 },
  { name: "Opportunities", charCount: 13, approxWidth: 95 },
  { name: "Tranche Vaults", charCount: 14, approxWidth: 100 },
  { name: "Custodial Wallet ⚡", charCount: 18, approxWidth: 130 },
  { name: "Fraud Vision AI 🔍", charCount: 18, approxWidth: 130 },
  { name: "Transactions", charCount: 12, approxWidth: 90 },
];

const totalNavItemsWidth = navItems.reduce((acc, item) => acc + item.approxWidth, 0);
const totalNavGaps = (navItems.length - 1) * 6; // 6 gaps * 6px = 36px
const totalNavigationWidth = totalNavItemsWidth + totalNavGaps; // 732 + 36 = 768px

console.log("=========================================");
console.log("CREDEXA HEADER WIDTH CALCULATION SUMMARY");
console.log("=========================================");
console.log(`Logo Width: ${logoWidth}px (+ ${logoMargin}px margin)`);
console.log(`Navigation Width (${navItems.length} items): ${totalNavigationWidth}px`);
console.log(`Account Width: ${accountWidth}px (+ ${accountMargin}px margin)`);
console.log(`Header Side Padding: ${headerPadding}px`);
console.log("-----------------------------------------");

viewports.forEach((vp) => {
  const totalOccupied = logoWidth + logoMargin + totalNavigationWidth + accountWidth + accountMargin + headerPadding;
  const headroom = vp - totalOccupied;
  const holds = totalOccupied <= vp;
  console.log(`Viewport: ${vp}px | Occupied: ${totalOccupied}px | Surplus Free Space: ${headroom}px | PASS: ${holds}`);
});
