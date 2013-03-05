// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(searchElement /*, fromIndex */) {
    "use strict";

    if (this === void 0 || this === null) {
      throw new TypeError();
    }

    var t = Object(this);
    var len = t.length >>> 0;

    if (len === 0) {
      return -1;
    }

    var n = 0;
    if (arguments.length > 0) {
      n = Number(arguments[1]);
      if (n !== n) { // shortcut for verifying if it's NaN
        n = 0;
      } else if (n !== 0 && n !== (Infinity) && n !== -(Infinity)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }

    if (n >= len) {
      return -1;
    }

    var k = n >= 0
          ? n
          : Math.max(len - Math.abs(n), 0);

    for (; k < len; k++) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }

    return -1;
  };
}

// Instantiate the object
var I18n = I18n || {};

// Set default locale to english
I18n.defaultLocale = "en";

// Set default handling of translation fallbacks to false
I18n.fallbacks = false;

// Set default separator
I18n.defaultSeparator = ".";

// Set current locale to null
I18n.locale = null;

// Set the placeholder format. Accepts `{{placeholder}}` and `%{placeholder}`.
I18n.PLACEHOLDER = /(?:\{\{|%\{)(.*?)(?:\}\}?)/gm;

I18n.fallbackRules = {
};

I18n.pluralizationRules = {
  en: function (n) {
    return n == 0 ? ["zero", "none", "other"] : n == 1 ? "one" : "other";
  }
};

I18n.getFallbacks = function(locale) {
  if (locale === I18n.defaultLocale) {
    return [];
  } else if (!I18n.fallbackRules[locale]) {
    var rules = []
      , components = locale.split("-");

    for (var l = 1; l < components.length; l++) {
      rules.push(components.slice(0, l).join("-"));
    }

    rules.push(I18n.defaultLocale);

    I18n.fallbackRules[locale] = rules;
  }

  return I18n.fallbackRules[locale];
}

I18n.isValidNode = function(obj, node, undefined) {
  return obj[node] !== null && obj[node] !== undefined;
};

I18n.lookup = function(scope, options) {
  var options = options || {}
    , lookupInitialScope = scope
    , translations = this.prepareOptions(I18n.translations)
    , locale = options.locale || I18n.currentLocale()
    , messages = translations[locale] || {}
    , options = this.prepareOptions(options)
    , currentScope
  ;

  if (typeof(scope) == "object") {
    scope = scope.join(this.defaultSeparator);
  }

  if (options.scope) {
    scope = options.scope.toString() + this.defaultSeparator + scope;
  }

  scope = scope.split(this.defaultSeparator);

  while (messages && scope.length > 0) {
    currentScope = scope.shift();
    messages = messages[currentScope];
  }

  if (!messages) {
    if (I18n.fallbacks) {
      var fallbacks = this.getFallbacks(locale);
      for (var fallback = 0; fallback < fallbacks.length; fallbacks++) {
        messages = I18n.lookup(lookupInitialScope, this.prepareOptions({locale: fallbacks[fallback]}, options));
        if (messages) {
          break;
        }
      }
    }

    if (!messages && this.isValidNode(options, "defaultValue")) {
        messages = options.defaultValue;
    }
  }

  return messages;
};

// Merge serveral hash options, checking if value is set before
// overwriting any value. The precedence is from left to right.
//
//   I18n.prepareOptions({name: "John Doe"}, {name: "Mary Doe", role: "user"});
//   #=> {name: "John Doe", role: "user"}
//
I18n.prepareOptions = function() {
  var options = {}
    , opts
    , count = arguments.length
  ;

  for (var i = 0; i < count; i++) {
    opts = arguments[i];

    if (!opts) {
      continue;
    }

    for (var key in opts) {
      if (!this.isValidNode(options, key)) {
        options[key] = opts[key];
      }
    }
  }

  return options;
};

I18n.interpolate = function(message, options) {
  options = this.prepareOptions(options);
  var matches = message.match(this.PLACEHOLDER)
    , placeholder
    , value
    , name
  ;

  if (!matches) {
    return message;
  }

  for (var i = 0; placeholder = matches[i]; i++) {
    name = placeholder.replace(this.PLACEHOLDER, "$1");

    value = options[name];

    if (!this.isValidNode(options, name)) {
      value = "[missing " + placeholder + " value]";
    }

    regex = new RegExp(placeholder.replace(/\{/gm, "\\{").replace(/\}/gm, "\\}"));
    message = message.replace(regex, value);
  }

  return message;
};

I18n.translate = function(scope, options) {
  options = this.prepareOptions(options);
  var translation = this.lookup(scope, options);

  try {
    if (typeof(translation) == "object") {
      if (typeof(options.count) == "number") {
        return this.pluralize(options.count, scope, options);
      } else {
        return translation;
      }
    } else {
      return this.interpolate(translation, options);
    }
  } catch(err) {
    return this.missingTranslation(scope);
  }
};

I18n.localize = function(scope, value) {
  switch (scope) {
    case "currency":
      return this.toCurrency(value);
    case "number":
      scope = this.lookup("number.format");
      return this.toNumber(value, scope);
    case "percentage":
      return this.toPercentage(value);
    default:
      if (scope.match(/^(date|time)/)) {
        return this.toTime(scope, value);
      } else {
        return value.toString();
      }
  }
};

I18n.parseDate = function(date) {
  var matches, convertedDate;

  // we have a date, so just return it.
  if (typeof(date) == "object") {
    return date;
  };

  // it matches the following formats:
  //   yyyy-mm-dd
  //   yyyy-mm-dd[ T]hh:mm::ss
  //   yyyy-mm-dd[ T]hh:mm::ss
  //   yyyy-mm-dd[ T]hh:mm::ssZ
  //   yyyy-mm-dd[ T]hh:mm::ss+0000
  //
  matches = date.toString().match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?(Z|\+0000)?/);

  if (matches) {
    for (var i = 1; i <= 6; i++) {
      matches[i] = parseInt(matches[i], 10) || 0;
    }

    // month starts on 0
    matches[2] -= 1;

    if (matches[7]) {
      convertedDate = new Date(Date.UTC(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6]));
    } else {
      convertedDate = new Date(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6]);
    }
  } else if (typeof(date) == "number") {
    // UNIX timestamp
    convertedDate = new Date();
    convertedDate.setTime(date);
  } else if (date.match(/\d+ \d+:\d+:\d+ [+-]\d+ \d+/)) {
    // a valid javascript format with timezone info
    convertedDate = new Date();
    convertedDate.setTime(Date.parse(date))
  } else {
    // an arbitrary javascript string
    convertedDate = new Date();
    convertedDate.setTime(Date.parse(date));
  }

  return convertedDate;
};

I18n.toTime = function(scope, d) {
  var date = this.parseDate(d)
    , format = this.lookup(scope)
  ;

  if (date.toString().match(/invalid/i)) {
    return date.toString();
  }

  if (!format) {
    return date.toString();
  }

  return this.strftime(date, format);
};

