export interface MacroeconomicData {
  recordDate: string;
  govBondsReturn: number;
  usdVndExchangeRate: number;
  usdVndExchangeRateReturn: number;
  equalWeightIndexReturn: number;
  marketIndexValue: number;
  marketIndexReturn: number;
  goldSpotUsdReturn: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface UpsertMacroeconomicDataRequest {
  recordDate: string;
  govBondsReturn: number;
  usdVndExchangeRate: number;
  usdVndExchangeRateReturn: number;
  equalWeightIndexReturn: number;
  marketIndexValue: number;
  marketIndexReturn: number;
  goldSpotUsdReturn: number;
}
