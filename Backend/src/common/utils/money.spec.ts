import { convertMinor, fromMinor, toMinor } from './money';

describe('money helpers', () => {
  it('converts amounts using the currency minor unit', () => {
    expect(toMinor('12.34', 'USD')).toBe(1234);
    expect(fromMinor(1234, 'USD')).toBe(12.34);
    expect(toMinor('123', 'JPY')).toBe(123);
    expect(fromMinor(123, 'JPY')).toBe(123);
  });

  it('rounds decimal amounts to the nearest minor unit', () => {
    expect(toMinor('1.005', 'USD')).toBe(101);
  });

  it('converts between currencies using a decimal exchange rate', () => {
    expect(convertMinor(1000, '1.2345', 'USD', 'USD')).toBe(1235);
    expect(convertMinor(100, '0.0067', 'JPY', 'USD')).toBe(67);
  });
});
