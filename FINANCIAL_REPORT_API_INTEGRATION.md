# Financial Report API Integration - Summary

## Overview
Updated the Financial Report module to integrate with the actual backend API structure from `GreenDragonTrading.NET`.

## Files Changed

### 1. **src/types/financialReport.ts** ✅
**Major Changes:**
- Added comprehensive type definitions matching backend API response structure
- Created enums: `FinancialPeriodType` (1=Yearly, 2=Quarterly, 3=Cumulative), `FinancialReportStatus`
- Added detailed types for:
  - `BalanceSheet` with nested types (ShortTermAssets, LongTermAssets, BankAssets, etc.)
  - `IncomeStatement` with nested types (BankOperatingIncome, InsuranceBusiness, etc.)
  - `CashFlowStatement`
  - `FinancialReport` (main report entity)
  - `FinancialReportTableRow` (flattened view for table display)
- Updated filter interfaces to match backend query parameters

**Key Types:**
```typescript
export interface FinancialReport {
  id: string;
  ticker: string;
  year: number;
  period: FinancialPeriodType;
  reportData: ReportData;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  status: FinancialReportStatus;
  createdAt: string;
  updatedAt: string;
}
```

### 2. **src/services/financialReportService.ts** ✅
**Major Changes:**
- Updated to call real API endpoint: `GET /financial-reports`
- Implemented `convertToTableRow()` function to flatten nested API response
- Added new service functions:
  - `fetchFinancialReports()` - with filters and pagination
  - `fetchFinancialReportById()` - get single report
  - `fetchFinancialReportByParams()` - get by ticker/year/period
  - `fetchAvailableYears()` - get available years for a ticker
- Proper error handling with `ApiResponse<T>` and `PaginatedResponse<T>` wrappers
- Calculates aggregated metrics from nested data (totalAssets, totalLiabilities, etc.)

**API Endpoints:**
- `GET /financial-reports?ticker={ticker}&year={year}&period={period}&pageIndex={pageIndex}&pageSize={pageSize}`
- `GET /financial-reports/{id}`
- `GET /financial-reports/ticker/{ticker}/year/{year}/period/{period}`
- `GET /financial-reports/years?ticker={ticker}`

### 3. **src/hooks/useFinancialReportQuery.ts** ✅
**Changes:**
- Updated to work with `FinancialReportTableRow` type
- Returns `{ items: FinancialReportTableRow[]; totalCount: number }` structure
- Added `select` function to ensure consistent data shape

### 4. **src/stores/financialReportStore.ts** ✅
**Changes:**
- Updated `periodType` from string `'1' | '0'` to numeric enum `FinancialPeriodType`
- Updated filters to use new `FinancialReportFilters` interface
- Filter state now includes: `ticker`, `period`, `pageIndex`, `pageSize`
- Default period is `1` (Yearly) with pagination defaults (pageIndex: 1, pageSize: 50)

### 5. **src/components/dashboard/modules/FinancialReportProModule.tsx** ✅
**Changes:**
- Updated to pass `data?.items` instead of `data` to table
- Added `totalCount` prop to table component
- Proper handling of loading and error states

### 6. **src/components/dashboard/modules/FinancialReportPro/FinancialReportTable.tsx** ✅
**Changes:**
- Updated to accept `FinancialReportTableRow[]` type
- Added `totalCount` prop for displaying record count
- Added status bar showing "Hiển thị X / Y báo cáo"
- Improved height calculation

### 7. **src/components/dashboard/modules/FinancialReportPro/PeriodTypeSelect.tsx** ✅
**Changes:**
- Updated to use numeric `FinancialPeriodType` enum
- Added third option: "Lũy kế" (Cumulative)
- Wider dropdown (120px instead of 100px)

