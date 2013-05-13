Discourse.UserSelector = Discourse.TextField.extend({

  didInsertElement: function(){
    var _this = this;
    var selected = [];
    var transformTemplate = Handlebars.compile("{{avatar this imageSize=\"tiny\"}} {{this.username}}");
    var template = Discourse.UserSelector.templateFunction();

    $(this.get('element')).val(this.get('usernames')).autocomplete({
      template: template,

      dataSource: function(term) {
        var exclude = selected;
        if (_this.get('excludeCurrentUser')){
          exclude = exclude.concat([Discourse.get('currentUser.username')]);
        }
        return Discourse.UserSearch.search({
          term: term,
          topicId: _this.get('topicId'),
          exclude: exclude
        });
      },

      onChangeItems: function(items) {
        items = $.map(items, function(i) {
          if (i.username) {
            return i.username;
          } else {
            return i;
          }
        });
        _this.set('usernames', items.join(","));
        selected = items;
      },

      transformComplete: transformTemplate,

      reverseTransform: function(i) {
        return { username: i };
      }

    });

  }

});


Discourse.UserSelector.reopenClass({
  // I really want to move this into a template file, but I need a handlebars template here, not an ember one
  templateFunction: function(){
      this.compiled = this.compiled || Handlebars.compile("<div class='autocomplete'>" +
                                    "<ul>" +
                                    "{{#each options}}" +
                                      "<li>" +
                                          "<a href='#'>{{avatar this imageSize=\"tiny\"}} " +
                                          "<span class='username'>{{this.username}}</span> " +
                                          "<span class='name'>{{this.name}}</span></a>" +
                                      "</li>" +
                                      "{{/each}}" +
                                    "</ul>" +
                                  "</div>");
      return this.compiled;
    }
});
