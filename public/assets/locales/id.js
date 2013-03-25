// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
Array.prototype.indexOf||(Array.prototype.indexOf=function(e){"use strict";if(this===void 0||this===null)throw new TypeError;var t=Object(this),n=t.length>>>0;if(n===0)return-1;var r=0;arguments.length>0&&(r=Number(arguments[1]),r!==r?r=0:r!==0&&r!==Infinity&&r!==-Infinity&&(r=(r>0||-1)*Math.floor(Math.abs(r))));if(r>=n)return-1;var i=r>=0?r:Math.max(n-Math.abs(r),0);for(;i<n;i++)if(i in t&&t[i]===e)return i;return-1});var I18n=I18n||{};I18n.defaultLocale="en",I18n.fallbacks=!1,I18n.defaultSeparator=".",I18n.locale=null,I18n.PLACEHOLDER=/(?:\{\{|%\{)(.*?)(?:\}\}?)/gm,I18n.fallbackRules={},I18n.pluralizationRules={en:function(e){return e==0?["zero","none","other"]:e==1?"one":"other"}},I18n.getFallbacks=function(e){if(e===I18n.defaultLocale)return[];if(!I18n.fallbackRules[e]){var t=[],n=e.split("-");for(var r=1;r<n.length;r++)t.push(n.slice(0,r).join("-"));t.push(I18n.defaultLocale),I18n.fallbackRules[e]=t}return I18n.fallbackRules[e]},I18n.isValidNode=function(e,t,n){return e[t]!==null&&e[t]!==n},I18n.lookup=function(e,t){var t=t||{},n=e,r=this.prepareOptions(I18n.translations),i=t.locale||I18n.currentLocale(),s=r[i]||{},t=this.prepareOptions(t),o;typeof e=="object"&&(e=e.join(this.defaultSeparator)),t.scope&&(e=t.scope.toString()+this.defaultSeparator+e),e=e.split(this.defaultSeparator);while(s&&e.length>0)o=e.shift(),s=s[o];if(!s){if(I18n.fallbacks){var u=this.getFallbacks(i);for(var a=0;a<u.length;u++){s=I18n.lookup(n,this.prepareOptions({locale:u[a]},t));if(s)break}}!s&&this.isValidNode(t,"defaultValue")&&(s=t.defaultValue)}return s},I18n.prepareOptions=function(){var e={},t,n=arguments.length;for(var r=0;r<n;r++){t=arguments[r];if(!t)continue;for(var i in t)this.isValidNode(e,i)||(e[i]=t[i])}return e},I18n.interpolate=function(e,t){t=this.prepareOptions(t);var n=e.match(this.PLACEHOLDER),r,i,s;if(!n)return e;for(var o=0;r=n[o];o++)s=r.replace(this.PLACEHOLDER,"$1"),i=t[s],this.isValidNode(t,s)||(i="[missing "+r+" value]"),regex=new RegExp(r.replace(/\{/gm,"\\{").replace(/\}/gm,"\\}")),e=e.replace(regex,i);return e},I18n.translate=function(e,t){t=this.prepareOptions(t);var n=this.lookup(e,t);try{return typeof n=="object"?typeof t.count=="number"?this.pluralize(t.count,e,t):n:this.interpolate(n,t)}catch(r){return this.missingTranslation(e)}},I18n.localize=function(e,t){switch(e){case"currency":return this.toCurrency(t);case"number":return e=this.lookup("number.format"),this.toNumber(t,e);case"percentage":return this.toPercentage(t);default:return e.match(/^(date|time)/)?this.toTime(e,t):t.toString()}},I18n.parseDate=function(e){var t,n;if(typeof e=="object")return e;t=e.toString().match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?(Z|\+0000)?/);if(t){for(var r=1;r<=6;r++)t[r]=parseInt(t[r],10)||0;t[2]-=1,t[7]?n=new Date(Date.UTC(t[1],t[2],t[3],t[4],t[5],t[6])):n=new Date(t[1],t[2],t[3],t[4],t[5],t[6])}else typeof e=="number"?(n=new Date,n.setTime(e)):e.match(/\d+ \d+:\d+:\d+ [+-]\d+ \d+/)?(n=new Date,n.setTime(Date.parse(e))):(n=new Date,n.setTime(Date.parse(e)));return n},I18n.toTime=function(e,t){var n=this.parseDate(t),r=this.lookup(e);return n.toString().match(/invalid/i)?n.toString():r?this.strftime(n,r):n.toString()},I18n.strftime=function(e,t){var n=this.lookup("date");if(!n)return e.toString();n.meridian=n.meridian||["AM","PM"];var r=e.getDay(),i=e.getDate(),s=e.getFullYear(),o=e.getMonth()+1,u=e.getHours(),a=u,f=u>11?1:0,l=e.getSeconds(),c=e.getMinutes(),h=e.getTimezoneOffset(),p=Math.floor(Math.abs(h/60)),d=Math.abs(h)-p*60,v=(h>0?"-":"+")+(p.toString().length<2?"0"+p:p)+(d.toString().length<2?"0"+d:d);a>12?a-=12:a===0&&(a=12);var m=function(e){var t="0"+e.toString();return t.substr(t.length-2)},g=t;return g=g.replace("%a",n.abbr_day_names[r]),g=g.replace("%A",n.day_names[r]),g=g.replace("%b",n.abbr_month_names[o]),g=g.replace("%B",n.month_names[o]),g=g.replace("%d",m(i)),g=g.replace("%e",i),g=g.replace("%-d",i),g=g.replace("%H",m(u)),g=g.replace("%-H",u),g=g.replace("%I",m(a)),g=g.replace("%-I",a),g=g.replace("%m",m(o)),g=g.replace("%-m",o),g=g.replace("%M",m(c)),g=g.replace("%-M",c),g=g.replace("%p",n.meridian[f]),g=g.replace("%S",m(l)),g=g.replace("%-S",l),g=g.replace("%w",r),g=g.replace("%y",m(s)),g=g.replace("%-y",m(s).replace(/^0+/,"")),g=g.replace("%Y",s),g=g.replace("%z",v),g},I18n.toNumber=function(e,t){t=this.prepareOptions(t,this.lookup("number.format"),{precision:3,separator:".",delimiter:",",strip_insignificant_zeros:!1});var n=e<0,r=Math.abs(e).toFixed(t.precision).toString(),i=r.split("."),s,o=[],u;e=i[0],s=i[1];while(e.length>0)o.unshift(e.substr(Math.max(0,e.length-3),3)),e=e.substr(0,e.length-3);u=o.join(t.delimiter),t.precision>0&&(u+=t.separator+i[1]),n&&(u="-"+u);if(t.strip_insignificant_zeros){var a={separator:new RegExp(t.separator.replace(/\./,"\\.")+"$"),zeros:/0+$/};u=u.replace(a.zeros,"").replace(a.separator,"")}return u},I18n.toCurrency=function(e,t){return t=this.prepareOptions(t,this.lookup("number.currency.format"),this.lookup("number.format"),{unit:"$",precision:2,format:"%u%n",delimiter:",",separator:"."}),e=this.toNumber(e,t),e=t.format.replace("%u",t.unit).replace("%n",e),e},I18n.toHumanSize=function(e,t){var n=1024,r=e,i=0,s,o;while(r>=n&&i<4)r/=n,i+=1;return i===0?(s=this.t("number.human.storage_units.units.byte",{count:r}),o=0):(s=this.t("number.human.storage_units.units."+[null,"kb","mb","gb","tb"][i]),o=r-Math.floor(r)===0?0:1),t=this.prepareOptions(t,{precision:o,format:"%n%u",delimiter:""}),e=this.toNumber(r,t),e=t.format.replace("%u",s).replace("%n",e),e},I18n.toPercentage=function(e,t){return t=this.prepareOptions(t,this.lookup("number.percentage.format"),this.lookup("number.format"),{precision:3,separator:".",delimiter:""}),e=this.toNumber(e,t),e+"%"},I18n.pluralizer=function(e){return pluralizer=this.pluralizationRules[e],pluralizer!==undefined?pluralizer:this.pluralizationRules.en},I18n.findAndTranslateValidNode=function(e,t){for(i=0;i<e.length;i++){key=e[i];if(this.isValidNode(t,key))return t[key]}return null},I18n.pluralize=function(e,t,n){var r;try{r=this.lookup(t,n)}catch(i){}if(!r)return this.missingTranslation(t);var s;return n=this.prepareOptions(n),n.count=e.toString(),pluralizer=this.pluralizer(this.currentLocale()),key=pluralizer(Math.abs(e)),keys=typeof key=="object"&&key instanceof Array?key:[key],s=this.findAndTranslateValidNode(keys,r),s==null&&(s=this.missingTranslation(t,keys[0])),this.interpolate(s,n)},I18n.missingTranslation=function(){var e='[missing "'+this.currentLocale(),t=arguments.length;for(var n=0;n<t;n++)e+="."+arguments[n];return e+='" translation]',e},I18n.currentLocale=function(){return I18n.locale||I18n.defaultLocale},I18n.t=I18n.translate,I18n.l=I18n.localize,I18n.p=I18n.pluralize,I18n.translations={id:{js:{share:{topic:"Bagikan tautan ke topik ini",post:"Bagikan tautan ke muatan ini"},edit:"sunting judul dan kategori dari topik ini",not_implemented:"Maaf, fitur itu belum diimplementasikan!",no_value:"Tidak",yes_value:"Ya",of_value:"dari",generic_error:"Maaf, kesalahan telah terjadi.",log_in:"Log In",age:"Umur",last_post:"Last post",admin_title:"Admin",flags_title:"Flags",show_more:"tampilkan lebih banyak",links:"Tautan-tautan",faq:"FAQ",you:"Anda",ok:"ok",or:"atau",suggested_topics:{title:"Sarankan topik"},bookmarks:{not_logged_in:"Sorry you must be logged in to bookmark posts.",created:"You've bookmarked this post.",not_bookmarked:"You've read this post; click to bookmark it.",last_read:"Ini adalah tautan terakhir yang anda telah baca."},new_topics_inserted:"{{count}} topik baru.",show_new_topics:"Klik untuk melihat.",preview:"pratilik",cancel:"batalkan",save:"Simpan ubahan",saving:"Menyimpan...",saved:"Tersimpan!",user_action_descriptions:{6:"Jawaban-jawaban"},user:{information:"Informasi pengguna",profile:"Profil",title:"Pengguna",mute:"Diamkan",edit:"Edit Preferensi",download_archive:"unduh arsip muatan saya",private_message:"Pesan Pribadi",private_messages:"Pesan-pesan Pribadi",activity_stream:"Aktifitas",preferences:"Preferensi",bio:"Tentang saya",change_password:"ganti",invited_by:"Diundang Oleh",trust_level:"Level Kepercayaan",change_username:{action:"ganti",title:"Ganti Nama Pengguna",confirm:"Penggantian nama pengguna ada konsekuensinya. Apakah anda yakin ingin mengganti nama pengguna anda?",taken:"Maaf, nama pengguna itu telah diambil.",error:"Ada kesalahan mengganti nama pengguna anda.",invalid:"Nama pengguna itu tidak sah. Nama pengguna itu harus terdiri dari angka dan huruf"},change_email:{action:"ganti",title:"Ganti Email",taken:"Maaf, email tersebut tidak tersedia.",error:"Ada kesalahan mengganti email anda. Mungkin alamat email tersebut sedang dipakai?",success:"Kami telah mengirim email ke alamat tersebut. Silahkan ikuti petunjuk konfirmasi."},email:{title:"Email",instructions:"Email anda tidak akan pernah diperlihatkan kepada publik.",ok:"Kelihatannya OK. Kami akan mengirim email kepada anda untuk konfirmasi.",invalid:"Silahkan masukkan alamat email yang sah.",authenticated:"Email anda telah diotentikasi oleh {{provider}}.",frequency:"Kami hanya akan meng-email anda jika kami tidak melihat anda akhir-akhir ini dan anda belum melihat apa yang kami email."},name:{title:"Nama",instructions:"Nama lengkap anda; tidak harus unik. Digunakan sebagai cara alternatif untuk mencocokkan @nama dan hanya akan ditampilkan di halaman pengguna anda.",too_short:"Nama anda terlalu pendek.",ok:"Nama anda kelihatannya ok."},username:{title:"Nama Pengguna",instructions:"Orang-orang dapat menyebut anda sebagai @{{username}}.",available:"Nama pengguna anda tersedia.",global_match:"Email cocok dengan nama pengguna yang terregistrasi.",global_mismatch:"Telah diregistrasi. Coba {{suggestion}}?",not_available:"Tidak tersedia. Coba {{suggestion}}?",too_short:"Nama pengguna anda terlalu pendek.",too_long:"Nama pengguna anda terlalu panjang.",checking:"Memeriksa apakah nama pengguna anda tersedia...",enter_email:"Nama pengguna ditemukan. Masukkan email yang cocok."},last_posted:"Muatan Terakhir",last_emailed:"Terakhir kali diemail",last_seen:"Terakhir kali dilihat",created:"Dibuat",log_out:"Log Out",website:"Situs Web",email_settings:"Email",email_digests:{title:"Kalau saya tidak mengunjungi situs ini, kirimi saya arsip email tentang apa saja yang baru",daily:"harian",weekly:"mingguan",bi_weekly:"dua minggu sekali"},email_direct:"Receive an email when someone quotes you, replies to your post, or mentions your @username",email_private_messages:"Receive an email when someone sends you a private message",other_settings:"Lain-lain",new_topic_duration:{label:"Consider topics new when",not_viewed:"I haven't viewed them yet",last_here:"they were posted since I was here last",after_n_days:{one:"they were posted in the last day",other:"they were posted in the last {{count}} days"},after_n_weeks:{one:"they were posted in the last week",other:"they were posted in the last {{count}} week"}},auto_track_topics:"Automatically track topics I enter",auto_track_options:{never:"never",always:"always",after_n_seconds:{one:"after 1 second",other:"after {{count}} seconds"},after_n_minutes:{one:"after 1 minute",other:"after {{count}} minutes"}},invited:{title:"Invites",user:"Invited User",none:"{{username}} hasn't invited any users to the site.",redeemed:"Redeemed Invites",redeemed_at:"Redeemed At",pending:"Pending Invites",topics_entered:"Topics Entered",posts_read_count:"Posts Read",rescind:"Remove Invitation",rescinded:"Invite removed",time_read:"Read Time",days_visited:"Days Visited",account_age_days:"Account age in days"},password:{title:"Password",too_short:"Your password is too short.",ok:"Your password looks good."},ip_address:{title:"Last IP Address"},avatar:{title:"Avatar",instructions:"We use <a href='https://gravatar.com' target='_blank'>Gravatar</a> for avatars based on your email"},filters:{all:"All"},stream:{posted_by:"Posted by",sent_by:"Sent by",private_message:"private message",the_topic:"the topic"}},loading:"Loading...",close:"Close",learn_more:"learn more...",year:"year",year_desc:"topics posted in the last 365 days",month:"month",month_desc:"topics posted in the last 30 days",week:"week",week_desc:"topics posted in the last 7 days",first_post:"First post",mute:"Mute",unmute:"Unmute",best_of:{title:"Best Of",description:"There are <b>{{count}}</b> posts in this topic. That's a lot! Would you like to save time by switching your view to show only the posts with the most interactions and responses?",button:'Switch to "Best Of" view'},private_message_info:{title:"Private Conversation",invite:"Invite Others..."},email:"Email",username:"Username",last_seen:"Last Seen",created:"Created",trust_level:"Trust Level",create_account:{title:"Create Account",action:"Create one now!",invite:"Don't have an account yet?",failed:"Something went wrong, perhaps this email is already registered, try the forgot password link"},forgot_password:{title:"Forgot Password",action:"I forgot my password",invite:"Enter your username or email address, and we'll send you a password reset email.",reset:"Reset Password",complete:"You should receive an email with instructions on how to reset your password shortly."},login:{title:"Log In",username:"Login",password:"Password",email_placeholder:"email address or username",error:"Unknown error",reset_password:"Reset Password",logging_in:"Logging In...",or:"Or",authenticating:"Authenticating...",awaiting_confirmation:"Your account is awaiting activation, use the forgot password link to issue another activation email.",awaiting_approval:"Your account has not been approved by a moderator yet. You will receive an email when it is approved.",not_activated:"You can't log in yet. We previously sent an activation email to you at <b>{{sentTo}}</b>. Please follow the instructions in that email to activate your account.",resend_activation_email:"Click here to send the activation email again.",sent_activation_email_again:"We sent another activation email to you at <b>{{currentEmail}}</b>. It might take a few minutes for it to arrive; be sure to check your spam folder.",google:{title:"Log In with Google",message:"Authenticating with Google (make sure pop up blockers are not enabled)"},twitter:{title:"Log In with Twitter",message:"Authenticating with Twitter (make sure pop up blockers are not enabled)"},facebook:{title:"Log In with Facebook",message:"Authenticating with Facebook (make sure pop up blockers are not enabled)"},yahoo:{title:"Log In with Yahoo",message:"Authenticating with Yahoo (make sure pop up blockers are not enabled)"},github:{title:"Log In with Github",message:"Authenticating with Github (make sure pop up blockers are not enabled)"},persona:{title:"Log In with Mozilla Persona",message:"Authenticating with Persona (make sure pop up blockers are not enabled)"}},composer:{saving_draft_tip:"saving",saved_draft_tip:"saved",saved_local_draft_tip:"saved locally",min_length:{at_least:"enter at least {{n}} characters",more:"{{n}} to go..."},save_edit:"Save Edit",reply:"Reply",create_topic:"Create Topic",create_pm:"Create Private Message",users_placeholder:"Add a user",title_placeholder:"Type your title here. What is this discussion about in one brief sentence?",reply_placeholder:"Type your reply here. Use Markdown or BBCode to format. Drag or paste an image here to upload it.",view_new_post:"View your new post.",saving:"Saving...",saved:"Saved!",saved_draft:"You have a post draft in progress. Click anywhere in this box to resume editing.",uploading:"Uploading...",show_preview:"show preview &raquo;",hide_preview:"&laquo; hide preview"},notifications:{title:"notifications of @name mentions, replies to your posts and topics, private messages, etc",none:"You have no notifications right now.",more:"view older notifications",mentioned:"<span title='mentioned' class='icon'>@</span> {{username}} {{link}}",quoted:"<i title='quoted' class='icon icon-quote-right'></i> {{username}} {{link}}",replied:"<i title='replied' class='icon icon-reply'></i> {{username}} {{link}}",posted:"<i title='replied' class='icon icon-reply'></i> {{username}} {{link}}",edited:"<i title='edited' class='icon icon-pencil'></i> {{username}} {{link}}",liked:"<i title='liked' class='icon icon-heart'></i> {{username}} {{link}}",private_message:"<i class='icon icon-envelope-alt' title='private message'></i> {{username}} sent you a private message: {{link}}",invited_to_private_message:"{{username}} invited you to a private conversation: {{link}}",invitee_accepted:"<i title='accepted your invitation' class='icon icon-signin'></i> {{username}} accepted your invitation",moved_post:"<i title='moved post' class='icon icon-arrow-right'></i> {{username}} moved post to {{link}}"},image_selector:{title:"Insert Image",from_my_computer:"From My Device",from_the_web:"From The Web",add_image:"Add Image",remote_tip:"enter address of an image in the form http://example.com/image.jpg",local_tip:"click to select an image from your device.",upload:"Upload",uploading_image:"Uploading image"},search:{title:"search for topics, posts, users, or categories",placeholder:"type your search terms here",no_results:"No results found.",searching:"Searching ..."},site_map:"go to another topic list or category",go_back:"go back",current_user:"go to your user page",favorite:{title:"Favorite",help:"add this topic to your favorites list"},topics:{none:{favorited:"You haven't favorited any topics yet. To favorite a topic, click or tap the star next to the title.",unread:"You have no unread topics to read.","new":"You have no new topics to read.",read:"You haven't read any topics yet.",posted:"You haven't posted in any topics yet.",popular:"There are no popular topics. That's sad.",category:"There are no {{category}} topics."},bottom:{popular:"There are no more popular topics to read.",posted:"There are no more posted topics to read.",read:"There are no more read topics to read.","new":"There are no more new topics to read.",unread:"There are no more unread topics to read.",favorited:"There are no more favorited topics to read.",category:"There are no more {{category}} topics."}},topic:{create_in:"Create {{categoryName}} Topic",create:"Create Topic",create_long:"Create a new Topic",private_message:"Start a private conversation",list:"Topics","new":"new topic",title:"Topic",loading_more:"Loading more Topics...",loading:"Loading topic...",invalid_access:{title:"Topic is private",description:"Sorry, you don't have access to that topic!"},server_error:{title:"Topic failed to load",description:"Sorry, we couldn't load that topic, possibly due to a connection problem. Please try again. If the problem persists, please let us know."},not_found:{title:"Topic not found",description:"Sorry, we couldn't find that topic. Perhaps it was removed by a moderator?"},unread_posts:"you have {{unread}} unread old posts in this topic",new_posts:"there are {{new_posts}} new posts in this topic since you last read it",likes:{one:"there is 1 like in this topic",other:"there are {{count}} likes in this topic"},back_to_list:"Back to Topic List",options:"Topic Options",show_links:"show links within this topic",toggle_information:"toggle topic details",read_more_in_category:"Want to read more? Browse other topics in {{catLink}} or {{popularLink}}.",read_more:"Want to read more? {{catLink}} or {{popularLink}}.",browse_all_categories:"Browse all categories",view_popular_topics:"view popular topics",suggest_create_topic:"Why not create a topic?",read_position_reset:"Your read position has been reset.",jump_reply_up:"jump to earlier reply",jump_reply_down:"jump to later reply",progress:{title:"topic progress",jump_top:"jump to first post",jump_bottom:"jump to last post",total:"total posts",current:"current post"},notifications:{title:"",reasons:{"3_2":"You will receive notifications because you are watching this topic.","3_1":"You will receive notifications because you created this topic.",3:"You will receive notifications because you are watching this topic.","2_4":"You will receive notifications because you posted a reply to this topic.","2_2":"You will receive notifications because you are tracking this topic.",2:'You will receive notifications because you <a href="/users/{{username}}/preferences">read this topic</a>.',1:"You will be notified only if someone mentions your @name or replies to your post.","1_2":"You will be notified only if someone mentions your @name or replies to your post.",0:"You are ignoring all notifications on this topic.","0_2":"You are ignoring all notifications on this topic."},watching:{title:"Watching",description:"same as Tracking, plus you will be notified of all new posts."},tracking:{title:"Tracking",description:"you will be notified of unread posts, @name mentions, and replies to your posts."},regular:{title:"Regular",description:"you will be notified only if someone mentions your @name or replies to your post."},muted:{title:"Muted",description:"you will not be notified of anything about this topic, and it will not appear on your unread tab."}},actions:{"delete":"Delete Topic",open:"Open Topic",close:"Close Topic",unpin:"Un-Pin Topic",pin:"Pin Topic",unarchive:"Unarchive Topic",archive:"Archive Topic",invisible:"Make Invisible",visible:"Make Visible",reset_read:"Reset Read Data",multi_select:"Toggle Multi-Select",convert_to_topic:"Convert to Regular Topic"},reply:{title:"Reply",help:"begin composing a reply to this topic"},share:{title:"Share",help:"share a link to this topic"},inviting:"Inviting...",invite_private:{title:"Invite to Private Conversation",email_or_username:"Invitee's Email or Username",email_or_username_placeholder:"email address or username",action:"Invite",success:"Thanks! We've invited that user to participate in this private conversation.",error:"Sorry there was an error inviting that user."},invite_reply:{title:"Invite Friends to Reply",help:"send invitations to friends so they can reply to this topic with a single click",email:"We'll send your friend a brief email allowing them to reply to this topic by clicking a link.",email_placeholder:"email address",success:"Thanks! We mailed out an invitation to <b>{{email}}</b>. We'll let you know when they redeem your invitation. Check the invitations tab on your user page to keep track of who you've invited.",error:"Sorry we couldn't invite that person. Perhaps they are already a user?"},login_reply:"Log In to Reply",filters:{user:"You're viewing only posts by specific user(s).",best_of:"You're viewing only the 'Best Of' posts.",cancel:"Show all posts in this topic again."},move_selected:{title:"Move Selected Posts",topic_name:"New Topic Name:",error:"Sorry, there was an error moving those posts.",instructions:{one:"You are about to create a new topic and populate it with the post you've selected.",other:"You are about to create a new topic and populate it with the <b>{{count}}</b> posts you've selected."}},multi_select:{select:"select",selected:"selected ({{count}})","delete":"delete selected",cancel:"cancel selecting",move:"move selected",description:{one:"You have selected <b>1</b> post.",other:"You have selected <b>{{count}}</b> posts."}}},post:{reply:"Replying to {{link}} by {{replyAvatar}} {{username}}",reply_topic:"Reply to {{link}}",edit:"Edit {{link}}",in_reply_to:"in reply to",reply_as_new_topic:"Reply as new Topic",continue_discussion:"Continuing the discussion from {{postLink}}:",follow_quote:"go to the quoted post",deleted_by_author:"(post removed by author)",has_replies:{one:"Reply",other:"Replies"},errors:{create:"Sorry, there was an error creating your post. Please try again.",edit:"Sorry, there was an error editing your post. Please try again.",upload:"Sorry, there was an error uploading that file. Please try again."},abandon:"Are you sure you want to abandon your post?",archetypes:{save:"Save Options"},controls:{reply:"begin composing a reply to this post",like:"like this post",edit:"edit this post",flag:"flag this post for moderator attention","delete":"delete this post",undelete:"undelete this post",share:"share a link to this post",bookmark:"bookmark this post to your user page",more:"More"},actions:{flag:"Flag",clear_flags:{one:"Clear flag",other:"Clear flags"},it_too:"{{alsoName}} it too",undo:"Undo {{alsoName}}",by_you_and_others:{zero:"You {{long_form}}",one:"You and 1 other person {{long_form}}",other:"You and {{count}} other people {{long_form}}"},by_others:{one:"1 person {{long_form}}",other:"{{count}} people {{long_form}}"}},edits:{one:"1 edit",other:"{{count}} edits",zero:"no edits"},"delete":{confirm:{one:"Are you sure you want to delete that post?",other:"Are you sure you want to delete all those posts?"}}},category:{none:"(no category)",edit:"edit",edit_long:"Edit Category",view:"View Topics in Category","delete":"Delete Category",create:"Create Category",more_posts:"view all {{posts}}...",name:"Category Name",description:"Description",topic:"category topic",color:"Color",name_placeholder:"Should be short and succinct.",color_placeholder:"Any web color",delete_confirm:"Are you sure you want to delete that category?",list:"List Categories",no_description:"There is no description for this category.",change_in_category_topic:"visit category topic to edit the description"},flagging:{title:"Why are you flagging this post?",action:"Flag Post",cant:"Sorry, you can't flag this post at this time.",custom_placeholder:"Why does this post require moderator attention? Let us know specifically what you are concerned about, and provide relevant links where possible.",custom_message:{at_least:"enter at least {{n}} characters",more:"{{n}} to go...",left:"{{n}} remaining"}},topic_summary:{title:"Topic Summary",links_shown:"show all {{totalLinks}} links..."},topic_statuses:{locked:{help:"this topic is closed; it no longer accepts new replies"},pinned:{help:"this topic is pinned; it will display at the top of its category"},archived:{help:"this topic is archived; it is frozen and cannot be changed"},invisible:{help:"this topic is invisible; it will not be displayed in topic lists, and can only be accessed via a direct link"}},posts:"Posts",posts_long:"{{number}} posts in this topic",original_post:"Original Post",views:"Views",replies:"Replies",views_long:"this topic has been viewed {{number}} times",activity:"Activity",likes:"Likes",top_contributors:"Participants",category_title:"Category",history:"History",categories_list:"Categories List",filters:{popular:{title:"Popular",help:"the most popular recent topics"},favorited:{title:"Favorited",help:"topics you marked as favorites"},read:{title:"Read",help:"topics you've read"},categories:{title:"Categories",title_in:"Category - {{categoryName}}",help:"all topics grouped by category"},unread:{title:{zero:"Unread",one:"Unread (1)",other:"Unread ({{count}})"},help:"tracked topics with unread posts"},"new":{title:{zero:"New",one:"New (1)",other:"New ({{count}})"},help:"new topics since your last visit, and tracked topics with new posts"},posted:{title:"My Posts",help:"topics you have posted in"},category:{title:{zero:"{{categoryName}}",one:"{{categoryName}} (1)",other:"{{categoryName}} ({{count}})"},help:"popular topics in the {{categoryName}} category"}},type_to_filter:"type to filter...",admin:{title:"Discourse Admin",dashboard:{title:"Admin Dashboard",version:"Installed version",up_to_date:"You are running the latest version of Discourse.",critical_available:"A critical update is available.",updates_available:"Updates are available.",please_upgrade:"Please upgrade!",latest_version:"Latest version",update_often:"Please update often!"},flags:{title:"Flags",old:"Old",active:"Active",clear:"Clear Flags",clear_title:"dismiss all flags on this post (will unhide hidden posts)","delete":"Delete Post",delete_title:"delete post (if its the first post delete topic)",flagged_by:"Flagged by"},customize:{title:"Customize",header:"Header",css:"Stylesheet",override_default:"Override default?",enabled:"Enabled?",preview:"preview",undo_preview:"undo preview",save:"Save","delete":"Delete",delete_confirm:"Delete this customization?"},email_logs:{title:"Email Logs",sent_at:"Sent At",email_type:"Email Type",to_address:"To Address",test_email_address:"email address to test",send_test:"send test email",sent_test:"sent!"},impersonate:{title:"Impersonate User",username_or_email:"Username or Email of User",help:"Use this tool to impersonate a user account for debugging purposes.",not_found:"That user can't be found.",invalid:"Sorry, you may not impersonate that user."},users:{title:"Users",create:"Add Admin User",last_emailed:"Last Emailed",not_found:"Sorry that username doesn't exist in our system.","new":"New",active:"Active",pending:"Pending",approved:"Approved?",approved_selected:{one:"approve user",other:"approve users ({{count}})"}},user:{ban_failed:"Something went wrong banning this user {{error}}",unban_failed:"Something went wrong unbanning this user {{error}}",ban_duration:"How long would you like to ban the user for? (days)",delete_all_posts:"Delete all posts",ban:"Ban",unban:"Unban",banned:"Banned?",moderator:"Moderator?",admin:"Admin?",show_admin_profile:"Admin",refresh_browsers:"Force browser refresh",show_public_profile:"Show Public Profile",impersonate:"Impersonate",revoke_admin:"Revoke Admin",grant_admin:"Grant Admin",revoke_moderation:"Revoke Moderation",grant_moderation:"Grant Moderation",basics:"Basics",reputation:"Reputation",permissions:"Permissions",activity:"Activity",like_count:"Likes Received",private_topics_count:"Private Topics Count",posts_read_count:"Posts Read",post_count:"Posts Created",topics_entered:"Topics Entered",flags_given_count:"Flags Given",flags_received_count:"Flags Received",approve:"Approve",approved_by:"approved by",time_read:"Read Time"},site_settings:{show_overriden:"Only show overridden",title:"Site Settings",reset:"reset to default"}}}}},I18n.locale="id";