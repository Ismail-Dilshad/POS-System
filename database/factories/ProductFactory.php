<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Get random category and supplier
        $category = Category::inRandomOrder()->first();
        $supplier = Supplier::inRandomOrder()->first();

        // Generate realistic product names based on category
        $productName = $this->generateUniqueProductName($category->name ?? 'عام');
        
        // Generate realistic pricing in Iraqi Dinar
        $costPrice = $this->generateCostPrice($category->name ?? 'عام');
        $markup = $this->faker->randomFloat(2, 1.2, 2.5); // 20-150% markup
        $sellPrice = round($costPrice * $markup); // Round to whole Iraqi Dinar
        
        // Generate stock levels
        $stock = $this->faker->numberBetween(0, 100);
        $minStock = $this->faker->numberBetween(1, 10);
        
        // Generate barcode
        $barcode = $this->generateBarcode();
        
        // Generate secondary barcode (optional)
        $secondaryBarcode = $this->faker->optional(0.3)->passthrough($this->generateUniqueSecondaryBarcode());
        
        // Generate expire date (optional, 30% chance)
        $expireDate = $this->faker->optional(0.3)->dateTimeBetween('now', '+2 years');
        
        return [
            'name' => $productName,
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'barcode_type' => $this->faker->randomElement(['ean13', 'upc', 'code128', 'code39', 'ean8']),
            'barcode' => $barcode,
            'secondary_barcode' => $secondaryBarcode,
            'cost_price' => $costPrice,
            'sell_price' => $sellPrice,
            'stock' => $stock,
            'min_stock' => $minStock,
            'show_in_pos' => $this->faker->boolean(85), // 85% chance to show in POS
            'expire_date' => $expireDate,
        ];
    }

    /**
     * Generate unique product names based on category
     */
    private function generateUniqueProductName(string $category): string
    {
        $baseName = $this->generateProductName($category);
        $uniqueName = $baseName;
        $counter = 1;
        
        // Add timestamp and random number to ensure uniqueness
        $timestamp = substr(microtime(true), -6); // Last 6 digits of microtime
        $random = $this->faker->numberBetween(100, 999);
        $uniqueName = $baseName . ' ' . $timestamp . $random;
        
        // Double-check uniqueness by checking database
        while (\App\Models\Product::where('name', $uniqueName)->exists()) {
            $uniqueName = $baseName . ' ' . $timestamp . $random . '-' . $counter;
            $counter++;
        }
        
        return $uniqueName;
    }

    /**
     * Generate realistic product names based on category
     */
    private function generateProductName(string $category): string
    {
        $categoryProducts = [
            'ئاو' => ['ئاوی سلیمانی', 'ئاوی زمزم', 'ئاوی نێستلە', 'ئاوی کۆکا کۆلا', 'ئاوی سپرایت'],
            'ئایس کرێم' => ['ئایس کرێمی ڤانیلا', 'ئایس کرێمی چۆکلێت', 'ئایس کرێمی سترۆبێری', 'ئایس کرێمی مینت'],
            'چا' => ['چای سەرخ', 'چای سەوز', 'چای ئێرل گری', 'چای لیپتۆن', 'چای تێتلی'],
            'چپس' => ['چپسی پۆتەیتۆ', 'چپسی کۆرن', 'چپسی تۆرتیلا', 'چپسی پفک'],
            'چەرەزات' => ['کۆرن فلیکس', 'ویتابیکس', 'چۆکۆ پاپس', 'کریسپی رایس'],
            'چوکلێت' => ['چۆکلێتی کادبوری', 'چۆکلێتی کیت کات', 'چۆکلێتی مارس', 'چۆکلێتی سنیکەرز'],
            'شەربەت' => ['شەربەتی پرانج', 'شەربەتی ئەپڵ', 'شەربەتی گریپ', 'شەربەتی لیمۆ'],
            'شەکرۆکە' => ['شەکری سپی', 'شەکری قاوەیی', 'شەکری بڕاون', 'شەکری پاوەدەر'],
            'شیر و قاوە' => ['شیری تازە', 'شیری یو اچ تی', 'قاوەیەکی ئەسپریسۆ', 'قاوەیەکی لاتێ'],
            'کێک' => ['کێکی چۆکلێت', 'کێکی ڤانیلا', 'کێکی سترۆبێری', 'کێکی کارۆت'],
            'خواردنەوەی گازی' => ['کۆکا کۆلا', 'سپرایت', 'فانتا', 'پێپسی'],
            'نان' => ['نانی سپی', 'نانی قاوەیی', 'نانی سەوز', 'نانی تۆست'],
            'شیرینی' => ['شیرینی کوردی', 'شیرینی عەرەبی', 'شیرینی فەڕەنسی', 'شیرینی ئیتاڵی'],
            'پاتری' => ['پاتری AA', 'پاتری AAA', 'پاتری 9V', 'پاتری C'],
            'منظفات' => ['دێتەرجەنت', 'سۆپ', 'کلینەر', 'دیش واشەر'],
            'مواد غذائيه' => ['برنج', 'پاستا', 'لۆبیا', 'نۆخود'],
            'مواد منزليه' => ['کاغەز', 'پلاستیک', 'کۆنتەینەر', 'بۆکس'],
            'مۆبایل' => ['کەیبڵی چارجەر', 'هێدفۆن', 'کەیس', 'سکرین پڕۆتێکتەر'],
        ];

        $products = $categoryProducts[$category] ?? ['بەرهەمی گشتی'];
        
        // Ensure products array is not empty
        if (empty($products)) {
            $products = ['بەرهەمی گشتی'];
        }
        
        $baseProduct = $this->faker->randomElement($products);
        $package = $this->faker->randomElement(['پاکەت', 'قوتو', 'بۆکس', 'کان', 'دۆزە', 'قوتوچکە']);
        $size = $this->faker->randomElement(['بچووک', 'گەورە', 'ناوەند', 'تایبەت', 'پرێمیۆم']);
        $flavor = $this->faker->randomElement(['سوور', 'سەوز', 'زەرد', 'سپی', 'قاوەیی', 'شین']);
        
        // Randomly combine elements to create variety
        $nameParts = [$baseProduct];
        
        if ($this->faker->boolean(60)) { // 60% chance to add package type
            $nameParts[] = $package;
        }
        
        if ($this->faker->boolean(40)) { // 40% chance to add size
            $nameParts[] = $size;
        }
        
        if ($this->faker->boolean(30)) { // 30% chance to add flavor/color
            $nameParts[] = $flavor;
        }
        
        return implode(' ', $nameParts);
    }

    /**
     * Generate realistic cost prices in Iraqi Dinar based on category
     */
    private function generateCostPrice(string $category): float
    {
        $priceRanges = [
            'ئاو' => [500, 2000],           // Water: 500-2,000 IQD
            'ئایس کرێم' => [1000, 5000],    // Ice cream: 1,000-5,000 IQD
            'چا' => [300, 3000],            // Tea: 300-3,000 IQD
            'چپس' => [500, 3000],           // Chips: 500-3,000 IQD
            'چەرەزات' => [1000, 8000],      // Cereals: 1,000-8,000 IQD
            'چوکلێت' => [500, 4000],        // Chocolate: 500-4,000 IQD
            'شەربەت' => [800, 4000],        // Juice: 800-4,000 IQD
            'شەکرۆکە' => [200, 2000],       // Sugar: 200-2,000 IQD
            'شیر و قاوە' => [1000, 6000],   // Milk and coffee: 1,000-6,000 IQD
            'کێک' => [2000, 15000],         // Cake: 2,000-15,000 IQD
            'خواردنەوەی گازی' => [500, 3000], // Soft drinks: 500-3,000 IQD
            'نان' => [300, 2000],           // Bread: 300-2,000 IQD
            'شیرینی' => [1000, 10000],      // Sweets: 1,000-10,000 IQD
            'پاتری' => [1000, 8000],        // Batteries: 1,000-8,000 IQD
            'منظفات' => [2000, 12000],      // Detergents: 2,000-12,000 IQD
            'مواد غذائيه' => [1000, 8000],   // Food items: 1,000-8,000 IQD
            'مواد منزليه' => [500, 5000],    // Household items: 500-5,000 IQD
            'مۆبایل' => [5000, 50000],      // Mobile accessories: 5,000-50,000 IQD
        ];

        $range = $priceRanges[$category] ?? [500, 5000];
        return $this->faker->numberBetween($range[0], $range[1]);
    }

    /**
     * Generate realistic barcode
     */
    private function generateBarcode(): string
    {
        // Generate unique barcode using microtime and random elements
        $microtime = substr(str_replace('.', '', microtime(true)), 0, 12);
        $random1 = $this->faker->numberBetween(1000, 9999);
        $random2 = $this->faker->numberBetween(100, 999);
        
        $baseBarcode = $microtime . $random1 . $random2;
        
        // Ensure it's unique by checking database
        do {
            $barcode = $baseBarcode . $this->faker->numberBetween(10, 99);
        } while (\App\Models\Product::where('barcode', $barcode)->exists());
        
        return $barcode;
    }

    /**
     * Generate unique secondary barcode
     */
    private function generateUniqueSecondaryBarcode(): string
    {
        // Generate unique secondary barcode using microtime and random elements
        $microtime = substr(str_replace('.', '', microtime(true)), 0, 10);
        $random1 = $this->faker->numberBetween(10000, 99999);
        $random2 = $this->faker->numberBetween(1000, 9999);
        
        $baseBarcode = $microtime . $random1 . $random2;
        
        // Ensure it's unique by checking database
        do {
            $barcode = $baseBarcode . $this->faker->numberBetween(100, 999);
        } while (\App\Models\Product::where('secondary_barcode', $barcode)->exists());
        
        return $barcode;
    }

    /**
     * Indicate that the product is low stock
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => $this->faker->numberBetween(0, 3),
            'min_stock' => $this->faker->numberBetween(5, 10),
        ]);
    }

    /**
     * Indicate that the product is out of stock
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
            'min_stock' => $this->faker->numberBetween(1, 5),
        ]);
    }

    /**
     * Indicate that the product is high value
     */
    public function highValue(): static
    {
        return $this->state(fn (array $attributes) => [
            'cost_price' => $this->faker->numberBetween(10000, 50000), // 10,000-50,000 IQD
            'sell_price' => $this->faker->numberBetween(15000, 75000), // 15,000-75,000 IQD
        ]);
    }

    /**
     * Indicate that the product is expiring soon
     */
    public function expiringSoon(): static
    {
        return $this->state(fn (array $attributes) => [
            'expire_date' => $this->faker->dateTimeBetween('now', '+30 days'),
        ]);
    }
}
