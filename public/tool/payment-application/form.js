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

    const quantity = nanToZero(parseInt($quantity.val()));
    const unitPrice = nanToZero(parseInt($unitPrice.val()));

    const amount = quantity * unitPrice;
    $amount.text(thousandSeparate(amount));
}

// 合計額計算
function totalAmountCalc() {
    const $rows = $(this).parents('tbody').children('tr');
    const $totalAmount = $rows.parents('table').find('.total-amount');

    let totalAmount = 0;
    $rows.each(function (index, element) {
        const $amount = $(element).find('.amount');
        const $taxRate = $(element).find("select[name='tax_rate']");

        const amount = parseInt(removeComma($amount.text()));
        const taxRate = parseInt($taxRate.val());

        totalAmount += amount * (taxRate*0.01 + 1);
    });

    $totalAmount.text(thousandSeparate(Math.floor(totalAmount))); //小数切り捨て&コンマ区切り
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