import { describe,expect,it } from 'vitest';
import { comparisonRows,fallbackComparisonOptions } from './comparisonOptions';

describe('comparison defaults',()=>{
  it('provides two distinct source-backed options',()=>{
    expect(fallbackComparisonOptions.length).toBeGreaterThanOrEqual(2);
    expect(new Set(fallbackComparisonOptions.map(item=>item.slug)).size).toBe(fallbackComparisonOptions.length);
    expect(fallbackComparisonOptions.every(item=>item.source.url.startsWith('https://')&&item.highlights.length>=2)).toBe(true);
  });
  it('provides every public at-a-glance row',()=>{
    expect(comparisonRows.map(([key])=>key)).toEqual(['typicalOnset','typicalDuration','frequency','prescription','importantConsiderations','priceLabel']);
    expect(fallbackComparisonOptions.every(item=>comparisonRows.every(([key])=>Boolean(item[key])))).toBe(true);
  });
});
