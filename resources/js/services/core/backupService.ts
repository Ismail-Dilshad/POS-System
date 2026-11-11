import { ApiBase, getErrorDetails } from '@/lib/api-base';
import axios from '../../bootstrap';

export interface BackupFile {
    filename: string;
    filesize: number;
    filesize_human: string;
    created_at: string;
    created_at_human: string;
    type?: string;
    tables_count?: number;
    total_records?: number;
    is_full_backup?: boolean;
}

export interface BackupResponse {
    success: boolean;
    message?: string;
    data?: {
        filename: string;
        filepath: string;
        filesize: number;
        timestamp: string;
    };
}

export interface BackupListResponse {
    success: boolean;
    message?: string;
    data?: BackupFile[];
}

class BackupService extends ApiBase {
    constructor() {
        super('/api');
    }

    async createBackup(): Promise<BackupResponse> {
        try {
            const response = await this.post<BackupResponse>('/backup/create');
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to create backup',
            };
        }
    }

    async listBackups(): Promise<BackupListResponse> {
        try {
            const response = await this.get<BackupListResponse>('/backup/list');
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to list backups',
            };
        }
    }

    async downloadBackup(filename: string): Promise<void> {
        const response = await axios.get(
            `/api/backup/download?filename=${encodeURIComponent(filename)}`,
            {
                responseType: 'blob',
            },
        );

        // Create blob and download
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    async deleteBackup(
        filename: string,
    ): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await this.delete<{
                success: boolean;
                message?: string;
            }>(`/backup/delete?filename=${encodeURIComponent(filename)}`);
            return response;
        } catch (error: unknown) {
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to delete backup',
            };
        }
    }

    async importBackup(
        file: File,
        confirmImport: boolean
    ): Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }> {
        try {
            const formData = new FormData();
            formData.append('backup_file', file);
            formData.append('confirm_import', confirmImport.toString());

            const response = await axios.post('/api/backup/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                timeout: 300000, // 5 minutes timeout for large files
            });

            return response.data;
        } catch (error: unknown) {
            console.error('Import backup error:', error);
            const { message } = getErrorDetails(error);
            return {
                success: false,
                message: message || 'Failed to import backup',
            };
        }
    }
}

export const backupService = new BackupService();
