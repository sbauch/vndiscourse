/**
  Supports Discourse's custom @mention syntax for calling out a user in a post.
  It will add a special class to them, and create a link if the user is found in a
  local map.

  @event register
  @namespace Discourse.Dialect
**/
Discourse.Dialect.on("register", function(event) {

  var dialect = event.dialect,
      MD = event.MD;

  /**
    Support for github style code blocks

    @method mentionSupport
    @param {Markdown.Block} block the block to examine
    @param {Array} next the next blocks in the sequence
    @return {Array} the JsonML containing the markup or undefined if nothing changed.
    @namespace Discourse.Dialect
  **/
  dialect.block['mentions'] = function mentionSupport(block, next) {
    var pattern = /(\W|^)(@[A-Za-z0-9][A-Za-z0-9_]{2,14})(?=(\W|$))/gm,
        result,
        remaining = block,
        m,
        mentionLookup = dialect.options.mentionLookup || Discourse.Mention.lookupCache;

    if (block.match(/^ {3}/)) { return; }

    var pushIt = function(p) { result.push(p) };

    while (m = pattern.exec(remaining)) {
      result = result || ['p'];

      var username = m[2],
          usernameIndex = remaining.indexOf(username),
          before = remaining.slice(0, usernameIndex);

      pattern.lastIndex = 0;
      remaining = remaining.slice(usernameIndex + username.length);

      if (before) {
        this.processInline(before).forEach(pushIt);
      }

      if (mentionLookup(username.substr(1))) {
        result.push(['a', {'class': 'mention', href: Discourse.getURL("/users/") + username.substr(1).toLowerCase()}, username]);
      } else {
        result.push(['span', {'class': 'mention'}, username]);
      }

      if (remaining && remaining.match(/\n/)) {
        next.unshift(MD.mk_block(remaining));
      }
    }

    if (result) {
      if (remaining.length) {
        this.processInline(remaining).forEach(pushIt);
      }

      return [result];
    }
  };

});
