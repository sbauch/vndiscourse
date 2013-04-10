(function() {
  window.Discourse.User.reopenClass({
  findAll: function(query, filter) {
    var result = Em.A();
    Discourse.ajax({
      url: Discourse.getURL("/directory.json"),
      data: { filter: filter }
    }).then(function(users) {
      users.each(function(u) {
        result.pushObject(Discourse.AdminUser.create(u));
      });
			result.set('loaded', true)
    });
    return result;
  }
  });
}).call(this);
