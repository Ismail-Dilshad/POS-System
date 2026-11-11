<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration creates the complete database schema for the market system
     * including users, authentication, cache, jobs, sessions tables, and performance indexes.
     */
    public function up(): void
    {
        // Users table with authentication support
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('full_name');
            $table->string('username')->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'cashier', 'dataentry'])->default('dataentry');
            $table->boolean('is_active')->default(true);
            $table->string('phone')->nullable();
            $table->rememberToken();
            $table->timestamps();

            // Performance indices for reports
            $table->index('full_name', 'idx_users_full_name');
            $table->index('role', 'idx_users_role');
        });

        // Categories table
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();

            // Performance indices for reports
            $table->index('name', 'idx_categories_name');
            
            // High-performance indexes for optimized queries
            $table->index(['name'], 'idx_categories_search');
        });

        // Suppliers table
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('supplier_code')->unique();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            
            // Business info
            $table->string('business_name')->nullable();
            $table->string('business_address')->nullable();
            $table->string('business_phone')->nullable();
            $table->string('business_email')->nullable();
            
            // Billing contact info
            $table->string('billing_contact_name')->nullable();
            $table->string('billing_contact_phone')->nullable();
            $table->string('billing_contact_email')->nullable();
            $table->string('biller_position')->nullable();
            
            $table->decimal('total_debt', 15, 2)->default(0);
            $table->timestamps();

            // Performance indices for reports
            $table->index('name', 'idx_suppliers_name');
            
            // High-performance indexes for optimized queries
            $table->index(['name'], 'idx_suppliers_search');
        });

        // Products table - FIXED VERSION
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->string('barcode_type');
            $table->string('barcode'); // Removed unique constraint to allow duplicate barcodes
            $table->string('secondary_barcode')->nullable(); // Removed unique constraint to allow duplicate secondary barcodes
            $table->decimal('cost_price', 10, 2);
            $table->decimal('sell_price', 10, 2);
            $table->integer('stock');
            $table->integer('min_stock')->default(5);
            $table->integer('per_carton')->nullable(); // Number of items per carton/box
            $table->decimal('carton_price', 12, 2)->nullable(); // Price per carton
            $table->boolean('show_in_pos')->default(false);
            $table->date('expire_date')->nullable();
            $table->timestamp('last_sold_at')->nullable()->default('2025-01-01 00:00:00');
            $table->timestamps();

            // Indexes for performance
            $table->index(['category_id', 'supplier_id']);
            $table->index('barcode');
            $table->index('stock');
            $table->index('expire_date');
            $table->index('last_sold_at');
            
            // POS Performance Indexes
            $table->index(['barcode', 'stock'], 'idx_products_barcode_stock');
            $table->index(['name', 'stock'], 'idx_products_name_stock');
            $table->index('secondary_barcode', 'idx_products_secondary_barcode');

        // Additional performance indices for reports
        $table->index('name', 'idx_products_name');
        $table->index(['category_id', 'supplier_id'], 'idx_products_cat_supplier');
        
        // High-performance indexes for optimized queries
        $table->index(['name', 'barcode'], 'idx_products_search');
        $table->index(['stock', 'min_stock'], 'idx_products_stock_status');
        $table->index(['show_in_pos'], 'idx_products_pos');
        });

        // Add check constraints for products table
        DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_cost_price_positive CHECK (cost_price >= 0)');
        DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_sell_price_positive CHECK (sell_price >= 0)');
        DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0)');
        DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_min_stock_positive CHECK (min_stock >= 0)');
        DB::statement('ALTER TABLE products ADD CONSTRAINT chk_products_per_carton_positive CHECK (per_carton IS NULL OR per_carton > 0)');

        // Calculate carton_price for products that have per_carton set
        // This will be calculated as per_carton * sell_price for products where carton_price is null
        DB::table('products')
            ->whereNull('carton_price')
            ->whereNotNull('per_carton')
            ->where('per_carton', '>', 0)
            ->whereNotNull('sell_price')
            ->update([
                'carton_price' => DB::raw('per_carton * sell_price'),
            ]);

        // Scale Products table - SIMPLIFIED VERSION
        Schema::create('scale_products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->string('scale_id'); // Removed unique constraint
            $table->string('plu')->unique();
            $table->decimal('cost_price', 10, 2);
            $table->decimal('sell_price', 10, 2);
            $table->decimal('stock', 10, 2);
            $table->decimal('min_stock', 10, 2)->default(5.00);
            $table->timestamps();

            // Indexes for performance
            $table->index(['category_id', 'supplier_id']);
            $table->index('scale_id');
            $table->index('plu');
            $table->index('stock');

            // POS Performance Indexes
            $table->index(['plu', 'stock'], 'idx_scale_products_plu_stock');
            $table->index(['name', 'stock'], 'idx_scale_products_name_stock');
            $table->index(['scale_id', 'stock'], 'idx_scale_products_scale_id_stock');
            
            // High-performance indexes for optimized queries
            $table->index(['name', 'plu'], 'idx_scale_products_search');
            $table->index(['stock', 'min_stock'], 'idx_scale_products_stock_status');
        });

        // Add check constraints for scale_products table
        DB::statement('ALTER TABLE scale_products ADD CONSTRAINT chk_scale_products_cost_price_positive CHECK (cost_price >= 0)');
        DB::statement('ALTER TABLE scale_products ADD CONSTRAINT chk_scale_products_sell_price_positive CHECK (sell_price >= 0)');
        DB::statement('ALTER TABLE scale_products ADD CONSTRAINT chk_scale_products_stock_non_negative CHECK (stock >= 0)');
        DB::statement('ALTER TABLE scale_products ADD CONSTRAINT chk_scale_products_min_stock_positive CHECK (min_stock >= 0)');

        // Name Cards table
        Schema::create('name_cards', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('image_path')->nullable();
            $table->string('image_original_name')->nullable();
            $table->integer('image_size')->nullable();
            $table->string('image_mime_type')->nullable();
            $table->timestamps();

            // Performance indices for reports
            $table->index('name', 'idx_name_cards_name');
        });

        // Cards table (for gift cards, membership cards, etc.)
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('name_card_id')->constrained('name_cards')->onDelete('cascade');
            $table->decimal('cost_price', 10, 2);
            $table->decimal('sell_price', 10, 2);
            $table->decimal('profit_margin', 5, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Performance indices for reports
            $table->index('name_card_id', 'idx_cards_name_card_id');
            $table->index('is_active', 'idx_cards_is_active');
            
            // High-performance indexes for optimized queries
            $table->index(['is_active'], 'idx_cards_active');
        });

        // Add check constraints for cards table
        DB::statement('ALTER TABLE cards ADD CONSTRAINT chk_cards_cost_price_positive CHECK (cost_price >= 0)');
        DB::statement('ALTER TABLE cards ADD CONSTRAINT chk_cards_sell_price_positive CHECK (sell_price >= 0)');
        DB::statement('ALTER TABLE cards ADD CONSTRAINT chk_cards_profit_margin_non_negative CHECK (profit_margin >= 0)');

        // Transactions table
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('total_amount', 15, 2);
            $table->decimal('amount_paid', 15, 2);
            $table->decimal('change_due', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->integer('items_count')->default(0);
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Performance indices for reports
            $table->index('transaction_number', 'idx_transactions_number');
            $table->index('user_id', 'idx_transactions_user_id');
            $table->index('status', 'idx_transactions_status');
            $table->index('created_at', 'idx_transactions_created_at');
            $table->index(['user_id', 'created_at'], 'idx_transactions_user_date');
            $table->index(['status', 'created_at'], 'idx_transactions_status_created_at');
        });

        // Add check constraints for transactions table
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT chk_transactions_total_amount_positive CHECK (total_amount >= 0)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT chk_transactions_amount_paid_positive CHECK (amount_paid >= 0)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT chk_transactions_change_due_non_negative CHECK (change_due >= 0)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT chk_transactions_discount_non_negative CHECK (discount >= 0)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT chk_transactions_items_count_non_negative CHECK (items_count >= 0)');

        // Transaction Items table
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('card_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('scale_product_id')->nullable()->constrained()->onDelete('set null');
            $table->string('barcode');
            $table->string('name');
            $table->decimal('price', 10, 2);
            $table->decimal('cost_price', 10, 2)->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('weight', 10, 3)->default(0);
            $table->decimal('total', 10, 2);
            $table->boolean('is_scale_product')->default(false);
            $table->string('category')->nullable();
            $table->string('supplier')->nullable();
            $table->timestamps();

            // Performance indices for reports
            $table->index('transaction_id', 'idx_transaction_items_transaction_id');
            $table->index('product_id', 'idx_transaction_items_product_id');
            $table->index('card_id', 'idx_transaction_items_card_id');
            $table->index('scale_product_id', 'idx_transaction_items_scale_product_id');
            $table->index('barcode', 'idx_transaction_items_barcode');
            $table->index('is_scale_product', 'idx_transaction_items_is_scale_product');
            $table->index('category', 'idx_transaction_items_category');
            $table->index('created_at', 'idx_transaction_items_created_at');
        });

        // Add check constraints for transaction_items table
        DB::statement('ALTER TABLE transaction_items ADD CONSTRAINT chk_transaction_items_price_positive CHECK (price >= 0)');
        DB::statement('ALTER TABLE transaction_items ADD CONSTRAINT chk_transaction_items_cost_price_positive CHECK (cost_price IS NULL OR cost_price >= 0)');
        DB::statement('ALTER TABLE transaction_items ADD CONSTRAINT chk_transaction_items_quantity_positive CHECK (quantity > 0)');
        DB::statement('ALTER TABLE transaction_items ADD CONSTRAINT chk_transaction_items_weight_non_negative CHECK (weight >= 0)');
        DB::statement('ALTER TABLE transaction_items ADD CONSTRAINT chk_transaction_items_total_positive CHECK (total >= 0)');

        // Purchases table
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_name');
            $table->string('invoice_id')->unique();
            $table->integer('total_orders')->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('status', ['order', 'receive'])->default('order');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Performance indices for reports
            $table->index('invoice_id', 'idx_purchases_invoice_id');
            $table->index('status', 'idx_purchases_status');
            $table->index('created_at', 'idx_purchases_created_at');
            $table->index(['status', 'created_at'], 'idx_purchases_status_created_at');
        });

        // Add check constraints for purchases table
        DB::statement('ALTER TABLE purchases ADD CONSTRAINT chk_purchases_total_orders_non_negative CHECK (total_orders >= 0)');
        DB::statement('ALTER TABLE purchases ADD CONSTRAINT chk_purchases_total_amount_non_negative CHECK (total_amount >= 0)');

        // Purchase Items table
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->enum('product_type', ['product', 'scale_product']);
            $table->string('product_name');
            $table->string('identifier');
            $table->decimal('cost_price', 10, 2);
            $table->decimal('sell_price', 10, 2);
            $table->decimal('quantity', 10, 3);
            $table->decimal('total_cost', 10, 2);
            $table->decimal('profit_margin', 5, 2)->default(0);
            $table->foreignId('supplier_id')->nullable()->constrained()->onDelete('set null');
            $table->string('supplier_name')->nullable();
            $table->timestamps();

            // Performance indices for reports
            $table->index('purchase_id', 'idx_purchase_items_purchase_id');
            $table->index('product_id', 'idx_purchase_items_product_id');
            $table->index('product_type', 'idx_purchase_items_product_type');
            $table->index('supplier_id', 'idx_purchase_items_supplier_id');
        });

        // Add check constraints for purchase_items table
        DB::statement('ALTER TABLE purchase_items ADD CONSTRAINT chk_purchase_items_cost_price_positive CHECK (cost_price >= 0)');
        DB::statement('ALTER TABLE purchase_items ADD CONSTRAINT chk_purchase_items_sell_price_positive CHECK (sell_price >= 0)');
        DB::statement('ALTER TABLE purchase_items ADD CONSTRAINT chk_purchase_items_quantity_positive CHECK (quantity > 0)');
        DB::statement('ALTER TABLE purchase_items ADD CONSTRAINT chk_purchase_items_total_cost_positive CHECK (total_cost >= 0)');
        DB::statement('ALTER TABLE purchase_items ADD CONSTRAINT chk_purchase_items_profit_margin_non_negative CHECK (profit_margin >= 0)');

        // Supplier Payments table
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained()->onDelete('cascade');
            $table->foreignId('supplier_id')->nullable()->constrained()->onDelete('set null');
            $table->string('supplier_name');
            $table->decimal('total_amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2);
            $table->enum('payment_status', ['debt', 'partial', 'paid'])->default('debt');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Performance indices for reports
            $table->index('purchase_id', 'idx_supplier_payments_purchase_id');
            $table->index('supplier_id', 'idx_supplier_payments_supplier_id');
            $table->index('payment_status', 'idx_supplier_payments_status');
            $table->index('created_at', 'idx_supplier_payments_created_at');
            $table->index(['supplier_id', 'created_at'], 'idx_supplier_payments_supplier_created_at');
        });

        // Add check constraints for supplier_payments table
        DB::statement('ALTER TABLE supplier_payments ADD CONSTRAINT chk_supplier_payments_total_amount_positive CHECK (total_amount >= 0)');
        DB::statement('ALTER TABLE supplier_payments ADD CONSTRAINT chk_supplier_payments_paid_amount_non_negative CHECK (paid_amount >= 0)');
        DB::statement('ALTER TABLE supplier_payments ADD CONSTRAINT chk_supplier_payments_remaining_amount_non_negative CHECK (remaining_amount >= 0)');

        // Supplier Returns table
        Schema::create('supplier_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('original_order_id');
            $table->string('original_order_name');
            $table->text('return_reason');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->integer('items_count')->default(0);
            $table->timestamps();

            // Performance indices for reports
            $table->index('purchase_id', 'idx_supplier_returns_purchase_id');
            $table->index('user_id', 'idx_supplier_returns_user_id');
            $table->index('original_order_id', 'idx_supplier_returns_order_id');
        });

        // Add check constraints for supplier_returns table
        DB::statement('ALTER TABLE supplier_returns ADD CONSTRAINT chk_supplier_returns_total_amount_non_negative CHECK (total_amount >= 0)');
        DB::statement('ALTER TABLE supplier_returns ADD CONSTRAINT chk_supplier_returns_items_count_non_negative CHECK (items_count >= 0)');

        // Supplier Return Items table
        Schema::create('supplier_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_return_id')->constrained()->onDelete('cascade');
            $table->foreignId('purchase_item_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->enum('product_type', ['product', 'scale_product']);
            $table->string('product_name');
            $table->string('identifier');
            $table->decimal('cost_price', 10, 2);
            $table->decimal('sell_price', 10, 2);
            $table->decimal('return_quantity', 10, 3);
            $table->decimal('return_amount', 10, 2);
            $table->timestamps();

            // Performance indices for reports
            $table->index('supplier_return_id', 'idx_supplier_return_items_return_id');
            $table->index('purchase_item_id', 'idx_supplier_return_items_purchase_item_id');
            $table->index('product_id', 'idx_supplier_return_items_product_id');
            $table->index('product_type', 'idx_supplier_return_items_product_type');
        });

        // Add check constraints for supplier_return_items table
        DB::statement('ALTER TABLE supplier_return_items ADD CONSTRAINT chk_supplier_return_items_cost_price_positive CHECK (cost_price >= 0)');
        DB::statement('ALTER TABLE supplier_return_items ADD CONSTRAINT chk_supplier_return_items_sell_price_positive CHECK (sell_price >= 0)');
        DB::statement('ALTER TABLE supplier_return_items ADD CONSTRAINT chk_supplier_return_items_return_quantity_positive CHECK (return_quantity > 0)');
        DB::statement('ALTER TABLE supplier_return_items ADD CONSTRAINT chk_supplier_return_items_return_amount_positive CHECK (return_amount >= 0)');

        // Expenses table - SIMPLIFIED VERSION (only amount and description)
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->decimal('amount', 15, 2);
            $table->string('description');
            $table->timestamps();

            // Performance indices for reports
            $table->index('amount', 'idx_expenses_amount');
            $table->index('created_at', 'idx_expenses_created_at');
        });

        // Add check constraints for expenses table
        DB::statement('ALTER TABLE expenses ADD CONSTRAINT chk_expenses_amount_positive CHECK (amount > 0)');

        // Returns table
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_code')->unique();
            $table->enum('return_type', ['receipt', 'manual']);
            $table->foreignId('original_transaction_id')->nullable()->constrained('transactions')->onDelete('set null');
            $table->string('original_transaction_number')->nullable();
            $table->decimal('total_return_amount', 15, 2);
            $table->foreignId('processed_by_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Performance indices for reports
            $table->index('return_code', 'idx_returns_code');
            $table->index('return_type', 'idx_returns_type');
            $table->index('original_transaction_id', 'idx_returns_original_transaction');
            $table->index('processed_by_user_id', 'idx_returns_processed_by');
            $table->index('created_at', 'idx_returns_created_at');
        });

        // Add check constraints for returns table
        DB::statement('ALTER TABLE returns ADD CONSTRAINT chk_returns_total_return_amount_positive CHECK (total_return_amount > 0)');

        // Return Items table
        Schema::create('return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_id')->constrained('returns')->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('product_name');
            $table->string('product_barcode');
            $table->string('product_category');
            $table->string('product_supplier');
            $table->decimal('original_price', 10, 2);
            $table->integer('quantity');
            $table->decimal('return_total', 10, 2);
            $table->boolean('stock_adjusted')->default(false);
            $table->timestamp('stock_adjusted_at')->nullable();
            $table->foreignId('stock_adjusted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Performance indices for reports
            $table->index('return_id', 'idx_return_items_return_id');
            $table->index('product_id', 'idx_return_items_product_id');
            $table->index('stock_adjusted', 'idx_return_items_stock_adjusted');
        });

        // Add check constraints for return_items table
        DB::statement('ALTER TABLE return_items ADD CONSTRAINT chk_return_items_original_price_positive CHECK (original_price >= 0)');
        DB::statement('ALTER TABLE return_items ADD CONSTRAINT chk_return_items_quantity_positive CHECK (quantity > 0)');
        DB::statement('ALTER TABLE return_items ADD CONSTRAINT chk_return_items_return_total_positive CHECK (return_total >= 0)');

        // Cache table for Laravel
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        // Cache locks table for Laravel
        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // Failed jobs table for Laravel
        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        // Job batches table for Laravel
        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        // Jobs table for Laravel
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        // Sessions table for Laravel
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Personal Access Tokens table for Laravel Sanctum
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        // ========================================
        // ADVANCED PERFORMANCE INDEXES FOR SCALABILITY
        // Optimized for handling millions of transactions
        // ========================================

        // Add advanced composite indexes for transaction_items (most critical for reports)
        Schema::table('transaction_items', function (Blueprint $table) {
            // Optimize JOIN queries with transactions table for profit calculations
            $table->index(['transaction_id', 'created_at'], 'idx_ti_transaction_created');

            // Optimize product profit calculations with cost/price lookups
            $table->index(['product_id', 'price', 'cost_price'], 'idx_ti_product_price');

            // Optimize scale product profit calculations
            $table->index(['scale_product_id', 'price'], 'idx_ti_scale_price');

            // Optimize category-based reports and aggregations
            $table->index(['category', 'total'], 'idx_ti_category_total');
        });

        // Add advanced indexes for transactions table (dashboard queries)
        Schema::table('transactions', function (Blueprint $table) {
            // Optimize user-based transaction queries with status filter
            $table->index(['user_id', 'status', 'created_at'], 'idx_trans_user_status_date');
        });

        // Add functional index for daily sales aggregations (PostgreSQL specific)
        DB::statement('CREATE INDEX IF NOT EXISTS idx_trans_status_date ON transactions (status, DATE(created_at))');

        // Add advanced indexes for expenses table
        Schema::table('expenses', function (Blueprint $table) {
            // Optimize date-range expense queries with amount
            $table->index(['created_at', 'amount'], 'idx_expenses_date_amt');
        });

        // Add advanced indexes for purchases table
        Schema::table('purchases', function (Blueprint $table) {
            // Optimize purchase queries with status and date filtering
            $table->index(['status', 'created_at', 'total_amount'], 'idx_purchases_status_date_amt');
        });

        // Add advanced search indexes for products table
        Schema::table('products', function (Blueprint $table) {
            // Optimize product search with category filter
            $table->index(['category_id', 'name'], 'idx_prod_category_name');

            // Optimize low stock queries for inventory alerts
            $table->index(['stock', 'min_stock', 'show_in_pos'], 'idx_prod_low_stock');
        });

        // Add advanced indexes for scale_products table
        Schema::table('scale_products', function (Blueprint $table) {
            // Optimize scale product search with category
            $table->index(['category_id', 'name'], 'idx_scale_category_name');
        });

        // ========================================
        // TRIGRAM INDEXES FOR FAST LIKE '%search%' QUERIES
        // PostgreSQL pg_trgm extension enables efficient substring matching
        // These indexes allow LIKE '%term%' to use indexes instead of full table scans
        // COALESCE handles NULL values by treating them as empty strings
        // Performance improvement: 10-100x faster searches on large tables
        // ========================================

        // Enable pg_trgm extension for trigram-based text search
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        // Products table - GIN trigram indexes for name and barcode search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (COALESCE(name, \'\') gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_products_barcode_trgm ON products USING GIN (COALESCE(barcode, \'\') gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_products_secondary_barcode_trgm ON products USING GIN (COALESCE(secondary_barcode, \'\') gin_trgm_ops)');

        // Scale products table - GIN trigram indexes for name, plu, and scale_id search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_scale_products_name_trgm ON scale_products USING GIN (COALESCE(name, \'\') gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_scale_products_plu_trgm ON scale_products USING GIN (COALESCE(plu, \'\') gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_scale_products_scale_id_trgm ON scale_products USING GIN (COALESCE(scale_id, \'\') gin_trgm_ops)');

        // Users table - GIN trigram index for full_name search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm ON users USING GIN (COALESCE(full_name, \'\') gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING GIN (COALESCE(username, \'\') gin_trgm_ops)');

        // Transactions table - GIN trigram index for transaction_number search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_transactions_number_trgm ON transactions USING GIN (COALESCE(transaction_number, \'\') gin_trgm_ops)');

        // Transaction items table - GIN trigram indexes for name and barcode search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_transaction_items_name_trgm ON transaction_items USING GIN (COALESCE(name, \'\') gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_transaction_items_barcode_trgm ON transaction_items USING GIN (COALESCE(barcode, \'\') gin_trgm_ops)');

        // Returns table - GIN trigram index for return_code search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_returns_code_trgm ON returns USING GIN (COALESCE(return_code, \'\') gin_trgm_ops)');

        // Name cards table - GIN trigram index for name search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_name_cards_name_trgm ON name_cards USING GIN (COALESCE(name, \'\') gin_trgm_ops)');

        // Suppliers table - GIN trigram index for name search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm ON suppliers USING GIN (COALESCE(name, \'\') gin_trgm_ops)');

        // Categories table - GIN trigram index for name search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_categories_name_trgm ON categories USING GIN (COALESCE(name, \'\') gin_trgm_ops)');

        // Expenses table - GIN trigram index for description search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_expenses_description_trgm ON expenses USING GIN (COALESCE(description, \'\') gin_trgm_ops)');

        // Purchases table - GIN trigram indexes for invoice search
        DB::statement('CREATE INDEX IF NOT EXISTS idx_purchases_invoice_name_trgm ON purchases USING GIN (COALESCE(invoice_name, \'\') gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_purchases_invoice_id_trgm ON purchases USING GIN (COALESCE(invoice_id, \'\') gin_trgm_ops)');

        // ========================================
        // END OF TRIGRAM INDEXES
        // ========================================

        // ========================================
        // END OF PERFORMANCE INDEXES
        // ========================================

        // Create the default administrator without preset staff accounts.
        (new \Database\Seeders\DefaultUserSeeder)->run();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop check constraints first (in reverse order)
        DB::statement('ALTER TABLE return_items DROP CONSTRAINT IF EXISTS chk_return_items_return_total_positive');
        DB::statement('ALTER TABLE return_items DROP CONSTRAINT IF EXISTS chk_return_items_quantity_positive');
        DB::statement('ALTER TABLE return_items DROP CONSTRAINT IF EXISTS chk_return_items_original_price_positive');
        DB::statement('ALTER TABLE returns DROP CONSTRAINT IF EXISTS chk_returns_total_return_amount_positive');
        DB::statement('ALTER TABLE expenses DROP CONSTRAINT IF EXISTS chk_expenses_amount_positive');
        DB::statement('ALTER TABLE supplier_return_items DROP CONSTRAINT IF EXISTS chk_supplier_return_items_return_amount_positive');
        DB::statement('ALTER TABLE supplier_return_items DROP CONSTRAINT IF EXISTS chk_supplier_return_items_return_quantity_positive');
        DB::statement('ALTER TABLE supplier_return_items DROP CONSTRAINT IF EXISTS chk_supplier_return_items_sell_price_positive');
        DB::statement('ALTER TABLE supplier_return_items DROP CONSTRAINT IF EXISTS chk_supplier_return_items_cost_price_positive');
        DB::statement('ALTER TABLE supplier_returns DROP CONSTRAINT IF EXISTS chk_supplier_returns_items_count_non_negative');
        DB::statement('ALTER TABLE supplier_returns DROP CONSTRAINT IF EXISTS chk_supplier_returns_total_amount_non_negative');
        DB::statement('ALTER TABLE supplier_payments DROP CONSTRAINT IF EXISTS chk_supplier_payments_remaining_amount_non_negative');
        DB::statement('ALTER TABLE supplier_payments DROP CONSTRAINT IF EXISTS chk_supplier_payments_paid_amount_non_negative');
        DB::statement('ALTER TABLE supplier_payments DROP CONSTRAINT IF EXISTS chk_supplier_payments_total_amount_positive');
        DB::statement('ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS chk_purchase_items_profit_margin_non_negative');
        DB::statement('ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS chk_purchase_items_total_cost_positive');
        DB::statement('ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS chk_purchase_items_quantity_positive');
        DB::statement('ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS chk_purchase_items_sell_price_positive');
        DB::statement('ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS chk_purchase_items_cost_price_positive');
        DB::statement('ALTER TABLE purchases DROP CONSTRAINT IF EXISTS chk_purchases_total_amount_non_negative');
        DB::statement('ALTER TABLE purchases DROP CONSTRAINT IF EXISTS chk_purchases_total_orders_non_negative');
        DB::statement('ALTER TABLE transaction_items DROP CONSTRAINT IF EXISTS chk_transaction_items_total_positive');
        DB::statement('ALTER TABLE transaction_items DROP CONSTRAINT IF EXISTS chk_transaction_items_weight_non_negative');
        DB::statement('ALTER TABLE transaction_items DROP CONSTRAINT IF EXISTS chk_transaction_items_quantity_positive');
        DB::statement('ALTER TABLE transaction_items DROP CONSTRAINT IF EXISTS chk_transaction_items_cost_price_positive');
        DB::statement('ALTER TABLE transaction_items DROP CONSTRAINT IF EXISTS chk_transaction_items_price_positive');
        DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_items_count_non_negative');
        DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_discount_non_negative');
        DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_change_due_non_negative');
        DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_amount_paid_positive');
        DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_total_amount_positive');
        DB::statement('ALTER TABLE cards DROP CONSTRAINT IF EXISTS chk_cards_profit_margin_non_negative');
        DB::statement('ALTER TABLE cards DROP CONSTRAINT IF EXISTS chk_cards_sell_price_positive');
        DB::statement('ALTER TABLE cards DROP CONSTRAINT IF EXISTS chk_cards_cost_price_positive');
        DB::statement('ALTER TABLE scale_products DROP CONSTRAINT IF EXISTS chk_scale_products_min_stock_positive');
        DB::statement('ALTER TABLE scale_products DROP CONSTRAINT IF EXISTS chk_scale_products_stock_non_negative');
        DB::statement('ALTER TABLE scale_products DROP CONSTRAINT IF EXISTS chk_scale_products_sell_price_positive');
        DB::statement('ALTER TABLE scale_products DROP CONSTRAINT IF EXISTS chk_scale_products_cost_price_positive');
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_per_carton_positive');
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_min_stock_positive');
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_stock_non_negative');
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_sell_price_positive');
        DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_products_cost_price_positive');

        // Drop trigram indexes first (in reverse order of creation)
        DB::statement('DROP INDEX IF EXISTS idx_purchases_invoice_id_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_purchases_invoice_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_expenses_description_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_categories_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_suppliers_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_name_cards_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_returns_code_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_transaction_items_barcode_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_transaction_items_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_transactions_number_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_users_username_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_users_full_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_scale_products_scale_id_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_scale_products_plu_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_scale_products_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_products_secondary_barcode_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_products_barcode_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_products_name_trgm');
        // Note: We don't drop the pg_trgm extension as it might be used by other databases

        // Drop advanced performance indexes (in reverse order)
        DB::statement('DROP INDEX IF EXISTS idx_trans_status_date');

        Schema::table('scale_products', function (Blueprint $table) {
            $table->dropIndex('idx_scale_category_name');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_prod_category_name');
            $table->dropIndex('idx_prod_low_stock');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('idx_purchases_status_date_amt');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex('idx_expenses_date_amt');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex('idx_trans_user_status_date');
        });

        Schema::table('transaction_items', function (Blueprint $table) {
            $table->dropIndex('idx_ti_transaction_created');
            $table->dropIndex('idx_ti_product_price');
            $table->dropIndex('idx_ti_scale_price');
            $table->dropIndex('idx_ti_category_total');
        });

        // Drop all tables
        Schema::dropIfExists('return_items');
        Schema::dropIfExists('returns');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('supplier_return_items');
        Schema::dropIfExists('supplier_returns');
        Schema::dropIfExists('supplier_payments');
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
        Schema::dropIfExists('transaction_items');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('cards');
        Schema::dropIfExists('name_cards');
        Schema::dropIfExists('scale_products');
        Schema::dropIfExists('products');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('users');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('jobs');
        Schema::dropIfExists('job_batches');
        Schema::dropIfExists('failed_jobs');
        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
    }
};