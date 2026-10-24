import { describe,expect,it } from 'vitest';
import { comparisonRows,fallbackComparisonOptions,fallbackComparisons } from './comparisonOptions';

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
  it('groups options into a publishable comparison',()=>{
    expect(fallbackComparisons).toHaveLength(1);
    expect(fallbackComparisons[0].purpose).toBe('Tadalafil vs Sildenafil');
    expect(fallbackComparisons[0].items).toHaveLength(2);
  });
});
