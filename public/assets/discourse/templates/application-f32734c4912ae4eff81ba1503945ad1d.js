Ember.TEMPLATES.application=Ember.Handlebars.template(function(t,n,r,i,s){this.compilerInfo=[2,">= 1.0.0-rc.3"],r=r||Ember.Handlebars.helpers,s=s||{};var o="",u,a,f,l=r.helperMissing,c=this.escapeExpression;return a={},f={hash:{},contexts:[n],types:["ID"],hashTypes:a,data:s},s.buffer.push(c((u=r.render,u?u.call(n,"header",f):l.call(n,"render","header",f)))),s.buffer.push("\n\n<div id='main-outlet'>\n  "),a={},s.buffer.push(c(r._triageMustache.call(n,"outlet",{hash:{},contexts:[n],types:["ID"],hashTypes:a,data:s}))),s.buffer.push("\n</div>\n\n"),a={},f={hash:{},contexts:[n],types:["ID"],hashTypes:a,data:s},s.buffer.push(c((u=r.render,u?u.call(n,"modal",f):l.call(n,"render","modal",f)))),s.buffer.push("\n"),o});