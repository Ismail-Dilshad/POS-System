# Restore weighed products

Scale products are hidden by a frontend feature flag. Backend PHP files, routes,
models, database tables, and existing records are unchanged.

To restore the interface, set `SCALE_PRODUCTS_ENABLED` to `true` in
`resources/js/config/features.ts`, then run `npm run build` and refresh the app.
This restores the POS scale button and T shortcut, inventory controls/statistics,
scale inventory rows, purchase and stock-adjustment choices, and report filters.

`scale-products-frontend-before-hide.zip` contains a snapshot of `resources/js`
before hiding the feature, including the two-character barcode fix. Extract it
to a temporary folder for comparison; avoid replacing newer project changes.

Completed sales, purchase history, receipts, and returns retain their original
items and amounts, including historical weighed items, for accounting accuracy.
Hiding the feature is a presentation change, not an API access restriction.
