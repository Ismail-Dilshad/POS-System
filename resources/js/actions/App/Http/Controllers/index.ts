import Auth from './Auth'
import ProductController from './ProductController'
import CategoryController from './CategoryController'
import SupplierController from './SupplierController'
import Api from './Api'
import PurchaseController from './PurchaseController'
import ScaleProductController from './ScaleProductController'
import CardController from './CardController'
import NameCardController from './NameCardController'
import ExpenseController from './ExpenseController'
import UserController from './UserController'
import SupplierReturnController from './SupplierReturnController'


const Controllers = {
    Auth: Object.assign(Auth, Auth),
    ProductController: Object.assign(ProductController, ProductController),
    CategoryController: Object.assign(CategoryController, CategoryController),
    SupplierController: Object.assign(SupplierController, SupplierController),
    Api: Object.assign(Api, Api),
    PurchaseController: Object.assign(PurchaseController, PurchaseController),
    ScaleProductController: Object.assign(ScaleProductController, ScaleProductController),
    CardController: Object.assign(CardController, CardController),
    NameCardController: Object.assign(NameCardController, NameCardController),
    ExpenseController: Object.assign(ExpenseController, ExpenseController),
    UserController: Object.assign(UserController, UserController),
    SupplierReturnController: Object.assign(SupplierReturnController, SupplierReturnController),
}

export default Controllers