I18n.strftime = function(date, format) {
  var options = this.lookup("date");

  if (!options) {
    return date.toString();
  }

  options.meridian = options.meridian || ["AM", "PM"];

  var weekDay = date.getDay()
    , day = date.getDate()
    , year = date.getFullYear()
    , month = date.getMonth() + 1
    , hour = date.getHours()
    , hour12 = hour
    , meridian = hour > 11 ? 1 : 0
    , secs = date.getSeconds()
    , mins = date.getMinutes()
    , offset = date.getTimezoneOffset()
    , absOffsetHours = Math.floor(Math.abs(offset / 60))
    , absOffsetMinutes = Math.abs(offset) - (absOffsetHours * 60)
    , timezoneoffset = (offset > 0 ? "-" : "+") + (absOffsetHours.toString().length < 2 ? "0" + absOffsetHours : absOffsetHours) + (absOffsetMinutes.toString().length < 2 ? "0" + absOffsetMinutes : absOffsetMinutes)
  ;

  if (hour12 > 12) {
    hour12 = hour12 - 12;
  } else if (hour12 === 0) {
    hour12 = 12;
  }

  var padding = function(n) {
    var s = "0" + n.toString();
    return s.substr(s.length - 2);
  };

  var f = format;
  f = f.replace("%a", options.abbr_day_names[weekDay]);
  f = f.replace("%A", options.day_names[weekDay]);
  f = f.replace("%b", options.abbr_month_names[month]);
  f = f.replace("%B", options.month_names[month]);
  f = f.replace("%d", padding(day));
  f = f.replace("%e", day);
  f = f.replace("%-d", day);
  f = f.replace("%H", padding(hour));
  f = f.replace("%-H", hour);
  f = f.replace("%I", padding(hour12));
  f = f.replace("%-I", hour12);
  f = f.replace("%m", padding(month));
  f = f.replace("%-m", month);
  f = f.replace("%M", padding(mins));
  f = f.replace("%-M", mins);
  f = f.replace("%p", options.meridian[meridian]);
  f = f.replace("%S", padding(secs));
  f = f.replace("%-S", secs);
  f = f.replace("%w", weekDay);
  f = f.replace("%y", padding(year));
  f = f.replace("%-y", padding(year).replace(/^0+/, ""));
  f = f.replace("%Y", year);
  f = f.replace("%z", timezoneoffset);

  return f;
};

I18n.toNumber = function(number, options) {
  options = this.prepareOptions(
    options,
    this.lookup("number.format"),
    {precision: 3, separator: ".", delimiter: ",", strip_insignificant_zeros: false}
  );

  var negative = number < 0
    , string = Math.abs(number).toFixed(options.precision).toString()
    , parts = string.split(".")
    , precision
    , buffer = []
    , formattedNumber
  ;

  number = parts[0];
  precision = parts[1];

  while (number.length > 0) {
    buffer.unshift(number.substr(Math.max(0, number.length - 3), 3));
    number = number.substr(0, number.length -3);
  }

  formattedNumber = buffer.join(options.delimiter);

  if (options.precision > 0) {
    formattedNumber += options.separator + parts[1];
  }

  if (negative) {
    formattedNumber = "-" + formattedNumber;
  }

  if (options.strip_insignificant_zeros) {
    var regex = {
        separator: new RegExp(options.separator.replace(/\./, "\\.") + "$")
      , zeros: /0+$/
    };

    formattedNumber = formattedNumber
      .replace(regex.zeros, "")
      .replace(regex.separator, "")
    ;
  }

  return formattedNumber;
};

I18n.toCurrency = function(number, options) {
  options = this.prepareOptions(
    options,
    this.lookup("number.currency.format"),
    this.lookup("number.format"),
    {unit: "$", precision: 2, format: "%u%n", delimiter: ",", separator: "."}
  );

  number = this.toNumber(number, options);
  number = options.format
    .replace("%u", options.unit)
    .replace("%n", number)
  ;

  return number;
};

I18n.toHumanSize = function(number, options) {
  var kb = 1024
    , size = number
    , iterations = 0
    , unit
    , precision
  ;

  while (size >= kb && iterations < 4) {
    size = size / kb;
    iterations += 1;
  }

  if (iterations === 0) {
    unit = this.t("number.human.storage_units.units.byte", {count: size});
    precision = 0;
  } else {
    unit = this.t("number.human.storage_units.units." + [null, "kb", "mb", "gb", "tb"][iterations]);
    precision = (size - Math.floor(size) === 0) ? 0 : 1;
  }

  options = this.prepareOptions(
    options,
    {precision: precision, format: "%n%u", delimiter: ""}
  );

  number = this.toNumber(size, options);
  number = options.format
    .replace("%u", unit)
    .replace("%n", number)
  ;

  return number;
};

I18n.toPercentage = function(number, options) {
  options = this.prepareOptions(
    options,
    this.lookup("number.percentage.format"),
    this.lookup("number.format"),
    {precision: 3, separator: ".", delimiter: ""}
  );

  number = this.toNumber(number, options);
  return number + "%";
};

I18n.pluralizer = function(locale) {
  pluralizer = this.pluralizationRules[locale];
  if (pluralizer !== undefined) return pluralizer;
  return this.pluralizationRules["en"];
};

I18n.findAndTranslateValidNode = function(keys, translation) {
  for (i = 0; i < keys.length; i++) {
    key = keys[i];
    if (this.isValidNode(translation, key)) return translation[key];
  }
  return null;
};

I18n.pluralize = function(count, scope, options) {
  var translation;

  try {
    translation = this.lookup(scope, options);
  } catch (error) {}

  if (!translation) {
    return this.missingTranslation(scope);
  }

  var message;
  options = this.prepareOptions(options);
  options.count = count.toString();

  pluralizer = this.pluralizer(this.currentLocale());
  key = pluralizer(Math.abs(count));
  keys = ((typeof key == "object") && (key instanceof Array)) ? key : [key];

  message = this.findAndTranslateValidNode(keys, translation);
  if (message == null) message = this.missingTranslation(scope, keys[0]);

  return this.interpolate(message, options);
};

I18n.missingTranslation = function() {
  var message = '[missing "' + this.currentLocale()
    , count = arguments.length
  ;

  for (var i = 0; i < count; i++) {
    message += "." + arguments[i];
  }

  message += '" translation]';

  return message;
};

I18n.currentLocale = function() {
  return (I18n.locale || I18n.defaultLocale);
};

// shortcuts
I18n.t = I18n.translate;
I18n.l = I18n.localize;
I18n.p = I18n.pluralize;


