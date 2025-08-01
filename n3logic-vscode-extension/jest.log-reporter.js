const fs = require('fs');
const path = require('path');

class PerFileLogReporter {
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
}

module.exports = PerFileLogReporter;
