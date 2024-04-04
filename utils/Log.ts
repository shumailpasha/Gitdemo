/*Imports the Node.js fs (file system) and path modules. 
These are used for working with files and file paths, respectively.
*/
const fs = require('fs');
const path = require('path');
const enum LogType {
  INFO = 'INFO',
  ERROR = 'ERROR',
  RESPONSE = 'RESPONSE',
}

/**
 * Logger class for writing log lines to a text file.
 */
export class Log {
  constructor(displayAlias: string) {
    this.displayAlias = displayAlias;
    /*path.resolve() is used to resolve a sequence of path segments into an absolute path.
      It starts from the root of the file system and navigates through the path segments to,
      construct the final absolute path.
      Concatenates the log folder, display alias, and the log file name to form a relative path.
    */
    this.logFile = path.resolve(process.cwd(), this.logFolder + this.displayAlias + '-log.txt');
  }

  //Members
  displayAlias: string = 'undefined';
  logFolder = 'reports/';
  logFile: string;

  //Functions
  Info(logLine: string) {
    this.appendLogLine('[' + LogType.INFO + '] - ' + new Date().toISOString() + ' - ' + logLine);
  }

  Error(logLine: string) {
    this.appendLogLine('[' + LogType.ERROR + '] - ' + new Date().toISOString() + ' - ' + logLine);
  }

  Header(logLine: string) {
    let headerLength = logLine.length + 14;
    let headerBar = '';
    for (let i = 0; i < headerLength; i++) {
      headerBar += '/';
    }
    this.appendLogLine('');
    this.appendLogLine(headerBar);
    this.appendLogLine('//     ' + logLine + '     //');
    this.appendLogLine(headerBar);
  }

  Response(test: string, response: string) {
    this.appendResponse(test, response);
  }

  appendLogLine(logLine: string) {
    fs.appendFileSync(this.logFile, logLine + '\n');
  }

  /*
  fs stands for the Node.js File System module, and appendFileSync is a function within that module. 
  The appendFileSync function is used to synchronously append data to a file.

  Using appendFileSync means that the file operation is synchronous, i.e., 
  it will block the execution of the code until the file operation is complete. 
  Depending on your use case, you might want to consider using the asynchronous version (fs.appendFile) 
  to avoid blocking the event loop in scenarios where non-blocking I/O is important

  The appendLogLine method, when called, will take a logLine as an argument and 
  append it to the file specified by this.logFile. The + '\n' part adds a newline character 
  to the end of the log line, ensuring that each log entry is on a new line in the file.
  */
  appendResponse(test: string, response: string) {
    fs.appendFileSync(this.logFile, '\n');
    fs.appendFileSync(
      this.logFile,
      test +
        '\n' +
        '[' +
        LogType.RESPONSE +
        '] - ' +
        new Date().toISOString() +
        ' - ' +
        response +
        '\n' +
        '\n',
    );
    fs.appendFileSync(this.logFile, '\n');
  }
}
