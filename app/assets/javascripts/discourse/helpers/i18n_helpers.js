/**
  Look up a translation for an i18n key in our dictionary.

  @method i18n
  @for Handlebars
**/
Ember.Handlebars.registerHelper('i18n', function(property, options) {
  // Resolve any properties
  var params,
    _this = this;
  params = options.hash;
  Object.keys(params, function(key, value) {
    params[key] = Em.Handlebars.get(_this, value, options);
  });
  return Ember.String.i18n(property, params);
});

/* We always prefix with .js to select exactly what we want passed through to the front end.
*/

/**
  Look up a translation for an i18n key in our dictionary.

  @method i18n
  @for Ember.String
**/
Ember.String.i18n = function(scope, options) {
  return I18n.translate("js." + scope, options);
};

/**
  Set up an i18n binding that will update as a count changes, complete with pluralization.

  @method countI18n
  @for Handlebars
**/
Ember.Handlebars.registerHelper('countI18n', function(key, options) {
  var view;
  view = Discourse.View.extend({
    tagName: 'span',
    render: function(buffer) {
      return buffer.push(Ember.String.i18n(key, {
        count: this.get('count')
      }));
    },
    countChanged: (function() {
      return this.rerender();
    }).observes('count')
  });
  return Ember.Handlebars.helpers.view.call(this, view, options);
});

if (Ember.EXTEND_PROTOTYPES) {
  String.prototype.i18n = function(options) {
    return Ember.String.i18n(String(this), options);
  };
}


