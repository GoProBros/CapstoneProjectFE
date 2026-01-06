/**
 * Layout Service - API calls for module layout management
 * 
 * API Endpoints:
 * - GET /api/module-layouts?type={moduleType} - Lấy danh sách layouts
 * - POST /api/module-layouts - Tạo layout mới
 * - GET /api/module-layouts/{id} - Lấy chi tiết layout
 * - PUT /api/module-layouts/{id} - Cập nhật layout
 * - DELETE /api/module-layouts/{id} - Xóa layout
 */

import { get, post, put, del } from '@/services/api';
import type {
  ModuleType,
  ModuleLayoutSummary,
  ModuleLayoutDetail,
  ParsedModuleLayoutDetail,
  CreateLayoutRequest,
  CreateLayoutResponse,
  UpdateLayoutRequest,
  LayoutConfigJson,
  ColumnConfig
} from '@/types/layout';

/**
 * Lấy danh sách tất cả layouts của một module type
 * 
 * GET /api/module-layouts?type={moduleType}
 * 
 * @param moduleType - Loại module (1 = StockScreener)
 * @returns Danh sách layouts
 */
export async function getLayouts(moduleType: number): Promise<ModuleLayoutSummary[]> {
  const result = await get<ModuleLayoutSummary[]>(`/api/module-layouts?type=${moduleType}`);
  
  if (result.isSuccess && result.data) {
    return result.data;
  }
  
  throw new Error(result.message || 'Không thể tải danh sách layout');
}

/**
 * Lấy chi tiết layout theo ID (bao gồm configJson)
 * 
 * GET /api/module-layouts/{id}
 * 
 * @param id - Layout ID
 * @returns Chi tiết layout với configJson đã parse
 */
export async function getLayoutById(id: number): Promise<ParsedModuleLayoutDetail> {
  const result = await get<ModuleLayoutDetail>(`/api/module-layouts/${id}`);
  
  if (result.isSuccess && result.data) {
    // Parse configJson string to object
    const parsedConfigJson = parseConfigJson(result.data.configJson);
    return {
      ...result.data,
      configJson: parsedConfigJson
    };
  }
  
  throw new Error(result.message || 'Không thể tải layout');
}

/**
 * Tạo layout mới
 * 
 * POST /api/module-layouts
 * 
 * @param data - Dữ liệu tạo layout
 * @returns Layout vừa tạo
 */
export async function createLayout(data: CreateLayoutRequest): Promise<CreateLayoutResponse> {
  const result = await post<CreateLayoutResponse>('/api/module-layouts', data);
  
  if (result.isSuccess && result.data) {
    return result.data;
  }
  
  throw new Error(result.message || 'Không thể tạo layout');
}

/**
 * Cập nhật layout (chỉ cho phép với layout không phải system default)
 * 
 * PUT /api/module-layouts/{id}
 * 
 * @param id - Layout ID
 * @param data - Dữ liệu cập nhật
 * @returns Layout sau khi cập nhật
 */
export async function updateLayout(id: number, data: UpdateLayoutRequest): Promise<ModuleLayoutDetail> {
  const result = await put<ModuleLayoutDetail>(`/api/module-layouts/${id}`, data);
  
  if (result.isSuccess && result.data) {
    return result.data;
  }
  
  throw new Error(result.message || 'Không thể cập nhật layout');
}

/**
 * Xóa layout (không cho phép xóa layout system default)
 * 
 * DELETE /api/module-layouts/{id}
 * 
 * @param id - Layout ID
 */
