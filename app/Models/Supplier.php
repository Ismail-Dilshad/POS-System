<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'supplier_code',
        'email',

        // Business info
        'business_name',
        'business_address',
        'business_phone',
        'business_email',

        // Biller person info
        'billing_contact_name',
        'billing_contact_phone',
        'billing_contact_email',
        'biller_position',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($supplier) {
            if (empty($supplier->supplier_code)) {
                $supplier->supplier_code = static::generateSupplierCode();
            }
        });
    }

    public static function generateSupplierCode(): string
    {
        do {
            $code = 'SUP' . str_pad(random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (static::where('supplier_code', $code)->exists());

        return $code;
    }

    // Relationships
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function scaleProducts()
    {
        return $this->hasMany(ScaleProduct::class);
    }

    public function supplierPayments()
    {
        return $this->hasMany(SupplierPayment::class);
    }

    // Usage validation methods
    public function isInUse(): bool
    {
        return $this->products()->count() > 0 || $this->scaleProducts()->count() > 0;
    }

    public function getUsageCount(): int
    {
        return $this->products()->count() + $this->scaleProducts()->count();
    }
}