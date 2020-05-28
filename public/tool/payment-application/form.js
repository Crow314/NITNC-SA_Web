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
            this.$receiptDetails = $receipt.find('.receipt-details');
            this.$receiptTotal = $receipt.find('.receipt-total');
            this.$receiptSubtotal = $receipt.find('.receipt-subtotal');
            this.$receiptTaxAdded = $receipt.find('.receipt-tax-added');
            this.payee = '';
            this.about = '';
            this.subtotal = 0;
            this.taxAmount = 0;
            this.totalAmount = 0;
            this.subtotalByTaxRate = Receipt.initByTaxRateMap(new Map());
            this.taxAmountByRate = Receipt.initByTaxRateMap(new Map());
            const $item = this.$receiptDetails.find('.receipt-item');
            const item = new Item(this, $item, 1);
            this.items = [item];
            this.$jQuery.on('click', '.add-item', this.addItem.bind(this));
        }
        update() {
            this.calcTotalAmount();
            this.setHTMLValue();
        }
        updateItemIndex() {
            this.items.forEach(item => item.updateIndex());
            this.update();
        }
        addItem() {
            const $item = Item.getTemplate();
            const item = new Item(this, $item);
            this.$receiptDetails.append($item);
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
                const tax = amount * taxRate * 0.01;
                this.subtotalByTaxRate.set(taxRate, Receipt.parseNumber(this.subtotalByTaxRate.get(taxRate)) + amount); // +=的な
                this.taxAmountByRate.set(taxRate, Receipt.parseNumber(this.taxAmountByRate.get(taxRate)) + tax); // +=的な
            });
            let subtotal = 0;
            let tax = 0;
            this.subtotalByTaxRate.forEach((amount) => {
                subtotal += amount;
            });
            this.taxAmountByRate.forEach((amount) => {
                tax += Math.floor(amount);
            });
            this.subtotal = subtotal;
            this.taxAmount = tax;
            this.totalAmount = this.subtotal + this.taxAmount;
        }
        setHTMLValue() {
            Receipt.setAmountHTML(this.totalAmount, this.$receiptTotal);
            Receipt.setByTaxAmountHTML(this.subtotalByTaxRate, this.$receiptSubtotal);
            Receipt.setByTaxAmountHTML(this.taxAmountByRate, this.$receiptTaxAdded);
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
        static setByTaxAmountHTML(amountMap, $textBlock) {
            let sum = 0;
            amountMap.forEach((amount, taxRate) => {
                amount = Math.floor(amount);
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
            this.setAmountHTML(Math.floor(sum), $main);
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
            console.debug(Item.$template);
        }
        this.$index = this.$jQuery.find('.index');
        this.$name = this.$jQuery.find("input[name='name']");
        this.$quantity = this.$jQuery.find("input[name='quantity']");
        this.$unitPrice = this.$jQuery.find("input[name='unit_price']");
        this.$amount = this.$jQuery.find('.amount');
        this.$taxRate = this.$jQuery.find("select[name='tax_rate']");
        this.$removeButton = this.$jQuery.find(".remove-item");
        this.index = index;
        this.name = '';
        this.quantity = NaN;
        this.unitPrice = 0;
        this.amount = 0;
        this.calcAmount();
        this.taxRate = 10;
        this.setHTMLValue();
        this.$jQuery.on('change', 'input,select', this.update.bind(this));
        this.$removeButton.on('click', this.remove.bind(this));
    }
    update() {
        this.input();
        this.setHTMLValue();
        this.receipt.update();
    }
    remove() {
        this.receipt.removeItem(this);
    }
    input() {
        this.name = String(this.$name.val());
        this.quantity = Receipt.parseNumber(this.$quantity.val());
        this.unitPrice = Receipt.parseNumber(this.$unitPrice.val());
        this.taxRate = Number(this.$taxRate.val());
        this.calcAmount();
    }
    setHTMLValue() {
        this.$index.text(this.index);
        this.checkUnitPriceColor();
        Receipt.setAmountHTML(this.amount, this.$jQuery);
    }
    updateIndex() {
        this.index = this.receipt.getItemIndex(this);
        this.setHTMLValue();
    }
    checkUnitPriceColor() {
        if (this.unitPrice >= 0) { // 正数時
            // 黒字に変更
            if (this.$unitPrice.hasClass('text-danger')) {
                this.$unitPrice.removeClass('text-danger');
            }
        }
        else { // 負数時
            // 赤字に変更
            if (!this.$unitPrice.hasClass('text-danger')) {
                this.$unitPrice.addClass('text-danger');
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
