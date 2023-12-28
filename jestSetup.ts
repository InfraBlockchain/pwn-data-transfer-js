if (process.env.NODE_ENV === 'test') {
  //increase jest default timeout when debugging via test files
  jest.setTimeout(1000 * 60 * 10);
  jest.autoMockOff();
}
