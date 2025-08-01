const fs = require('fs');
const path = require('path');


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
      ...result.testResults.map(tr => {
        if (tr.status === 'failed') {
          this.failedTests.push({
            file: result.testFilePath,
            name: tr.fullName,
            message: tr.failureMessages.join('\n')
          });
        }
        return [
          `Test: ${tr.fullName}`,
          `Status: ${tr.status}`,
          tr.failureMessages.length ? `Failure: ${tr.failureMessages.join('\n')}` : '',
          ''
        ].join('\n');
      })
    ].join('\n');
    fs.writeFileSync(logPath, logContent, 'utf8');
  }

  onRunComplete() {
    const logsDir = path.resolve(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
    const summaryPath = path.join(logsDir, 'failed-tests-summary.txt');
    if (this.failedTests.length === 0) {
      fs.writeFileSync(summaryPath, 'All tests passed.\n', 'utf8');
      return;
    }
    const summary = [
      'FAILED TESTS SUMMARY',
      '====================',
      ...this.failedTests.map(f => [
        `File: ${f.file}`,
        `Test: ${f.name}`,
        `Message: ${f.message}`,
        ''
      ].join('\n'))
    ].join('\n');
    fs.writeFileSync(summaryPath, summary, 'utf8');
  }
}

module.exports = PerFileLogReporter;