### 8. **src/components/dashboard/modules/FinancialReportPro/columnDefs.ts** ✅
**Major Changes:**
- Simplified column structure to match flattened `FinancialReportTableRow` type
- Removed 93 detailed columns (were placeholders for future development)
- Added essential columns grouped by:
  - **KỲ BÁO CÁO**: ticker, year, periodLabel
  - **BẢNG CÂN ĐỐI KẾ TOÁN**: totalAssets, shortTermAssets, longTermAssets, totalLiabilities, totalEquity
  - **KẾT QUẢ KINH DOANH**: netRevenue, grossProfit, operatingProfit, profitBeforeTax, netProfit
  - **LƯU CHUYỂN TIỀN TỆ**: netCashFlow, operatingCashFlow, investingCashFlow, financingCashFlow
  - **THÔNG TIN**: status, fileUrl (hidden), createdAt, updatedAt
- Added formatters for dates and status enum

## API Response Structure

### Backend Response (from API)
```json
{
  "isSuccess": true,
  "message": "Success",
  "data": [
    {
      "id": "guid",
      "ticker": "FPT",
      "year": 2023,
      "period": 1,
      "reportData": {
        "balanceSheet": { ... },
        "incomeStatement": { ... },
        "cashFlowStatement": { ... }
      },
      "filePath": "...",
      "fileUrl": "...",
      "fileSize": 1024,
      "status": 1,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

### Frontend Flattened Structure (for table display)
```typescript
{
  id: string;
  ticker: string;
  year: number;
  period: FinancialPeriodType;
  periodLabel: string; // e.g., "2023 - Q1"
  
  // Aggregated from balanceSheet
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  shortTermAssets: number;
  longTermAssets: number;
  
  // From incomeStatement
  netRevenue: number;
  grossProfit: number;
  operatingProfit: number;
  profitBeforeTax: number;
  netProfit: number;
  
  // From cashFlowStatement
  netCashFlow: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  
  // Metadata
  status: FinancialReportStatus;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
}
```

## Data Flow

1. **User interacts with filters** (PeriodTypeSelect, TickerSearchBox, etc.)
   ↓
2. **Zustand store** (`useFinancialReportStore`) updates filters
   ↓
3. **TanStack Query hook** (`useFinancialReportQuery`) detects filter change
   ↓
4. **Service function** (`fetchFinancialReports`) calls API with query params
   ↓
5. **API returns** `PaginatedResponse<FinancialReport>` with nested structure
   ↓
6. **Service converts** each report to `FinancialReportTableRow` (flattened)
   ↓
7. **Hook returns** `{ items: FinancialReportTableRow[], totalCount: number }`
   ↓
8. **Table component** displays flattened data in AG Grid

## Next Steps

### When Backend API is Ready:

1. **Update `api.ts` service** to point to correct base URL
2. **Test API endpoints** with real data
3. **Add error handling** for specific backend error responses
4. **Implement pagination controls** (if needed)
5. **Add more filters** as needed (status, date range, etc.)

### Future Enhancements:

1. **Expand column definitions** with detailed nested data from reportData:
   - Individual balance sheet items (cash, receivables, inventory, etc.)
   - Detailed income statement items
   - Financial ratios (ROE, ROA, P/E, etc.)
   
2. **Add calculated fields** for YoY growth rates, margins, etc.

3. **Implement grouping** by ticker (requires AG Grid Enterprise)

4. **Add export functionality** to download reports

5. **Sector filtering** (once sectors API is available)

## Testing Checklist

- [ ] Filter by ticker works
- [ ] Filter by year works
- [ ] Filter by period type (Yearly/Quarterly/Cumulative) works
- [ ] Pagination works correctly
- [ ] Loading states display properly
- [ ] Error states display properly
- [ ] Empty state displays properly
- [ ] Table sorts by ticker and year
- [ ] Column formatters work (numbers, dates, status)
- [ ] Data matches backend response structure

## Notes

- **Mock industries data** is still being used until sectors API is implemented
- **Detailed financial ratios** columns are ready to be added once backend calculates them
- **File URL column** is hidden by default but can be shown if needed
- **Period label** is auto-generated based on year and period type
- **TanStack Query caching** is configured for 5 minutes stale time, 10 minutes gc time
