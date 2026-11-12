const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function compile(file, mocks = {}) {
    const module = { exports: {} };
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    new Function('require', 'module', 'exports', code)(id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
    return module.exports;
}

function editor(item, change) {
    const state = [];
    let cursor = 0;
    const { CartPriceEditor } = compile('resources/js/components/layout/cart-price-editor.tsx', {
        react: { useId: () => 'price', useState: initial => { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], next => { state[i] = next; }]; } },
        '@/components/ui/button': { Button: 'button' },
        '@/components/ui/input': { Input: 'input' },
        '@/components/ui/label': { Label: 'label' },
        '@/components/ui/dialog': { Dialog: 'dialog', DialogContent: 'dialog-content', DialogHeader: 'header', DialogTitle: 'h2', DialogFooter: 'footer' },
        '@/hooks/use-translation': { useTranslation: () => ({ t: key => key }) },
        '@/lib/cart-pricing': compile('resources/js/lib/cart-pricing.ts'),
        '@/lib/currency': { formatCurrency: String, formatIQD: String },
        '@/utils/keyboard-normalization': { normalizeToEnglishNumbers: value => value },
        'lucide-react': { Pencil: 'svg' },
    });
    return () => { cursor = 0; return CartPriceEditor({ item, onChange: change }); };
}

function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
        const match = find(child, predicate);
        if (match) return match;
    }
    return null;
}

const item = { id: '1', name: 'Product', price: 150, cost_price: 100 };
const button = tree => find(tree, n => n.type === 'button');
const input = tree => find(tree, n => n.type === 'input');
const dialog = tree => find(tree, n => n.type === 'dialog');
const apply = tree => find(tree, n => n.type === 'button' && n.props.children === 'cart_price.apply');

test('below-minimum, blank, and excessive-precision drafts cannot change the cart', () => {
    for (const draft of ['119.99', '', '120.001', 'abc', '-1']) {
        let calls = 0;
        const render = editor(item, () => { calls++; return null; });
        button(render()).props.onClick();
        input(render()).props.onChange({ target: { value: draft } });
        apply(render()).props.onClick();
        assert.equal(calls, 0);
        assert.equal(dialog(render()).props.open, true);
        assert.ok(find(render(), n => n.props?.role === 'alert'));
    }
});

test('Enter applies an allowed price and blocks POS keyboard shortcuts', () => {
    let changed;
    const render = editor(item, (id, price) => { changed = { id, price }; return null; });
    button(render()).props.onClick();
    input(render()).props.onChange({ target: { value: '120' } });
    let prevented = false;
    input(render()).props.onKeyDown({ key: 'Enter', preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(changed, { id: '1', price: 120 });
    assert.equal(dialog(render()).props.open, false);
    let stopped = false;
    find(render(), n => n.type === 'dialog-content').props.onKeyDown({ key: 'C', stopPropagation: () => { stopped = true; } });
    assert.equal(stopped, true);
});

test('discount validation keeps the dialog open; missing costs disable editing', () => {
    const render = editor(item, () => 'Discount would reduce profit');
    button(render()).props.onClick();
    apply(render()).props.onClick();
    assert.equal(dialog(render()).props.open, true);
    assert.equal(find(render(), n => n.props?.role === 'alert').props.children, 'Discount would reduce profit');
    assert.equal(button(editor({ ...item, cost_price: null }, () => null)()).props.disabled, true);
});

test('carton editing starts with the effective unit price', () => {
    const render = editor({ ...item, isCartonMode: true, per_carton: 12, carton_price: 1440 }, () => null);
    button(render()).props.onClick();
    assert.equal(input(render()).props.value, '120');
});
