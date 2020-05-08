$(function () {
    $('.add-row').click(function () {
        const $tbody = $(this).parents('table').children('tbody');
        const $target = $tbody.children('tr:last');
        const $clone = $target.clone();
        const $index = $clone.children('.index');
        const indexNum = parseInt($index.text());

        $clone.find('input').val('');
        $index.text(indexNum+1);
        $tbody.append($clone);
    });

    $(document).on('click','.remove-row', function () {
        const $target = $(this).parents('tr');
        const $indexFixTargets = $target.nextAll('tr');
        let $index = $target.children('.index');
        let indexNum = parseInt($index.text());

        $target.remove();

        //削除行以降インデックス調整
        $indexFixTargets.each(function(index, element){
            $(element).children('.index').text(indexNum);
            indexNum++;
        })
    });
});