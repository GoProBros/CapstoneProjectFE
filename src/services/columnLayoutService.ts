/**
 * Column Layout Service
 * Handles API calls for saving and loading column layouts
 */

import { get, post } from './api';
import { ColumnLayoutData, ColumnLayoutResponse } from '@/types/columnLayout';

const STORAGE_KEY = 'stock-screener-layout';

/**
 * Save column layout to backend
 */
export async function saveColumnLayout(layoutData: ColumnLayoutData): Promise<ColumnLayoutData> {
  try {
    const result = await post<ColumnLayoutData>('/column-layout', layoutData);
    
    console.log('Layout saved successfully:', layoutData);
    console.log(`  - Name: ${layoutData.name}`);
    console.log(`  - Column widths: ${layoutData.columnWidths?.length || 0} columns`);
    console.log(`  - Symbols: ${layoutData.symbols?.length || 0} tickers`);
    
    return result.data;
  } catch (error) {
    console.error('Error saving layout:', error);
    
    // Fallback: save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutData));
    console.log('Layout saved to localStorage as fallback');
    
    throw error;
  }
}

/**
 * Load column layout from backend
 */
export async function loadColumnLayout(): Promise<ColumnLayoutData | null> {
  try {
    const result = await get<ColumnLayoutData>('/column-layout');

    if (result.success && result.data) {
      console.log('Layout loaded successfully from DB:', result.data);
      return result.data;
    }

    // Fallback: load from localStorage
    return loadFromLocalStorage();
  } catch (error) {
    console.error('Error loading layout:', error);
    
    // Fallback: load from localStorage
    return loadFromLocalStorage();
  }
}

/**
 * Load layout from localStorage (fallback)
 */
function loadFromLocalStorage(): ColumnLayoutData | null {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    console.log('Layout loaded from localStorage (fallback)');
    return JSON.parse(localData);
  }
  return null;
}
