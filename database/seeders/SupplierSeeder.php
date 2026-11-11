<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing suppliers
        DB::table('suppliers')->truncate();

        // Get the CSV file path
        $csvPath = database_path('seeders/data/suppliers.csv');

        if (!File::exists($csvPath)) {
            $this->command->error('Suppliers CSV file not found at: ' . $csvPath);
            return;
        }

        // Read CSV file
        $csvData = array_map(function($line) {
            return str_getcsv($line, ',', '"', '\\');
        }, file($csvPath));
        
        // Remove header row
        $header = array_shift($csvData);
        
        $this->command->info('Importing suppliers from CSV...');
        
        $importedCount = 0;
        $skippedCount = 0;

        foreach ($csvData as $row) {
            // Skip empty rows
            if (empty($row) || !isset($row[0]) || empty(trim($row[0] ?? ''))) {
                continue;
            }

            $supplierName = trim($row[0] ?? '');
            $supplierCode = isset($row[1]) ? trim($row[1] ?? '') : '';

            // Skip if supplier name is empty
            if (empty($supplierName)) {
                $skippedCount++;
                continue;
            }

            try {
                // Create supplier with only the fields that exist in our simplified table
                $supplierData = [
                    'name' => $supplierName,
                    'phone' => null,
                    'email' => null,
                ];

                // If code is provided in CSV, use it; otherwise let the model auto-generate
                if (!empty($supplierCode)) {
                    $supplierData['supplier_code'] = $supplierCode;
                }

                // Create supplier (will handle duplicates due to unique constraint)
                Supplier::firstOrCreate(
                    ['name' => $supplierName],
                    $supplierData
                );
                $importedCount++;
            } catch (\Exception $e) {
                $this->command->warn("Failed to import supplier '{$supplierName}': " . $e->getMessage());
                $skippedCount++;
            }
        }

        $this->command->info("Suppliers import completed:");
        $this->command->info("- Imported: {$importedCount} suppliers");
        $this->command->info("- Skipped: {$skippedCount} suppliers");
    }
}
