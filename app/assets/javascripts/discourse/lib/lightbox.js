/**
  Helper object for lightboxes.

  @class Lightbox
  @namespace Discourse
  @module Discourse
**/
Discourse.Lightbox = {
  apply: function($elem) {
    $LAB.script("/javascripts/jquery.magnific-popup-min.js").wait(function() {
      $("a.lightbox", $elem).each(function(i, e) {
        $(e).magnificPopup({
          type: "image",
          closeOnContentClick: false,

          callbacks: {
            open: function() {
              var wrap = this.wrap,
                  img = this.currItem.img,
                  maxHeight = img.css("max-height");

              wrap.on("click.pinhandler", "img", function() {
                wrap.toggleClass("mfp-force-scrollbars");
                img.css("max-height", wrap.hasClass("mfp-force-scrollbars") ? "none" : maxHeight);
              });
            },
            beforeClose: function() {
              this.wrap.off("click.pinhandler");
              this.wrap.removeClass("mfp-force-scrollbars");
            }
          },

          image: {
            titleSrc: function(item) {
              return [
                item.el.attr("title"),
                $("span.informations", item.el).text(),
                '<a class="image-source-link" href="' + item.src + '" target="_blank">' + I18n.t("lightbox.download") + '</a>'
              ].join(' &middot; ');
            }
          }

        });
      });
    });
  }
};
