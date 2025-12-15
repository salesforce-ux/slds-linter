import cliProgress from 'cli-progress';
import chalk from 'chalk';

export interface ProgressHandlerOptions {
  total: number;
  format?: string;
}

export class ProgressHandler {
  private progressBar: cliProgress.SingleBar | null = null;
  private completed: number = 0;

  constructor(options: ProgressHandlerOptions) {
    const format = options.format || `Processing [{bar}] {percentage}% ({value}/{total})`;
    const isCI = String(process.env.CI || '').toLowerCase() === 'true' || process.env.CI === '1';
    const isTTY = Boolean(process.stdout.isTTY);

    if(!isTTY || isCI) {
      return;
    }
    
    this.progressBar = new cliProgress.SingleBar({
      format,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      formatBar: (progress: number, options: any) => {
        const completeSize = Math.round(progress * options.barsize);
        const incompleteSize = options.barsize - completeSize;
        
        return chalk.cyan(options.barCompleteChar.repeat(completeSize)) +
               chalk.cyanBright(options.barIncompleteChar.repeat(incompleteSize));
      }
    });

    this.progressBar.start(options.total, 0);
  }

  /**
   * Increment progress by one unit
   */
  increment(): void {
    this.completed++;
    this.progressBar?.update(this.completed);
  }

  /**
   * Update progress to a specific value
   */
  update(value: number): void {
    this.completed = value;
    this.progressBar?.update(value);
  }

  /**
   * Stop and cleanup the progress bar
   */
  stop(): void {
    this.progressBar?.stop();
  }

  /**
   * Get current progress value
   */
  getCompleted(): number {
    return this.completed;
  }
}