export async function deleteLayout(id: number): Promise<void> {
  const result = await del<void>(`/api/module-layouts/${id}`);
  
  if (!result.isSuccess) {
    throw new Error(result.message || 'Không thể xóa layout');
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Chuyển đổi column store state sang LayoutConfigJson format để gửi lên backend
 * 
 * @param columns - Object từ columnStore
 * @returns LayoutConfigJson object
 */
export function convertColumnsToConfigJson(
  columns: Record<string, ColumnConfig>
): LayoutConfigJson {
  return {
    state: {
      columns
    }
  };
}

/**
 * Stringify config để gửi lên backend
 * 
 * @param config - LayoutConfigJson object
 * @returns JSON string
 */
export function stringifyConfig(config: LayoutConfigJson): string {
  return JSON.stringify(config);
}

/**
 * Parse configJson string từ backend thành object
 * 
 * @param configJsonString - JSON string từ backend
 * @returns LayoutConfigJson object
 */
export function parseConfigJson(configJsonString: string): LayoutConfigJson {
  try {
    console.log(JSON.parse(configJsonString));
    return JSON.parse(configJsonString) as LayoutConfigJson;
  } catch (error) {
    console.error('[LayoutService] Failed to parse configJson:', error);
    throw new Error('Config JSON không hợp lệ');
  }
}

/**
 * Merge layout columns from API with current columns from localStorage
 * Preserves all fields from current columns, only updates visible/width/order from saved layout
 * 
 * @param currentColumns - Current columns from Zustand store (localStorage 'stock-screener-columns')
 * @param savedColumns - Columns from API layout
 * @returns Merged columns object
 */
export function mergeLayoutColumns(
  currentColumns: Record<string, ColumnConfig>,
  savedColumns: Record<string, ColumnConfig>
): Record<string, ColumnConfig> {
  // Start with current columns as base (preserves all fields including new ones)
  const mergedColumns = { ...currentColumns };
  
  // Update only the fields that exist in saved layout
  Object.entries(savedColumns).forEach(([field, savedConfig]) => {
    if (mergedColumns[field]) {
      // Field exists in current columns - update properties
      mergedColumns[field] = {
        ...mergedColumns[field],
        visible: savedConfig.visible,
        width: savedConfig.width ?? mergedColumns[field].width,
        order: savedConfig.order ?? mergedColumns[field].order,
      };
    } else {
      // Field doesn't exist in current columns - add it
      // (this handles backward compatibility if column was removed from defaults)
      mergedColumns[field] = savedConfig;
    }
  });
  
  return mergedColumns;
}

/**
 * Kiểm tra và tạo layout mặc định nếu chưa có
 * 
 * @param moduleType - Loại module
 * @param defaultConfig - Config mặc định của module
 * @returns Layout mặc định (đã tồn tại hoặc mới tạo)
 */
export async function ensureDefaultLayout(
  moduleType: number,
  defaultConfig: LayoutConfigJson,
  defaultName: string = 'Layout mặc định'
): Promise<ModuleLayoutSummary> {
  try {
    // Lấy danh sách layouts hiện có
    const layouts = await getLayouts(moduleType);
    
    // Nếu đã có layout, trả về layout đầu tiên
    if (layouts.length > 0) {
      return layouts[0];
    }
    
    // Chưa có layout nào -> Tạo layout mặc định
    console.log('[LayoutService] No layouts found, creating default layout...');
    
    const createRequest: CreateLayoutRequest = {
      layoutName: defaultName,
      moduleType: moduleType,
      configJson: stringifyConfig(defaultConfig),
      isSystemDefault: true
    };
    
    const created = await createLayout(createRequest);
    
    // Convert CreateLayoutResponse to ModuleLayoutSummary
    return {
      id: created.id,
      layoutName: created.layoutName,
      moduleType: created.moduleType,
      moduleTypeName: created.moduleTypeName,
      isSystemDefault: created.isSystemDefault,
      isPersonal: created.isPersonal,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt
    };
  } catch (error) {
    console.error('[LayoutService] Error ensuring default layout:', error);
    throw error;
  }
}

/**
 * Lưu layout mới (user layout, không phải system default)
 * 
 * @param moduleType - Loại module
 * @param layoutName - Tên layout
 * @param columns - Column config từ store
 * @returns Layout vừa tạo
 */
export async function saveUserLayout(
  moduleType: number,
  layoutName: string,
  columns: Record<string, ColumnConfig>
): Promise<CreateLayoutResponse> {
  const configJson = convertColumnsToConfigJson(columns);
  
  const createRequest: CreateLayoutRequest = {
    layoutName,
    moduleType,
    configJson: stringifyConfig(configJson),
    isSystemDefault: false // User layout
  };
  
  return await createLayout(createRequest);
}

/**
 * Cập nhật layout của user
 * 
 * @param layoutId - Layout ID
 * @param layoutName - Tên layout mới
 * @param columns - Column config từ store
 * @returns Layout sau khi cập nhật
 */
export async function updateUserLayout(
  layoutId: number,
  layoutName: string,
  columns: Record<string, ColumnConfig>
): Promise<ModuleLayoutDetail> {
  const configJson = convertColumnsToConfigJson(columns);
  
  const updateRequest: UpdateLayoutRequest = {
    id: layoutId,
    layoutName,
    configJson: stringifyConfig(configJson),
    isSystemDefault: false
  };
  
  return await updateLayout(layoutId, updateRequest);
}
