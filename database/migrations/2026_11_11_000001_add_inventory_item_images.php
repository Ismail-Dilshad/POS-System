<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['products', 'scale_products'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->string('image_path')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['products', 'scale_products'] as $tableName) {
            Schema::table($tableName, fn (Blueprint $table) => $table->dropColumn('image_path'));
        }
    }
};
