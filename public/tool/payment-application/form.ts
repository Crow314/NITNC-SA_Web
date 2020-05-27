$( () => {
    const $receipt: JQuery = $('.receipt');
    new Receipt($receipt);
});

class Receipt {
    static $template: JQuery;

    readonly $jQuery: JQuery;
    readonly $receiptDetails: JQuery;
    readonly $receiptTotal: JQuery;

    private payee: string;
    private about: string;
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

        this.payee = '';
        this.about = '';
        this.subtotal = 0;
        this.taxAmount = 0;
        this.totalAmount = 0;
        this.subtotalByTaxRate = new Map<number, number>();
        this.taxAmountByRate = new Map<number, number>();

        const $item = this.$receiptDetails.find('.receipt-item');
        const item: Item = new Item(this, $item, 1);
        this.items = [item];

        this.$jQuery.on('click', '.add-item', this.addItem.bind(this));
    }

    update(): void {
        this.calcTotalAmount();
        this.setHTMLValue();
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
        this.subtotalByTaxRate = new Map<number, number>();
        this.taxAmountByRate = new Map<number, number>();

        this.items.forEach(item => {
            const amount:number = item.getAmount();
            const taxRate:number = item.getTaxRate();
            const tax: number = amount * taxRate * 0.01;

            if(!this.subtotalByTaxRate.has(taxRate)) { // 同一税率初出時
                this.subtotalByTaxRate.set(taxRate, 0);
                this.taxAmountByRate.set(taxRate, 0);
            }

            this.subtotalByTaxRate.set(taxRate, Receipt.parseNumber(this.subtotalByTaxRate.get(taxRate)) + amount); // +=的な
            this.taxAmountByRate.set(taxRate, Receipt.parseNumber(this.taxAmountByRate.get(taxRate)) + tax); // +=的な
        });

        let subtotal: number = 0;
        let tax: number = 0;

        this.subtotalByTaxRate.forEach((amount: number) => { // value, key
            subtotal += Math.floor(amount);
        });
        this.taxAmountByRate.forEach((amount: number) => {
            tax += Math.floor(amount);
        });
        this.subtotal = subtotal;
        this.taxAmount = tax;

        this.totalAmount = this.subtotal + this.taxAmount;
    }

    setHTMLValue(): void {
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

    static setAmountHTML(price: number, $textBlock: JQuery): void {
        const $amountText = $textBlock.find('.text-amount');
        const $amount = $amountText.children('.amount');
        const $minus = $amountText.children('.minus');

        if(price >= 0) { // 正数時
            // テキスト設定
            $amount.text(Receipt.thousandSeparate(price));

            // マイナス表示削除
            if(!$minus.hasClass('d-none')) {
                $minus.addClass('d-none');
            }

            // 黒字に変更
            if($amountText.hasClass('text-danger')) {
                $amountText.removeClass('text-danger');
            }
        }else { // 負数時
            // テキスト設定
            $amount.text(Receipt.thousandSeparate(Receipt.removeMinus(price)));

            // マイナス表示付加
            if($minus.hasClass('d-none')) {
                $minus.removeClass('d-none');
            }

            // 赤字に変更
            if(!$amountText.hasClass('text-danger')) {
                $amountText.addClass('text-danger');
            }
        }
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
        this.calcAmount();
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