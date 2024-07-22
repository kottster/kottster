import { convertName } from '../../../lib/utils/convertName';

describe('utils/convertName', () => {
  const expected = 'Foo bar baz';

  it('should convert camelCase', () => {
    expect(convertName('fooBarBaz')).toBe(expected);
  });

  it('should convert PascalCase', () => {
    expect(convertName('FooBarBaz')).toBe(expected);
  });

  it('should convert lower_case', () => {
    expect(convertName('foo_bar_baz')).toBe(expected);
  });
});