<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = User::select('id', 'full_name', 'username', 'role', 'is_active', 'phone', 'created_at', 'updated_at');

            // Filter by search term
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('username', 'like', "%{$search}%");
                });
            }

            // Filter by single role
            if ($request->has('role') && $request->role) {
                $query->where('role', $request->role);
            }

            // Filter by multiple roles (comma-separated)
            if ($request->has('roles') && $request->roles) {
                $roles = explode(',', $request->roles);
                $query->whereIn('role', $roles);
            }

            $users = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'full_name' => 'required|string|max:255',
                'username' => 'required|string|max:255|unique:users,username',
                'password' => 'required|string|min:6',
                'confirmPassword' => 'required|string|same:password',
                'role' => 'required|in:admin,cashier,dataentry',
                'is_active' => 'boolean',
                'phone' => 'nullable|string|max:20'
            ], [
                'full_name.required' => 'Full name is required',
                'username.required' => 'Username is required',
                'username.unique' => 'Username already exists',
                'password.required' => 'Password is required',
                'password.min' => 'Password must be at least 6 characters',
                'confirmPassword.required' => 'Please confirm your password',
                'confirmPassword.same' => 'Passwords do not match',
                'role.required' => 'Role is required',
                'role.in' => 'Invalid role selected'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::create([
                'full_name' => $request->full_name,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'is_active' => $request->boolean('is_active', true),
                'phone' => $request->phone
            ]);

            return response()->json([
                'success' => true,
                'data' => $user->makeHidden(['password']),
                'message' => 'User created successfully'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific user
     */
    public function show(User $user): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $user->makeHidden(['password'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a user
     */
    public function update(Request $request, User $user): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'full_name' => 'required|string|max:255',
                'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
                'password' => 'nullable|string|min:6',
                'confirmPassword' => 'nullable|string|same:password',
                'role' => 'required|in:admin,cashier,dataentry',
                'is_active' => 'boolean',
                'phone' => 'nullable|string|max:20'
            ], [
                'full_name.required' => 'Full name is required',
                'username.required' => 'Username is required',
                'username.unique' => 'Username already exists',
                'password.min' => 'Password must be at least 6 characters',
                'confirmPassword.same' => 'Passwords do not match',
                'role.required' => 'Role is required',
                'role.in' => 'Invalid role selected'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'full_name' => $request->full_name,
                'username' => $request->username,
                'role' => $request->role,
                'is_active' => $request->boolean('is_active', true),
                'phone' => $request->phone
            ];

            // Only update password if provided
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            return response()->json([
                'success' => true,
                'data' => $user->makeHidden(['password']),
                'message' => 'User updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user
     */
    public function destroy(User $user): JsonResponse
    {
        try {
            // Prevent deleting the first admin user
            if ($user->username === 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete the first admin user. This user is required for system access.'
                ], 422);
            }

            // Prevent deleting the last admin
            if ($user->role === 'admin') {
                $adminCount = User::where('role', 'admin')->count();
                if ($adminCount <= 1) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot delete the last admin user'
                    ], 422);
                }
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }
}
