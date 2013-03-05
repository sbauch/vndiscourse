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


I18n.translations = {"nl":{"js":null},"share":{"0":"Je negeert alle notificaties in dit topic.","0_2":"Je negeert alle notificaties in dit topic.","1":"Je krijgt alleen een notificatie als iemand je @naam noemt of reageert op je post.","1_2":"Je krijgt alleen een notificatie als iemand je @naam noemt of reageert op je post.","2":"Je ontvangt een notificatie omdat je <a href=\"/users/{{username}}/preferences\">dit topic hebt gelezen</a>.","2_2":"Je ontvangt een notificatie omdat je dit topic volgt.","2_4":"Je ontvangt een notificatie omdat je een reactie aan dit topic hebt gegeven.","3_1":"Je ontvangt een notificatie omdat je dit topic gemaakt hebt.","3_2":"Je ontvangt een notificatie omdat je dit topic aan het bekijken bent.","6":"reacties","abandon":"Weet je zeker dat je deze post wilt verlaten?","account_age_days":"accountleeftijd in dagen","action":"Meld Post","actions":null,"active":"Actief","activity":"Activiteit","activity_stream":"Activiteit","add_image":"Voeg Afbeelding Toe","admin":"Beheerder?","admin_js":null,"admin_title":"Beheer","after_n_days":null,"after_n_minutes":null,"after_n_seconds":null,"after_n_weeks":null,"age":"Leeftijd","all":"Alle","always":"altijd","approve":"Keur Goed","approved":"Goedgekeurd?","approved_by":"Goedgekeurd door","approved_selected":null,"archetypes":null,"archive":"Archiveer Topic","archived":null,"at_least":"vul op zijn minst {{n}} karakters in","authenticated":"Je e-mail is goedgekeurd bij {{provider}}.","authenticating":"Authenticatie...","auto_track_options":null,"auto_track_topics":"Houd automatisch topics bij die ik bezoek","available":"Je gebruikersnaam is beschikbaar.","avatar":null,"awaiting_approval":"Je account is nog niet goedgekeurd door een moderator. Je krijgt van ons een mail wanneer deze is goedgekeurd.","awaiting_confirmation":"Je account moet momenteel nog geactiveerd worden. Gebruik de 'Wachtwoord Vergeten'-link om een nieuwe activatie-mail te versturen.","back_to_list":"Terug Naar Topic-lijst","ban":"Blokkeer","ban_duration":"Hoe lang zou je deze gebruiker willen blokkeren? (dagen)","ban_failed":"Er ging iets fout met het blokkeren van deze gebruiker {{error}}","banned":"Geblokkeerd?","basics":"Algemeen","best_of":"Je ziet momenteel alleen de 'Beste Van' posts.","bi_weekly":"elke twee weken","bio":"Over mij","bookmark":"voeg deze post toe aan je bladwijzers op je gebruikerspagina","bookmarks":null,"browse_all_categories":"Bekijk alle categorie\u00ebn","button":"Verander naar \"Beste Van\"-weergave","by_others":null,"by_you_and_others":null,"cancel":"annuleer geselecteerde","cant":"Sorry, Je kan deze post momenteel niet melden.","categories":null,"categories_list":"Categorie-lijst","category":null,"category_title":"Categorie","change_email":null,"change_password":"wijzig","change_username":null,"checking":"Beschikbaarheid controleren...","clear":"Wis Meldingen","clear_flags":null,"clear_title":"verwijder alle meldingen van deze post (laat verborgen posts weer zien)","close":"Sluit Topic","color":"Kleur","color_placeholder":"Elke web-kleur dan ook.","complete":"Je zou binnenkort een mail moeten ontvangen met instructies hoe je je wachtwoord kan herstellen.","composer":null,"confirm":null,"continue_discussion":"Voortzetting van de discussie op {{postLink}}:","controls":null,"convert_to_topic":"Zet om naar Normaal Topic","create":"Voeg Beheerder Toe","create_account":null,"create_in":"Maak een {{categoryName}} Topic","create_long":"Maak een Nieuw Topic","create_pm":"Maak Priv\u00e9-bericht","create_topic":"Maak Topic","created":"Gemaakt Op","css":"Stylesheet","current":"huidige post","current_user":"ga naar je gebruikerspagina","custom_message":null,"custom_placeholder":"Waarom heeft deze post moderator-aandacht nodig? Laat ons specifiek weten waar je je zorgen om maakt, en stuur relevante links mee waar mogelijk.","customize":null,"daily":"dagelijks","dashboard":"Beheer Dashboard","days_visited":"Dagen Bezocht","delete":"Verwijderen","delete_all_posts":"Verwijder alle posts","delete_confirm":"Verwijder deze aanpassing?","delete_title":"verwijder post (als het de eerste post is van een topic, verwijdert dit het topic)","deleted_by_author":"(post verwijderd door de auteur)","description":"Beschrijving","download_archive":"download een archief van mijn posts","edit":"bewerk","edited":"{{username}} heeft je post bewerkt {{link}}","edits":null,"email":"We zullen je vrienden een korte e-mail sturen waardoor zij op dit topic kunnen reageren door op een link te klikken.","email_digests":null,"email_direct":"Ontvang een mail wanneer iemand je quote, reageert op je post of je @gebruikersnaam noemt.","email_logs":null,"email_or_username":"E-mail of Gebruikersnaam Uitgenodigde Gebruiker","email_or_username_placeholder":"e-mailadres of gebruikersnaam","email_placeholder":"e-mailadres","email_private_messages":"Ontvang een mail wanneer iemand je een priv\u00e9-bericht heeft gestuurd.","email_settings":"E-mail","email_type":"E-mail Type","enabled":"Ingeschakeld?","enter_email":"Gebruikersnaam gevonden. Vul het gekoppelde e-mailadres in.","error":"Sorry, er is iets misgegaan bij het verplaatsen van deze posts.","errors":null,"facebook":null,"failed":"Er ging iets mis, wellicht is het e-mailadres al geregistreerd. Probeer de 'Wachtwoord Vergeten'-link","faq":"FAQ","favorite":null,"favorited":null,"filters":null,"first_post":"Eerste post","flag":"Meld","flagged_by":"Gemeld door","flagging":null,"flags":null,"flags_given_count":"Meldingen Gegeven","flags_received_count":"Meldingen Ontvangen","flags_title":"Meldingen","follow_quote":"ga naar de gequote post","forgot_password":null,"frequency":"We zullen je alleen maar mailen als we je een tijd niet gezien hebben, en als je toevallig hetgeen waarover we je mailen nog niet hebt gezien op onze site.","from_my_computer":"Vanaf Mijn Apparaat","from_the_web":"Vanaf Het Web","generic_error":"Sorry, deze onverwachte fout hadden wij niet verwacht!","global_match":"Je e-mailadres komt overeen met je geregistreerde gebruikersnaam.","global_mismatch":"Al geregistreerd. Probeer {{suggestion}}?","go_back":"ga terug","google":null,"grant_admin":"Geef Beheerdersrechten","has_replies":null,"header":"Header","help":"Gebruik dit hulpmiddel om een gebruiker te imiteren voor debug-doeleinden.","hide_preview":"\u00ab verberg voorbeeld","image_selector":null,"impersonate":"Imiteer","in_reply_to":"in reactie op","information":"Gebruikersinformatie","instructions":null,"invalid":"Sorry, maar deze gebruiker mag je niet imiteren.","invisible":null,"invite":"Vul je gebruikersnaam of e-mailadres in, en we sturen je een wachtwoord-herstel mail.","invite_private":null,"invite_reply":null,"invited":null,"invited_by":"Uitgenodigd door","invited_to_private_message":"{{username}} heeft je uitgenodigd voor een priv\u00e9-bericht: {{link}}","invitee_accepted":"{{username}} heeft je uitnodiging geaccepteerd en heeft zich ingeschreven om deel te nemen.","inviting":"Aan Het Uitnodigen...","ip_address":null,"it_too":"{{alsoName}} het ook","jump_bottom":"spring naar laatste post","jump_top":"spring naar eerste post","label":"Beschouw topics als nieuw wanneer","last_emailed":"laatste mail verstuurd naar","last_here":"ze gepost waren sinds ik hier voor het laatst was","last_post":"Laatste post","last_posted":"Laatste Post","last_read":"Dit is de laatste post die je gelezen hebt.","last_seen":"Laatst Gezien","learn_more":"leer meer...","left":"{{n}} resterend","like":"waardeer deze post","like_count":"Ontvangen Waarderingen","liked":"{{username}} waardeerde je post {{link}}","likes":"Waarderingen","links":"Links","links_shown":"laat alle {{totalLinks}} links zien...","list":"Laat Categori\u00ebn Zien","loading":"Bezig Met Laden Van topic...","loading_more":"Meer Topics Aan Het Laden...","local_tip":"klik om een afbeelding vanaf je apparaat te selecteren.","locked":null,"log_in":"Log In","log_out":"Log Uit","logging_in":"Aan het Inloggen...","login":null,"login_reply":"Log In om te Reageren","mentioned":"{{username}} heeft je genoemd in {{link}}","message":"Authenticatie met Yahoo (zorg ervoor dat je pop up blocker uitstaat)","missing":"Topic Niet Gevonden","moderator":"Moderator?","month":"maand","month_desc":"topics die in de afgelopen 30 dagen gepost zijn","more":"{{n}} te gaan...","more_posts":"bekijk alle {{posts}}...","move":"verplaats geselecteerde","move_selected":null,"moved_post":"{{username}} heeft je post verplaatst naar {{link}}","multi_select":null,"mute":"Demp","muted":null,"name":"Categorie Naam","name_placeholder":"Moet kort en duidelijk zijn.","never":"nooit","new":"Nieuw","new_posts":"er zijn {{new_posts}} nieuwe posts in dit topic sinds je dit voor het laatst gelezen hebt","new_topic_duration":null,"new_topics_inserted":"{{count}} nieuwe topics.","no_favorited":"Je hebt nog geen topics tussen je Favorieten staan. Om een topic toe te wijzen aan je Favorieten, klik of druk op de ster naast de topictitel..","no_new":"Je hebt geen nieuwe topics om te lezen.","no_popular":"Er zijn geen populaire topics. Dat is best wel sneu.","no_posted":"Je hebt nog niet in een topic gepost.","no_read":"Je hebt nog geen topics gelezen.","no_results":"Geen resultaten gevonden.","no_unread":"Je hebt geen ongelezen topics om te lezen.","no_value":"Nee","none":"(geen categorie)","not_available":"Niet beschikbaar. Try {{suggestion}}?","not_bookmarked":"Je hebt deze post gelezen; klik om deze aan je bladwijzer toe te voegen.","not_found":"Sorry, deze gebruikersnaam bestaat niet in ons systeem.","not_implemented":"Deze functie is helaas nog niet beschikbaar, sorry!","not_logged_in":"Sorry, maar je moet ingelogd zijn om deze post aan je bladwijzer toe te voegen.","not_viewed":"ik ze nog heb niet bekeken","notifications":null,"of_value":"van","ok":"Je wachtwoord ziet er goed uit.","old":"Oud","one":"keur gebruiker goed","open":"Open Topic","options":"Topic Opties","or":"Of","original_post":"Originele Post","other":"keur gebruikers goed ({{count}})","other_settings":"Overige","override_default":"Overschrijf standaard?","password":"Wachtwoord","pending":"Onder beoordeling","permissions":"Toestemmingen","pin":"Pin Topic","pinned":null,"placeholder":"typ je zoekterm hier","popular":null,"post":null,"post_count":"Posts Gemaakt","posted":null,"posts":"Posts","posts_long":"{{number}} posts in dit topic","posts_read_count":"Posts Gelezen","preferences":"Voorkeuren","preview":"voorbeeld","private_message":"Start een priv\u00e9-gesprek","private_message_info":null,"private_messages":"Berichten","private_topics_count":"Aantal Priv\u00e9 Topics","profile":"Profiel","progress":null,"quoted":"{{username}} heeft je gequote in {{link}}","read":null,"read_more":"Wil je meer lezen? {{catLink}} of {{popularLink}}.","read_more_in_category":"Wil je meer lezen? Kijk dan voor andere topics in {{catLink}} of {{popularLink}}.","reasons":null,"redeemed":"Verbruikte Uitnodigingen","redeemed_at":"Verbruikt op","refresh_browsers":"Forceer browser refresh","regular":null,"remote_tip":"vul een internetadres in van een afbeelding in de vorm: http://example.com/image.jpg","replied":"{{username}} reageerde op je in {{link}}","replies":"Reacties","reply":"begin met het maken van een reactie op deze post","reply_as_new_topic":"Reageer als Nieuw Topic","reply_placeholder":"Typ hier je reactie. Gebruik Markdown of BBCode voor de tekstopmaak. Sleep of plak een afbeelding hierin om deze te uploaden.","reply_topic":"Reageer op {{link}}","reputation":"Reputatie","rescind":"Verwijder Uitnodiging","rescinded":"Uitnodiging Verwijderd","reset":"herstel standaardinstellingen","reset_password":"Herstel wachtwoord","reset_read":"Herstel Gelezen Data","revoke_admin":"Ontneem Beheerdersrechten","save":"Opslaan","save_edit":"Bewaar Wijziging","saved":"Opgeslagen!","saved_draft":"Je hebt nog een concept-post openstaan. Klik in dit veld om verder te gaan met bewerken.","saved_draft_tip":"opgeslagen","saved_local_draft_tip":"lokaal opgeslagen","saving":"Aan het Opslaan...","saving_draft_tip":"aan het opslaan","search":null,"searching":"Zoeken ...","select":"selecteer","selected":"geselecteerd ({{count}})","send_test":"verstuur test e-mail","sent_at":"Verzonden Op","sent_test":"Verzonden!","share":"deel een link naar deze post","show_admin_profile":"Beheerder","show_links":"laat links binnen dit topic zien","show_more":"meer...","show_new_topics":"Klik om te laten zien.","show_overriden":"Toon alleen overschreven","show_preview":"laat voorbeeld zien \u00bb","show_public_profile":"Laat Openbaar Profiel Zien","site_map":"ga naar een andere topic-lijst of categorie","site_settings":null,"success":"Bedankt! We hebben een uitnodiging verstuurd naar <b>{{email}}</b>. We laten je direct weten wanneer ze je uitnodiging hebben geaccepteerd. Check de 'Uitnodigingen'-tab op je gebruikerspagina om bij te houden wie je hebt uitgenodigd.","suggested_topics":null,"taken":"Sorry dat e-mailadres is niet beschikbaar.","test_email_address":"e-mailadres om te testen","time_read":"Tijd Gelezen","title":"Site Instellingen","title_in":"Categorie - {{categoryName}}","title_placeholder":"Typ hier je title. Beschrijf binnen \u00e9\u00e9n zin waar deze discussie over gaat.","to_address":"Aan: Adres","toggle_information":"Zet topic details Aan/Uit","too_long":"Je gebruikersnaam is te lang.","too_short":"Je wachtwoord is te kort.","top_contributors":"Deelnemers","topic":"categorie onderwerp","topic_name":"Nieuwe Topicnaam:","topic_statuses":null,"topic_summary":null,"topics":null,"topics_entered":"Topics binnengegaan","total":"totaal aantal posts","tracking":null,"trust_level":"Vertrouwensniveau","twitter":null,"type_to_filter":"typ om te filteren...","unarchive":"De-archiveer Topic","unban":"Deblokkeer","unban_failed":"Er ging iets fout bij het deblokkeren van deze gebruiker {{error}}","undelete":"on-verwijder deze post","undo":"Draai {{alsoName}} terug","undo_preview":"sluit voorbeeld","unmute":"Ont-demp","unpin":"Ont-Pin Topic","unread":null,"unread_posts":"je hebt {{unread}} ongelezen posts in dit topic","upload":"Sorry, er is iets misgegaan bij het uploaden van je bestand. Probeer a.u.b. opnieuw.","uploading":"Aan het Uploaden...","user":null,"user_action_descriptions":null,"username":"Gebruikersnaam","username_or_email":"Gebruikersnaam of E-mailadres van gebruiker","users":null,"users_placeholder":"Voeg een gebruiker toe","view":"Bekijk Topics in Categorie","view_new_post":"Bekijk je nieuwe post.","view_popular_topics":"bekijk populaire topics","views":"Bekeken","views_long":"dit topic is {{number}} keer bekeken","visible":"Maak Zichtbaar","watching":null,"website":"Website","week":"week","week_desc":"topics die in de afgelopen 7 dagen gepost zijn","weekly":"wekelijks","yahoo":null,"year":"jaar","year_desc":"topics die in de afgelopen 365 dagen gepost zijn","yes_value":"Ja","you":"Jij","zero":"{{categoryName}}"}};
I18n.locale = 'nl'
;
