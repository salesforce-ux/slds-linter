/**
 * Determine configuration format based on environment variable
 * 
 * @returns {boolean} True for flat config (ESLint v9), false for legacy config (ESLint v8)
 * 
 * Behavior:
 * - ESLINT_USE_FLAT_CONFIG=true: Use flat config (ESLint v9 format)
 * - ESLINT_USE_FLAT_CONFIG=false: Use legacy config (ESLint v8 format)
 * - undefined: Defaults to flat config (ESLint v9 format)
 * 
 * Note: ESLint v8 users must explicitly set ESLINT_USE_FLAT_CONFIG=false
 */
export function shouldUseFlatConfig(): boolean {
    const envVar = process.env.ESLINT_USE_FLAT_CONFIG;
    if (envVar !== undefined) {
        return envVar === 'true';
    }
    
    // Default to flat config (ESLint v9 format)
    return true;
} 