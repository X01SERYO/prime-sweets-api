import { InvalidCustomerError } from '../errors/invalidCustomer.error';

export type CustomerPrimitives = {
  id: string;
  documentType: string;
  documentNumber: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export class Customer {
  private constructor(
    readonly id: string,
    private _documentType: string,
    private _documentNumber: string,
    private _name: string,
    private _phone: string | null,
    private _email: string | null,
    private _address: string | null
  ) {}

  get documentType(): string {
    return this._documentType;
  }

  get documentNumber(): string {
    return this._documentNumber;
  }

  get name(): string {
    return this._name;
  }

  get phone(): string | null {
    return this._phone;
  }

  get email(): string | null {
    return this._email;
  }

  get address(): string | null {
    return this._address;
  }

  static create(params: {
    id: string;
    documentType: string;
    documentNumber: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }): Customer {
    if (!params.id || params.id.trim() === '') {
      throw new InvalidCustomerError('Customer id cannot be empty');
    }

    const trimmedDocType = params.documentType?.trim();
    if (!trimmedDocType) {
      throw new InvalidCustomerError('Customer document type cannot be empty');
    }

    const trimmedDocNumber = params.documentNumber?.trim();
    if (!trimmedDocNumber) {
      throw new InvalidCustomerError('Customer document number cannot be empty');
    }

    const trimmedName = params.name?.trim();
    if (!trimmedName) {
      throw new InvalidCustomerError('Customer name cannot be empty');
    }

    const phone = params.phone !== undefined && params.phone !== null ? params.phone.trim() || null : null;
    const email = params.email !== undefined && params.email !== null ? params.email.trim() || null : null;
    const address = params.address !== undefined && params.address !== null ? params.address.trim() || null : null;

    return new Customer(
      params.id.trim(),
      trimmedDocType,
      trimmedDocNumber,
      trimmedName,
      phone,
      email,
      address
    );
  }

  update(params: {
    documentType?: string;
    documentNumber?: string;
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }): Customer {
    let newDocType = this._documentType;
    if (params.documentType !== undefined) {
      const trimmed = params.documentType.trim();
      if (!trimmed) {
        throw new InvalidCustomerError('Customer document type cannot be empty');
      }
      newDocType = trimmed;
    }

    let newDocNumber = this._documentNumber;
    if (params.documentNumber !== undefined) {
      const trimmed = params.documentNumber.trim();
      if (!trimmed) {
        throw new InvalidCustomerError('Customer document number cannot be empty');
      }
      newDocNumber = trimmed;
    }

    let newName = this._name;
    if (params.name !== undefined) {
      const trimmed = params.name.trim();
      if (!trimmed) {
        throw new InvalidCustomerError('Customer name cannot be empty');
      }
      newName = trimmed;
    }

    const newPhone =
      params.phone !== undefined
        ? params.phone !== null
          ? params.phone.trim() || null
          : null
        : this._phone;

    const newEmail =
      params.email !== undefined
        ? params.email !== null
          ? params.email.trim() || null
          : null
        : this._email;

    const newAddress =
      params.address !== undefined
        ? params.address !== null
          ? params.address.trim() || null
          : null
        : this._address;

    return new Customer(
      this.id,
      newDocType,
      newDocNumber,
      newName,
      newPhone,
      newEmail,
      newAddress
    );
  }

  toPrimitives(): CustomerPrimitives {
    return {
      id: this.id,
      documentType: this._documentType,
      documentNumber: this._documentNumber,
      name: this._name,
      phone: this._phone,
      email: this._email,
      address: this._address
    };
  }
}
