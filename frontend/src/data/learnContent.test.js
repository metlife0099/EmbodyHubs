import { describe, expect, it } from 'vitest';
import { glossaryTerms, learnArticles, learnCategories } from './learnContent';

describe('Learn content', () => {
  it('uses unique, route-safe article slugs', () => {
    const slugs = learnArticles.map(article => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every(slug => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))).toBe(true);
  });

  it('provides substantive, source-backed content for every editorial category', () => {
    const editorialCategories = learnCategories.filter(category => category.id !== 'glossary');
    expect(editorialCategories.every(category => learnArticles.some(article => article.categoryId === category.id))).toBe(true);
    expect(learnArticles.every(article => article.takeaways.length >= 3 && article.sections.length >= 3)).toBe(true);
    expect(learnArticles.every(article => article.sources.length > 0 && article.sources.every(source => source.url.startsWith('https://')))).toBe(true);
  });

  it('provides plain-language glossary definitions', () => {
    expect(glossaryTerms.length).toBeGreaterThanOrEqual(10);
    expect(glossaryTerms.every(item => item.term && item.definition.length >= 40)).toBe(true);
  });
});
