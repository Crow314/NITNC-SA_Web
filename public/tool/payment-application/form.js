$(function () {
    // 行追加
    $('.add-item').on('click', function (e) {
        const $tbody = $(this).parents('table').children('tbody');
        const $target = $tbody.children('tr:last');
        const $clone = $target.clone();
        const $index = $clone.children('.index');
        const indexNum = parseInt($index.text());

        $clone.find('input').val('');
        $index.text(indexNum+1);
        $clone.find('.amount').text('0');
        $tbody.append($clone);
    });

    // 行削除
    $('table').on('click','.remove-item', function (e) {
        const $target = $(this).parents('tr');
        const $otherItems = $target.siblings('tr');
        const $indexFixTargets = $target.nextAll('tr');
        let $index = $target.children('.index');
        let indexNum = parseInt($index.text());

        // 最低1行は残す
        if($otherItems.length > 0) {
            $target.remove();

            //削除行以降インデックス調整
            $indexFixTargets.each(function (index, element) {
                $(element).children('.index').text(indexNum);
                indexNum++;
            })
        }
    });

    // 金額計算系イベント設定
    $('tbody').on('change focus blur', "input[name='quantity']", amountCalcFunction)
        .on('change focus blur', "input[name='unit_price']", amountCalcFunction)
        .on('change focus blur', "input[name='quantity']", totalAmountCalc)
        .on('change focus blur', "input[name='unit_price']", totalAmountCalc)
        .on('change', "select[name='tax_rate']", totalAmountCalc);

});

// 各行金額計算
function amountCalcFunction(e) {
    const element = e.currentTarget;
    const $item = $(element).parents('.receipt-item');
    const $quantity = $item.find("input[name='quantity']");
    const $unitPrice = $item.find("input[name='unit_price']");
    const $amount = $item.find('.amount');
    const $amountText = $amount.parents('.text-amount');

    const quantity = parseNan(parseInt($quantity.val()), 1);
    const unitPrice = parseNan(parseInt($unitPrice.val()), 0);

    const amount = quantity * unitPrice;

    if(amount >= 0) { // 正数時
        // テキスト設定
        $amount.text(thousandSeparate(amount));

        // 黒字に変更
        if($unitPrice.hasClass('text-danger')) {
            $unitPrice.removeClass('text-danger');
            $amountText.removeClass('text-danger');
        }
    }else { // 負数時
        // テキスト設定
        $amount.text(thousandSeparate(removeMinus(amount)));

        // 赤字に変更
        if(!$unitPrice.hasClass('text-danger')) {
            $unitPrice.addClass('text-danger');
            $amountText.addClass('text-danger');
        }
    }

    priceFormat(e, amount, $amountText)
}

// 合計額計算
function totalAmountCalc(e) {
    const element = e.currentTarget;
    const $receipt = $(element).parents('.receipt');
    const $items = $receipt.find('.receipt-details').find('.receipt-item');
    const $totalSection = $receipt.find('.receipt-section-total');
    const $total= $totalSection.find('.receipt-total');
    const $amountText = $total.find('.text-amount');

    let amountSum = new Map(); // taxRate: amount
    $items.each(function (index, element) {
        const $amount = $(element).find('.amount');
        const $amountMinus = $amount.siblings('.minus');
        const $taxRate = $(element).find("select[name='tax_rate']");

        let amount = parseInt(removeComma($amount.text()));
        if(!$amountMinus.hasClass('d-none')) {
            amount *= -1;
        }

        const taxRate = parseInt($taxRate.val());

        if(!amountSum.has(taxRate)) { // 同一税率初出時
            amountSum.set(taxRate, 0);
        }

        amountSum.set(taxRate, amountSum.get(taxRate)+amount); // +=的な
    });

    let totalAmount = 0;
    amountSum.forEach(function(amount, taxRate) { // value, key
        totalAmount += Math.floor(amount*(taxRate*0.01 + 1));
    });

    priceFormat(e, totalAmount, $amountText);
}

function priceFormat(e, price, $amountText) {
    const $amount = $amountText.children('.amount');
    const $minus = $amountText.children('.minus');

    if(price >= 0) { // 正数時
        // テキスト設定
        $amount.text(thousandSeparate(price));

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
        $amount.text(thousandSeparate(removeMinus(price)));

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

function parseNan(targetNum, changeTo) {
    if(isNaN(Number(targetNum))) {
        targetNum = changeTo;
    }
    return targetNum;
}

function thousandSeparate(number) {
    return String(number).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
}

function removeComma(number) {
    return String(number).replace(/,/g, '');
}

function removeMinus(number) {
    return String(number).replace(/-/g, '');
}