export class ConvertError extends Error {
  constructor(msg: string = 'Can Not Convert Data') {
    super(msg);
    this.name = 'ConvertError';
  }
}
