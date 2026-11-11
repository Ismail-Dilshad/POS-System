<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DefaultUserSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $accounts = DB::table('users')
                ->whereIn('username', ['admin', 'Alinetwork'])
                ->lockForUpdate()
                ->get();

            if ($accounts->count() > 1 || $accounts->contains(fn ($user) => $user->role !== 'admin')) {
                throw new RuntimeException('The admin usernames conflict with existing accounts. No users were changed.');
            }

            $admin = $accounts->first();
            $attributes = [
                'full_name' => 'Alinetwork',
                'username' => 'Alinetwork',
                'password' => '$2y$10$BvMqavE.mloYh8S.HBDBBeWkNeMJaXvlgylsoTSmHqQoyOVZKwB/i',
                'role' => 'admin',
                'is_active' => true,
                'remember_token' => null,
                'updated_at' => now(),
            ];

            if ($admin) {
                DB::table('users')->where('id', $admin->id)->update($attributes);
                $adminId = $admin->id;
            } else {
                $adminId = DB::table('users')->insertGetId($attributes + ['created_at' => now()]);
            }

            $presets = [
                ['username' => 'ahmed', 'full_name' => 'Ahmed', 'role' => 'dataentry'],
                ['username' => 'saman', 'full_name' => 'Saman', 'role' => 'cashier'],
                ['username' => 'hawraz', 'full_name' => 'Hawraz', 'role' => 'cashier'],
            ];

            $revokedIds = [$adminId];
            foreach ($presets as $preset) {
                $user = DB::table('users')->where($preset)->lockForUpdate()->first();
                if (! $user) {
                    continue;
                }

                $revokedIds[] = $user->id;
                $hasHistory = DB::table('transactions')->where('user_id', $user->id)->exists()
                    || DB::table('supplier_returns')->where('user_id', $user->id)->exists()
                    || DB::table('returns')->where('processed_by_user_id', $user->id)->exists()
                    || DB::table('return_items')->where('stock_adjusted_by', $user->id)->exists();

                if ($hasHistory) {
                    DB::table('users')->where('id', $user->id)->update([
                        'is_active' => false,
                        'remember_token' => null,
                        'updated_at' => now(),
                    ]);
                    $this->command?->warn("Disabled {$user->username} to preserve transaction history.");
                } else {
                    DB::table('users')->where('id', $user->id)->delete();
                }
            }

            DB::table('sessions')->whereIn('user_id', $revokedIds)->delete();
            DB::table('personal_access_tokens')
                ->where('tokenable_type', \App\Models\User::class)
                ->whereIn('tokenable_id', $revokedIds)
                ->delete();
        });

        $this->command?->info('Admin login updated to Alinetwork. Preset staff accounts removed or disabled.');
    }
}
