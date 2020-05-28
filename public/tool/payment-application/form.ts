$( () => {
    const $receipt: JQuery = $('.receipt');
    new Receipt($receipt);
});

class Receipt {
    static readonly taxRates: Array<number> = [10, 8, 0];
    private static $template: JQuery;

    readonly $jQuery: JQuery;
    readonly $receiptDetails: JQuery;
    readonly $receiptTotal: JQuery;
    readonly $receiptSubtotal: JQuery;
    readonly $receiptTaxAdded: JQuery;

    private payee: string;
    private about: string;
    private roundMode: RoundMode;
    private taxMode: TaxMode;
    private subtotal: number;
    private taxAmount: number;
    private totalAmount: number;
    private subtotalByTaxRate: Map<number, number>; // taxRate: amount
    private taxAmountByRate: Map<number, number>; // taxRate: amount

    private items: Array<Item>;

    constructor($receipt: JQuery) {
        this.$jQuery = $receipt.first();
        if(Receipt.$template === undefined) {
            Receipt.$template = this.$jQuery.clone();
        }

        this.$receiptDetails = $receipt.find('.receipt-details');
        this.$receiptTotal = $receipt.find('.receipt-total');
        this.$receiptSubtotal = $receipt.find('.receipt-subtotal');
        this.$receiptTaxAdded = $receipt.find('.receipt-tax-added');

        this.payee = '';
        this.about = '';
        this.roundMode = RoundMode.RoundOff;
        this.taxMode = TaxMode.Included;
        this.subtotal = 0;
        this.taxAmount = 0;
        this.totalAmount = 0;
        this.subtotalByTaxRate = Receipt.initByTaxRateMap(new Map<number, number>());
        this.taxAmountByRate = Receipt.initByTaxRateMap(new Map<number, number>());

        const $item = this.$receiptDetails.find('.receipt-item');
        const item: Item = new Item(this, $item, 1);
        this.items = [item];

        this.$jQuery.on('click', '.add-item', this.addItem.bind(this));
        this.$jQuery.children('.receipt-property').on('change', 'input,select', this.update.bind(this));
    }

    update(): void {
        this.input();
        this.calcTotalAmount();
        this.setHTMLValue();
    }

