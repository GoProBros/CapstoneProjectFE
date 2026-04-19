import { get, put } from '@/services/api';
import { API_ENDPOINTS } from '@/constants';
import type {
  MacroeconomicData,
  UpsertMacroeconomicDataRequest,
} from '@/types/macroeconomicData';

/**
 * Get current macroeconomic data from database.
 */
export async function getMacroeconomicData(): Promise<MacroeconomicData | null> {
  const response = await get<MacroeconomicData | null>(API_ENDPOINTS.MACROECONOMIC_DATA.BASE);

  if (!response.isSuccess) {
    throw new Error(response.message || 'Không thể tải dữ liệu kinh tế vĩ mô');
  }

  return response.data ?? null;
}

/**
 * Upsert macroeconomic data.
 */
export async function upsertMacroeconomicData(
  payload: UpsertMacroeconomicDataRequest
): Promise<MacroeconomicData> {
  const response = await put<MacroeconomicData>(
    API_ENDPOINTS.MACROECONOMIC_DATA.BASE,
    payload
  );

  if (!response.isSuccess || !response.data) {
    throw new Error(response.message || 'Không thể cập nhật dữ liệu kinh tế vĩ mô');
  }

  return response.data;
}

const macroeconomicDataService = {
  getMacroeconomicData,
  upsertMacroeconomicData,
};

export default macroeconomicDataService;