I18n.translations = {"cs":{"js":{"share":{"topic":"sd\u00edlet odkaz na toto t\u00e9ma","post":"sd\u00edlet odkaz na tento p\u0159\u00edsp\u011bvek"},"edit":"upravit n\u00e1zev a kategorii p\u0159\u00edsp\u011bvku","not_implemented":"Tato fi\u010dura je\u0161t\u011b nen\u00ed implementovan\u00e1","no_value":"Ne","yes_value":"Ano","of_value":"z","generic_error":"Bohu\u017eel nastala chyba.","log_in":"P\u0159ihl\u00e1sit se","age":"V\u011bk","last_post":"Posledn\u00ed p\u0159\u00edsp\u011bvek","admin_title":"Administr\u00e1tor","flags_title":"Nahl\u00e1\u0161en\u00ed","show_more":"zobrazit v\u00edce","links":"Odkazy","faq":"FAQ","you":"Vy","ok":"ok","or":"nebo","suggested_topics":{"title":"Doporu\u010den\u00e1 t\u00e9mata"},"bookmarks":{"not_logged_in":"Pro p\u0159id\u00e1n\u00ed z\u00e1lo\u017eky se mus\u00edte p\u0159ihl\u00e1sit.","created":"Z\u00e1lo\u017eka byla p\u0159id\u00e1na.","not_bookmarked":"Tento p\u0159\u00edsp\u011bvek jste ji\u017e \u010detli. Klikn\u011bte pro p\u0159id\u00e1n\u00ed z\u00e1lo\u017eky.","last_read":"Tohle je posledn\u00ed ji\u017e p\u0159e\u010dten\u00fd p\u0159\u00edsp\u011bvek."},"new_topics_inserted":"{{count}} nov\u00fdch t\u00e9mat.","show_new_topics":"Klikn\u011bte pro zobrazen\u00ed.","preview":"n\u00e1hled","cancel":"zru\u0161it","save":"Ulo\u017eit zm\u011bny","saving":"Ukl\u00e1d\u00e1m...","saved":"Ulo\u017eeno!","user_action_descriptions":{"6":"Odpov\u011bdi"},"user":{"information":"Informace o u\u017eivateli","profile":"Profil","title":"U\u017eivatel","mute":"Ignorovat","edit":"Upravit nastaven\u00ed","download_archive":"st\u00e1hnout archiv m\u00fdch p\u0159\u00edsp\u011bvk\u016f","private_message":"Soukrom\u00e1 zpr\u00e1va","private_messages":"Zpr\u00e1vy","activity_stream":"Aktivita","preferences":"Nastaven\u00ed","bio":"O mn\u011b","change_password":"zm\u011bnit heslo","invited_by":"Pozn\u00e1nka od","trust_level":"V\u011brohodnost","change_username":{"action":"zm\u011bnit u\u017eivatelsk\u00e9 jm\u00e9no","title":"Zm\u011bnit u\u017eivatelsk\u00e9 jm\u00e9no","confirm":"Zm\u011bna u\u017eivatelsk\u00e9ho jm\u00e9na m\u016f\u017ee m\u00edt v\u00e1\u017en\u00e9 n\u00e1sledky. Opravdu to chcete ud\u011blat?","taken":"Toto u\u017eivatelsk\u00e9 jm\u00e9no je ji\u017e zabran\u00e9.","error":"Nastala chyba p\u0159i zm\u011bn\u011b u\u017eivatelsk\u00e9ho jm\u00e9na.","invalid":"U\u017eivatelsk\u00e9 jm\u00e9no je neplatn\u00e9. Mus\u00ed obsahovat pouze p\u00edsmena a \u010d\u00edslice."},"change_email":{"action":"zm\u011bnit emailovou adresu","title":"Zm\u011bnit emailovou adresu","taken":"Tato emailov\u00e1 adresa nen\u00ed k dispozici.","error":"Nastala chyba p\u0159i zm\u011bn\u011b emailov\u00e9 adresy. Nen\u00ed tato adresa ji\u017e pou\u017e\u00edvan\u00e1?","success":"Na zadanou adresu jsme zaslali email. N\u00e1sledujte, pros\u00edm, instrukce v tomto emailu."},"email":{"title":"Emailov\u00e1 adresa","instructions":"Va\u0161e emailov\u00e1 adresa nikdy nebude ve\u0159ejn\u011b zobrazena.","ok":"To vypad\u00e1 dob\u0159e. Za\u0161leme v\u00e1m email s potvrzen\u00edm.","invalid":"Pros\u00edm zadejte platnou emailovou adresu.","authenticated":"V\u00e1\u0161e emailov\u00e1 adresa byla autorizov\u00e1na p\u0159es slu\u017ebu {{provider}}.","frequency":"Budeme v\u00e1s informovat emailem pouze pokud jste se na na\u0161em webu dlouho neuk\u00e1zali a pokud jste obsah, o kter\u00e9m v\u00e1s chceme informovat, doposud nevid\u011bli."},"name":{"title":"Jm\u00e9no","instructions":"Del\u0161\u00ed verze va\u0161eho jm\u00e9na. Nemus\u00ed b\u00fdt unik\u00e1tn\u00ed.","too_short":"Va\u0161e jm\u00e9no je p\u0159\u00edli\u0161 kr\u00e1tk\u00e9.","ok":"Va\u0161e jm\u00e9no vypad\u00e1 dob\u0159e"},"username":{"title":"U\u017eivatelsk\u00e9 jm\u00e9no","instructions":"Ostatn\u00ed v\u00e1s mohou zm\u00ednit jako @{{username}}.","available":"Toto u\u017eivatelsk\u00e9 jm\u00e9no je voln\u00e9.","global_match":"Emailov\u00e1 adresa odpov\u00edd\u00e1 registrovan\u00e9ho u\u017eivatelsk\u00e9mu jm\u00e9nu.","global_mismatch":"ji\u017e zaregistrov\u00e1no. Co t\u0159eba {{suggestion}}?","not_available":"Nen\u00ed k dispozici. Co t\u0159eba {{suggestion}}?","too_short":"Va\u0161e u\u017eivatelsk\u00e9 jm\u00e9no je p\u0159\u00edli\u0161 kr\u00e1tk\u00e9.","too_long":"Va\u0161e u\u017eivatelsk\u00e9 jm\u00e9no je p\u0159\u00edli\u0161 dlouh\u00e9.","checking":"Zji\u0161\u0165uji, zda je u\u017eivatelsk\u00e9 jm\u00e9no voln\u00e9...","enter_email":"U\u017eivatelsk\u00e9 jm\u00e9no nalezeno. Zadejte odpov\u00eddaj\u00edc\u00ed emailovou adresu."},"last_posted":"Posledn\u00ed p\u0159\u00edsp\u011bvek","last_emailed":"Naposledy zasl\u00e1n email","last_seen":"Naposledy vid\u011bn","created":"\u00da\u010det vytvo\u0159en","log_out":"Odhl\u00e1sit","website":"Web","email_settings":"Emailov\u00e1 adresa","email_digests":{"title":"Chci dost\u00e1vat emailem souhrn novinek","daily":"denn\u011b","weekly":"t\u00fddn\u011b","bi_weekly":"jednou za 14 dn\u00ed"},"email_direct":"Chci dostat email kdy\u017e n\u011bkdo bude mluvit p\u0159\u00edmo se mnou","email_private_messages":"Chci dostat email kdy\u017e mi n\u011bkdo za\u0161le soukromou zpr\u00e1vu","other_settings":"Ostatn\u00ed","new_topic_duration":{"label":"Pova\u017eovat t\u00e9mata za nov\u00e1, pokud","not_viewed":"dosud jsem je nevid\u011bl","last_here":"byly zasl\u00e1ny od m\u00e9 posledn\u00ed n\u00e1v\u0161t\u011bvy","after_n_days":{"one":"byly zasl\u00e1ny v posledn\u00edm dni","other":"byly zasl\u00e1ny v posledn\u00edch {{count}} dnech"},"after_n_weeks":{"one":"byly zasl\u00e1ny v posledn\u00edm t\u00fddnu","other":"byly zasl\u00e1ny v posledn\u00edch {{count}} t\u00fddnech"}},"auto_track_topics":"Automaticky sledovat t\u00e9mata, kter\u00e1 nav\u0161t\u00edv\u00edm","auto_track_options":{"never":"nikdy","always":"v\u017edy","after_n_seconds":{"one":"po 1 vte\u0159in\u011b","other":"po {{count}} vte\u0159in\u00e1ch"},"after_n_minutes":{"one":"po 1 minut\u011b","other":"po {{count}} minut\u00e1ch"}},"invited":{"title":"Pozv\u00e1nky","user":"Pozvan\u00fd u\u017eivatel","none":"{{username}} nepozval na tento web \u017e\u00e1dn\u00e9 u\u017eivatele.","redeemed":"Uplatn\u011bn\u00e9 pozv\u00e1nky","redeemed_at":"Uplatn\u011bno","pending":"Nevy\u0159\u00edzen\u00e9 pozv\u00e1nky","topics_entered":"Zobrazeno t\u00e9mat","posts_read_count":"P\u0159e\u010dteno p\u0159\u00edsp\u011bvk\u016f","rescind":"Odstranit pozv\u00e1nku","rescinded":"Pozv\u00e1nka odstran\u011bna","time_read":"\u010cas \u010dten\u00ed","days_visited":"P\u0159\u00edtomen dn\u016f","account_age_days":"St\u00e1\u0159\u00ed \u00fa\u010dtu ve dnech"},"password":{"title":"Heslo","too_short":"Va\u0161e heslo je p\u0159\u00edli\u0161 kr\u00e1tk\u00e9.","ok":"Va\u0161e heslo je v po\u0159\u00e1dku."},"ip_address":{"title":"Posledn\u00ed IP adresa"},"avatar":{"title":"Avatar","instructions":"Pou\u017e\u00edv\u00e1me slu\u017ebu <a href='https://gravatar.com' target='_blank'>Gravatar</a> pro zobrazen\u00ed avataru podle va\u0161\u00ed emailov\u00e9 adresy"},"filters":{"all":"V\u0161e"},"stream":{"posted_by":"Zaslal","sent_by":"Odeslal","private_message":"soukrom\u00e1 zpr\u00e1va","the_topic":"t\u00e9ma"}},"loading":"Na\u010d\u00edt\u00e1m...","close":"Zav\u0159\u00edt","learn_more":"v\u00edce informac\u00ed...","year":"rok","year_desc":"t\u00e9mata za posledn\u00edch 365 dn\u00ed","month":"m\u011bs\u00edc","month_desc":"t\u00e9mata za posledn\u00edch 30 dn\u00ed","week":"t\u00fdden","week_desc":"t\u00e9mata za posledn\u00edch 7 dn\u00ed","first_post":"Prvn\u00ed p\u0159\u00edsp\u011bvek","mute":"Ignorovat","unmute":"Zru\u0161it ignorov\u00e1n\u00ed","best_of":{"title":"Nejlep\u0161\u00ed p\u0159\u00edsp\u011bvky","description":"V tomto t\u00e9matu je <b>{{count}}</b> p\u0159\u00edsp\u011bvk\u016f. A to u\u017e je hodn\u011b! Nechcete u\u0161et\u0159it \u010das p\u0159i \u010dten\u00ed t\u00edm, \u017ee zobraz\u00edte pouze p\u0159\u00edsp\u011bvky, kter\u00e9 maj\u00ed nejv\u00edce interakc\u00ed a odpov\u011bd\u00ed?","button":"P\u0159epnout na \"nejlep\u0161\u00ed p\u0159\u00edsp\u011bvky\""},"private_message_info":{"title":"Soukrom\u00e9 konverzace","invite":"pozvat \u00fa\u010dastn\u00edka"},"email":"Emailov\u00e1 adresa","username":"U\u017eivatelsk\u00e9 jm\u00e9no","last_seen":"Naposledy vid\u011bn","created":"\u00da\u010det vytvo\u0159en","trust_level":"V\u011brohodnost","create_account":{"title":"Vytvo\u0159it \u00fa\u010det","action":"Vytvo\u0159it!","invite":"Nem\u00e1te je\u0161t\u011b \u00fa\u010det?","failed":"N\u011bco se nepovedlo, mo\u017en\u00e1 je tato e-mailov\u00e1 adresa ji\u017e pou\u017eita. Zkuste pou\u017e\u00edt formul\u00e1\u0159 pro obnoven\u00ed hesla."},"forgot_password":{"title":"Zapomenut\u00e9 heslo","action":"Zapomn\u011bl jsem sv\u00e9 heslo","invite":"Vlo\u017ete svoje u\u017eivatelsk\u00e9 jm\u00e9no nebo e-mailovou adresu a my v\u00e1m za\u0161leme postup pro obnoven\u00ed hesla.","reset":"Obnovit heslo","complete":"M\u011bli byste obdr\u017eet email s instrukcemi jak obnovit va\u0161e heslo."},"login":{"title":"P\u0159ihl\u00e1sit se","username":"Login","password":"Heslo","email_placeholder":"emailov\u00e1 adresa nebo u\u017eivatelsk\u00e9 jm\u00e9no","error":"Nezn\u00e1m\u00e1 chyba","reset_password":"Resetovat heslo","logging_in":"P\u0159ihla\u0161uji...","or":"Nebo","authenticating":"Autorizuji...","awaiting_confirmation":"V\u00e1\u0161 \u00fa\u010det nyn\u00ed \u010dek\u00e1 na aktivaci, pou\u017eijte odkaz pro zapomen\u00e9 heslo, jestli chcete, abychom v\u00e1m zaslali dal\u0161\u00ed aktiva\u010dn\u00ed email.","awaiting_approval":"V\u00e1\u0161 \u00fa\u010det zat\u00edm nebyl schv\u00e1len moder\u00e1torem. A\u017e se tak stane, budeme v\u00e1s informovat emailem.","not_activated":"Je\u0161t\u011b se nem\u016f\u017eete p\u0159ihl\u00e1sit. Zaslali jsme v\u00e1m aktiva\u010dn\u00ed email v <b>{{sentTo}}</b>. Pros\u00edm n\u00e1sledujte instrukce v tomto emailu, abychom mohli v\u00e1\u0161 \u00fa\u010det aktivovat.","resend_activation_email":"Klikn\u011bte sem pro zasl\u00e1n\u00ed aktiva\u010dn\u00edho emailu.","sent_activation_email_again":"Zaslali jsme v\u00e1m dal\u0161\u00ed aktiva\u010dn\u00ed email na <b>{{currentEmail}}</b>. M\u016f\u017ee trvat n\u011bkolik minut, ne\u017e v\u00e1m doraz\u00ed. Zkontrolujte tak\u00e9 va\u0161i slo\u017eku s nevy\u017e\u00e1danou po\u0161lou.","google":{"title":"P\u0159ihl\u00e1sit p\u0159es Google","message":"Autorizuji p\u0159es Google (ujist\u011bte se, \u017ee nem\u00e1te zablokovan\u00e1 popup okna)"},"twitter":{"title":"P\u0159ihl\u00e1sit p\u0159es Twitter","message":"Autorizuji p\u0159es Twitter (ujist\u011bte se, \u017ee nem\u00e1te zablokovan\u00e1 popup okna)"},"facebook":{"title":"P\u0159ihl\u00e1sit p\u0159es Facebook","message":"Autorizuji p\u0159es Facebook (ujist\u011bte se, \u017ee nem\u00e1te zablokovan\u00e1 popup okna)"},"yahoo":{"title":"P\u0159ihl\u00e1sit p\u0159es Yahoo","message":"Autorizuji p\u0159es Yahoo (ujist\u011bte se, \u017ee nem\u00e1te zablokovan\u00e1 popup okna)"},"github":{"title":"\u0159ihl\u00e1sit p\u0159es Github","message":"Autorizuji p\u0159es Github (ujist\u011bte se, \u017ee nem\u00e1te zablokovan\u00e1 popup okna)"}},"composer":{"saving_draft_tip":"ukl\u00e1d\u00e1m","saved_draft_tip":"ulo\u017eeno","saved_local_draft_tip":"ulo\u017eeno lok\u00e1ln\u011b","min_length":{"at_least":"vlo\u017ete alespo\u0148 {{n}} znak\u016f","more":"{{n}} zb\u00fdv\u00e1..."},"save_edit":"Ulo\u017eit zm\u011bnu","reply":"Odpov\u011bd\u011bt","create_topic":"Vytvo\u0159it t\u00e9ma","create_pm":"Vytvo\u0159it soukromou zpr\u00e1vu","users_placeholder":"P\u0159idat u\u017eivatele","title_placeholder":"Sem napi\u0161te n\u00e1zev. O \u010dem je tato diskuze v jedn\u00e9 kr\u00e1tk\u00e9 v\u011bt\u011b","reply_placeholder":"Sem napi\u0161te svou odpov\u011b\u010f. Pro form\u00e1tov\u00e1n\u00ed pou\u017eijte Markdown nebo BBCode. M\u016f\u017eete sem p\u0159et\u00e1hnout nebo vlo\u017eit obr\u00e1zek a bude vlo\u017een do p\u0159\u00edsp\u011bvku.","view_new_post":"Zobrazit v\u00e1\u0161 nov\u00fd p\u0159\u00edsp\u011bvek.","saving":"Ukl\u00e1d\u00e1m...","saved":"Ulo\u017eeno!","saved_draft":"M\u00e1te rozepsan\u00fd p\u0159\u00edsp\u011bvek. Klikn\u011bte sem pro pokra\u010dov\u00e1n\u00ed v \u00faprav\u00e1ch.","uploading":"Nahr\u00e1v\u00e1m...","show_preview":"zobrazit n\u00e1hled &raquo;","hide_preview":"&laquo; skr\u00fdt n\u00e1hled"},"notifications":{"title":"ozn\u00e1men\u00ed o zm\u00ednk\u00e1ch pomoc\u00ed @name, odpov\u011bdi na va\u0161e p\u0159\u00edsp\u011bvky a t\u00e9mata, soukrom\u00e9 zpr\u00e1vy, atd.","none":"V tuto chv\u00edli nem\u00e1te \u017e\u00e1dn\u00e1 ozn\u00e1men\u00ed.","more":"zobrazit star\u0161\u00ed ozn\u00e1men\u00ed","mentioned":"<span title='mentioned' class='icon'>@</span> {{username}} {{link}}","quoted":"<i title='quoted' class='icon icon-quote-right'></i> {{username}} {{link}}","replied":"<i title='replied' class='icon icon-reply'></i> {{username}} {{link}}","posted":"<i title='replied' class='icon icon-reply'></i> {{username}} {{link}}","edited":"<i title='edited' class='icon icon-pencil'></i> {{username}} {{link}}","liked":"<i title='liked' class='icon icon-heart'></i> {{username}} {{link}}","private_message":"<i class='icon icon-lock' title='soukrom\u00e1 zpr\u00e1va'></i> {{username}} v\u00e1m zaslal soukromou zpr\u00e1vu: {{link}}","invited_to_private_message":"{{username}} v\u00e1s pozval do soukrom\u00e9 konverzace: {{link}}","invitee_accepted":"<i title='p\u0159ijet\u00ed pozv\u00e1nky' class='icon icon-signin'></i> {{username}} p\u0159ijal va\u0161i pozv\u00e1nku","moved_post":"<i title='p\u0159esunut\u00fd p\u0159\u00edsp\u011bvek' class='icon icon-arrow-right'></i> {{username}} p\u0159esunul p\u0159\u00edsp\u011bvek do {{link}}"},"image_selector":{"from_my_computer":"Z m\u00e9ho za\u0159\u00edzen\u00ed","from_the_web":"Z webu","add_image":"P\u0159idat obr\u00e1zek","remote_tip":"zadejte adresu obr\u00e1zku ve form\u00e1tu http://example.com/image.jpg","local_tip":"klikn\u011bte sem pro v\u00fdb\u011br obr\u00e1zku z va\u0161eho za\u0159\u00edzen\u00ed","upload":"Nahr\u00e1t","uploading_image":"Nahr\u00e1v\u00e1m obr\u00e1zek"},"search":{"title":"hled\u00e1n\u00ed t\u00e9mat, p\u0159\u00edsp\u011bvk\u016f, u\u017eivatel\u016f a kategori\u00ed","placeholder":"sem zadejte hledan\u00fd v\u00fdraz","no_results":"Nenalezeny \u017e\u00e1dn\u00e9 v\u00fdsledky.","searching":"Hled\u00e1m ..."},"site_map":"j\u00edt na jin\u00fd seznam t\u00e9mat nebo kategorii","go_back":"j\u00edt zp\u011bt","current_user":"j\u00edt na va\u0161i u\u017eivatelskou str\u00e1nku","favorite":{"title":"Obl\u00edben\u00e9","help":"p\u0159idat toto t\u00e9ma do obl\u00edben\u00fdch"},"topics":{"none":{"favorited":"Zat\u00edm nem\u00e1te \u017e\u00e1dn\u00e1 obl\u00edben\u00e1 t\u00e9mata. Pro p\u0159id\u00e1n\u00ed t\u00e9matu do obl\u00edben\u00fdch, klikn\u011bte na hv\u011bzdi\u010dku vedle n\u00e1zvu t\u00e9matu.","unread":"Nem\u00e1te \u017e\u00e1dn\u00e1 nep\u0159e\u010dten\u00e1 t\u00e9mata.","new":"Nem\u00e1te \u017e\u00e1dn\u00e1 nov\u00e1 t\u00e9mata ke \u010dten\u00ed.","read":"Zat\u00edm jste ne\u010detli \u017e\u00e1dn\u00e1 t\u00e9mata.","posted":"Zat\u00edm jste nep\u0159isp\u011bli do \u017e\u00e1dn\u00e9ho t\u00e9matu.","popular":"Nejsou tu \u017e\u00e1dn\u00e1 popul\u00e1rn\u00ed t\u00e9mata. To je docela smutn\u00e9.","category":"V kategorii {{category}} nejsou \u017e\u00e1dn\u00e1 t\u00e9mata."},"bottom":{"popular":"Nejsou tu \u017e\u00e1dn\u00e1 dal\u0161\u00ed popul\u00e1rn\u00ed t\u00e9mata k p\u0159e\u010dten\u00ed.","posted":"Nejsou tu \u017e\u00e1dn\u00e1 dal\u0161\u00ed zaslan\u00e1 t\u00e9mata k p\u0159e\u010dten\u00ed.","read":"Nejsou tu \u017e\u00e1dn\u00e1 dal\u0161\u00ed p\u0159e\u010dten\u00e1 t\u00e9mata.","new":"Nejsou tu \u017e\u00e1dn\u00e1 dal\u0161\u00ed nov\u00e1 t\u00e9mata k p\u0159e\u010dten\u00ed.","unread":"Nejsou tu \u017e\u00e1dn\u00e1 dal\u0161\u00ed nep\u0159e\u010dten\u00e1 t\u00e9mata.","favorited":"Nejsou tu \u017e\u00e1dn\u00e1 dal\u0161\u00ed obl\u00edben\u00e1 t\u00e9mata k p\u0159e\u010dten\u00ed.","category":"V kategorii {{category}} nejsou \u017e\u00e1dn\u00e1 dal\u0161\u00ed t\u00e9mata."}},"topic":{"create_in":"Nov\u00e9 t\u00e9ma v kategorii {{categoryName}}","create":"Nov\u00e9 t\u00e9ma","create_long":"Vytvo\u0159it nov\u00e9 t\u00e9ma","private_message":"Vytvo\u0159it soukromou konverzaci","list":"T\u00e9mata","new":"nov\u00e9 t\u00e9ma","title":"T\u00e9ma","loading_more":"Nahr\u00e1v\u00e1m v\u00edce t\u00e9mat...","loading":"Nahr\u00e1v\u00e1m t\u00e9ma...","invalid_access":{"title":"T\u00e9ma je soukrom\u00e9","description":"Bohu\u017eel nem\u00e1te p\u0159\u00edstup k tomuto t\u00e9matu."},"server_error":{"title":"T\u00e9ma se nepoda\u0159ilo na\u010d\u00edst","description":"Bohu\u017eel nen\u00ed mo\u017en\u00e9 na\u010d\u00edst toto t\u00e9ma, m\u016f\u017ee to b\u00fdt zp\u016fsobeno probl\u00e9mem s va\u0161\u00edm p\u0159ipojen\u00edm. Pros\u00edm, zkuste str\u00e1nku na\u010d\u00edst znovu. Pokud bude probl\u00e9m p\u0159etrv\u00e1vat, dejte n\u00e1m v\u011bd\u011bt."},"not_found":{"title":"T\u00e9ma nenalezeno","description":"Bohu\u017eel se n\u00e1m nepovedlo naj\u00edt toto t\u00e9ma. Nebylo odstran\u011bno moder\u00e1torem?"},"unread_posts":"m\u00e1te {{unread}} nep\u0159e\u010dten\u00fdch p\u0159\u00edsp\u011bvk\u016f v tomto t\u00e9matu","new_posts":"je zde {{new_posts}} nov\u00fdch p\u0159\u00edsp\u011bvk\u016f od doby, kdy jste toto t\u00e9ma naposledy \u010detli","likes":{"one":"je zde 1x 'l\u00edb\u00ed' v tomto t\u00e9matu","other":"je zde {{count}}x 'l\u00edb\u00ed' v tomto t\u00e9matu"},"back_to_list":"Zp\u00e1tky na seznam t\u00e9mat","options":"Mo\u017enosti","show_links":"zobrazit odkazy v tomto t\u00e9matu","toggle_information":"zobrazit/skr\u00fdt detaily t\u00e9matu","read_more_in_category":"Chcete si p\u0159e\u010d\u00edst dal\u0161\u00ed informace? Projd\u011bte si t\u00e9mata v {{catLink}} nebo {{popularLink}}.","read_more":"Chcete si p\u0159e\u010d\u00edst dal\u0161\u00ed informace? {{catLink}} nebo {{popularLink}}.","browse_all_categories":"Proch\u00e1zet v\u0161echny kategorie","view_popular_topics":"zobrazit popul\u00e1rn\u00ed t\u00e9mata","suggest_create_topic":"Co takhle zalo\u017eit nov\u00e9 t\u00e9ma?","read_position_reset":"Va\u0161e pozice \u010dten\u00ed byla zresetov\u00e1na.","jump_reply_up":"p\u0159ej\u00edt na p\u0159edchoz\u00ed odpov\u011b\u010f","jump_reply_down":"p\u0159ej\u00edt na n\u00e1sleduj\u00edc\u00ed odpov\u011b\u010f","progress":{"title":"pozice v t\u00e9matu","jump_top":"p\u0159ej\u00edt na prvn\u00ed p\u0159\u00edsp\u011bvek","jump_bottom":"p\u0159ej\u00edt na posledn\u00ed p\u0159\u00edsp\u011bvek","total":"celkem p\u0159\u00edsp\u011bvk\u016f","current":"aktu\u00e1ln\u00ed p\u0159\u00edsp\u011bvek"},"notifications":{"title":"","reasons":{"3_2":"Budete dost\u00e1vat ozn\u00e1men\u00ed, proto\u017ee hl\u00edd\u00e1te toto t\u00e9ma.","3_1":"Budete dost\u00e1vat ozn\u00e1men\u00ed, proto\u017ee jste autorem totoho t\u00e9matu.","3":"Budete dost\u00e1vat ozn\u00e1men\u00ed, proto\u017ee hl\u00edd\u00e1te toto t\u00e9ma.","2_4":"Budete dost\u00e1vat ozn\u00e1men\u00ed, proto\u017ee jste zaslal odpov\u011b\u010f do tohoto t\u00e9matu.","2_2":"Budete dost\u00e1vat ozn\u00e1men\u00ed, proto\u017ee sledujete toto t\u00e9ma.","2":"Budete dost\u00e1vat ozn\u00e1men\u00ed, proto\u017ee <a href=\"/users/{{username}}/preferences\">jste \u010detli toto t\u00e9ma</a>.","1":"Dostanete ozn\u00e1men\u00ed, jestli\u017ee v\u00e1s n\u011bkdo zm\u00edn\u00ed pomoc\u00ed @name nebo odpov\u00ed na v\u00e1\u0161 p\u0159\u00edsp\u011bvek.","1_2":"Dostanete ozn\u00e1men\u00ed, jestli\u017ee v\u00e1s n\u011bkdo zm\u00edn\u00ed pomoc\u00ed @name nebo odpov\u00ed na v\u00e1\u0161 p\u0159\u00edsp\u011bvek.","0":"Ignorujete v\u0161echna ozn\u00e1men\u00ed z tohoto t\u00e9matu.","0_2":"Ignorujete v\u0161echna ozn\u00e1men\u00ed z tohoto t\u00e9matu."},"watching":{"title":"Hl\u00edd\u00e1n\u00ed","description":"stejn\u00e9 jako 'Sledov\u00e1n\u00ed' a nav\u00edc dostanete upozorn\u011bn\u00ed o v\u0161ech nov\u00fdch p\u0159\u00edsp\u011bvc\u00edch."},"tracking":{"title":"Sledov\u00e1n\u00ed","description":"dostanete ozn\u00e1men\u00ed o nep\u0159e\u010dten\u00fdch p\u0159\u00edsp\u011bvc\u00edch, zm\u00ednk\u00e1ch p\u0159es @name a odpov\u011bd\u00edch na v\u00e1\u0161 p\u0159\u00edsp\u011bvek."},"regular":{"title":"Norm\u00e1ln\u00ed","description":"dostanete ozn\u00e1men\u00ed, jestli\u017ee v\u00e1s n\u011bkdo zm\u00edn\u00ed pomoc\u00ed @name nebo odpov\u00ed na v\u00e1\u0161 p\u0159\u00edsp\u011bvek."},"muted":{"title":"Zti\u0161en\u00ed","description":"nebudete v\u016fbec dost\u00e1vat ozn\u00e1men\u00ed o tomto t\u00e9matu a nebude se zobrazovat v seznamu nep\u0159e\u010dten\u00fdch t\u00e9mat."}},"actions":{"delete":"Odstranit t\u00e9ma","open":"Otev\u0159\u00edt t\u00e9ma","close":"Zav\u0159\u00edt t\u00e9ma","unpin":"Odstranit p\u0159ipevn\u011bn\u00ed","pin":"P\u0159ipevnit t\u00e9ma","unarchive":"Navr\u00e1tit z archivu","archive":"Archivovat t\u00e9ma","invisible":"Zneviditelnit","visible":"Zviditelnit","reset_read":"Resetovat data o p\u0159e\u010dten\u00ed","multi_select":"Zapnout/vypnout multi-v\u00fdb\u011br","convert_to_topic":"P\u0159ev\u00e9st na b\u011b\u017en\u00e9 t\u00e9ma"},"reply":{"title":"Odpov\u011bd\u011bt","help":"za\u010dn\u011bte ps\u00e1t odpov\u011b\u010f na toto t\u00e9ma"},"share":{"title":"Sd\u00edlet","help":"sd\u00edlet odkaz na toto t\u00e9ma"},"inviting":"Odes\u00edl\u00e1m pozv\u00e1nku...","invite_private":{"title":"Pozvat do soukrom\u00e9 konverzace","email_or_username":"Email nebo u\u017eivatelsk\u00e9 jm\u00e9no pozvan\u00e9ho","email_or_username_placeholder":"emailov\u00e1 adresa nebo u\u017eivatelsk\u00e9 jm\u00e9no","action":"Pozvat","success":"D\u011bkujeme! Pozvali jste dan\u00e9ho u\u017eivatele, aby se \u00fa\u010dastnil t\u00e9to soukrom\u00e9 konverzace.","error":"Bohu\u017eel nastala chyba p\u0159i odes\u00edl\u00e1n\u00ed pozv\u00e1nky."},"invite_reply":{"title":"Pozvat p\u0159\u00e1tele k odpov\u011bdi","help":"odeslat pozv\u00e1nku p\u0159\u00e1tel\u016fm, aby mohli na toto t\u00e9ma odpov\u011bd\u011bt jedn\u00edm kliknut\u00edm","email":"Ode\u0161leme va\u0161emu p\u0159\u00edteli kr\u00e1tk\u00fd email s odkazem na mo\u017enost p\u0159\u00edmo odpov\u011bd\u011bt na toto t\u00e9ma.","email_placeholder":"emailov\u00e1 adresa","success":"D\u00edky! Odeslali jsme pozv\u00e1nku na <b>{{email}}</b>. D\u00e1me v\u00e1m v\u011bd\u011bt, a\u017e bude pozv\u00e1nka vyzvednuta. Na z\u00e1lo\u017ece pozv\u00e1nek na va\u0161\u00ed u\u017eivatelsk\u00e9 str\u00e1nce m\u016f\u017eete sledovat koho jste pozvali.","error":"Bohu\u017eel se nepoda\u0159ilo pozvat tuto osobu. Nen\u00ed ji\u017e registrovan\u00fdm u\u017eivatelem?"},"login_reply":"P\u0159ihla\u0161te se, chcete-li odpov\u011bd\u011bt","filters":{"user":"Jsou zobrazeny pouze p\u0159\u00edsp\u011bvky od dan\u00fdch u\u017eivatel\u016f.","best_of":"Jsou zobrazeny pouze 'nejlep\u0161\u00ed' p\u0159\u00edsp\u011bvky.","cancel":"Zobraz\u00ed znovu v\u0161echny p\u0159\u00edsp\u011bvky v tomto t\u00e9matu."},"move_selected":{"title":"P\u0159esunout ozna\u010den\u00e9 p\u0159\u00edsp\u011bvky","topic_name":"N\u00e1zev nov\u00e9ho t\u00e9matu:","error":"Bohu\u017eel nastala chyba p\u0159i p\u0159esouv\u00e1n\u00ed p\u0159\u00edsp\u011bvk\u016f.","instructions":{"one":"Chyst\u00e1te se vytvo\u0159it nov\u00e9 t\u00e9ma a naplnit ho p\u0159\u00edsp\u011bvkem, kter\u00fd jste ozna\u010dili.","other":"Chystate se vytvo\u0159it not\u00e9 t\u00e9ma a naplnit ho <b>{{count}}</b> p\u0159\u00edsp\u011bvky, kter\u00e9 jste ozna\u010dili."}},"multi_select":{"select":"ozna\u010dit","selected":"ozna\u010deno ({{count}})","delete":"odstranit ozna\u010den\u00e9","cancel":"zru\u0161it ozna\u010dov\u00e1n\u00ed","move":"p\u0159esunout ozna\u010den\u00e9","description":{"one":"M\u00e1te ozna\u010den <b>1</b> p\u0159\u00edsp\u011bvek.","other":"M\u00e1te ozna\u010deno <b>{{count}}</b> p\u0159\u00edsp\u011bvk\u016f."}}},"post":{"reply":"Odpov\u00edd\u00e1te na {{link}} od {{replyAvatar}} {{username}}","reply_topic":"Odpov\u011b\u010f na {{link}}","edit":"Editovat {{link}}","in_reply_to":"v odpov\u011bdi na","reply_as_new_topic":"Odpov\u011bd\u011bt jako nov\u00e9 t\u00e9ma","continue_discussion":"Pokra\u010duj\u00edc\u00ed diskuze z {{postLink}}:","follow_quote":"p\u0159ej\u00edt na citovan\u00fd p\u0159\u00edsp\u011bvek","deleted_by_author":"(p\u0159\u00edsp\u011bvek odstran\u011bn autorem)","has_replies":{"one":"Odpov\u011b\u010f","other":"Odpov\u011bdi"},"errors":{"create":"Bohu\u017eel nastala chyba p\u0159i vytv\u00e1\u0159en\u00ed p\u0159\u00edsp\u011bvku. Pros\u00edm zkuste to znovu.","edit":"Bohu\u017eel nastala chyba p\u0159i editaci p\u0159\u00edsp\u011bvku. Pros\u00edm zkuste to znovu.","upload":"Bohu\u017eel nastala chyba p\u0159i nahr\u00e1v\u00e1n\u00ed p\u0159\u00edsp\u011bvku. Pros\u00edm zkuste to znovu."},"abandon":"Opravdu chcete opustit v\u00e1\u0161 p\u0159\u00edsp\u011bvek?","archetypes":{"save":"Ulo\u017eit nastaven\u00ed"},"controls":{"reply":"otev\u0159e okno pro seps\u00e1n\u00ed odpov\u011bdi na tento p\u0159\u00edsp\u011bvek","like":"to se mi l\u00edb\u00ed","edit":"upravit p\u0159\u00edsp\u011bvek","flag":"nahl\u00e1sit p\u0159\u00edsp\u011bvek moder\u00e1torovi","delete":"smazat p\u0159\u00edsp\u011bvek","undelete":"obnovit p\u0159\u00edsp\u011bvek","share":"sd\u00edlet odkaz na tento p\u0159\u00edsp\u011bvek","bookmark":"p\u0159idat z\u00e1lo\u017eku na tento p\u0159\u00edsp\u011bvek na va\u0161i u\u017eivatelskou str\u00e1nku","more":"V\u00edce"},"actions":{"flag":"Nahl\u00e1sit","clear_flags":{"one":"Odebrat nahl\u00e1\u0161en\u00ed","other":"Odebrat nahl\u00e1\u0161en\u00ed"},"it_too":"{{alsoName}} tak\u00e9","undo":"Zru\u0161it {{alsoName}}","by_you_and_others":{"zero":"Vy {{long_form}}","one":"Vy a 1 dal\u0161\u00ed \u010dlov\u011bk {{long_form}}","other":"Vy a {{count}} dal\u0161\u00edch lid\u00ed {{long_form}}"},"by_others":{"one":"1 \u010dlov\u011bk {{long_form}}","other":"{{count}} lid\u00ed {{long_form}}"}},"edits":{"one":"1 \u00faprava","other":"{{count}} \u00faprav","zero":"\u017e\u00e1dn\u00e9 \u00fapravy"},"delete":{"confirm":{"one":"Opravdu chcete odstranit tento p\u0159\u00edsp\u011bvek?","other":"Opravdu chcete odstranit v\u0161echny tyto p\u0159\u00edsp\u011bvky?"}}},"category":{"none":"(bez kategorie)","edit":"upravit","edit_long":"Upravit kategorii","view":"Zobrazit t\u00e9mata v kategorii","delete":"Smazat kategorii","create":"Nov\u00e1 kategorie","more_posts":"zobrazit v\u0161echny {{posts}}...","name":"N\u00e1zev kategorie","description":"Popis","topic":"t\u00e9ma kategorie","color":"Barva","name_placeholder":"M\u011bl by b\u00fdt kr\u00e1tk\u00fd a v\u00fdsti\u017en\u00fd.","color_placeholder":"Jak\u00e1koliv webov\u00e1 barva","delete_confirm":"Opravdu chcete odstranit tuto kategorii?","list":"Seznam kategori\u00ed","no_description":"K t\u00e9to kategorii zat\u00edm nen\u00ed \u017e\u00e1dn\u00fd popis.","change_in_category_topic":"nav\u0161tivte t\u00e9ma kategorie pro editaci jej\u00edho popisu"},"flagging":{"title":"Pro\u010d chcete nahl\u00e1sit tento p\u0159\u00edsp\u011bvek?","action":"Nahl\u00e1sit p\u0159\u00edsp\u011bvek","cant":"Bohu\u017eel nyn\u00ed nem\u016f\u017eete tento p\u0159\u00edsp\u011bvek nahl\u00e1sit.","custom_placeholder":"Pro\u010d p\u0159\u00edsp\u011bvek vy\u017eaduje pozornost moder\u00e1tora? Dejte n\u00e1m v\u011bd\u011bt, co konkr\u00e9tn\u011b v\u00e1s znepokojuje, a poskytn\u011bte relevantn\u00ed odkazy, je-li to mo\u017en\u00e9.","custom_message":{"at_least":"zadejte alespo\u0148 {{n}} znak\u016f","more":"je\u0161t\u011b {{n}}...","left":"{{n}} zb\u00fdv\u00e1"}},"topic_summary":{"title":"Souhrn t\u00e9matu","links_shown":"zobrazit v\u0161ech {{totalLinks}} odkaz\u016f..."},"topic_statuses":{"locked":{"help":"toto t\u00e9ma je uzav\u0159en\u00e9; dal\u0161\u00ed odpov\u011bdi nebudou p\u0159ij\u00edm\u00e1ny"},"pinned":{"help":"toto t\u00e9ma je p\u0159ipevn\u011bn\u00e9; bude se zobrazovat na vrcholu seznamu ve sv\u00e9 kategorii"},"archived":{"help":"toto t\u00e9ma je archivov\u00e1no; je zmra\u017eeno a nelze ho ji\u017e m\u011bnit"},"invisible":{"help":"toto t\u00e9ma je neviditeln\u00e9; nebude se zobrazovat v seznamu t\u00e9mat a lze ho nav\u0161t\u00edvit pouze p\u0159es p\u0159\u00edm\u00fd odkaz"}},"posts":"p\u0159\u00edsp\u011bvky","posts_long":"{{number}} p\u0159\u00edsp\u011bvk\u016f v tomto t\u00e9matu","original_post":"P\u016fvodn\u00ed p\u0159\u00edsp\u011bvek","views":"Zobrazen\u00ed","replies":"Odpov\u011bdi","views_long":"toto t\u00e9ma bylo zobrazeno {{number}}kr\u00e1t","activity":"Aktivita","likes":"l\u00edb\u00ed se","top_contributors":"\u00da\u010dastn\u00edci","category_title":"Kategorie","categories_list":"Seznam kategori\u00ed","filters":{"popular":{"title":"Popul\u00e1rn\u00ed","help":"popul\u00e1rn\u00ed t\u00e9mata z posledn\u00ed doby"},"favorited":{"title":"Obl\u00edben\u00e1","help":"t\u00e9mata, kter\u00e1 jste ozna\u010dili jako obl\u00edben\u00e1"},"read":{"title":"P\u0159e\u010dten\u00e1","help":"t\u00e9mata, kter\u00e1 jste si p\u0159e\u010detli"},"categories":{"title":"Kategorie","title_in":"Kategorie - {{categoryName}}","help":"v\u0161echny t\u00e9mata seskupen\u00e1 podle kategorie"},"unread":{"title":{"zero":"Nep\u0159e\u010dten\u00e1","one":"Nep\u0159e\u010dten\u00e1 (1)","other":"Nep\u0159e\u010dten\u00e1 ({{count}})"},"help":"sledovan\u00e1 t\u00e9mata s nep\u0159e\u010dten\u00fdmi p\u0159\u00edsp\u011bvky"},"new":{"title":{"zero":"Nov\u00e1","one":"Nov\u00e1 (1)","other":"Nov\u00e1 ({{count}})"},"help":"nov\u00e1 t\u00e9mata od va\u0161\u00ed posledn\u00ed n\u00e1v\u0161t\u011bvy a nov\u00e9 p\u0159\u00edsp\u011bvky v t\u00e9matech, kter\u00e1 sledujete"},"posted":{"title":"M\u00e9 p\u0159\u00edsp\u011bvky","help":"t\u00e9mata, do kter\u00fdch jste p\u0159isp\u011bli"},"category":{"title":{"zero":"{{categoryName}}","one":"{{categoryName}} (1)","other":"{{categoryName}} ({{count}})"},"help":"popul\u00e1rn\u00ed t\u00e9mata v kategorii {{categoryName}}"}},"type_to_filter":"zadejte text pro filtrov\u00e1n\u00ed...","admin":{"title":"Discourse Administrace","dashboard":{"title":"Administr\u00e1torsk\u00fd rozcestn\u00edk","welcome":"V\u00edtejte v administr\u00e1torsk\u00e9 sekci.","version":"Verze Discourse","up_to_date":"Pou\u017e\u00edv\u00e1te nejnov\u011bj\u0161\u00ed verzi Discourse.","critical_available":"Je k dispozici d\u016fle\u017eit\u00e1 aktualizace.","updates_available":"Jsou k dispozici aktualizace.","please_upgrade":"Pros\u00edm aktualizujte!","latest_version":"Posledn\u00ed verze","update_often":"Pros\u00edm aktualizujte \u010dasto!"},"flags":{"title":"Nahl\u00e1\u0161en\u00ed","old":"Star\u00e9","active":"Aktivn\u00ed","clear":"Vynulovat nahl\u00e1\u0161en\u00ed","clear_title":"zru\u0161it v\u0161echna nahl\u00e1\u0161en\u00ed na tomto p\u0159\u00edsp\u011bvku (zviditeln\u00ed p\u0159\u00edsp\u011bvek, byl-li skryt\u00fd)","delete":"Odstranit p\u0159\u00edsp\u011bvek","delete_title":"odstranit p\u0159\u00edsp\u011bvek (sma\u017ee cel\u00e9 t\u00e9ma, je-li to prvn\u00ed p\u0159\u00edsp\u011bvek v t\u00e9matu)","flagged_by":"Nahl\u00e1sil"},"customize":{"title":"P\u0159izp\u016fsoben\u00ed","header":"Hlavi\u010dka","css":"Stylesheet","override_default":"P\u0159et\u00ed\u017eit v\u00fdchoz\u00ed?","enabled":"Zapnut\u00fd?","preview":"n\u00e1hled","undo_preview":"zru\u0161it n\u00e1hled","save":"Ulo\u017eit","delete":"Smazat","delete_confirm":"Smazat toto p\u0159izp\u016fsoben\u00ed?"},"email_logs":{"title":"Z\u00e1znamy o emailech","sent_at":"Odesl\u00e1no","email_type":"Typ emailu","to_address":"Komu","test_email_address":"testovac\u00ed emailov\u00e1 adresa","send_test":"odeslat testovac\u00ed email","sent_test":"odesl\u00e1no!"},"impersonate":{"title":"Vyd\u00e1vat se za u\u017eivatele","username_or_email":"U\u017eivatelsk\u00e9 jm\u00e9no nebo emailov\u00e1 adresa","help":"Pou\u017eijte tento n\u00e1stroj k p\u0159ihl\u00e1\u0161en\u00ed za jin\u00e9ho u\u017eivatele pro lad\u00edc\u00ed a v\u00fdvojov\u00e9 pot\u0159eby.","not_found":"Tento u\u017eivatel nebyl nalezen.","invalid":"Bohu\u017eel za tohoto u\u017eivatele se nem\u016f\u017eete vyd\u00e1vat."},"users":{"title":"U\u017eivatel\u00e9","create":"P\u0159idat administr\u00e1tora","last_emailed":"Email naposledy zasl\u00e1n","not_found":"Bohu\u017eel u\u017eivatel s t\u00edmto jm\u00e9nem nen\u00ed v na\u0161em syst\u00e9mu.","new":"Nov\u00fd","active":"Aktivn\u00ed","pending":"\u010cek\u00e1 na schv\u00e1len\u00ed","approved":"Schv\u00e1len?","approved_selected":{"one":"schv\u00e1lit u\u017eivatele","other":"schv\u00e1lit u\u017eivatele ({{count}})"}},"user":{"ban_failed":"Nastala chyba p\u0159i zakazov\u00e1n\u00ed u\u017eivatele {{error}}","unban_failed":"Nastala chyba p\u0159i povolov\u00e1n\u00ed u\u017eivatele {{error}}","ban_duration":"Jak dlouho m\u00e1 z\u00e1kaz platit? (dny)","delete_all_posts":"Smazat v\u0161echny p\u0159\u00edsp\u011bvky","ban":"Zak\u00e1zat","unban":"Povolit","banned":"Zak\u00e1z\u00e1n?","moderator":"Moder\u00e1tor?","admin":"Administr\u00e1tor?","show_admin_profile":"Administrace","refresh_browsers":"Vynutit obnoven\u00ed prohl\u00ed\u017ee\u010de","show_public_profile":"Zobrazit ve\u0159ejn\u00fd profil","impersonate":"Vyd\u00e1vat se za u\u017eivatele","revoke_admin":"Odebrat administr\u00e1torsk\u00e1 pr\u00e1va","grant_admin":"Ud\u011blit administr\u00e1torsk\u00e1 pr\u00e1va","revoke_moderation":"Odebrat moder\u00e1torsk\u00e1 pr\u00e1va","grant_moderation":"Ud\u011blit moder\u00e1torsk\u00e1 pr\u00e1va","basics":"Z\u00e1kladn\u00ed informace","reputation":"Reputace","permissions":"Povolen\u00ed","activity":"Aktivita","like_count":"Obdr\u017eel 'l\u00edb\u00ed'","private_topics_count":"Po\u010det soukrom\u00e1ch t\u00e9mat","posts_read_count":"P\u0159e\u010dteno p\u0159\u00edsp\u011bvk\u016f","post_count":"Vytvo\u0159eno p\u0159\u00edsp\u011bvk\u016f","topics_entered":"Zobrazil t\u00e9mat","flags_given_count":"Ud\u011bleno nahl\u00e1\u0161en\u00ed","flags_received_count":"P\u0159ijato nahl\u00e1\u0161en\u00ed","approve":"Schv\u00e1lit","approved_by":"schv\u00e1lil","time_read":"\u010cas \u010dten\u00ed"},"site_settings":{"show_overriden":"Zobrazit pouze p\u0159enastaven\u00e9","title":"Nastaven\u00ed webu","reset":"vr\u00e1tit do p\u016fvodn\u00edho nastaven\u00ed"}}}}};
I18n.locale = 'cs'
;
