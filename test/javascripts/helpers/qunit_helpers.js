function integration(name) {
  module("Integration: " + name, {
    setup: function() {
      sinon.stub(Discourse.ScrollingDOMMethods, "bindOnScroll");
      sinon.stub(Discourse.ScrollingDOMMethods, "unbindOnScroll");
      Ember.run(Discourse, Discourse.advanceReadiness);
    },

    teardown: function() {
      Discourse.reset();
      Discourse.ScrollingDOMMethods.bindOnScroll.restore();
      Discourse.ScrollingDOMMethods.unbindOnScroll.restore();
    }
  });
}

function controllerFor(controller, model) {
  var controller = Discourse.__container__.lookup('controller:' + controller);
  if (model) { controller.set('model', model ); }
  return controller;
}

function asyncTestDiscourse(text, func) {

  asyncTest(text, function () {

    var qunitContext = this;
    Ember.run(function () {
      func.call(qunitContext);
    });
  });
}