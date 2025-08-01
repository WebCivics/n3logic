

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


class PerFileLogReporter {
  constructor() {
    this.failedTests = [];
  }

  onTestResult(contexts, result) {
    const logsDir = path.resolve(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    const fileName = path.basename(result.testFilePath).replace(/\.[jt]sx?$/, '') + '.log';
    const logPath = path.join(logsDir, fileName);
    const logContent = [
      `Test File: ${result.testFilePath}`,
      `Status: ${result.numFailingTests > 0 ? 'FAIL' : 'PASS'}`,
      '',
      ...result.testResults.map((tr) => {
        if (tr.status === 'failed') {
          this.failedTests.push({
            file: result.testFilePath,
            name: tr.fullName,
            message: tr.failureMessages.join('\n'),
          });
        }
        return [
          `Test: ${tr.fullName}`,
          `Status: ${tr.status}`,
          tr.failureMessages.length ? `Failure: ${tr.failureMessages.join('\n')}` : '',
          '',
        ].join('\n');
      }),
    ].join('\n');
    fs.writeFileSync(logPath, logContent, 'utf8');
  }

  onRunComplete() {
    const logsDir = path.resolve(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    const summaryPath = path.join(logsDir, 'failed-tests-summary.txt');
    let summary = '';
    if (this.failedTests.length === 0) {
      summary = 'All tests passed.\n';
    } else {
      summary = [
        'FAILED TESTS SUMMARY',
        '====================',
        ...this.failedTests.map((f) => [
          `File: ${f.file}`,
          `Test: ${f.name}`,
          `Message: ${f.message}`,
          '',
        ].join('\n')),
      ].join('\n');
    }
    // Append debug log output from the latest session debug log file, if present
    const logFiles = fs.readdirSync(logsDir)
      .filter((f) => /^reasoner-debug-\d+\.log$/.test(f))
      .map((f) => ({
        name: f,
        time: parseInt(f.match(/reasoner-debug-(\d+)\.log/)[1], 10),
      }))
      .sort((a, b) => b.time - a.time);
    if (logFiles.length > 0) {
      const latestLog = path.join(logsDir, logFiles[0].name);
      try {
        const debugLogContent = fs.readFileSync(latestLog, 'utf8');
        summary += '\n\nDEBUG LOG OUTPUT (latest session):\n=================================\n' + debugLogContent;
      } catch (e) {
        summary += '\n\n[Could not read latest debug log: ' + e.message + ']';
      }
    }
    fs.writeFileSync(summaryPath, summary, 'utf8');
  }
}

export default PerFileLogReporter;
