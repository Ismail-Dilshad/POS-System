<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing categories
        DB::table('categories')->truncate();

        // Get the CSV file path
        $csvPath = database_path('seeders/data/categories.csv');

        if (!File::exists($csvPath)) {
            $this->command->error('Categories CSV file not found at: ' . $csvPath);
            return;
        }

        // Read CSV file
        $csvData = array_map(function($line) {
            return str_getcsv($line, ',', '"', '\\');
        }, file($csvPath));
        
        // Remove header row
        $header = array_shift($csvData);
        
        $this->command->info('Importing categories from CSV...');
        
        $importedCount = 0;
        $skippedCount = 0;

        foreach ($csvData as $row) {
            // Skip empty rows
            if (empty($row) || !isset($row[0]) || empty(trim($row[0] ?? ''))) {
                continue;
            }

            $categoryName = trim($row[0] ?? '');

            // Skip if category name is empty
            if (empty($categoryName)) {
                $skippedCount++;
                continue;
            }

            try {
                // Create category (will handle duplicates due to unique constraint)
                Category::firstOrCreate(
                    ['name' => $categoryName],
                    ['name' => $categoryName]
                );
                $importedCount++;
            } catch (\Exception $e) {
                $this->command->warn("Failed to import category '{$categoryName}': " . $e->getMessage());
                $skippedCount++;
            }
        }

        $this->command->info("Categories import completed:");
        $this->command->info("- Imported: {$importedCount} categories");
        $this->command->info("- Skipped: {$skippedCount} categories");
    }
}
