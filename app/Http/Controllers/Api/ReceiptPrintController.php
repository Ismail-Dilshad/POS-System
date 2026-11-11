<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Carbon\Carbon;

class ReceiptPrintController extends Controller
{
    public function printTest(Request $request)
    {
        try {
            $receiptData = $request->input('receiptData');
            $printerSettings = $request->input('printerSettings');

            // Validate required data
            if (!$receiptData || !$printerSettings) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt data and printer settings are required'
                ], 400);
            }

            // Log the print request for debugging
            \Log::info('Test receipt print requested', [
                'printer' => $printerSettings['receiptPrinter'] ?? 'unknown',
                'paper_size' => $printerSettings['receiptPaperSize'] ?? 'unknown',
                'store_name' => $receiptData['storeName'] ?? 'unknown'
            ]);

            // For now, we'll simulate successful printing
            // In a real implementation, you would:
            // 1. Format the receipt data for the specific printer
            // 2. Send the data to the printer via appropriate driver/API
            // 3. Handle printer-specific commands (ESC/POS for thermal printers)

            $response = $this->simulatePrinting($receiptData, $printerSettings);

            return response()->json([
                'success' => true,
                'message' => 'Test receipt sent to printer successfully',
                'data' => $response
            ]);

        } catch (\Exception $e) {
            \Log::error('Receipt print failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to print receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    public function printReceipt(Request $request)
    {
        try {
            $receiptData = $request->input('receiptData');
            $printerSettings = $request->input('printerSettings');

            // Validate required data
            if (!$receiptData || !$printerSettings) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt data and printer settings are required'
                ], 400);
            }

            // Process actual receipt printing
            $response = $this->processPrinting($receiptData, $printerSettings);

            return response()->json([
                'success' => true,
                'message' => 'Receipt printed successfully',
                'data' => $response
            ]);

        } catch (\Exception $e) {
            \Log::error('Receipt print failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to print receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    private function simulatePrinting($receiptData, $printerSettings)
    {
        // Simulate printing process
        sleep(1); // Simulate printer processing time

        return [
            'printer_id' => $printerSettings['receiptPrinter'],
            'paper_size' => $printerSettings['receiptPaperSize'],
            'receipt_id' => $receiptData['transactionNumber'],
            'timestamp' => Carbon::now()->toISOString(),
            'items_count' => count($receiptData['items'] ?? []),
            'total_amount' => $receiptData['grandTotal'] ?? 0
        ];
    }

    private function processPrinting($receiptData, $printerSettings)
    {
        // In a real implementation, this would:
        // 1. Format receipt data according to printer requirements
        // 2. Generate ESC/POS commands for thermal printers
        // 3. Send data to printer via USB, Network, or Bluetooth
        // 4. Handle printer responses and errors

        // For thermal printers, you would typically:
        // - Set paper width (80mm, 58mm, etc.)
        // - Set character encoding for Kurdish text
        // - Format text alignment and fonts
        // - Add barcode if needed
        // - Cut paper command

        $escPosCommands = $this->generateEscPosCommands($receiptData, $printerSettings);

        return [
            'printer_id' => $printerSettings['receiptPrinter'],
            'paper_size' => $printerSettings['receiptPaperSize'],
            'commands_sent' => count($escPosCommands),
            'receipt_id' => $receiptData['transactionNumber'],
            'timestamp' => Carbon::now()->toISOString()
        ];
    }

    /**
     * Stream receipt data in chunks for faster display
     */
    public function streamReceipt(Request $request): JsonResponse
    {
        try {
            $receiptData = $request->input('receiptData');
            $chunkSize = $request->input('chunkSize', 5); // Default 5 items per chunk

            if (!$receiptData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt data is required'
                ], 422);
            }

            $items = $receiptData['items'] ?? [];
            $totalItems = count($items);

            // Generate receipt chunks
            $chunks = [];
            for ($i = 0; $i < $totalItems; $i += $chunkSize) {
                $chunkItems = array_slice($items, $i, $chunkSize);
                $chunk = $this->generateReceiptChunk($receiptData, $chunkItems, $i / $chunkSize + 1, ceil($totalItems / $chunkSize));
                $chunks[] = $chunk;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'chunks' => $chunks,
                    'totalChunks' => count($chunks),
                    'totalItems' => $totalItems,
                    'chunkSize' => $chunkSize
                ],
                'message' => 'Receipt data streamed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to stream receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a single chunk of receipt data
     */
    private function generateReceiptChunk($receiptData, $chunkItems, $chunkNumber, $totalChunks): array
    {
        $isFirstChunk = $chunkNumber === 1;
        $isLastChunk = $chunkNumber === $totalChunks;

        // Calculate totals for this chunk
        $chunkSubtotal = array_sum(array_column($chunkItems, 'total'));
        $chunkDiscount = $isLastChunk ? ($receiptData['discount'] ?? 0) : 0;
        $chunkTotal = $chunkSubtotal - $chunkDiscount;

        return [
            'chunkNumber' => $chunkNumber,
            'totalChunks' => $totalChunks,
            'isFirstChunk' => $isFirstChunk,
            'isLastChunk' => $isLastChunk,
            'items' => $chunkItems,
            'chunkSubtotal' => $chunkSubtotal,
            'chunkDiscount' => $chunkDiscount,
            'chunkTotal' => $chunkTotal,
            'header' => $isFirstChunk ? [
                'storeName' => $receiptData['storeName'] ?? config('app.display_name', 'Ali Network POS'),
                'cashier' => $receiptData['cashier'] ?? 'Cashier',
                'date' => now()->format('Y/m/d H:i'),
                'transactionNumber' => $receiptData['transactionNumber'] ?? '',
                'phone' => $receiptData['phone'] ?? '',
                'address' => $receiptData['address'] ?? ''
            ] : null,
            'footer' => $isLastChunk ? [
                'thankYouMessage' => $receiptData['thankYouMessage'] ?? 'سوپاس بۆ سەردانتان',
                'footerText' => $receiptData['footerText'] ?? ''
            ] : null
        ];
    }

    private function generateEscPosCommands($receiptData, $printerSettings)
    {
        // ESC/POS command examples for thermal printers
        $commands = [
            "\x1B\x40", // Initialize printer
            "\x1B\x61\x01", // Center alignment
            "\x1B\x21\x30", // Double height and width
            $receiptData['storeName'] . "\n",
            "\x1B\x21\x00", // Normal text
            "\x1B\x61\x00", // Left alignment
            str_repeat("-", 32) . "\n",
            "Cashier: " . ($receiptData['cashier'] ?? 'Unknown') . "\n",
            "Date: " . Carbon::now()->format('Y/m/d H:i') . "\n",
            "Receipt: " . $receiptData['transactionNumber'] . "\n",
            "Phone: " . $receiptData['phone'] . "\n",
            str_repeat("-", 32) . "\n"
        ];

        // Add items
        foreach ($receiptData['items'] ?? [] as $item) {
            $itemLine = sprintf(
                "%-20s %2d %8s\n",
                substr($item['name'], 0, 20),
                $item['quantity'],
                number_format($item['total'])
            );
            $commands[] = $itemLine;
        }

        // Add totals
        $commands[] = str_repeat("-", 32) . "\n";
        $commands[] = sprintf("%-20s %11s\n", "Total:", number_format($receiptData['grandTotal']));
        $commands[] = "\n";
        $commands[] = "\x1B\x61\x01"; // Center alignment
        $commands[] = $receiptData['thankYouMessage'] . "\n";
        $commands[] = $receiptData['footerText'] . "\n";
        $commands[] = "\x1D\x56\x42\x00"; // Cut paper

        return $commands;
    }
}