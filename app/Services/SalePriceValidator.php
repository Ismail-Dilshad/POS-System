<?php

namespace App\Services;

use Illuminate\Support\Collection;

class SalePriceValidator
{
    public function validate(array $items, Collection $products, Collection $scaleProducts, Collection $cards, float $discount, float $totalAmount): array
    {
        $errors = [];
        $subtotal = array_sum(array_column($items, 'total'));
        $ratio = $subtotal > 0 ? max(0, 1 - $discount / $subtotal) : 0;
        if ($discount > $subtotal || abs(max(0, $subtotal - $discount) - $totalAmount) > 0.02) {
            $errors['total_amount'][] = 'The sale total does not match the items and discount.';
        }
        foreach ($items as $index => $item) {
            $ids = array_filter([$item['product_id'] ?? null, $item['scale_product_id'] ?? null, $item['card_id'] ?? null]);
            $model = !empty($item['product_id']) ? $products->get($item['product_id'])
                : (!empty($item['scale_product_id']) ? $scaleProducts->get($item['scale_product_id']) : $cards->get($item['card_id'] ?? null));
            $key = "items.{$index}.price";
            if (count($ids) !== 1 || !$model) {
                $errors[$key][] = 'Select a valid product or card before changing its price.';
                continue;
            }
            $units = !empty($item['scale_product_id']) ? (float) ($item['weight'] ?? 0) : (float) ($item['quantity'] ?? 1);
            $price = (float) $item['price'];
            $total = (float) $item['total'];
            if ($units <= 0 || abs($total - $price * $units) > max(0.02, $units * 0.005 + 0.01)) {
                $errors[$key][] = 'The item total does not match its selling price and quantity.';
                continue;
            }
            // Existing catalog prices keep their current behavior. Any manual or
            // non-catalog price must retain at least 20% above the database cost.
            $catalogPrice = abs($price - (float) $model->sell_price) < 0.0051;
            if (!empty($item['product_id']) && (float) $model->per_carton > 0 && $model->carton_price !== null) {
                $perCarton = (float) $model->per_carton;
                $cartons = $units / $perCarton;
                $catalogPrice = $catalogPrice || (
                    abs($cartons - round($cartons)) < 1e-7 &&
                    abs($price - round((float) $model->carton_price / $perCarton, 2)) < 0.0051 &&
                    abs($total - (float) $model->carton_price * $cartons) <= 0.02
                );
            }
            if (empty($item['price_overridden']) && $catalogPrice) continue;
            $cost = $model->cost_price;
            $minimum = $cost !== null && is_numeric($cost) && (float) $cost >= 0
                ? max(0.01, ceil((float) $cost * 120 - 1e-7) / 100) : null;
            $netPrice = min($price, $total / $units) * $ratio;
            if ($minimum === null || !is_finite($netPrice) || $netPrice + 1e-7 < $minimum) {
                $errors[$key][] = $minimum === null ? 'The product cost is unavailable. Refresh the product before editing its price.'
                    : sprintf('%s must sell for at least %.2f IQD per unit after discounts (20%% above cost).', $model->name ?? $item['name'], $minimum);
            }
        }
        return $errors;
    }
}
