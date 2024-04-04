export class Issue {
  constructor(id: string, name: string) {
    this.displayId = id;
    this.testName = name;
  }
  displayId: string = '';
  testName: string = '';
}

export class KnownIssues {
  static Issues: Issue[] = [
    new Issue('97e31523-b8f9-466a-b48d-420120d6f966', 'Reboot Display'), //TPVWAVE-1180
    new Issue('02bbc59e-11c7-4873-b52a-3bf6369a599f', 'Change Mute'), //TPVWAVE-1329
    new Issue('02bbc59e-11c7-4873-b52a-3bf6369a599f', 'Uninstall App'), //App management b-line
  ];
  /*
   if (this.Issues.filter((i)
   below line uses the filter method to check if there's any issue in the Issues array that matches 
  the provided displayId and testName. If the length of the filtered array is greater than 0, 
  it means there's a known issue, and the method returns true; otherwise, it returns false.
  */
  static HasKnownIssue(displayId: string, testName: string): boolean {
    console.log('Hasknown issue: ' + displayId + ' - ' + testName);
    if (this.Issues.filter((i) => i.displayId == displayId && i.testName == testName).length > 0) {
      return true;
    } else {
      return false;
    }
  }
}
