<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BackupController extends Controller
{
    public function createBackup()
    {
        try {
            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $filename = "pos_system_full_backup_{$timestamp}.sql";

            // Create backup directory if it doesn't exist
            $backupPath = storage_path('app/backups');
            if (!file_exists($backupPath)) {
                mkdir($backupPath, 0755, true);
            }

            $filepath = $backupPath . '/' . $filename;

            // Create backup using pg_dump
            $this->createPgDumpBackup($filepath);

            // Verify backup file was created and has content
            if (!file_exists($filepath) || filesize($filepath) === 0) {
                throw new \Exception('Backup file was not created or is empty');
            }

            $filesize = filesize($filepath);

            // Get additional backup info
            $backupInfo = $this->getBackupInfo($filepath);

            return response()->json([
                'success' => true,
                'message' => 'Full database backup created successfully',
                'data' => [
                    'filename' => $filename,
                    'filepath' => $filepath,
                    'filesize' => $filesize,
                    'timestamp' => $timestamp,
                    'tables_count' => $backupInfo['tables_count'],
                    'total_records' => $backupInfo['total_records'],
                    'backup_type' => 'full_sql_dump'
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Backup creation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function createPgDumpBackup($filepath)
    {
        // Get database credentials from config (which reads from .env securely)
        $dbConfig = config('database.connections.pgsql');
        $host = $dbConfig['host'] ?? '127.0.0.1';
        $port = $dbConfig['port'] ?? '5432';
        $database = $dbConfig['database'] ?? 'market';
        $username = $dbConfig['username'] ?? 'postgres';
        $password = $dbConfig['password'] ?? 'Esma4hel3@xade04';

        // Create pg_dump command - full database backup
        $command = sprintf(
            'pg_dump --host=%s --port=%s --username=%s --dbname=%s --no-password --clean --if-exists --format=plain --file=%s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        // Set password environment variable
        putenv("PGPASSWORD=" . $password);

        // Execute backup command
        $output = [];
        $returnCode = 0;
        exec($command . ' 2>&1', $output, $returnCode);

        if ($returnCode !== 0) {
            $errorMessage = implode("\n", $output);
            \Log::error('pg_dump failed: ' . $errorMessage);
            throw new \Exception('Backup failed: ' . $errorMessage);
        }
    }

    public function downloadBackup(Request $request)
    {
        $filename = $request->input('filename');

        if (!$filename) {
            return response()->json([
                'success' => false,
                'message' => 'Filename is required'
            ], 400);
        }

        $filepath = storage_path('app/backups/' . $filename);

        if (!file_exists($filepath)) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file not found'
            ], 404);
        }

        return response()->download($filepath);
    }

    public function listBackups()
    {
        try {
            $backupPath = storage_path('app/backups');

            if (!file_exists($backupPath)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Prioritize SQL files (full backups) over JSON files
            $sqlFiles = glob($backupPath . '/*.sql');
            $jsonFiles = glob($backupPath . '/*.json');
            $files = array_merge($sqlFiles, $jsonFiles);
            
            $backups = [];

            foreach ($files as $file) {
                $filename = basename($file);
                $filesize = filesize($file);
                $created_at = filemtime($file);
                $extension = pathinfo($file, PATHINFO_EXTENSION);
                
                // Get backup info for SQL files
                $backupInfo = [];
                if ($extension === 'sql') {
                    $backupInfo = $this->getBackupInfo($file);
                }

                $backups[] = [
                    'filename' => $filename,
                    'filesize' => $filesize,
                    'filesize_human' => $this->formatBytes($filesize),
                    'created_at' => date('Y-m-d H:i:s', $created_at),
                    'created_at_human' => Carbon::createFromTimestamp($created_at)->diffForHumans(),
                    'type' => $extension === 'sql' ? 'full_sql_dump' : 'json_export',
                    'tables_count' => $backupInfo['tables_count'] ?? null,
                    'total_records' => $backupInfo['total_records'] ?? null,
                    'is_full_backup' => $extension === 'sql'
                ];
            }

            // Sort by creation time (newest first), with SQL files prioritized
            usort($backups, function($a, $b) {
                // First sort by type (SQL files first)
                if ($a['is_full_backup'] && !$b['is_full_backup']) return -1;
                if (!$a['is_full_backup'] && $b['is_full_backup']) return 1;
                
                // Then sort by creation time
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json([
                'success' => true,
                'data' => $backups
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to list backups: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteBackup(Request $request)
    {
        $filename = $request->input('filename') ?: $request->query('filename');

        if (!$filename) {
            return response()->json([
                'success' => false,
                'message' => 'Filename is required'
            ], 400);
        }

        $filepath = storage_path('app/backups/' . $filename);

        if (!file_exists($filepath)) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file not found'
            ], 404);
        }

        if (unlink($filepath)) {
            return response()->json([
                'success' => true,
                'message' => 'Backup deleted successfully'
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete backup file'
            ], 500);
        }
    }

    public function importBackup(Request $request)
    {
        \Log::info('Import backup method called');
        
        try {
            \Log::info('Import backup request received', [
                'has_file' => $request->hasFile('backup_file'),
                'confirm_import' => $request->input('confirm_import'),
                'all_input' => $request->all()
            ]);

            // Check if file exists first
            if (!$request->hasFile('backup_file')) {
                \Log::warning('No file uploaded in request', [
                    'files' => $request->allFiles(),
                    'input' => $request->all(),
                    'php_upload_max_filesize' => ini_get('upload_max_filesize'),
                    'php_post_max_size' => ini_get('post_max_size'),
                    'php_max_file_uploads' => ini_get('max_file_uploads'),
                    'content_length' => $request->header('content-length'),
                    'content_type' => $request->header('content-type')
                ]);
                
                // Check if it's a file size issue
                $contentLength = $request->header('content-length');
                $uploadMaxSize = $this->parseSize(ini_get('upload_max_filesize'));
                $postMaxSize = $this->parseSize(ini_get('post_max_size'));
                
                if ($contentLength && $contentLength > $uploadMaxSize) {
                    return response()->json([
                        'success' => false,
                        'message' => 'File too large. Maximum upload size is ' . ini_get('upload_max_filesize') . '. Your file is ' . $this->formatBytes($contentLength) . '. Please increase PHP upload limits.'
                    ], 422);
                }
                
                if ($contentLength && $contentLength > $postMaxSize) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Request too large. Maximum POST size is ' . ini_get('post_max_size') . '. Your file is ' . $this->formatBytes($contentLength) . '. Please increase PHP POST limits.'
                    ], 422);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'No file uploaded. Please select a SQL backup file.'
                ], 422);
            }

            // Validate file size and type manually
            $file = $request->file('backup_file');
            if (!$file->isValid()) {
                \Log::warning('File upload failed', [
                    'error' => $file->getError(),
                    'filename' => $file->getClientOriginalName()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'File upload failed: ' . $file->getErrorMessage()
                ], 422);
            }

            $maxSize = 500 * 1024 * 1024; // 500MB in bytes
            if ($file->getSize() > $maxSize) {
                return response()->json([
                    'success' => false,
                    'message' => 'File too large. Maximum size is 500MB. Your file is ' . $this->formatBytes($file->getSize()) . '.'
                ], 422);
            }

            // Check file extension
            $extension = $file->getClientOriginalExtension();
            if (strtolower($extension) !== 'sql') {
                return response()->json([
                    'success' => false,
                    'message' => 'File must be a SQL backup file (.sql)'
                ], 422);
            }

            if (!$request->input('confirm_import') || $request->input('confirm_import') !== 'true') {
                return response()->json([
                    'success' => false,
                    'message' => 'Import confirmation is required'
                ], 422);
            }
            
            // Validate file content
            $content = file_get_contents($file->getPathname());
            if (empty($content)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The uploaded file is empty'
                ], 422);
            }

            if (!$this->isValidSqlBackup($content)) {
                \Log::warning('Invalid SQL backup file uploaded', [
                    'filename' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'content_preview' => substr($content, 0, 200)
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid SQL backup file. Please ensure you are uploading a valid database backup file.'
                ], 422);
            }

            // Create temporary file
            $tempPath = storage_path('app/temp_import_' . time() . '.sql');
            file_put_contents($tempPath, $content);

            // Start database transaction
            DB::beginTransaction();

            try {
                // Execute the SQL file
                $this->executeSqlFile($tempPath);
                
                // Ensure all sequences exist and are properly set
                $this->ensureSequencesExist();
                
                DB::commit();

                // Clean up temp file
                unlink($tempPath);

                return response()->json([
                    'success' => true,
                    'message' => 'Database restored successfully from backup'
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                
                // Clean up temp file
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }
                
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Backup import validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed: ' . implode(', ', array_merge(...array_values($e->errors()))),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Backup import failed: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString(),
                'file' => $request->file('backup_file') ? $request->file('backup_file')->getClientOriginalName() : 'No file'
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function isValidSqlBackup($content)
    {
        // Check if it's a valid SQL backup - be more flexible
        $requiredPatterns = [
            '/CREATE TABLE/i',
            '/INSERT INTO/i'
        ];

        // Check for our backup signature first
        $hasSignature = preg_match('/Quantum Market/i', $content);
        if ($hasSignature) {
            return true; // Our backup files are always valid
        }

        // For other SQL files, check if they look like database dumps
        $hasRequiredPatterns = true;
        foreach ($requiredPatterns as $pattern) {
            if (!preg_match($pattern, $content)) {
                $hasRequiredPatterns = false;
                break;
            }
        }

        if ($hasRequiredPatterns) {
            return true;
        }

        // Additional checks for various SQL dump formats
        $additionalChecks = [
            '/DROP TABLE/i',
            '/ALTER TABLE/i',
            '/CREATE INDEX/i',
            '/CREATE SEQUENCE/i',
            '/CREATE TYPE/i',
            '/COPY /i', // PostgreSQL COPY commands
            '/\\\\./i'  // PostgreSQL commands
        ];

        foreach ($additionalChecks as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        // If it's a valid SQL file with some content, allow it
        return strlen(trim($content)) > 100 && preg_match('/[A-Za-z]/', $content);
    }

    private function executeSqlFile($filepath)
    {
        // Execute SQL file using psql (PostgreSQL native tool)
        $this->executeWithPsql($filepath);
    }

    private function executeWithPsql($filepath)
    {
        // Get database credentials from config (which reads from .env securely)
        $dbConfig = config('database.connections.pgsql');
        $host = $dbConfig['host'] ?? '127.0.0.1';
        $port = $dbConfig['port'] ?? '5432';
        $database = $dbConfig['database'] ?? 'market';
        $username = $dbConfig['username'] ?? 'postgres';
        $password = $dbConfig['password'] ?? 'Esma4hel3@xade04';

        $command = sprintf(
            'psql --host=%s --port=%s --username=%s --dbname=%s --no-password --file=%s',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($filepath)
        );

        putenv("PGPASSWORD=" . $password);

        $output = [];
        $returnCode = 0;
        exec($command . ' 2>&1', $output, $returnCode);

        if ($returnCode !== 0) {
            $errorMessage = implode("\n", $output);
            \Log::error('psql failed: ' . $errorMessage);
            throw new \Exception('Failed to restore backup: ' . $errorMessage);
        }
    }

    private function ensureSequencesExist()
    {
        try {
            // Get all tables with serial/identity columns
            $tables = DB::select("
                SELECT table_name, column_name, column_default 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND column_default LIKE '%nextval%' 
                ORDER BY table_name, column_name
            ");

            foreach ($tables as $table) {
                $tableName = $table->table_name;
                $columnName = $table->column_name;
                $default = $table->column_default;
                
                // Extract sequence name from default value
                if (preg_match("/nextval\('([^']+)'::regclass\)/", $default, $matches)) {
                    $sequenceName = $matches[1];
                    
                    // Check if sequence exists
                    $sequenceExists = DB::select("
                        SELECT 1 FROM information_schema.sequences 
                        WHERE sequence_name = ? AND sequence_schema = 'public'
                    ", [$sequenceName]);
                    
                    if (empty($sequenceExists)) {
                        \Log::info("Creating missing sequence: {$sequenceName}");
                        
                        // Create the sequence
                        DB::statement("CREATE SEQUENCE \"{$sequenceName}\"");
                        
                        // Get the maximum value from the table to set the sequence
                        $maxValue = DB::table($tableName)->max($columnName) ?? 0;
                        if ($maxValue > 0) {
                            DB::statement("SELECT setval('{$sequenceName}', {$maxValue}, true)");
                        }
                        
                        \Log::info("Sequence {$sequenceName} created and set to {$maxValue}");
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to ensure sequences exist: ' . $e->getMessage());
            // Don't throw the exception, just log it
        }
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = array('B', 'KB', 'MB', 'GB', 'TB');

        for ($i = 0; $bytes > 1024; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    private function parseSize($size)
    {
        $unit = preg_replace('/[^bkmgtpezy]/i', '', $size); // Remove the non-unit characters from the size.
        $size = preg_replace('/[^0-9\.]/', '', $size); // Remove the non-numeric characters from the size.
        if ($unit) {
            // Find the position of the unit in the ordered string which is the power of magnitude to multiply a kilobyte by.
            return round($size * pow(1024, stripos('bkmgtpezy', $unit[0])));
        } else {
            return round($size);
        }
    }

    private function getBackupInfo($filepath)
    {
        $tablesCount = 0;
        $totalRecords = 0;

        try {
            if (file_exists($filepath)) {
                $content = file_get_contents($filepath);
                
                // Count CREATE TABLE statements (case insensitive, handles both formats)
                $tablesCount = preg_match_all('/CREATE\s+TABLE/i', $content);
                
                // Count INSERT statements (approximate record count)
                // Handle both "INSERT INTO" and "COPY" (pg_dump format)
                $insertCount = preg_match_all('/INSERT\s+INTO/i', $content);
                $copyCount = preg_match_all('/^COPY\s+/im', $content);
                
                // pg_dump uses COPY format, count data lines
                if ($copyCount > 0) {
                    // Count lines that look like data (not comments or commands)
                    $dataLines = preg_match_all('/^\d+\t|\t.*\t/im', $content);
                    $totalRecords = max($insertCount, $dataLines);
                } else {
                    $totalRecords = $insertCount;
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to analyze backup file: ' . $e->getMessage());
        }

        return [
            'tables_count' => $tablesCount,
            'total_records' => $totalRecords
        ];
    }
}