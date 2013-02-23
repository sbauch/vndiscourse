window.Discourse.DirectoryController =  Ember.ArrayController.extend Discourse.Presence,

  username: null
  query: null
  selectAll: false
  content: null
  filterMode: 'directory'

  filterUsers: Discourse.debounce(->
    @refreshUsers()
  ,250).observes('username')

  orderChanged: (->
    @refreshUsers()
  ).observes('query')

  showApproval: (->
    return false unless Discourse.SiteSettings.must_approve_users
    return true if @get('query') is 'new'
    return true if @get('query') is 'pending'
  ).property('query')

  selectedCount: (->
    return 0 if @blank('content')
    @get('content').filterProperty('selected').length
  ).property('content.@each.selected')

  hasSelection: (->
    @get('selectedCount') > 0
  ).property('selectedCount')

  refreshUsers: ->
    @set 'content', Discourse.User.findAll(@get('query'), @get('username'))

  show: (term) ->
    if @get('query') == term
      @refreshUsers()
    else
      @set('query', term)

  approveUsers: ->
    Discourse.AdminUser.bulkApprove(@get('content').filterProperty('selected'))
  
  availableNavItems: (->
    summary = @get('filterSummary')
    loggedOn = !!Discourse.get('currentUser')

    Discourse.SiteSettings.top_menu.split("|").map((i)->
      Discourse.NavItem.fromText i,
        loggedOn: loggedOn
        hasCategories: true
        countSummary: summary
    ).filter((i)-> i != null)

  ).property('filterSummary')