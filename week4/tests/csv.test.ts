import { describe, expect, it } from 'vitest';
import { escapeCsvCell, toCsv, withBom } from '../src/core/csv';

describe('csv', () => {
  it('joins plain cells with commas', () => {
    expect(toCsv([['Category', 'Item', 'Qty'], ['衣物', 'T恤', 7]])).toBe('Category,Item,Qty\r\n衣物,T恤,7');
  });

  it('quotes cells containing commas, quotes or newlines', () => {
    expect(escapeCsvCell('内衣, 袜子')).toBe('"内衣, 袜子"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvCell('plain')).toBe('plain');
  });

  it('keeps empty cells and numbers', () => {
    expect(toCsv([['', 0, 3]])).toBe(',0,3');
  });

  it('prepends a UTF-8 BOM so Excel reads Chinese correctly', () => {
    const csv = withBom('a,b');
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('a,b');
  });
});
