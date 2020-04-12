$(function(){
    $('.header-list-contents').click(function(){
        const $headerAccordion = $('.header-accordion');
        const targetId = $(this).attr('id').replace('list', 'accordion');
        const $target = $headerAccordion.find('#' + targetId);
        const $currentOpened = $headerAccordion.find('.show');

        if($currentOpened.length === 0){ //アコーディオン非表示時
            //アコーディオン展開
            $headerAccordion.slideDown();
            $target.show();

            $(this).addClass('header-list-selected');
            $target.addClass('show');
        }else { //アコーディオン表示時
            if($target.hasClass('show')) {//アコーディオン縮小
                $headerAccordion.slideUp();
                $target.hide();

                $(this).removeClass('header-list-selected');
                $target.removeClass('show');
            }else {//アコーディオン内容切り替え
                $currentOpened.hide();
                $target.show();

                const currentOpenedBtnId = $currentOpened.attr('id').replace('accordion', 'list');
                $('.header-list').find(currentOpenedBtnId).removeClass('header-list-selected');
                $currentOpened.removeClass('show');
                $(this).addClass('header-list-selected');
                $target.addClass('show');
            }
        }
    });
});