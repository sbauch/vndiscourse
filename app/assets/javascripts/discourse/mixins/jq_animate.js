Discourse.Animate = Ember.Mixin.create({
  cssProperties: ['background', 'backgroundAttachment', 'backgroundColor', 'backgroundImage', 'backgroundPosition', 
  'backgroundRepeat', 'border', 'borderBottom', 'borderBottomColor', 'borderBottomStyle', 'borderBottomWidth', 
  'borderColor', 'borderLeft', 'borderLeftColor', 'borderLeftStyle', 'borderLeftWidth', 'borderRight', 'borderRightColor', 
  'borderRightStyle', 'borderRightWidth', 'borderStyle', 'borderTop', 'borderTopColor', 'borderTopStyle', 'borderTopWidth', 
  'borderWidth', 'clear', 'clip', 'color', 'cursor', 'display', 'filter', 'font', 'fontFamily', 'fontSize', 
  'fontVariant', 'fontWeight', 'height', 'left', 'letterSpacing', 'lineHeight', 'listStyle', 'listStyleImage', 
  'listStylePosition', 'listStyleType', 'margin', 'marginBottom', 'marginLeft', 'marginRight', 'marginTop', 'overflow', 
  'padding', 'paddingBottom', 'paddingLeft', 'paddingRight', 'paddingTop', 'pageBreakAfter', 'pageBreakBefore', 
  'position', 'styleFloat', 'textAlign', 'textDecoration', 'textIndent', 'textTransform', 'top', 'verticalAlign', 
  'visibility', 'width', 'zIndex'],
  
  elementIsInserted: false,
    
  didInsertElement: function() {
    this._super();
    
    this.set('elementIsInserted', true);
    this._gatherProperties();
  },

  willDestroyElement: function() {
    this._super();
    
    this.set('elementIsInserted', false);
    
    // Tear down any observers that were created
    var observers = this._observers;
    for (var prop in observers) {
        if (observers.hasOwnProperty(prop)) {
          this.removeObserver(prop, observers[prop]);
        }
    }

  },

  _gatherProperties: function() {
    var cssProperties = this.get('cssProperties');
    
    // The view can specify a list of css properties that should be treated
    // as Ember properties.
    cssProperties.forEach(function(key) {

      // Set up an observer on the Ember property. 
      // When it changes, call animate() 
      var observer = function() {
        this.animate();
      };

      this.addObserver(key, observer);

      // Insert the observer in a Hash so we can remove it later.
      this._observers = this._observers || {};
      this._observers[key] = observer;
    }, this);

  },
  
  
  // Do the animation. Called whenever a css property changes.
  // You can define a beforeAnimate() function that will be called before the actual animation takes place
  // You can also define a afterAnimate() function that will be called just after the animation ends
  animate: function(){
      var cssProperties = this.get('cssProperties'), properties = {}, 
        duration = this.get('duration') || 400, easing = this.get('easing') || null, self = this;
        
      // Ensure this view is inserted. If not, animate later.
      if (!this.get('elementIsInserted')){
          return Ember.run.next(this, function() {
              this.animate();
          });
      }
      
      // Gather css properties values
      cssProperties.forEach(function(key) {
        properties[key] = self.get(key);
      }, this);
      
      // Before animation
      if (typeof this.beforeAnimate == "function"){
          this.beforeAnimate();
      }
      
      // Animate
      return this.$().animate(properties, duration, easing, function(){
          if (typeof self.afterAnimate == "function"){
            self.afterAnimate();
          }
      });
  }
});