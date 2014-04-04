// https://gist.github.com/simonsmith/5135933
!function(global) {
    function definition($) {
        $.fn.measure = function(fn) {
            var clone = $(this).clone(), result;
 
            clone.css({
                visibility: 'hidden',
                position: 'absolute'
            });
            clone.appendTo(document.body);
 
            if (typeof fn == 'function') {
                result = fn.apply(clone);
            }
            clone.remove();
 
            return result;
        };
    }
 
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], definition);
    } else {
        definition(global.jQuery);
    }
}(this);
