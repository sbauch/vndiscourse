/**
  This view handles rendering of a combobox

  @class ComboboxView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.MultiComboboxView = Discourse.View.extend({
  tagName: 'select',
  classNames: [''],
  valueAttribute: 'id',
	attributeBindings: ['multiple'],
	multiple: 'multiple',

  render: function(buffer) {
	  

    var nameProperty = this.get('nameProperty') || 'name';

    // Add none option if required
    if (this.get('none')) {
      buffer.push('<option value="">' + (I18n.t(this.get('none'))) + "</option>");
    }

    var selected = this.get('value');
		var selectedIds = Em.A();
		_.each(selected, function(team){
			selectedIds.push(team.id);
		});
		
		if (selected) { selected = selected.toString(); }

		console.log(selectedIds);

    if (this.get('content')) {
      var comboboxView = this;
      _.each(this.get('content'),function(o) {
        var val = o[comboboxView.get('valueAttribute')];
        if (val) { val = val.toString(); }

        var selectedText = (selectedIds.contains(val)) ? "selected" : "";
        
        buffer.push("<option " + selectedText + " value=\"" + val + "\" " + ">" + Em.get(o, nameProperty) + "</option>");
      });
    }
  },
	
  valueChanged: function() {
    var $combo = this.$();
    var val = this.get('value');
    $combo.trigger("liszt:updated");
  }.observes('value'),

  didInsertElement: function() {
    var $elem = this.$();
          var comboboxView = this;
       		$elem.attr('multiple', true);       
               if (this.overrideWidths) {
                 // The Chosen plugin hard-codes the widths in style attrs. :<
                 var $chznContainer = $elem.chosen().next();
                 $chznContainer.removeAttr("style");
                 $chznContainer.find('.chzn-drop').removeAttr("style");
                 $chznContainer.find('.chzn-search input').removeAttr("style");
               }
               if (this.classNames && this.classNames.length > 0) {
                 // Apply the classes to Chosen's dropdown div too:
                 _.each(this.classNames,function(c) {
                   $elem.chosen().next().addClass(c);
                 });
               }
             
               $elem.chosen().change(function(e) {
                 comboboxView.set('value', $(e.target).val());
               });
  }

});

Discourse.View.registerHelper('multicombobox', Discourse.MultiComboboxView);
