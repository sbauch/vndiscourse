RESPONSE = "6"
MENTION = "7"
TOPIC_RESPONSE = "8"
QUOTE = "9"
NEW_PRIVATE_MESSAGE = "12"
GOT_PRIVATE_MESSAGE = "13"

window.Discourse.User = Discourse.Model.extend Discourse.Presence,
  
  avatarLarge: (->
    Discourse.Utilities.avatarUrl(@get('username'), 'large', @get('avatar_template'))
  ).property('username')

  avatarSmall: (->
    Discourse.Utilities.avatarUrl(@get('username'), 'small', @get('avatar_template'))
  ).property('username')

  websiteName:( ->
    @get('website').split("/")[2]
  ).property('website')

  path:(->
    "/users/#{@get('username_lower')}"
  ).property('username')

  username_lower:(->
    @get('username').toLowerCase()
  ).property('username')

  trustLevel: (->
    Discourse.get('site.trust_levels').findProperty('id', @get('trust_level'))
  ).property('trust_level')

  changeUsername: (newUsername) ->
    $.ajax
      url: "/users/#{@get('username_lower')}/preferences/username"
      type: 'PUT'
      data: {new_username: newUsername}

  changeEmail: (email) ->
    $.ajax
      url: "/users/#{@get('username_lower')}/preferences/email"
      type: 'PUT'
      data: {email: email}

  copy: (deep) ->
    Discourse.User.create(@getProperties(Ember.keys(@)))

  save: (finished) ->
    jQuery.ajax "/users/" + @get('username').toLowerCase(),
      data: @getProperties('auto_track_topics_after_msecs','bio_raw', 'website', 'name', 'email_digests', 'email_direct', 'email_private_messages', 'digest_after_days')
      type: 'PUT'
      success: => finished(true)
      error: => finished(false)

  changePassword: (callback)->
    good = false
    $.ajax
      url: '/session/forgot_password'
      dataType: 'json'
      data: {username: @get('username')}
      type: 'POST'
      success: ->
        good = true
      complete: ->
        message = "error"
        message = "email sent" if good
        callback(message)

  filterStream: (filter)->
    filter = Discourse.User.statGroups[filter].join(",") if Discourse.User.statGroups[filter]
    @set('streamFilter', filter)
    @set('stream', Em.A())
    @loadMoreUserActions()

  loadUserAction: (id)->
    stream = @get('stream')
    $.ajax
      url: "/user_actions/#{id}.json",
      dataType: 'json'
      cache: 'false'
      success: (result)=>
        if result
          return unless (@get('streamFilter') || result['action_type']) == result['action_type']
          stream.insertAt(0, Discourse.UserAction.create(result))

  loadMoreUserActions: (callback)->
    stream = @get('stream')
    return unless stream
    url = "/user_actions?offset=#{stream.length}&user_id=#{@get("id")}"
    url += "&filter=#{@get('streamFilter')}" if @get('streamFilter')
    $.ajax
      url: url
      dataType: 'json'
      cache: 'false'
      success: (result)=>
        if result and result.user_actions and result.user_actions.each
          result.user_actions.each (i)=>
            stream.pushObject(Discourse.UserAction.create(i))
          @set('stream', stream)
        callback() if callback

  statsCountNonPM: (->
    total=0
    return 0 unless stats = @get('stats')
    @get('stats').each (s)->
      total+= parseInt(s.count) unless s.action_type is NEW_PRIVATE_MESSAGE || s.action_type is GOT_PRIVATE_MESSAGE
    total
  ).property('stats.@each')

  statsExcludingPms: (->
    r = []
    return r if @blank('stats')
    @get('stats').each (s)->
      r.push s unless (s.action_type == NEW_PRIVATE_MESSAGE || s.action_type == GOT_PRIVATE_MESSAGE)
    r
  ).property('stats.@each')

  statsPmsOnly: (->
    r = []
    return r if @blank('stats')
    @get('stats').each (s)->
      r.push s if (s.action_type is NEW_PRIVATE_MESSAGE or s.action_type is GOT_PRIVATE_MESSAGE)
    r
  ).property('stats.@each')

  inboxCount: (->
    r = 0
    @get('stats').each (s)->
      if s.action_type is GOT_PRIVATE_MESSAGE
        r = s.count
        return false
    return r
  ).property('stats.@each')

  sentItemsCount: (->
    r = 0
    @get('stats').each (s)->
      if s.action_type is NEW_PRIVATE_MESSAGE
        r = s.count
        return false
    return r
  ).property('stats.@each')


window.Discourse.User.reopenClass

  checkUsername: (username, email) ->
    $.ajax
      url: '/users/check_username'
      type: 'GET'
      data: {username: username, email: email}

  groupStats: (stats) ->
    g = {}
    stats.each (s) =>
      found = false
      for k,v of @statGroups
        if v.contains(s.action_type)
          found = true
          g[k] = {count: 0} unless g[k]
          g[k].count += parseInt(s.count)
          c = g[k].count
          if s.action_type == k
            g[k] = s
            s.count = c

      g[s.action_type] = s unless found

    stats.map((s)->
      g[s.action_type]
    ).exclude (s)->
      !s

  statGroups: (->
    g = {}
    g[RESPONSE] = [RESPONSE,MENTION,TOPIC_RESPONSE,QUOTE]
    g
  )()

  find: (username) ->
    promise = new RSVP.Promise()
    $.ajax
      url: "/users/" + username + '.json',
      success: (json) =>
        json.user.stats = @groupStats(json.user.stats)
        json.user.stream = json.user.stream.map (ua) -> Discourse.UserAction.create(ua) if json.user.stream
        user = Discourse.User.create(json.user)
        promise.resolve(user)
      error: (xhr) -> promise.reject(xhr)
    promise

  createAccount: (name, email, password, username, passwordConfirm, challenge) ->
    $.ajax
      url: '/users'
      dataType: 'json'
      data: {name: name, email: email, password: password, username: username, password_confirmation: passwordConfirm, challenge: challenge}
      type: 'POST'
  
   create: (result) ->
    result = @_super(result)
    result
    
  findAll: (query, filter)->
    result = Em.A()
    $.ajax
      url: "/admin/users/list/#{query}.json"
      data: {filter: filter}
      success: (users) ->
        users.each (u) -> result.pushObject(Discourse.AdminUser.create(u))
    result