const fs = require('fs');
const path = require('path');

const FEATURES = 'D:/University/Semester/Semester9/CapstoneProject/src/features/dashboard';

function walkDir(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, files);
    else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) files.push(full);
  }
  return files;
}

const replacements = [
  [/@\/components\/dashboard\/ColumnSidebar/g, '@/features/dashboard/components/ColumnSidebar'],
  [/@\/components\/dashboard\/SymbolSearchBox/g, '@/features/dashboard/components/SymbolSearchBox'],
  [/@\/components\/dashboard\/layout\/WatchListSelector/g, '@/features/dashboard/components/layout/WatchListSelector'],
  [/@\/components\/dashboard\/layout'/g, "@/features/dashboard/components/layout'"],
  [/@\/components\/dashboard\/layout"/g, '@/features/dashboard/components/layout"'],
  [/@\/components\/dashboard\/modules\/FinancialReport\/FinancialIndicatorChart/g, './FinancialIndicatorChart'],
  [/@\/components\/dashboard\/modules\/FinancialReport\/FinancialIndicatorGroupTabs/g, './FinancialIndicatorGroupTabs'],
  [/@\/components\/dashboard\/modules\/FinancialReport\/FinancialIndicatorMetricsTable/g, './FinancialIndicatorMetricsTable'],
  [/@\/components\/dashboard\/modules\/FinancialReport\/FinancialIndicatorPeriodNavigator/g, './FinancialIndicatorPeriodNavigator'],
  [/@\/components\/dashboard\/modules\/SmartBoard\/SmartBoardFilterBar/g, './SmartBoardFilterBar'],
  [/@\/components\/dashboard\/modules\/StockScreener\/ExchangeFilter/g, '../stock-screener/ExchangeFilter'],
  [/@\/components\/dashboard\/modules\/StockScreener\/SectorFilter/g, '../stock-screener/SectorFilter'],
];

let totalPatched = 0;
for (const file of walkDir(FEATURES)) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    const newContent = content.replace(from, to);
    if (newContent !== content) { content = newContent; changed = true; }
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    const rel = file.split('features/dashboard/')[1];
    console.log('patched: ' + rel);
    totalPatched++;
  }
}
console.log('Total: ' + totalPatched + ' files patched');
