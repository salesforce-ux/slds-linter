import { execFile } from 'child_process';
import path from 'path';
import cliProgress from 'cli-progress';

const FOLDER_NAME = 'reports';


function runLinterBatch(batch: string[], batchNum: number, linterPath: string, configFile: string): Promise<string> {
  const OUTPUT_DIR = path.join(process.cwd(), FOLDER_NAME);
  return new Promise((resolve, reject) => {

    let args = [];
    let linterType = getLinterType(linterPath);
    const label = linterType === 'es' ? 'ESLint' : 'Stylelint';

    let outputFile = `${OUTPUT_DIR}/${linterType}_batch${batchNum}.json`;

    if(linterType === 'sl')
    {
      args = [
        ...batch,
        '--config', configFile,
        '--formatter', 'json',
        '--output-file', outputFile,
      ];
    }
    else if(linterType === 'es')
      {
        args = [
          ...batch,
          '--config', configFile,
          '--format', 'json',
          '--output-file', outputFile,
        ];
      }

    //console.log(`Arguments ${configFile} ${outputFile}`)
    execFile(linterPath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && (error.code === 2 || error.code === 1)) {
        //console.warn(`${linter} Batch ${batchNum} completed with linting errors, but continuing.`);
        return resolve(`${label} Batch ${batchNum} completed with linting errors.`);
      }

      if (error) {
        //console.error(`${label} Batch ${batchNum} failed with error:`, error);
        return reject(new Error(`${label} failed for batch ${batchNum}`));
      }

      resolve(`${label} Batch ${batchNum} completed successfully.`);
    });
  });
}

export async function processFilesInBatches(
  files: string[],
  linter: string,
  configFile: string,
  batchSize: number
): Promise<void> {
  const totalFiles = files.length;
  const batchResults: string[] = [];
  let processedFiles = 0; // Track the number of files validated

  const linterType = getLinterType(linter);

  // Initialize the progress bar
  const progressBar = new cliProgress.SingleBar({
    format:
      linterType === 'es'
        ? `Components Linting Progress [{bar}] {percentage}% | {value}/{total} files`
        : `Styles Linting Progress [{bar}] {percentage}% | {value}/{total} files`,
    barCompleteChar: '█',
    barIncompleteChar: '-',
    hideCursor: true,
  });

  progressBar.start(totalFiles, 0); // Start the progress bar

  for (let i = 0; i < totalFiles; i += batchSize) {
    const batchNum = Math.floor(i / batchSize) + 1;
    const batch = files.slice(i, i + batchSize);

    try {
      const result = await runLinterBatch(batch, batchNum, linter, configFile);
      batchResults.push(result);
    } catch (error) {
      console.error(`Error processing batch ${batchNum}: ${error}`);
    }

    processedFiles += batch.length; // Update the number of files processed
    progressBar.update(processedFiles); // Update the progress bar
  }

  progressBar.stop(); // Stop the progress bar after completion
}

  function getLinterType(linter: string){
    let linterType = 'sl' // stylelint
    if(linter.indexOf('eslint') > 0)
      linterType = 'es' //eslint

    return linterType;
  }