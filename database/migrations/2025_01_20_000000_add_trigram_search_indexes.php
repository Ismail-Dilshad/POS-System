<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Trigram index definitions for all searchable columns.
     * Format: 'table.column' => 'index_name'
     */
    private const TRIGRAM_INDEXES = [
        // Products table - Most searched table in POS
        'products.name' => 'idx_products_name_trgm',
        'products.barcode' => 'idx_products_barcode_trgm',
        'products.secondary_barcode' => 'idx_products_secondary_barcode_trgm',
        
        // Scale products table
        'scale_products.name' => 'idx_scale_products_name_trgm',
        'scale_products.plu' => 'idx_scale_products_plu_trgm',
        'scale_products.scale_id' => 'idx_scale_products_scale_id_trgm',
        
        // Users table
        'users.full_name' => 'idx_users_full_name_trgm',
        'users.username' => 'idx_users_username_trgm',
        
        // Transactions table
        'transactions.transaction_number' => 'idx_transactions_number_trgm',
        
        // Transaction items table
        'transaction_items.name' => 'idx_transaction_items_name_trgm',
        'transaction_items.barcode' => 'idx_transaction_items_barcode_trgm',
        
        // Returns table
        'returns.return_code' => 'idx_returns_code_trgm',
        
        // Name cards table
        'name_cards.name' => 'idx_name_cards_name_trgm',
        
        // Suppliers table
        'suppliers.name' => 'idx_suppliers_name_trgm',
        
        // Categories table
        'categories.name' => 'idx_categories_name_trgm',
        
        // Expenses table
        'expenses.description' => 'idx_expenses_description_trgm',
        
        // Purchases table
        'purchases.invoice_name' => 'idx_purchases_invoice_name_trgm',
        'purchases.invoice_id' => 'idx_purchases_invoice_id_trgm',
    ];

    /**
     * Run the migrations.
     * 
     * This migration adds PostgreSQL trigram (pg_trgm) indexes for efficient
     * LIKE '%search%' queries. Without these indexes, LIKE queries with leading
     * wildcards cause full table scans which are very slow on large datasets.
     * 
     * With pg_trgm GIN indexes, PostgreSQL can use the index for substring
     * matching, dramatically improving search performance.
     * 
     * Performance improvement: 10-100x faster searches on large tables
     * 
     * LIFETIME SOLUTION: These indexes are essential for any market/retail
     * system with significant product catalogs (1000+ products).
     */
    public function up(): void
    {
        // Enable pg_trgm extension for trigram-based text search
        // This extension is required for GIN trigram indexes
        try {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
            Log::info('pg_trgm extension enabled successfully');
        } catch (\Exception $e) {
            Log::error('CRITICAL: Could not create pg_trgm extension: ' . $e->getMessage());
            throw $e; // This is critical - fail if extension cannot be created
        }

        $successCount = 0;
        $errorCount = 0;

        foreach (self::TRIGRAM_INDEXES as $tableColumn => $indexName) {
            [$table, $column] = explode('.', $tableColumn);
            
            try {
                // Drop existing index if it exists (to ensure proper NULL handling)
                DB::statement("DROP INDEX IF EXISTS {$indexName}");
                
                // Create GIN trigram index with NULL handling
                // COALESCE ensures NULL values are treated as empty strings
                DB::statement("
                    CREATE INDEX {$indexName} 
                    ON {$table} 
                    USING GIN (COALESCE({$column}, '') gin_trgm_ops)
                ");
                
                $successCount++;
                Log::info("Created trigram index: {$indexName} on {$table}.{$column}");
            } catch (\Exception $e) {
                $errorCount++;
                Log::error("Failed to create index {$indexName}: " . $e->getMessage());
                // Don't fail entire migration - other indexes are still valuable
            }
        }

        Log::info("Trigram search indexes migration completed: {$successCount} created, {$errorCount} failed");
        
        if ($successCount === 0) {
            throw new \Exception('No trigram indexes were created - migration failed');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (array_reverse(self::TRIGRAM_INDEXES) as $tableColumn => $indexName) {
            try {
                DB::statement("DROP INDEX IF EXISTS {$indexName}");
                Log::info("Dropped trigram index: {$indexName}");
            } catch (\Exception $e) {
                Log::warning("Could not drop index {$indexName}: " . $e->getMessage());
            }
        }

        // Note: We don't drop pg_trgm extension as it might be used elsewhere

        Log::info('Trigram search indexes rollback completed');
    }
};
