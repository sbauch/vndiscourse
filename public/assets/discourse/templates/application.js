Ember.TEMPLATES["application"] = Ember.Handlebars.compile("{{render header}}\n  \n  <div id='main-outlet'>\n    {{outlet}}\n  </div>\n  \n  {{render modal}}");
