// Run: node --test tests/cart-pricing.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../resources/js/lib/cart-pricing.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const output = { exports: {} };
new Function('exports', compiled)(output.exports);
const { minimumSalePrice, withCartPrice, cartPriceIssue } = output.exports;
const item = { id: 'product_1', productId: 1, name: 'Product', barcode: 'C5', cost_price: 100, price: 150, originalPrice: 150, quantity: 2, total: 300, image_url: '/storage/item.png' };

test('minimum is twenty percent above cost and rounds upward', () => {
    assert.equal(minimumSalePrice(100), 120);
    assert.equal(minimumSalePrice(10.01), 12.02);
    assert.equal(minimumSalePrice(0), 0.01);
    for (const value of [null, undefined, '', NaN, Infinity, -1]) assert.equal(minimumSalePrice(value), null);
});

test('sale-only unit edit updates total and checkout payload without changing catalog metadata', () => {
    const edited = withCartPrice(item, 120);
    assert.equal(item.price, 150);
    assert.equal(edited.originalPrice, 150);
    assert.equal(edited.image_url, item.image_url);
    assert.equal(edited.total, 240);
    assert.equal(edited.transactionItem.price, 120);
    assert.equal(edited.transactionItem.total, 240);
    assert.equal(edited.transactionItem.product_id, 1);
    assert.equal(edited.transactionItem.price_overridden, true);
    assert.equal(cartPriceIssue([edited], 0), null);
    assert.ok(cartPriceIssue([withCartPrice(item, 119.99)], 0));
});

test('discounts cannot push edited items below the minimum', () => {
    const edited = withCartPrice(item, 150);
    assert.equal(cartPriceIssue([edited], 60), null);
    assert.ok(cartPriceIssue([edited], 60.01));
    assert.ok(cartPriceIssue([withCartPrice(item, 120)], 1));
    assert.equal(cartPriceIssue([{ ...item, price: 110, total: 220 }], 0), null);
});

test('cartons, cards, weights, and saved carts retain price metadata', () => {
    const carton = withCartPrice({ ...item, quantity: 24, per_carton: 12, carton_price: 1600, isCartonMode: true, cartonQuantity: 2 }, 120);
    assert.equal(carton.total, 2880);
    assert.equal(carton.carton_price, 1440);
    assert.equal(carton.cartonQuantity, 2);
    const saved = JSON.parse(JSON.stringify(carton));
    assert.equal(cartPriceIssue([saved], 0), null);
    assert.ok(cartPriceIssue([{ ...saved, cost_price: undefined }], 0));
    const card = withCartPrice({ ...item, productId: undefined, cardId: 4, productType: 'card' }, 120);
    assert.equal(card.transactionItem.card_id, 4);
    const scale = withCartPrice({ ...item, quantity: null, weight: 0.5, isScaleProduct: true }, 120);
    assert.equal(scale.total, 60);
    assert.equal(scale.transactionItem.quantity, null);
    assert.equal(cartPriceIssue([scale], 0), null);
});
