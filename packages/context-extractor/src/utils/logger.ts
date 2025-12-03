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

  static spinner(message: string) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;

    process.stdout.write(Colors.info(`${frames[i]} ${message}`));

    const interval = setInterval(() => {
      i = (i + 1) % frames.length;
      process.stdout.write(`\r${Colors.info(`${frames[i]} ${message}`)}`);
    }, 80);

    return {
      stop(success: boolean = true) {
        clearInterval(interval);
        const symbol = success ? Colors.success('✓') : Colors.error('✖');
        process.stdout.write(`\r${symbol} ${message}\n`);
      },
    };
  }
}