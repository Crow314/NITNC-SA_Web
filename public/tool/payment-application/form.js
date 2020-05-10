$(function () {
    // 行追加
    $('.add-row').click(function () {
        const $tbody = $(this).parents('table').children('tbody');
        const $target = $tbody.children('tr:last');
        const $clone = $target.clone();
        const $index = $clone.children('.index');
        const indexNum = parseInt($index.text());

        $clone.find('input').val('');
        $index.text(indexNum+1);
        $clone.find("input[name='quantity']").val(1);
        $tbody.append($clone);
    });

    // 行削除
    $('table').on('click','.remove-row', function () {
        const $target = $(this).parents('tr');
        const $indexFixTargets = $target.nextAll('tr');
        let $index = $target.children('.index');
        let indexNum = parseInt($index.text());

        $target.remove();

        //削除行以降インデックス調整
        $indexFixTargets.each(function (index, element) {
            $(element).children('.index').text(indexNum);
            indexNum++;
        })
    });

    // 金額計算系イベント設定
    $('tbody').on('change focus blur', "input[name='quantity']", amountCalcFunction)
        .on('change focus blur', "input[name='unit_price']", amountCalcFunction)
        .on('change focus blur', "input[name='quantity']", totalAmountCalc)
        .on('change focus blur', "input[name='unit_price']", totalAmountCalc)
        .on('change', "select[name='tax_rate']", totalAmountCalc);

});

// 各行金額計算
function amountCalcFunction() {
    const $row = $(this).parents('tr');
    const $quantity = $row.find("input[name='quantity']");
    const $unitPrice = $row.find("input[name='unit_price']");
    const $amount = $row.find('.amount');
    const $amountTD = $amount.parent('td');
    const $minus = $amountTD.children('.minus');

    const quantity = nanToZero(parseInt($quantity.val()));
    const unitPrice = nanToZero(parseInt($unitPrice.val()));

    const amount = quantity * unitPrice;

    if(amount >= 0) { // 正数時
        // テキスト設定
        $amount.text(thousandSeparate(amount));

        // マイナス表示削除
        if(!$minus.hasClass('d-none')) {
            $minus.addClass('d-none');
        }

        // 黒字に変更
        if($amountTD.hasClass('text-danger')) {
            $unitPrice.removeClass('text-danger');
            $amountTD.removeClass('text-danger');
        }
    }else { // 負数時
        // テキスト設定
        $amount.text(thousandSeparate(removeMinus(amount)));

        // マイナス表示付加
        if($minus.hasClass('d-none')) {
            $minus.removeClass('d-none');
        }

        // 赤字に変更
        if(!$amountTD.hasClass('text-danger')) {
            $unitPrice.addClass('text-danger');
            $amountTD.addClass('text-danger');
        }
    }
}

// 合計額計算
function totalAmountCalc() {
    const $rows = $(this).parents('tbody').children('tr');
    const $totalAmount = $rows.parents('table').find('.total-amount');
    const $totalAmountTD = $totalAmount.parent('td');
    const $minus = $totalAmountTD.children('.minus');

    let amountSum = new Map(); // taxRate: amount
    $rows.each(function (index, element) {
        const $amount = $(element).find('.amount');
        const $amountMinus = $amount.parent('td').children('.minus');
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

    if(totalAmount >= 0) { // 正数時
        // テキスト設定
        $totalAmount.text(thousandSeparate(totalAmount));

        // マイナス表示削除
        if(!$minus.hasClass('d-none')) {
            $minus.addClass('d-none');
        }

        // 黒字に変更
        if($totalAmountTD.hasClass('text-danger')) {
            $totalAmountTD.removeClass('text-danger');
        }
    }else { // 負数時
        // テキスト設定
        $totalAmount.text(thousandSeparate(removeMinus(totalAmount)));

        // マイナス表示付加
        if($minus.hasClass('d-none')) {
            $minus.removeClass('d-none');
        }

        // 赤字に変更
        if(!$totalAmountTD.hasClass('text-danger')) {
            $totalAmountTD.addClass('text-danger');
        }
    }
}


function nanToZero(number) {
    if(isNaN(Number(number))) {
        number = 0;
    }
    return number;
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