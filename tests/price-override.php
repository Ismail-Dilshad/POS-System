<?php

// Run: php tests/price-override.php. No database or application writes.
require __DIR__.'/../vendor/autoload.php';

use App\Services\SalePriceValidator;
use Illuminate\Support\Collection;

$policy = new SalePriceValidator;
$product = (object) ['name' => 'Product', 'cost_price' => 100, 'sell_price' => 150, 'per_carton' => null, 'carton_price' => null];
$card = (object) ['name' => 'Card', 'cost_price' => 100, 'sell_price' => 150];
$products = new Collection([1 => $product]);
$cards = new Collection([2 => $card]);
$scales = new Collection([3 => clone $card]);
$checks = 0;
$check = function (string $label, array $item, bool $valid, float $discount = 0, ?float $saleTotal = null) use ($policy, $products, $cards, $scales, &$checks) {
    $errors = $policy->validate([$item], $products, $scales, $cards, $discount, $saleTotal ?? max(0, $item['total'] - $discount));
    if (($errors === []) !== $valid) throw new RuntimeException($label.': '.json_encode($errors));
    $checks++;
};
$line = fn ($price, $extra = []) => array_merge(['product_id' => 1, 'name' => 'Product', 'price' => $price, 'quantity' => 1, 'total' => $price, 'price_overridden' => true], $extra);

$check('Below cost', $line(99), false);
$check('Below twenty percent', $line(119.99), false);
$check('Exactly twenty percent', $line(120), true);
$check('Thirty percent', $line(130), true);
$check('Omitted override flag still protected', $line(110, ['price_overridden' => false]), false);
$check('Client cost cannot bypass database cost', $line(110, ['cost_price' => 0]), false);
$check('Discount cannot reduce edited price below minimum', $line(120), false, 0.01);
$check('Discount exactly at minimum', $line(150), true, 30);
$check('Forged line total', $line(150, ['total' => 110]), false);
$check('Forged order total', $line(150), false, 0, 1);
$check('Missing identity', $line(150, ['product_id' => null]), false);
$check('Multiple identities', $line(150, ['card_id' => 2]), false);
$check('Invalid quantity', $line(150, ['quantity' => 0]), false);

$product->sell_price = 110;
$check('Existing catalog price preserved', $line(110, ['price_overridden' => false]), true);
$check('Manual override of a low catalog price rejected', $line(110), false);
$product->sell_price = 150;
$product->cost_price = 130;
$check('Stale browser cost cannot bypass new database cost', $line(150), false);
$product->cost_price = 10.01;
$check('Minimum rounds upward to cents', $line(12.01), false);
$check('Rounded minimum accepted', $line(12.02), true);
$product->cost_price = null;
$check('Unknown cost rejected', $line(150), false);
$product->cost_price = 0;
$check('Zero cost requires positive price', $line(0), false);
$check('Zero cost positive price accepted', $line(0.01), true);
$product->cost_price = 100;

$check('Card minimum', $line(120, ['product_id' => null, 'card_id' => 2]), true);
$check('Card below minimum', $line(119, ['product_id' => null, 'card_id' => 2]), false);
$check('Weighed product price per kg', $line(120, ['product_id' => null, 'scale_product_id' => 3, 'quantity' => null, 'weight' => 0.5, 'total' => 60]), true);

$product->cost_price = 700;
$product->sell_price = 1000;
$product->per_carton = 12;
$product->carton_price = 10000;
$check('Existing carton pricing preserved', $line(833.33, ['quantity' => 24, 'total' => 20000, 'price_overridden' => false]), true);
$check('Carton price cannot bypass unit minimum', $line(833.33, ['price_overridden' => false]), false);
$check('Edited carton pricing', $line(900, ['quantity' => 24, 'total' => 21600]), true);
$check('Edited carton below minimum', $line(800, ['quantity' => 24, 'total' => 19200]), false);

echo "PASS: {$checks} sale-price policy checks.\n";
