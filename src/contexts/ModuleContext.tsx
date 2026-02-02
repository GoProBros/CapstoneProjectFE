import { createContext, useContext } from 'react';

/**
 * ModuleContext provides module-specific data to each module instance
 * Used for modules with configurable layouts to access their moduleId and workspace data
 */
interface ModuleContextType {
  moduleId: string;
  moduleType: string;
}

export const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

/**
 * Hook to access module context
 * Returns undefined if not within a ModuleContext (for modules without layout config)
 */
export const useModule = () => {
  return useContext(ModuleContext);
};
