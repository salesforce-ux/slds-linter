import chalk from 'chalk';

/**
 * Color constants matching the UX design system syntax colors for dark mode
 * Based on the mock design specifications
 */
export const Colors = {
  // Error: light red/salmon
  error: chalk.hex('#FF8080'),
  
  // Warning: vibrant yellow
  warning: chalk.hex('#FFFF80'),
  
  // Success: bright light green
  success: chalk.hex('#66BB6A'),
  
  // Informational: light cyan/aqua blue
  info: chalk.hex('#80FFFF'),
  
  // Hyperlink: light blue/lavender
  hyperlink: chalk.hex('#8080FF'),
  
  // Low-emphasis text: light gray
  lowEmphasis: chalk.hex('#A9A9A9'),
  
  // Standard text: white (default)
  standard: chalk.white,
  
  // Bold variants for emphasis
  errorBold: chalk.hex('#FF8080').bold,
  warningBold: chalk.hex('#FFFF80').bold,
} as const;

