import { describe, it, expect } from '@jest/globals';
import { transformObjectToInnerString } from '../../lib/utils/transformObjectToInnerString';

describe('transformObjectToInnerString', () => {
  it('handles a simple flat object', () => {
    const result = transformObjectToInnerString({ file: '111' });
    expect(result).toBe("file: '111'");
  });

  it('handles multiple flat properties', () => {
    const result = transformObjectToInnerString({ file: '111', name: 'test' });
    expect(result).toBe("file: '111',\nname: 'test'");
  });

  it('handles nested objects', () => {
    const result = transformObjectToInnerString({
      file: '111',
      avatar: {
        file: '222'
      }
    });
    expect(result).toBe("file: '111',\navatar: {\n  file: '222'\n}");
  });

  it('handles deeply nested objects', () => {
    const result = transformObjectToInnerString({
      level1: {
        level2: {
          level3: 'deep'
        }
      }
    });
    expect(result).toBe("level1: {\n  level2: {\n    level3: 'deep'\n  }\n}");
  });

  it('handles non-string primitives', () => {
    const result = transformObjectToInnerString({
      count: 42,
      active: true,
      empty: null
    });
    expect(result).toBe("count: 42,\nactive: true,\nempty: null");
  });

  it('handles arrays as primitives', () => {
    const result = transformObjectToInnerString({
      items: [1, 2, 3]
    });
    expect(result).toBe("items: [1, 2, 3]");
  });

  it('handles empty object', () => {
    const result = transformObjectToInnerString({});
    expect(result).toBe('');
  });

  it('handles mixed nested and flat properties', () => {
    const result = transformObjectToInnerString({
      id: '123',
      meta: {
        created: 'today',
        author: {
          name: 'John'
        }
      },
      status: 'active'
    });
    expect(result).toBe(
      "id: '123',\nmeta: {\n  created: 'today',\n  author: {\n    name: 'John'\n  }\n},\nstatus: 'active'"
    );
  });

  it('handles complex nested with indentation', () => {
    const result = transformObjectToInnerString({
      user: {
        profile: {
          name: 'Alice',
          address: {
            city: 'Wonderland',
            zip: '00000'
          }
        },
        roles: ['admin', 'user']
      },
      isActive: false
    }, '      ');
    expect(result).toBe(
      "      user: {\n        profile: {\n          name: 'Alice',\n          address: {\n            city: 'Wonderland',\n            zip: '00000'\n          }\n        },\n        roles: ['admin', 'user']\n      },\n      isActive: false"
    );
  });
});