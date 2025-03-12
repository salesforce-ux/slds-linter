import chalk from 'chalk';

export class Logger {
  static newLine(){
    console.log('\n');
    return this;
  }
  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  static warning(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  static error(message: string): void {
    console.error(chalk.red('✖'), message);
  }

  static debug(message: string): void {
    if (process.env.DEBUG) {
      console.debug(chalk.gray('🔍'), message);
    }
  }
} 