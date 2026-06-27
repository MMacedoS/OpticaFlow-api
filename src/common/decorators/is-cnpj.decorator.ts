import { registerDecorator, ValidationOptions } from 'class-validator';

function isValidCnpj(value: string): boolean {
  const cnpj = value.replace(/\D/g, '');

  if (cnpj.length !== 14) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calcDigit = (base: string, weights: number[]) => {
    const sum = base
      .split('')
      .reduce((acc, digit, i) => acc + Number(digit) * weights[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const digit1 = calcDigit(
    cnpj.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const digit2 = calcDigit(
    cnpj.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return cnpj === `${cnpj.slice(0, 12)}${digit1}${digit2}`;
}

export function IsCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCnpj',
      target: object.constructor,
      propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidCnpj(value);
        },
      },
    });
  };
}
