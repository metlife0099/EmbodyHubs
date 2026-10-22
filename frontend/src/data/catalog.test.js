import { describe,expect,it } from 'vitest';
import { products } from './catalog';
describe('public catalog policy',()=>{it('publishes only non-prescription demo products',()=>{expect(products.every(product=>product.prescriptionRequired===false)).toBe(true)});it('requires complete public product labeling',()=>{expect(products.every(product=>product.name&&product.ingredient&&product.category&&product.slug)).toBe(true)})});
