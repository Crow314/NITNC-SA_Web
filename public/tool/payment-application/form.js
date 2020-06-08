"use strict";
$(() => {
    const $receipt = $('.receipt');
    new Receipt($receipt);
});
let Receipt = /** @class */ (() => {
    class Receipt {
        constructor($receipt) {
            this.$jQuery = $receipt.first();
            if (Receipt.$template === undefined) {
                Receipt.$template = this.$jQuery.clone();
            }
            this.payee = '';
            this.about = '';
            this.roundMode = RoundMode.RoundOff;
            this.taxMode = TaxMode.Included;
            this.subtotal = 0;
            this.taxAmount = 0;
            this.totalAmount = 0;
            this.subtotalByTaxRate = Receipt.initByTaxRateMap(new Map());
            this.taxAmountByRate = Receipt.initByTaxRateMap(new Map());
            this.items = [];
            this.addItem();
            this.$jQuery.on('click', '.add-item', this.addItem.bind(this));
            this.$jQuery.children('.receipt-property').on('change', 'input,select', this.update.bind(this));
        }
        update() {
            this.input();
            this.calcTotalAmount();
            this.setHTMLValue();
        }
        input() {
            this.payee = String(this.$jQuery.find("input[name='payee']").val());
            this.about = String(this.$jQuery.find("input[name='about']").val());
            const roundModeStr = String(this.$jQuery.find("select[name='round_mode']").val());
            let roundMode = RoundMode.RoundDown;
            switch (roundModeStr) {
                case 'round_off':
                    roundMode = RoundMode.RoundOff;
                    break;
                case 'round_down':
                    roundMode = RoundMode.RoundDown;
                    break;
                case 'round_up':
                    roundMode = RoundMode.RoundUp;
                    break;
            }
            this.roundMode = roundMode;
            const taxModeStr = String(this.$jQuery.find("select[name='tax_mode']").val());
            let taxMode = TaxMode.Included;
            switch (taxModeStr) {
                case 'included':
                    taxMode = TaxMode.Included;
                    break;
                case 'added':
                    taxMode = TaxMode.Added;
                    break;
            }
            this.taxMode = taxMode;
        }
        updateItemIndex() {
            this.items.forEach(item => item.updateIndex());
            this.update();
        }
        addItem() {
            const $receiptDetails = this.$jQuery.find('.receipt-details');
            let $item;
            let item;
            if (this.items.length === 0) {
                $item = $receiptDetails.find('.receipt-item');
                item = new Item(this, $item, 1);
            }
            else {
                $item = Item.getTemplate();
                item = new Item(this, $item);
                $receiptDetails.append($item);
            }
            this.items.push(item);
            this.updateItemIndex();
        }
        removeItem(item) {
            if (this.items.length > 1) { // 最低1行は残す
                item.$jQuery.remove();
                this.items = this.items.filter(elem => elem !== item);
                this.updateItemIndex();
            }
        }
        calcTotalAmount() {
            //reset
            this.subtotal = 0;
            this.taxAmount = 0;
            Receipt.resetMapValue(this.subtotalByTaxRate);
            Receipt.resetMapValue(this.taxAmountByRate);
            this.items.forEach(item => {
                const amount = item.getAmount();
                const taxRate = item.getTaxRate();
                let tax = 0;
                switch (this.taxMode) {
                    case TaxMode.Included:
                        tax = amount - (amount / (taxRate * 0.01 + 1));
                        break;
                    case TaxMode.Added:
                        tax = amount * (taxRate * 0.01);
                        break;
                }
                this.subtotalByTaxRate.set(taxRate, Receipt.parseNumber(this.subtotalByTaxRate.get(taxRate)) + amount); // +=的な
                this.taxAmountByRate.set(taxRate, Receipt.parseNumber(this.taxAmountByRate.get(taxRate)) + tax); // +=的な
            });
            let subtotal = 0;
            let tax = 0;
            this.subtotalByTaxRate.forEach((amount) => {
                subtotal += amount;
            });
            this.taxAmountByRate.forEach((amount) => {
                tax += Receipt.roundValue(amount, this.roundMode);
            });
            let totalAmount = subtotal;
            if (this.taxMode === TaxMode.Added) {
                totalAmount += tax;
            }
            this.subtotal = subtotal;
            this.taxAmount = tax;
            this.totalAmount = totalAmount;
        }
        setHTMLValue() {
            const $receiptTotal = this.$jQuery.find('.receipt-total');
            const $receiptSubtotal = this.$jQuery.find('.receipt-subtotal');
            const $taxIncluded = this.$jQuery.find('.receipt-tax-included');
            const $taxAdded = this.$jQuery.find('.receipt-tax-added');
            switch (this.taxMode) {
                case TaxMode.Included:
                    Receipt.setByTaxAmountHTML(this.taxAmountByRate, $taxIncluded, this.roundMode);
                    $taxIncluded.show();
                    $taxAdded.hide();
                    break;
                case TaxMode.Added:
                    Receipt.setByTaxAmountHTML(this.taxAmountByRate, $taxAdded, this.roundMode);
                    $taxAdded.show();
                    $taxIncluded.hide();
                    break;
            }
            Receipt.setByTaxAmountHTML(this.subtotalByTaxRate, $receiptSubtotal, this.roundMode);
            Receipt.setAmountHTML(this.totalAmount, $receiptTotal);
        }
        getItemIndex(item) {
            return this.items.indexOf(item) + 1;
        }
        static parseNumber(inputNum) {
            let result;
            switch (typeof inputNum) {
                case 'string':
                    result = parseInt(inputNum);
                    break;
                case 'number':
                    result = inputNum;
                    break;
                default:
                    result = NaN;
            }
            return result;
        }
        static thousandSeparate(number) {
            return String(number).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        }
        static removeMinus(number) {
            return Number(String(number).replace(/-/g, ''));
        }
        static setAmountHTML(amount, $textBlock) {
            const $amountText = $textBlock.find('.text-amount');
            const $amount = $amountText.children('.amount');
            const $minus = $amountText.children('.minus');
            if (amount >= 0) { // 正数時
                // テキスト設定
                $amount.text(Receipt.thousandSeparate(amount));
                // マイナス表示削除
                $minus.hide();
                // 黒字に変更
                $amountText.removeClass('text-danger');
            }
            else { // 負数時
                // テキスト設定
                $amount.text(Receipt.thousandSeparate(Receipt.removeMinus(amount)));
                // マイナス表示付加
                $minus.show();
                // 赤字に変更
                $amountText.addClass('text-danger');
            }
        }
        static setByTaxAmountHTML(amountMap, $textBlock, roundMode) {
            let sum = 0;
            amountMap.forEach((amount, taxRate) => {
                amount = Receipt.roundValue(amount, roundMode);
                const $target = $textBlock.children('.receipt-tax' + String(taxRate));
                Receipt.setAmountHTML(amount, $target);
                sum += amount;
                if (amount === 0) {
                    $target.hide();
                }
                else {
                    $target.show();
                }
            });
            const $main = $textBlock.children('.receipt-main');
            this.setAmountHTML(Receipt.roundValue(sum, roundMode), $main);
        }
        static initByTaxRateMap(map) {
            Receipt.taxRates.forEach(rate => {
                map.set(rate, 0);
            });
            return map;
        }
        static resetMapValue(map) {
            map.forEach((value, key) => {
                map.set(key, 0);
            });
            return map;
        }
        static roundValue(number, mode) {
            let result;
            switch (mode) {
                case RoundMode.RoundOff:
                    result = Math.round(number);
                    break;
                case RoundMode.RoundDown:
                    result = Math.floor(number);
                    break;
                case RoundMode.RoundUp:
                    result = Math.ceil(number);
                    break;
            }
            return result;
        }
    }
    Receipt.taxRates = [10, 8, 0];
    return Receipt;
})();
class Item {
    constructor(receipt, $item, index = 0) {
        this.receipt = receipt;
        this.$jQuery = $item.first();
        if (Item.$template === undefined) {
            Item.$template = this.$jQuery.clone();
        }
        this.index = index;
        this.name = '';
        this.quantity = NaN;
        this.unitPrice = 0;
        this.amount = 0;
        this.calcAmount();
        this.taxRate = 10;
        this.setHTMLValue();
        this.$jQuery.find('input,select').on('change', this.update.bind(this));
        this.$jQuery.find('.remove-item').on('click', this.remove.bind(this));
    }
    update() {
        this.input();
        this.calcAmount();
        this.setHTMLValue();
        this.receipt.update();
    }
    remove() {
        this.receipt.removeItem(this);
    }
    input() {
        const $name = this.$jQuery.find("input[name='name']");
        const $quantity = this.$jQuery.find("input[name='quantity']");
        const $unitPrice = this.$jQuery.find("input[name='unit_price']");
        const $taxRate = this.$jQuery.find("select[name='tax_rate']");
        this.name = String($name.val());
        this.quantity = Receipt.parseNumber($quantity.val());
        this.unitPrice = Receipt.parseNumber($unitPrice.val());
        this.taxRate = Number($taxRate.val());
    }
    setHTMLValue() {
        const $index = this.$jQuery.find('.index');
        $index.text(this.index);
        this.checkUnitPriceColor();
        Receipt.setAmountHTML(this.amount, this.$jQuery);
    }
    updateIndex() {
        this.index = this.receipt.getItemIndex(this);
        this.setHTMLValue();
    }
    checkUnitPriceColor() {
        const $unitPrice = this.$jQuery.find("input[name='unit_price']");
        if (this.unitPrice >= 0) { // 正数時
            // 黒字に変更
            if ($unitPrice.hasClass('text-danger')) {
                $unitPrice.removeClass('text-danger');
            }
        }
        else { // 負数時
            // 赤字に変更
            if (!$unitPrice.hasClass('text-danger')) {
                $unitPrice.addClass('text-danger');
            }
        }
    }
    calcAmount() {
        this.amount = Item.parseNan(this.quantity, 1) * Item.parseNan(this.unitPrice, 0);
    }
    static parseNan(targetNum, changeTo) {
        if (Number.isNaN(targetNum)) {
            targetNum = changeTo;
        }
        return targetNum;
    }
    //Getter
    static getTemplate() {
        return Item.$template.clone();
    }
    getAmount() {
        return this.amount;
    }
    getTaxRate() {
        return this.taxRate;
    }
}
var RoundMode;
(function (RoundMode) {
    RoundMode[RoundMode["RoundOff"] = 0] = "RoundOff";
    RoundMode[RoundMode["RoundDown"] = 1] = "RoundDown";
    RoundMode[RoundMode["RoundUp"] = 2] = "RoundUp";
})(RoundMode || (RoundMode = {}));
var TaxMode;
(function (TaxMode) {
    TaxMode[TaxMode["Included"] = 0] = "Included";
    TaxMode[TaxMode["Added"] = 1] = "Added";
})(TaxMode || (TaxMode = {}));
