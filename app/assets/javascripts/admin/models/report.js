Discourse.Report = Discourse.Model.extend({
  reportUrl: function() {
    return("/admin/reports/" + this.get('type'));
  }.property('type'),

  valueAt: function(numDaysAgo) {
    if (this.data) {
      var wantedDate = Date.create(numDaysAgo + ' days ago', 'en').format('{yyyy}-{MM}-{dd}');
      var item = this.data.find( function(d, i, arr) { return d.x === wantedDate; } );
      if (item) {
        return item.y;
      }
    }
    return 0;
  },

  sumDays: function(startDaysAgo, endDaysAgo) {
    if (this.data) {
      var earliestDate = Date.create(endDaysAgo + ' days ago', 'en').beginningOfDay();
      var latestDate = Date.create(startDaysAgo + ' days ago', 'en').beginningOfDay();
      var d, sum = 0;
      this.data.each(function(datum){
        d = Date.create(datum.x);
        if(d >= earliestDate && d <= latestDate) {
          sum += datum.y;
        }
      });
      return sum;
    }
  },

  todayCount: function() {
    return this.valueAt(0);
  }.property('data'),

  yesterdayCount: function() {
    return this.valueAt(1);
  }.property('data'),

  lastSevenDaysCount: function() {
    return this.sumDays(1,7);
  }.property('data'),

  lastThirtyDaysCount: function() {
    return this.sumDays(1,30);
  }.property('data'),

  sevenDaysAgoCount: function() {
    return this.valueAt(7);
  }.property('data'),

  thirtyDaysAgoCount: function() {
    return this.valueAt(30);
  }.property('data'),

  yesterdayTrend: function() {
    var yesterdayVal = this.valueAt(1);
    var twoDaysAgoVal = this.valueAt(2);
    if ( yesterdayVal > twoDaysAgoVal ) {
      return 'trending-up';
    } else if ( yesterdayVal < twoDaysAgoVal ) {
      return 'trending-down';
    } else {
      return 'no-change';
    }
  }.property('data'),

  sevenDayTrend: function() {
    var currentPeriod = this.sumDays(1,7);
    var prevPeriod = this.sumDays(8,14);
    if ( currentPeriod > prevPeriod ) {
      return 'trending-up';
    } else if ( currentPeriod < prevPeriod ) {
      return 'trending-down';
    } else {
      return 'no-change';
    }
  }.property('data'),

  thirtyDayTrend: function() {
    if( this.get('prev30Days') ) {
      var currentPeriod = this.sumDays(1,30);
      if( currentPeriod > this.get('prev30Days') ) {
        return 'trending-up';
      } else if ( currentPeriod < this.get('prev30Days') ) {
        return 'trending-down';
      }
    }
    return 'no-change';
  }.property('data', 'prev30Days'),

  icon: function() {
    switch( this.get('type') ) {
    case 'flags':
      return 'icon-flag';
    case 'likes':
      return 'icon-heart';
    default:
      return null;
    }
  }.property('type'),

  percentChangeString: function(val1, val2) {
    var val = ((val1 - val2) / val2) * 100;
    if( isNaN(val) || !isFinite(val) ) {
      return null;
    } else if( val > 0 ) {
      return '+' + val.toFixed(0) + '%';
    } else {
      return val.toFixed(0) + '%';
    }
  },

  changeTitle: function(val1, val2, prevPeriodString) {
    var title = '';
    var percentChange = this.percentChangeString(val1, val2);
    if( percentChange ) {
      title += percentChange + ' change. ';
    }
    title += 'Was ' + val2 + ' ' + prevPeriodString + '.';
    return title;
  },

  yesterdayCountTitle: function() {
    return this.changeTitle( this.valueAt(1), this.valueAt(2),'two days ago');
  }.property('data'),

  sevenDayCountTitle: function() {
    return this.changeTitle( this.sumDays(1,7), this.sumDays(8,14), 'two weeks ago');
  }.property('data'),

  thirtyDayCountTitle: function() {
    return this.changeTitle( this.sumDays(1,30), this.get('prev30Days'), 'in the previous 30 day period');
  }.property('data')

});

Discourse.Report.reopenClass({
  find: function(type) {
    var model = Discourse.Report.create({type: type});
    Discourse.ajax("/admin/reports/" + type).then(function (json) {
      // Add a percent field to each tuple
      var maxY = 0;
      json.report.data.forEach(function (row) {
        if (row.y > maxY) maxY = row.y;
      });
      if (maxY > 0) {
        json.report.data.forEach(function (row) {
          row.percentage = Math.round((row.y / maxY) * 100);
        });
      }
      model.mergeAttributes(json.report);
      model.set('loaded', true);
    });
    return(model);
  }
});
