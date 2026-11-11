import TransactionController from './TransactionController'
import InventoryController from './InventoryController'
import ReturnController from './ReturnController'
import BarcodePrintController from './BarcodePrintController'
import DiscountVisibilityController from './DiscountVisibilityController'
import PosVisibilityController from './PosVisibilityController'
import PosController from './PosController'
import BackupController from './BackupController'
import ReceiptPrintController from './ReceiptPrintController'


const Api = {
    TransactionController: Object.assign(TransactionController, TransactionController),
    InventoryController: Object.assign(InventoryController, InventoryController),
    ReturnController: Object.assign(ReturnController, ReturnController),
    BarcodePrintController: Object.assign(BarcodePrintController, BarcodePrintController),
    DiscountVisibilityController: Object.assign(DiscountVisibilityController, DiscountVisibilityController),
    PosVisibilityController: Object.assign(PosVisibilityController, PosVisibilityController),
    PosController: Object.assign(PosController, PosController),
    BackupController: Object.assign(BackupController, BackupController),
    ReceiptPrintController: Object.assign(ReceiptPrintController, ReceiptPrintController),
}

export default Api