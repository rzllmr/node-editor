
(function($, window, document) {
  $(function() {
    $(document).scrollTop(0);

    const section = $('#downloads.section');
    const sticky = section.clone();
    sticky.addClass('sticky');
    sticky.hide();
    sticky.insertAfter(section);

    $(window).on('scroll', checkSticky);

    function checkSticky() {
      const stickyOffset = section[0].offsetTop;
      if (window.pageYOffset > stickyOffset) {
        sticky.show();
      } else {
        sticky.hide();
      }
    }
  });
}(window.jQuery, window, document));
