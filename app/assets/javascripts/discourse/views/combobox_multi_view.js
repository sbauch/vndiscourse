/**
  This view handles rendering of a combobox

  @class ComboboxView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.MultiComboboxView = Discourse.View.extend({
  tagName: 'select multiple',
  classNames: ['combobox'],
  valueAttribute: 'id',

  render: function(buffer) {
    var nameProperty = this.get('nameProperty') || 'name';

    // Add none option if required
    if (this.get('none')) {
      buffer.push('<option value="">' + (I18n.t(this.get('none'))) + "</option>");
    }

    var selected = this.get('preselected');
		console.log(selected);
    if (selected) { selected = selected.getEach('value'); }
		console.log(selected);

    	if (this.get('content')) {
      var comboboxView = this;
      _.each(this.get('content'),function(o) {
				
        var val = o[comboboxView.get('valueAttribute')];
        if (val) { val = val.toString(); }

        var selectedText = (selected.contains(val)) ? "selected" : "";

				
				console.log(val);
					
        var data = "";
        if (comboboxView.dataAttributes) {
          comboboxView.dataAttributes.forEach(function(a) {
            data += "data-" + a + "=\"" + o.get(a) + "\" ";
          });
        }
        buffer.push("<option " + selectedText + " value=\"" + val + "\" " + data + ">" + Em.get(o, nameProperty) + "</option>");
      });
    }
  },

  didInsertElement: function() {
    var $elem = this.$();
    var comboboxView = this;

    $elem.chosen({ template: this.template, disable_search_threshold: 5 });
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
    	var value = $(e.target).val();
			console.log(value);
      comboboxView.set('value', value);

    });
		 			$elem.chosen().trigger("liszt:updated");

 }

});

Discourse.View.registerHelper('multicombobox', Discourse.MultiComboboxView);
