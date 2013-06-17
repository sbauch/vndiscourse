Discourse.Formatter = (function(){

  var updateRelativeAge, autoUpdatingRelativeAge, relativeAge, relativeAgeTiny,
      relativeAgeMedium, relativeAgeMediumSpan, longDate, toTitleCase,
      shortDate;

  shortDate = function(date){
    return moment(date).shortDate();
  };

  // http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
  // TODO: locale support ?
  toTitleCase = function toTitleCase(str)
  {
    return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  longDate = function(dt) {
    if (!dt) return;

    return moment(dt).longDate();
  };

  updateRelativeAge = function(elems) {
    // jQuery .each
    elems.each(function(){
      var $this = $(this);
      $this.html(relativeAge(new Date($this.data('time')), {format: $this.data('format'), wrapInSpan: false}));
    });
  };

  autoUpdatingRelativeAge = function(date,options) {

    if (!date) return "";

    options = options || {};
    var format = options.format || "tiny";

    var append = "";

    if(format === 'medium') {
      append = " date' title='" + longDate(date);
      if(options.leaveAgo) {
        format = 'medium-with-ago';
      }
      options.wrapInSpan = false;
    }

    return "<span class='relative-date" + append + "' data-time='" + date.getTime() + "' data-format='" + format +  "'>" + relativeAge(date, options)  + "</span>";
  };


  relativeAgeTiny = function(date, options){
    var format = "tiny";
    var distance = Math.round((new Date() - date) / 1000);
    var distanceInMinutes = Math.round(distance / 60.0);

    var formatted;
    var t = function(key,opts){
      return Ember.String.i18n("dates." + format + "." + key, opts);
    };

    switch(true){

    case(distanceInMinutes < 1):
      formatted = t("less_than_x_minutes", {count: 1});
      break;
    case(distanceInMinutes >= 1 && distanceInMinutes <= 44):
      formatted = t("x_minutes", {count: distanceInMinutes});
      break;
    case(distanceInMinutes >= 45 && distanceInMinutes <= 89):
      formatted = t("about_x_hours", {count: 1});
      break;
    case(distanceInMinutes >= 90 && distanceInMinutes <= 1439):
      formatted = t("about_x_hours", {count: Math.round(distanceInMinutes / 60.0)});
      break;
    case(distanceInMinutes >= 1440 && distanceInMinutes <= 2519):
      formatted = t("x_days", {count: 1});
      break;
    case(distanceInMinutes >= 2520 && distanceInMinutes <= 129599):
      formatted = t("x_days", {count: Math.round(distanceInMinutes / 1440.0)});
      break;
    case(distanceInMinutes >= 129600 && distanceInMinutes <= 525599):
      formatted = t("x_months", {count: Math.round(distanceInMinutes / 43200.0)});
      break;
    default:
      var months = Math.round(distanceInMinutes / 43200.0);
      if (months < 24) {
        formatted = t("x_months", {count: months});
      } else {
        formatted = t("over_x_years", {count: Math.round(months / 12.0)});
      }
      break;
    }

    return formatted;
  };

  relativeAgeMediumSpan = function(distance, leaveAgo) {
    var formatted, distanceInMinutes;

    distanceInMinutes = Math.round(distance / 60.0);

    var t = function(key, opts){
      return Ember.String.i18n("dates.medium" + (leaveAgo?"_with_ago":"") + "." + key, opts);
    }

    switch(true){
    case(distanceInMinutes >= 1 && distanceInMinutes <= 56):
      formatted = t("x_minutes", {count: distanceInMinutes});
      break;
    case(distanceInMinutes >= 56 && distanceInMinutes <= 89):
      formatted = t("x_hours", {count: 1});
      break;
    case(distanceInMinutes >= 90 && distanceInMinutes <= 1379):
      formatted = t("x_hours", {count: Math.round(distanceInMinutes / 60.0)});
      break;
    case(distanceInMinutes >= 1380 && distanceInMinutes <= 2159):
      formatted = t("x_days", {count: 1});
      break;
    case(distanceInMinutes >= 2160):
      formatted = t("x_days", {count: Math.round((distanceInMinutes - 720.0) / 1440.0)});
      break;
    }
    return formatted || '&mdash';
  };

  relativeAgeMedium = function(date, options){
    var displayDate, fiveDaysAgo, oneMinuteAgo, fullReadable, leaveAgo, val;
    var wrapInSpan = options.wrapInSpan === false ? false : true;

    leaveAgo = options.leaveAgo;
    var distance = Math.round((new Date() - date) / 1000);

    if (!date) {
      return "&mdash;";
    }

    fullReadable = longDate(date);
    displayDate = "";
    fiveDaysAgo = 432000;
    oneMinuteAgo = 60;

    if (distance < oneMinuteAgo) {
      displayDate = Em.String.i18n("now");
    } else if (distance > fiveDaysAgo) {
      if ((new Date()).getFullYear() !== date.getFullYear()) {
        displayDate = shortDate(date);
      } else {
        displayDate = moment(date).shortDateNoYear();
      }
    } else {
      displayDate = relativeAgeMediumSpan(distance, leaveAgo);
    }
    if(wrapInSpan) {
      return "<span class='date' title='" + fullReadable + "'>" + displayDate + "</span>";
    } else {
      return displayDate;
    }
  };

  // mostly lifted from rails with a few amendments
  relativeAge = function(date, options) {
    options = options || {};
    var format = options.format || "tiny";

    if(format === "tiny") {
      return relativeAgeTiny(date, options);
    } else if (format === "medium") {
      return relativeAgeMedium(date, options);
    } else if (format === 'medium-with-ago') {
      return relativeAgeMedium(date, _.extend(options, {format: 'medium', leaveAgo: true}));
    }

    return "UNKNOWN FORMAT";
  };

  return {
    longDate: longDate,
    relativeAge: relativeAge,
    autoUpdatingRelativeAge: autoUpdatingRelativeAge,
    updateRelativeAge: updateRelativeAge,
    toTitleCase: toTitleCase,
    shortDate: shortDate
  };
})();
