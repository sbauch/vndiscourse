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


I18n.translations = {"sv":{"js":{"share":{"topic":"dela en l\u00e4nk till denna tr\u00e5d","post":"dela en l\u00e4nk till denna tr\u00e5d"},"edit":"\u00e4ndra titel och kategori f\u00f6r denna tr\u00e5d","not_implemented":"Den funktionen har inte implementerats \u00e4n, tyv\u00e4rr!","no_value":"Nej","yes_value":"Ja","of_value":"av","generic_error":"Tyv\u00e4rr, ett fel har uppst\u00e5tt.","log_in":"Logga In","age":"\u00c5lder","last_post":"Sista inl\u00e4gget","admin_title":"Admin","flags_title":"Flaggningar","show_more":"visa mer","links":"L\u00e4nkar","faq":"FAQ","you":"Du","ok":"ok","or":"eller","suggested_topics":{"title":"F\u00f6reslagna Tr\u00e5dar"},"bookmarks":{"not_logged_in":"Tyv\u00e4rr m\u00e5ste du vara inloggad f\u00f6r att bokm\u00e4rka inl\u00e4gg.","created":"Du har bokm\u00e4rkt detta inl\u00e4gg.","not_bookmarked":"Du har l\u00e4st detta inl\u00e4gg; klicka f\u00f6r att bokm\u00e4rka det.","last_read":"Detta \u00e4r det sista inl\u00e4gget du l\u00e4st."},"new_topics_inserted":"{{count}} nya tr\u00e5dar.","show_new_topics":"Klicka f\u00f6r att visa.","preview":"f\u00f6rhandsgranska","cancel":"avbryt","save":"Spara \u00c4ndringar","saving":"Sparar...","saved":"Sparat!","user_action_descriptions":{"6":"Svar"},"user":{"information":"Anv\u00e4ndarinformation","profile":"Profil","title":"Anv\u00e4ndare","mute":"D\u00e4mpa","edit":"\u00c4ndra Inst\u00e4llningar","download_archive":"ladda ner ett arkiv med mina inl\u00e4gg","private_message":"Privata Meddelanden","private_messages":"Meddelanden","activity_stream":"Aktivitet","preferences":"Inst\u00e4llningar","bio":"Om mig","change_password":"byt","invited_by":"Inbjuden AV","trust_level":"P\u00e5litlighetsniv\u00e5","change_username":{"action":"byt","title":"Byt Anv\u00e4ndarnamn","confirm":"Det kan finnas konsekvenser till att byta ditt anv\u00e4ndarnamn. \u00c4r du helt s\u00e4ker p\u00e5 att du vill?","taken":"Tyv\u00e4rr det anv\u00e4ndarnamn \u00e4r taget.","error":"Det uppstod ett problem under bytet av ditt anv\u00e4ndarnamn.","invalid":"Det anv\u00e4ndarnamnet \u00e4r ogiltigt. Det f\u00e5r bara inneh\u00e5lla siffror och bokst\u00e4ver"},"change_email":{"action":"byt","title":"Byt E-post","taken":"Tyv\u00e4rr den adressen \u00e4r inte tillg\u00e4nglig.","error":"Det uppstod ett problem under bytet av din e-post. \u00c4r kanske adressen redan upptagen?","success":"Vi har skickat ett mail till den adressen. Var god f\u00f6lj bekr\u00e4ftelseinstruktionerna."},"email":{"title":"E-post","instructions":"Din e-postadress kommer aldrig att visas f\u00f6r allm\u00e4nheten.","ok":"Ser bra ut. Vi kommer maila dig f\u00f6r att bekr\u00e4fta.","invalid":"Vad god ange en giltig e-postadress.","authenticated":"Din e-post har verifierats av {{provider}}.","frequency":"Vi kommer bara maila dig om vi inte har sett dig nyligen och du inte redan sett det vi mailar dig om."},"name":{"title":"Namn","instructions":"Den l\u00e4ngre versionen av ditt namn; beh\u00f6ver inte vara unikt. Anv\u00e4nds som ett alternativt @namn och visas bara p\u00e5 din anv\u00e4ndarsida.","too_short":"Ditt namn \u00e4r f\u00f6r kort.","ok":"Ditt namn ser bra ut."},"username":{"title":"Anv\u00e4ndarnamn","instructions":"Personer kan omn\u00e4mna dig som @{{username}}.","available":"Ditt anv\u00e4ndarnamn \u00e4r tillg\u00e4ngligt.","global_match":"E-posten matchar det registrerade anv\u00e4ndarnamnet.","global_mismatch":"Redan registrerat. Prova {{suggestion}}?","not_available":"Inte tillg\u00e4ngligt. Prova {{suggestion}}?","too_short":"Ditt anv\u00e4ndarnamn \u00e4r f\u00f6r kort.","too_long":"Ditt anv\u00e4ndarnamn \u00e4r f\u00f6r l\u00e5ngt.","checking":"Kollar anv\u00e4ndarnamnets tillg\u00e4nglighet...","enter_email":"Anv\u00e4ndarnamn hittat. Ange matchande e-post."},"last_posted":"Senaste Inl\u00e4gg","last_emailed":"Senast Mailad","last_seen":"Senast Sedd","created":"Skapad Vid","log_out":"Logga Ut","website":"Webbplats","email_settings":"E-post","email_digests":{"title":"N\u00e4r jag inte bes\u00f6ker sidan, skicka mig ett sammandrag via mail om vad som \u00e4r nytt","daily":"dagligen","weekly":"veckovis","bi_weekly":"varannan vecka"},"email_direct":"Ta emot ett mail n\u00e4r n\u00e5gon citerar dig, svarar p\u00e5 dina inl\u00e4gg, eller n\u00e4mner ditt @anv\u00e4ndarnamn","email_private_messages":"Ta emot ett mail n\u00e4r n\u00e5gon skickar dig ett privat meddelande","other_settings":"\u00d6vrigt","new_topic_duration":{"label":"Betrakta tr\u00e5dar som nya n\u00e4r","not_viewed":"Jag inte har kollat p\u00e5 dem \u00e4n","last_here":"de postades efter jag var h\u00e4r sist","after_n_days":{"one":"de postades det senaste dygnet","other":"de postades inom de senaste {{count}} dagarna"},"after_n_weeks":{"one":"de postades den senaste veckan","other":"de postades inom de senaste {{count}} veckorna"}},"auto_track_topics":"F\u00f6lj automatiskt tr\u00e5dar jag bes\u00f6ker","auto_track_options":{"never":"aldrig","always":"alltid","after_n_seconds":{"one":"efter 1 sekund","other":"efter {{count}} sekunder"},"after_n_minutes":{"one":"efter 1 minut","other":"efter {{count}} minuter"}},"invited":{"title":"Inbjudningar","user":"Inbjuden Anv\u00e4ndare","none":"{{username}} har inte bjudit in n\u00e5gra anv\u00e4ndare till webbplatsen.","redeemed":"Inl\u00f6sta Inbjudnignar","redeemed_at":"Inl\u00f6st Vid","pending":"Avvaktande Inbjudningar","topics_entered":"Tr\u00e5dar Bes\u00f6kta","posts_read_count":"Inl\u00e4gg L\u00e4sta","rescind":"Ta Bort Inbjudan","rescinded":"Inbjudan borttagen","time_read":"L\u00e4stid","days_visited":"Dagar Bes\u00f6kta","account_age_days":"Konto\u00e5lder i dagar"},"password":{"title":"L\u00f6senord","too_short":"Ditt l\u00f6senord \u00e4r f\u00f6r kort.","ok":"Ditt l\u00f6senord ser bra ut."},"ip_address":{"title":"Senaste IP-adress"},"avatar":{"title":"Profilbild","instructions":"Vi anv\u00e4nder <a href='https://gravatar.com' target='_blank'>Gravatar</a> f\u00f6r profilbilder baserat p\u00e5 din e-post"},"filters":{"all":"Alla"},"stream":{"posted_by":"Postat av","sent_by":"Skickat av","private_message":"privat meddelande","the_topic":"tr\u00e5den"}},"loading":"Laddar...","close":"St\u00e4ng","learn_more":"l\u00e4r dig mer...","year":"\u00e5r","year_desc":"tr\u00e5dar postade i de senaste 365 dagarna","month":"m\u00e5nad","month_desc":"tr\u00e5dar postade i de senaste 30 dagarna","week":"vecka","week_desc":"tr\u00e5dar postade i de senaste 7 dagarna","first_post":"F\u00f6rsta inl\u00e4gget","mute":"D\u00e4mpa","unmute":"Avd\u00e4mpa","best_of":{"title":"B\u00e4st Av","description":"Det finns <b>{{count}}</b> inl\u00e4gg i den h\u00e4r tr\u00e5den. Det \u00e4r m\u00e5nga! Vill du spara tid genom att byta s\u00e5 du bara ser de inl\u00e4gg med flest interaktioner och svar?","button":"Byt till \"B\u00e4st Av\"-l\u00e4get"},"private_message_info":{"title":"Privat Konversation","invite":"Bjud In Andra..."},"email":"E-post","username":"Anv\u00e4ndarnamn","last_seen":"Senast Sedd","created":"Skapad","trust_level":"P\u00e5litlighetsniv\u00e5","create_account":{"title":"Skapa Konto","action":"Skapa ett nu!","invite":"har du inget konto \u00e4n?","failed":"N\u00e5got gick fel, kanske \u00e4r denna e-post redan registrerad, f\u00f6rs\u00f6k gl\u00f6mt l\u00f6senordsl\u00e4nken"},"forgot_password":{"title":"Gl\u00f6mt L\u00f6senord","action":"Jag har gl\u00f6mt mitt l\u00f6senord","invite":"Skriv in ditt anv\u00e4ndarnamn eller e-postadress, s\u00e5 vi skickar dig ett mail om l\u00f6senords\u00e5terst\u00e4llning.","reset":"\u00c5terst\u00e4ll L\u00f6senord","complete":"Du borde f\u00e5 ett mail med instruktioner om hur du \u00e5terst\u00e4ller ditt l\u00f6senord inom kort."},"login":{"title":"Logga In","username":"Inloggning","password":"L\u00f6senord","email_placeholder":"e-postadress eller anv\u00e4ndarnamn","error":"Ok\u00e4nt fel","reset_password":"\u00c5terst\u00e4ll L\u00f6senord","logging_in":"Loggar In...","or":"Eller","authenticating":"Autentiserar...","awaiting_confirmation":"Ditt konto v\u00e4ntar p\u00e5 aktivering, anv\u00e4nd gl\u00f6mt l\u00f6senordsl\u00e4nken f\u00f6r att skicka ett nytt aktiveringsmail.","awaiting_approval":"Ditt konto har inte godk\u00e4nts av en moderator \u00e4n. Du kommer att f\u00e5 ett mail n\u00e4r det \u00e4r godk\u00e4nt.","not_activated":"Du kan inte logga in \u00e4n. Vi har tidigare skickat ett aktiveringsmail till dig via <b>{{sentTo}}</b>. Var god f\u00f6lj instruktionerna i det mailet f\u00f6r att aktivera ditt konto.","resend_activation_email":"Klicka h\u00e4r f\u00f6r att skicka aktiveringsmailet igen.","sent_activation_email_again":"Vi har skickat \u00e4nnu ett aktiveringsmail till dig via <b>{{currentEmail}}</b>. Det kan ta ett par minuter f\u00f6r det att komma fram; var noga med att kolla din skr\u00e4ppost.","google":{"title":"Logga In med Google","message":"Autentiserar med Google (kolla s\u00e5 att pop up-blockare inte \u00e4r aktiverade)"},"twitter":{"title":"Logga In med Twitter","message":"Autentiserar med Twitter (kolla s\u00e5 att pop up-blockare inte \u00e4r aktiverade)"},"facebook":{"title":"Logga In med Facebook","message":"Autentiserar med Facebook (kolla s\u00e5 att pop up-blockare inte \u00e4r aktiverade)"},"yahoo":{"title":"Logga In med Yahoo","message":"Autentiserar med Yahoo (kolla s\u00e5 att pop up-blockare inte \u00e4r aktiverade)"},"github":{"title":"Logga In med Github","description":"Autentiserar med Github (kolla s\u00e5 att pop up-blockare inte \u00e4r aktiverade)"}},"composer":{"saving_draft_tip":"sparar","saved_draft_tip":"sparat","saved_local_draft_tip":"sparat lokalt","min_length":{"at_least":"skriv minst {{n}} tecken","more":"{{n}} fler..."},"save_edit":"Spara \u00c4ndring","reply":"Svara","create_topic":"Skapa Tr\u00e5d","create_pm":"Skapa Privat Meddelande","users_placeholder":"L\u00e4gg till en anv\u00e4ndare","title_placeholder":"Skriv din titel h\u00e4r. Vad handlar denna diskussion om i en kort mening?","reply_placeholder":"Skriv ditt svar h\u00e4r. Anv\u00e4nd Markdown eller BBCode f\u00f6r formatering. Dra eller klista in en bild h\u00e4r f\u00f6r att ladda upp den.","view_new_post":"Visa ditt nya inl\u00e4gg.","saving":"Sparar...","saved":"Sparat!","saved_draft":"Du har ett p\u00e5g\u00e5ende inl\u00e4ggsutkast. Klicka n\u00e5gonstans i denna ruta f\u00f6r att forts\u00e4tta redigera.","uploading":"Laddar upp...","show_preview":"visa f\u00f6rhandsgranskning &raquo;","hide_preview":"&laquo; d\u00f6lj f\u00f6rhandsgranskning"},"notifications":{"title":"notifikationer med omn\u00e4mnanden av @namn, svar p\u00e5 dina inl\u00e4gg och tr\u00e5dar, privata meddelanden, etc","none":"Du har inte notifikationer just nu.","more":"visa \u00e4ldre notifikationer","mentioned":"<span title='omn\u00e4mnd' class='icon'>@</span> {{username}} {{link}}","quoted":"<i title='citerad' class='icon icon-quote-right'></i> {{username}} {{link}}","replied":"<i title='svarad' class='icon icon-reply'></i> {{username}} {{link}}","posted":"<i title='svarad' class='icon icon-reply'></i> {{username}} {{link}}","edited":"<i title='\u00e4ndrad' class='icon icon-pencil'></i> {{username}} {{link}}","liked":"<i title='gillad' class='icon icon-heart'></i> {{username}} {{link}}","private_message":"<i class='icon icon-lock' title='privat meddelande'></i> {{username}} skickade dig ett privat meddelande: {{link}}","invited_to_private_message":"{{username}} bj\u00f6d in dig till en privat konversation: {{link}}","invitee_accepted":"<i title='accepterade din inbjudan' class='icon icon-signin'></i> {{username}} accepterade din inbjudan","moved_post":"<i title='flyttade inl\u00e4gg' class='icon icon-arrow-right'></i> {{username}} flyttade inl\u00e4gg till {{link}}"},"image_selector":{"from_my_computer":"Fr\u00e5n Min Enhet","from_the_web":"Fr\u00e5n Internet","add_image":"L\u00e4gg Till Bild","remote_tip":"skriv in en adress till en bild i formen http://exempel.se/bild.jpg","local_tip":"klicka f\u00f6r att v\u00e4lja en bild fr\u00e5n din enhet.","upload":"Ladda Upp","uploading_image":"Laddar upp bild"},"search":{"title":"s\u00f6k efter tr\u00e5dar, inl\u00e4gg, anv\u00e4ndare, eller kategorier","placeholder":"skriv din s\u00f6kterm h\u00e4r","no_results":"Inga resultat hittades.","searching":"S\u00f6ker ..."},"site_map":"g\u00e5 till en annan tr\u00e5dlista eller kategori","go_back":"g\u00e5 tillbaka","current_user":"g\u00e5 till din anv\u00e4ndarsida","favorite":{"title":"Favorit","help":"l\u00e4gg till denna tr\u00e5d i din favoritlista"},"topics":{"none":{"favorited":"Du har inte favoritmarkerat n\u00e5gra tr\u00e5dar \u00e4n. F\u00f6r att favoritmarkera en tr\u00e5d, klicka eller tryck p\u00e5 stj\u00e4rnan brevid titeln.","unread":"Du har inga ol\u00e4sta tr\u00e5dar att l\u00e4sa.","new":"Du har inga nya tr\u00e5dar att l\u00e4sa.","read":"Du har inte l\u00e4st n\u00e5gra tr\u00e5dar \u00e4n.","posted":"Du har inte postat i n\u00e5gra tr\u00e5dar \u00e4n.","popular":"Det finns inga popul\u00e4ra tr\u00e5dar. Det \u00e4r lite sorgligt.","category":"Det finns inga {{category}}-tr\u00e5dar."},"bottom":{"popular":"Det finns inga fler popul\u00e4ra tr\u00e5dar att l\u00e4sa.","posted":"Det finns inga fler postade tr\u00e5dar att l\u00e4sa","read":"Det finns inga fler l\u00e4sta tr\u00e5dar att l\u00e4sa.","new":"Det finns inga fler nya tr\u00e5dar att l\u00e4sa.","unread":"Det finns inga fler ol\u00e4sa tr\u00e5dar att l\u00e4sa.","favorited":"Det finns inga fler favoritmarkerade tr\u00e5dar att l\u00e4sa.","category":"Det finns inga fler {{category}}-tr\u00e5dar."}},"topic":{"create_in":"Skapa {{categoryName}}-tr\u00e5d","create":"Skapa Tr\u00e5d","create_long":"Skapa en nytt Tr\u00e5d","private_message":"Starta en privat konversation","list":"Tr\u00e5dar","new":"ny tr\u00e5d","title":"Tr\u00e5d","loading_more":"Laddar fler Tr\u00e5dar...","loading":"Laddar tr\u00e5d...","invalid_access":{"title":"Tr\u00e5den \u00e4r privat","description":"Tyv\u00e4rr, du har inte beh\u00f6righet till den tr\u00e5den."},"server_error":{"title":"Tr\u00e5den misslyckades med att ladda","description":"Tyv\u00e4rr, vi kunde inte ladda den tr\u00e5den, troligen p.g.a. ett anslutningsproblem. Var go f\u00f6rs\u00f6k igen. Om problemet kvarst\u00e5r, l\u00e5t oss g\u00e4rna veta det!"},"not_found":{"title":"Tr\u00e5den hittades inte","description":"Tyv\u00e4rr, vi kunde inte hitta den tr\u00e5den. Kanske har den tagits bort av en moderator?"},"unread_posts":"du har {{unread}} gamla ol\u00e4sta inl\u00e4gg i den h\u00e4r tr\u00e5den","new_posts":"det finns {{new_posts}} nya inl\u00e4gg i den h\u00e4r tr\u00e5den sen du senaste l\u00e4ste det","likes":{"one":"det finns 1 gillning i den h\u00e4r tr\u00e5den","other":"det finns {{count}} gillningar i den h\u00e4r tr\u00e5den"},"back_to_list":"Tillbaka till Tr\u00e5dlistan","options":"Tr\u00e5dinst\u00e4llningar","show_links":"visa l\u00e4nkar som finns i den h\u00e4r tr\u00e5den","toggle_information":"sl\u00e5 p\u00e5/av tr\u00e5ddetaljer","read_more_in_category":"Vill du l\u00e4sa mer? Bl\u00e4ddra bland andra tr\u00e5dar i {{catLink}} eller {{popularLink}}.","read_more":"Vill du l\u00e4sa mer? {{catLink}} eller {{popularLink}}.","browse_all_categories":"Bl\u00e4ddra bland alla kategorier","view_popular_topics":"visa popul\u00e4ra tr\u00e5dar","suggest_create_topic":"Varf\u00f6r inte skapa en tr\u00e5d?","read_position_reset":"Din l\u00e4sposition har blivit \u00e5terst\u00e4lld.","jump_reply_up":"hoppa till tidigare svar","jump_reply_down":"hoppa till senare svar","progress":{"title":"tr\u00e5dplacering","jump_top":"hoppa till f\u00f6rsta inl\u00e4gget","jump_bottom":"hoppa till sista inl\u00e4gget","total":"antal inl\u00e4gg","current":"nuvarande inl\u00e4gg"},"notifications":{"title":"","reasons":{"3_2":"Du kommer ta emot notifikationer f\u00f6r att du kollar in denna tr\u00e5d.","3_1":"Du kommer ta emot notifikationer f\u00f6r att du skapade denna tr\u00e5d.","3":"Du kommer ta emot notifikationer f\u00f6r att du kollar in denna tr\u00e5d.","2_4":"Du kommer ta emot notifikationer f\u00f6r att du postade ett svar till denna tr\u00e5d.","2_2":"Du kommer ta emot notifikationer f\u00f6r att du f\u00f6ljer denna tr\u00e5d.","2":"Du kommer ta emot notifikationer f\u00f6r att du <a href=\"/users/{{username}}/preferences\">l\u00e4ser denna tr\u00e5d</a>.","1":"Du kommer bara meddelandes om n\u00e5gon n\u00e4mner ditt @namn eller svara p\u00e5 dina inl\u00e4gg.","1_2":"Du kommer bara meddelandes om n\u00e5gon n\u00e4mner ditt @namn eller svara p\u00e5 dina inl\u00e4gg.","0":"Du ignorerar alla notifikationer f\u00f6r denna tr\u00e5d.","0_2":"Du ignorerar alla notifikationer f\u00f6r denna tr\u00e5d."},"watching":{"title":"Kollar","description":"samma som F\u00f6ljer, plus att du meddelas om alla nya inl\u00e4gg."},"tracking":{"title":"F\u00f6ljer","description":"du meddelas om ol\u00e4sta inl\u00e4gg, omn\u00e4mnanden av @namn, och svar p\u00e5 dina inl\u00e4gg."},"regular":{"title":"Vanlig","description":"du meddelas bara om n\u00e5gon n\u00e4mner ditt @namn eller svarar p\u00e5 ditt inl\u00e4gg."},"muted":{"title":"D\u00e4mpad","description":"du kommer inte meddelas om denna tr\u00e5d alls, och den kommer inte visas i din flik med ol\u00e4sta."}},"actions":{"delete":"Radera Tr\u00e5d","open":"\u00d6ppna Tr\u00e5d","close":"St\u00e4ng Tr\u00e5d","unpin":"Avn\u00e5la Tr\u00e5d","pin":"N\u00e5la Tr\u00e5d","unarchive":"Dearkivera Tr\u00e5d","archive":"Arkivera Tr\u00e5d","invisible":"G\u00f6r Osynlig","visible":"G\u00f6r Synlig","reset_read":"\u00c5terst\u00e4ll L\u00e4sdata","multi_select":"V\u00e4xla p\u00e5/av flervalsfunktion","convert_to_topic":"Konvertera till Vanlig Tr\u00e5d"},"reply":{"title":"Svara","help":"b\u00f6rja komponera ett svar till denna tr\u00e5d"},"share":{"title":"Dela","help":"dela en l\u00e4nk till denna tr\u00e5d"},"inviting":"Bjuder in...","invite_private":{"title":"Bjud in till Privat Konversation","email_or_username":"Den Inbjudnas E-post eller Anv\u00e4ndarnamn","email_or_username_placeholder":"e-postadress eller anv\u00e4ndarnamn","action":"Bjud In","success":"Tack! Vi har bjudit in den anv\u00e4ndaren att delta i denna privata konversation.","error":"Tyv\u00e4rr det uppstod ett fel under inbjudandet av den anv\u00e4ndaren."},"invite_reply":{"title":"Bjud in V\u00e4nner att Svara","help":"skicka inbjudningar till v\u00e4nner s\u00e5 de kan svara i den h\u00e4r tr\u00e5den med ett enda klick","email":"Vi skickar din v\u00e4n ett kort mail s\u00e5 de kan svara i den h\u00e4r tr\u00e5den genom att klicka p\u00e5 en l\u00e4nk.","email_placeholder":"e-postadress","success":"Tack! Vi har mailat ut ett inbjudan till <b>{{email}}</b>. Vi l\u00e5ter dig veta n\u00e4r de l\u00f6st in sin inbjudan. Kolla in fliken med Inbjudningar p\u00e5 din anv\u00e4ndarsida f\u00f6r att h\u00e5lla koll p\u00e5 vem du har bjudit in.","error":"Tyv\u00e4rr vi kunde inte bjudan in den personen. Kanske \u00e4r den redan en anv\u00e4ndare?"},"login_reply":"Logga In f\u00f6r att Svara","filters":{"user":"Du visar bara inl\u00e4gg av en eller flera specifika anv\u00e4ndare.","best_of":"Du visar bara 'B\u00e4st Av'-inl\u00e4ggen.","cancel":"Visa alla inl\u00e4gg i den h\u00e4r tr\u00e5den igen."},"move_selected":{"title":"Flytta Markerade Inl\u00e4gg","topic_name":"Nya Tr\u00e5dens Namn:","error":"Tyv\u00e4rr, det uppstod ett problem under flytten av de inl\u00e4ggen.","instructions":{"one":"Du h\u00e5ller p\u00e5 att skapa en ny tr\u00e5d och fylla den med inl\u00e4gget som du markerat.","other":"Du h\u00e5ller p\u00e5 att skapa en ny tr\u00e5d och fylla den med de <b>{{count}}</b> inl\u00e4gg som du markerat."}},"multi_select":{"select":"markera","selected":"markerade ({{count}})","delete":"radera markerade","cancel":"avbryt markering","move":"flytta markerade","description":{"one":"Du har markerat <b>1</b> inl\u00e4gg.","other":"Du har markerat <b>{{count}}</b> inl\u00e4gg."}}},"post":{"reply":"Svarar p\u00e5 {{link}} av {{replyAvatar}} {{username}}","reply_topic":"Svar p\u00e5 {{link}}","edit":"\u00c4ndra {{link}}","in_reply_to":"som svar till","reply_as_new_topic":"Svara som ny Tr\u00e5d","continue_discussion":"Forts\u00e4tter diskussionen fr\u00e5n {{postLink}}:","follow_quote":"g\u00e5 till det citerade inl\u00e4gget","deleted_by_author":"(inl\u00e4gg borttaget av f\u00f6rfattaren)","has_replies":{"one":"Svara","other":"Svar"},"errors":{"create":"Tyv\u00e4rr, det uppstod ett fel under skapandet av ditt inl\u00e4gg. Var god f\u00f6rs\u00f6k igen.","edit":"Tyv\u00e4rr, det uppstod ett fel under \u00e4ndringen av ditt inl\u00e4gg. Var god f\u00f6rs\u00f6k igen.","upload":"Tyv\u00e4rr, det uppstod ett fel under uppladdandet av den filen. Vad god f\u00f6rs\u00f6k igen."},"abandon":"\u00c4r du s\u00e4ker p\u00e5 att du vill \u00f6verge ditt inl\u00e4gg?","archetypes":{"save":"Spara Inst\u00e4llningar"},"controls":{"reply":"b\u00f6rja komponera ett svar till detta inl\u00e4gg","like":"gilla detta inl\u00e4gg","edit":"\u00e4ndra detta inl\u00e4gg","flag":"flagga detta inl\u00e4gg f\u00f6r moderatorsuppm\u00e4rksamhet","delete":"radera detta inl\u00e4gg","undelete":"\u00e5terst\u00e4ll detta inl\u00e4gg","share":"dela en l\u00e4nk till detta inl\u00e4gg","bookmark":"bokm\u00e4rk detta inl\u00e4gg till din anv\u00e4ndarsida","more":"Mer"},"actions":{"flag":"Flaga","clear_flags":{"one":"Ta bort flagga","other":"Ta bort flaggningar"},"it_too":"{{alsoName}} det ocks\u00e5","undo":"\u00c5ngra {{alsoName}}","by_you_and_others":{"zero":"Du {{long_form}}","one":"Du och 1 annan person {{long_form}}","other":"Du och {{count}} andra personer {{long_form}}"},"by_others":{"one":"1 person {{long_form}}","other":"{{count}} personer {{long_form}}"}},"edits":{"one":"1 \u00e4ndring","other":"{{count}} \u00e4ndringar","zero":"inga \u00e4ndringar"},"delete":{"confirm":{"one":"\u00c4r du s\u00e4ker p\u00e5 att du vill radera detta inl\u00e4gg?","other":"\u00c4r du s\u00e4ker p\u00e5 att du vill radera alla dessa inl\u00e4gg?"}}},"category":{"none":"(ingen kategori)","edit":"\u00e4ndra","edit_long":"\u00c4ndra Kategori","view":"Visa Tr\u00e5dar i Kategori","delete":"Radera Kategori","create":"Skapa Kategoriy","more_posts":"visa alla {{posts}}...","name":"Kategorinamn","description":"Beskrivning","topic":"Kategoristr\u00e5d","color":"F\u00e4rg","name_placeholder":"Ska vara kort och koncist.","color_placeholder":"N\u00e5gon webbf\u00e4rg","delete_confirm":"\u00c4r du s\u00e4ker p\u00e5 att du vill radera den kategorin?","list":"Lista Kategorier","no_description":"Det finns ingen beskrivning f\u00f6r denna kategori.","change_in_category_topic":"bes\u00f6k kategorins tr\u00e5d f\u00f6r att \u00e4ndra beskrivning"},"flagging":{"title":"Varf\u00f6r flaggar du detta inl\u00e4gg?","action":"Flagga Inl\u00e4gg","cant":"Tyv\u00e4rr, du kan inte flagga detta inl\u00e4gg just nu.","custom_placeholder":"Varf\u00f6r kr\u00e4ver detta inl\u00e4gg en moderators uppm\u00e4rksamhet? L\u00e5t oss veta specifikt vad du \u00e4r orolig f\u00f6r, och ta med relevanta l\u00e4nkar om m\u00f6jligt.","custom_message":{"at_least":"skriv \u00e5tminstone {{n}} tecken","more":"{{n}} fler...","left":"{{n}} kvar"}},"topic_summary":{"title":"Tr\u00e5dsammanfattning","links_shown":"Visa alla {{totalLinks}} l\u00e4nkar..."},"topic_statuses":{"locked":{"help":"denna tr\u00e5d \u00e4r l\u00e5st; den accepterar inte l\u00e4ngre nya svar"},"pinned":{"help":"denna tr\u00e5d \u00e4r n\u00e5lad; den kommer att visas h\u00f6gst upp i sin kategori"},"archived":{"help":"denna tr\u00e5d \u00e4r arkiverad; den \u00e4r frusen och kan inte \u00e4ndras"},"invisible":{"help":"denna tr\u00e5d \u00e4r osynlig; den kommer inte att visas i tr\u00e5dlistor, och kan endast bes\u00f6kas via direktl\u00e4nkar"}},"posts":"Inl\u00e4gg","posts_long":"{{number}} inl\u00e4gg i den h\u00e4r tr\u00e5den","original_post":"Originalinl\u00e4gg","views":"Visningar","replies":"Svar","views_long":"denna tr\u00e5d har visats {{number}} g\u00e5nger","activity":"Aktivitet","likes":"Gillningar","top_contributors":"Deltagare","category_title":"Kategori","categories_list":"Kategorilista","filters":{"popular":{"title":"Popul\u00e4ra","help":"det popul\u00e4raste tr\u00e5darna nyligen"},"favorited":{"title":"Favoriter","help":"tr\u00e5dar du favoritmarkerat"},"read":{"title":"L\u00e4sta","help":"tr\u00e5dar du har l\u00e4st"},"categories":{"title":"Kategorier","title_in":"Kategori - {{categoryName}}","help":"alla tr\u00e5dar grupperade efter kategori"},"unread":{"title":{"zero":"Ol\u00e4sta","one":"Ol\u00e4sta (1)","other":"Ol\u00e4sta ({{count}})"},"help":"f\u00f6ljda tr\u00e5dar med ol\u00e4sta inl\u00e4gg"},"new":{"title":{"zero":"Nya","one":"Nya (1)","other":"Nya ({{count}})"},"help":"nya tr\u00e5dar sen tidd senaste bes\u00f6k, och f\u00f6ljda tr\u00e5dar med nya inl\u00e4gg"},"posted":{"title":"Mina Inl\u00e4gg","help":"tr\u00e5dar som du har postat i"},"category":{"title":{"zero":"{{categoryName}}","one":"{{categoryName}} (1)","other":"{{categoryName}} ({{count}})"},"help":"popul\u00e4ra tr\u00e5dar i {{categoryName}}-kategorin"}},"type_to_filter":"skriv f\u00f6r att filtrera...","admin":{"title":"Discourse Adminn","dashboard":{"title":"\u00d6versiktspanel","welcome":"V\u00e4lkommen till adminsektionen.","version":"Installerad version","up_to_date":"Du k\u00f6r den senaste versionen av Discourse.","critical_available":"En kritisk uppdatering \u00e4r tillg\u00e4nglig.","updates_available":"Uppdateringar \u00e4r tillg\u00e4ngliga.","please_upgrade":"Var god uppgradera!","latest_version":"Senaste versionen","update_often":"Sn\u00e4lla uppdatera ofta!"},"flags":{"title":"Flaggningar","old":"Gamla","active":"Aktiva","clear":"Rensa Flaggningar","clear_title":"rensa alla flaggningar av detta inl\u00e4gg (kommer visa g\u00f6mda inl\u00e4gg)","delete":"Radera Inl\u00e4gg","delete_title":"radera inl\u00e4gg (om det \u00e4r f\u00f6rsta inl\u00e4gget radera tr\u00e5d)","flagged_by":"Flaggad av"},"customize":{"title":"Anpassa","header":"Sidhuvud","css":"Stilmall","override_default":"Skriv \u00f6ver standard?","enabled":"Aktiverad?","preview":"f\u00f6rhandsgranska","undo_preview":"\u00e5ngra f\u00f6rhandsgranskning","save":"Spara","delete":"Radera","delete_confirm":"Radera denna anpassning?"},"email_logs":{"title":"E-postloggar","sent_at":"Skickat","email_type":"E-posttyp","to_address":"Till adress","test_email_address":"e-postadress att testa","send_test":"skicka testmail","sent_test":"skickat!"},"impersonate":{"title":"Imitera Anv\u00e4ndare","username_or_email":"Anv\u00e4ndare eller E-post f\u00f6r Anv\u00e4ndare","help":"Anv\u00e4nd detta verktyg f\u00f6r att imitera en anv\u00e4ndare i fels\u00f6kningssyfte.","not_found":"Den anv\u00e4ndaren kan inte hittas.","invalid":"Tyv\u00e4rr, du kan inte imitera den anv\u00e4ndaren."},"users":{"title":"Anv\u00e4ndare","create":"L\u00e4gg till Administrat\u00f6r","last_emailed":"Senast Mailad","not_found":"Tyv\u00e4rr den anv\u00e4ndaren existerar inte i v\u00e5rt system.","new":"Ny","active":"Aktiv","pending":"Avvaktande","approved":"Godk\u00e4nd?","approved_selected":{"one":"godk\u00e4nd anv\u00e4ndare","other":"godk\u00e4nd anv\u00e4ndare ({{count}})"}},"user":{"ban_failed":"N\u00e5gonting gick fel under avst\u00e4ngningen av denna anv\u00e4ndare {{error}}","unban_failed":"N\u00e5gonting gick fel under uppl\u00e5sningen av denna anv\u00e4ndare {{error}}","ban_duration":"Hur l\u00e4nge vill du st\u00e4nga av denna anv\u00e4ndare? (dagar)","delete_all_posts":"Radera alla inl\u00e4gg","ban":"St\u00e4ng av","unban":"L\u00e5s upp","banned":"Avst\u00e4ngd?","moderator":"Moderator?","admin":"Administrat\u00f6r?","show_admin_profile":"Administrat\u00f6r","refresh_browsers":"Tvinga webbl\u00e4saruppdatering","show_public_profile":"Visa Publik Profil","impersonate":"Imitera","revoke_admin":"\u00c5terkalla Administrat\u00f6r","grant_admin":"Bevilja Administrat\u00f6r","revoke_moderation":"\u00c5terkalla Moderering","grant_moderation":"Bevilja Moderering","basics":"Grundl\u00e4ggande","reputation":"Rykte","permissions":"R\u00e4ttigheter","activity":"Aktivitet","like_count":"Gillningar Mottagna","private_topics_count":"Antal Privata Tr\u00e5dar","posts_read_count":"Inl\u00e4gg L\u00e4sta","post_count":"Inl\u00e4gg Skapade","topics_entered":"Tr\u00e5dar Bes\u00f6kta","flags_given_count":"Givna Flaggnignar","flags_received_count":"Mottagna Flaggningar","approve":"Godk\u00e4nn","approved_by":"godk\u00e4nd av","time_read":"L\u00e4stid"},"site_settings":{"show_overriden":"Visa bara \u00f6verskrivna","title":"Webbplatsinst\u00e4llningar","reset":"\u00e5terst\u00e4ll till standard"}}}}};
I18n.locale = 'sv'
;
