import { InvalidUserError } from '../errors/invalidUser.error';

export type UserPrimitives = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
};

export class User {
  private constructor(
    readonly id: string,
    private readonly _email: string,
    private readonly _displayName: string,
    private readonly _passwordHash: string
  ) {}

  get email(): string {
    return this._email;
  }

  get displayName(): string {
    return this._displayName;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  static rehydrate(primitives: UserPrimitives): User {
    const id = primitives.id?.trim();
    const email = primitives.email?.trim().toLowerCase();
    const displayName = primitives.displayName?.trim();
    const passwordHash = primitives.passwordHash?.trim();

    if (!id) {
      throw new InvalidUserError('User id cannot be empty');
    }
    if (!email) {
      throw new InvalidUserError('User email cannot be empty');
    }
    if (!displayName) {
      throw new InvalidUserError('User display name cannot be empty');
    }
    if (!passwordHash) {
      throw new InvalidUserError('User password hash cannot be empty');
    }

    return new User(id, email, displayName, passwordHash);
  }

  toPrimitives(): UserPrimitives {
    return {
      id: this.id,
      email: this._email,
      displayName: this._displayName,
      passwordHash: this._passwordHash
    };
  }
}
