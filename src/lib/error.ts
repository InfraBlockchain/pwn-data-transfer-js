export class ConvertError extends Error {
  constructor(msg: string = 'Can Not Convert Data') {
    super(msg);
    this.name = 'ConvertError';
  }
}

export class NoDIDSetError extends Error {
  constructor(msg: string = 'Did set is not initialized.') {
    super(msg);
    this.name = 'NoDIDSetError';
  }
}
