/**
 * Will only run describe block if the condition is true
 */
export const describeIf = (condition: boolean) => (condition ? describe : describe.skip);
