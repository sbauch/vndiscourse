Discourse.Attendee = Discourse.Model.extend({
	attended: null,
	buttonClass: function(){
		if (this.get('attended') == true ){
			return 'yeah'
		}
	}.property(),
  // hasOptions: (function() {
  //    if (!this.get('options')) return false;
  //    return this.get('options').length > 0;
  //  }).property('options.@each'),
  // 
  //  isDefault: (function() {
  //    return this.get('id') === Discourse.get('site.default_archetype');
  //  }).property('id')

});

Discourse.Attendee.reopenClass({
  create: function(obj) {
    var result;
    result = this._super(obj);
    if (obj.data) {
      result.set('data', Em.Object.create(obj.data));
    }
    return result;
  }
});