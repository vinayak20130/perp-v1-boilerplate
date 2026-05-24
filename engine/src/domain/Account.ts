export class Account {
  private _available: number;
  private _locked: number;
  constructor(public userId: string) {
    this._available = 0;
    this._locked = 0;
  }
  /**
   * lock -> locks a user balance
   */
  public lock(amount: number) {
    if (this._available < amount) {
      throw new Error("Insuffient balance");
    }
    this._available -= amount;
    this._locked += amount;
  }
  /**
   * unlock -> unlocks a user balance
   */
  public unlock(amount: number) {
    if (amount > this._locked) {
      throw new Error(`current locked amount amount is ${this._locked}`);
    }
    this._locked -= amount;
    this._available += amount;
  }
  /**
   * onRamp -> adds balance to user wallet
   */
  public onRamp(amount: number) {
    if (amount <= 0) throw new Error("amount must be positive");
    this._available += amount;
  }
  /**
   * offRamp -> withdraws balance from user's wallet
   */
  public offRamp(amount: number) {
    if (amount > this._available) {
      throw new Error(`Current balance is ${this._available}`);
    }
    this._available -= amount;
  }
  public get available(): number {
    return this._available;
  }
  public get locked(): number {
    return this._locked;
  }
}