    input(): void {
        this.payee = String(this.$jQuery.find("input[name='payee']").val());
        this.about = String(this.$jQuery.find("input[name='about']").val());

        const roundModeStr: string = String(this.$jQuery.find("select[name='round_mode']").val());
        let roundMode: RoundMode = RoundMode.RoundDown;
        switch(roundModeStr) {
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

        const taxModeStr: string = String(this.$jQuery.find("select[name='tax_mode']").val());
        let taxMode: TaxMode = TaxMode.Included;
        switch(taxModeStr) {
            case 'included':
                taxMode = TaxMode.Included;
                break;

            case 'added':
                taxMode = TaxMode.Added;
                break
        }
        this.taxMode = taxMode;
    }

    updateItemIndex(): void {
        this.items.forEach(item => item.updateIndex());
        this.update();
    }

    addItem(): void {
        const $item = Item.getTemplate();
        const item: Item = new Item(this, $item);
        this.$receiptDetails.append($item);
        this.items.push(item);
        this.updateItemIndex();
    }

    removeItem(item: Item): void {
        if(this.items.length > 1) { // 最低1行は残す
            item.$jQuery.remove();
            this.items = this.items.filter(elem => elem !== item);
            this.updateItemIndex();
        }
    }

    calcTotalAmount(): void {
        //reset
        this.subtotal = 0;
        this.taxAmount = 0;
        Receipt.resetMapValue(this.subtotalByTaxRate);
        Receipt.resetMapValue(this.taxAmountByRate);

        this.items.forEach(item => {
            const amount: number = item.getAmount();
            const taxRate: number = item.getTaxRate();
            let tax: number = 0;

            switch(this.taxMode) {
                case TaxMode.Included:
                    tax = amount - (amount / (taxRate*0.01 + 1));
                    break;

                case TaxMode.Added:
                    tax = amount * (taxRate * 0.01);
                    break;
            }

            this.subtotalByTaxRate.set(taxRate, Receipt.parseNumber(this.subtotalByTaxRate.get(taxRate)) + amount); // +=的な
            this.taxAmountByRate.set(taxRate, Receipt.parseNumber(this.taxAmountByRate.get(taxRate)) + tax); // +=的な
        });

        let subtotal: number = 0;
        let tax: number = 0;

        this.subtotalByTaxRate.forEach((amount: number) => { // value, key
            subtotal += amount;
        });
        this.taxAmountByRate.forEach((amount: number) => {
            tax += Receipt.roundValue(amount, this.roundMode);
        });

        let totalAmount: number = subtotal;
        if(this.taxMode === TaxMode.Added) {
            totalAmount += tax;
        }

        this.subtotal = subtotal;
        this.taxAmount = tax;
        this.totalAmount = totalAmount;
    }

    setHTMLValue(): void {
        const $taxIncluded: JQuery = this.$jQuery.find('.receipt-tax-included');
        const $taxAdded: JQuery = this.$jQuery.find('.receipt-tax-added');
        switch(this.taxMode) {
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


        Receipt.setByTaxAmountHTML(this.subtotalByTaxRate, this.$receiptSubtotal, this.roundMode);
        Receipt.setAmountHTML(this.totalAmount, this.$receiptTotal);
    }

    getItemIndex(item: Item): number {
        return this.items.indexOf(item) + 1;
    }

    static parseNumber(inputNum: string | number | string[] | undefined): number {
        let result: number;
        switch(typeof inputNum) {
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

    static thousandSeparate(number: number): string {
        return String(number).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    }

    static removeMinus(number: number): number {
        return Number(String(number).replace(/-/g, ''));
    }

    static setAmountHTML(amount: number, $textBlock: JQuery): void {
        const $amountText = $textBlock.find('.text-amount');
        const $amount = $amountText.children('.amount');
        const $minus = $amountText.children('.minus');

        if(amount >= 0) { // 正数時
            // テキスト設定
            $amount.text(Receipt.thousandSeparate(amount));

            // マイナス表示削除
            $minus.hide();

            // 黒字に変更
            $amountText.removeClass('text-danger');
        }else { // 負数時
            // テキスト設定
            $amount.text(Receipt.thousandSeparate(Receipt.removeMinus(amount)));

            // マイナス表示付加
            $minus.show();

            // 赤字に変更
            $amountText.addClass('text-danger');
        }
    }

    static setByTaxAmountHTML(amountMap: Map<number, number>, $textBlock: JQuery, roundMode: RoundMode): void {
        let sum: number = 0;
        amountMap.forEach((amount: number, taxRate: number) => {
            amount = Receipt.roundValue(amount, roundMode);
            const $target: JQuery = $textBlock.children('.receipt-tax' + String(taxRate));
            Receipt.setAmountHTML(amount, $target);
            sum += amount;

            if(amount === 0) {
                $target.hide();
            }else {
                $target.show();
            }
        });
        const $main: JQuery = $textBlock.children('.receipt-main');
        this.setAmountHTML(Receipt.roundValue(sum, roundMode), $main);
    }

    static initByTaxRateMap(map: Map<number, number>): Map<number, number> {
        Receipt.taxRates.forEach(rate => {
            map.set(rate, 0);
        });
        return map;
    }
    
    static resetMapValue(map: Map<any, number>): Map<any, number> {
        map.forEach((value: number, key: any) => {
            map.set(key, 0);
        });
        return map;
    }

    static roundValue(number: number, mode: RoundMode): number {
        let result: number;
        switch(mode) {
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

class Item {
    private static $template: JQuery;

    readonly $jQuery: JQuery;
    readonly $index: JQuery;
    readonly $name: JQuery;
    readonly $quantity: JQuery;
    readonly $unitPrice: JQuery;
    readonly $amount: JQuery;
    readonly $taxRate: JQuery;
    readonly $removeButton: JQuery;

    private receipt: Receipt;
    private index: number;
    private name: string;
    private quantity: number;
    private unitPrice: number;
    private amount: number;
    private taxRate: number;

    constructor(receipt: Receipt, $item: JQuery, index: number = 0) {
        this.receipt = receipt;

        this.$jQuery = $item.first();
        if(Item.$template === undefined) {
            Item.$template = this.$jQuery.clone();
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

    update(): void {
        this.input();
        this.calcAmount();
        this.setHTMLValue();
        this.receipt.update();
    }

    remove(): void {
        this.receipt.removeItem(this);
    }

    input(): void {
        this.name = String(this.$name.val());
        this.quantity = Receipt.parseNumber(this.$quantity.val());
        this.unitPrice = Receipt.parseNumber(this.$unitPrice.val());
        this.taxRate = Number(this.$taxRate.val());
    }

    setHTMLValue(): void {
        this.$index.text(this.index);
        this.checkUnitPriceColor();
        Receipt.setAmountHTML(this.amount, this.$jQuery);
    }

    updateIndex(): void {
        this.index = this.receipt.getItemIndex(this);
        this.setHTMLValue();
    }

    checkUnitPriceColor(): void {
        if(this.unitPrice >= 0) { // 正数時
            // 黒字に変更
            if(this.$unitPrice.hasClass('text-danger')) {
                this.$unitPrice.removeClass('text-danger');
            }
        }else { // 負数時
            // 赤字に変更
            if(!this.$unitPrice.hasClass('text-danger')) {
                this.$unitPrice.addClass('text-danger');
            }
        }
    }

    calcAmount(): void {
       this.amount = Item.parseNan(this.quantity, 1) * Item.parseNan(this.unitPrice, 0);
    }

    static parseNan(targetNum: number, changeTo: number): number {
        if(Number.isNaN(targetNum)) {
            targetNum = changeTo;
        }
        return targetNum;
    }

    //Getter
    static getTemplate(): JQuery {
        return Item.$template.clone();
    }

    getAmount(): number {
        return this.amount;
    }

    getTaxRate(): number {
        return this.taxRate;
    }
}

enum RoundMode {
    RoundOff,
    RoundDown,
    RoundUp
}

enum TaxMode {
    Included,
    Added
}