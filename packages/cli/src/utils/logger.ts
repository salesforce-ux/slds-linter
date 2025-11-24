import { Colors } from './colors';

export class Logger {
  static newLine(){
    console.log('');
    return this;
  }
  static info(message: string): void {
    console.log(Colors.info(`ℹ ${message}`));
  }

  static success(message: string): void {
    console.log(Colors.success('✓'), message);
  }

  static warning(message: string): void {
    console.warn(Colors.warning('⚠'), message);
  }

  static error(message: string): void {
    console.error(Colors.error('✖'), message);
  }

  static debug(message: string): void {
    if (process.env.DEBUG) {
      console.debug(Colors.lowEmphasis('🔍'), message);
    }
  }
} 