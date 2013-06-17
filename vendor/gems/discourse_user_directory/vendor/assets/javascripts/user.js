Discourse.User.reopenClass({
  	findAll: function(query, filter) {
    	return Discourse.ajax("/directory.json", { 
      	data: { filter: filter }
    	}).then(function(users) {
				return users.map(function(u) {
					// console.log(Discourse.User.create(u));
        	return Discourse.User.create(u);
      	});
    	});
  	}
	});


// findAll: function(query, filter) {
//     return Discourse.ajax("/admin/users/list/" + query + ".json", {
//       data: { filter: filter }
//     }).then(function(users) {
//       return users.map(function(u) {
//         return Discourse.AdminUser.create(u);
//       });
//     });
//   }
// });

