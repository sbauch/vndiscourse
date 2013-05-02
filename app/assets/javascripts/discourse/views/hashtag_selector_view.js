Discourse.HashtagSelector = Discourse.TextField.extend({
  
  didInsertElement: function(){
    var _this = this;
    var selected = [];
    var transformTemplate = Handlebars.compile("{{avatar this imageSize=\"tiny\"}} {{this.username}}");
    var template = Discourse.HashtagSelector.templateFunction();

    $(this.get('element')).val(this.get('tags')).autocomplete({
      template: template,

      dataSource: function(term) {
        return Discourse.HashtagSearch.search({
          term: term
        });
      },

      onChangeItems: function(items) {
        items = $.map(items, function(i) {
          if (i.term) {
            return i.term;
          } else {
            return i;
          }
        });
        _this.set('tags', items.join(","));
        selected = items;
      },

      transformComplete: transformTemplate,

      reverseTransform: function(i) {
        return { term: i };
      }

    });
    
  }

});


Discourse.HashtagSelector.reopenClass({
  // I really want to move this into a template file, but I need a handlebars template here, not an ember one
  templateFunction: function(){ 
      this.compiled = this.compiled || Handlebars.compile("<div class='autocomplete'>" +
                                    "<ul>" +
                                    "{{#each options}}" +
                                      "<li>" +
                                          "<a href='#'>" +
                                          "<span class='username'>#{{this.term}}</span> " +
                                      "</li>" +
                                      "{{/each}}" +
                                    "</ul>" +
                                  "</div>");
      return this.compiled;
    }
});
