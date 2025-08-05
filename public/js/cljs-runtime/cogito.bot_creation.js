goog.provide('cogito.bot_creation');
cogito.bot_creation.bot_creation_form = (function cogito$bot_creation$bot_creation_form(){
var form_data = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"meeting-url","meeting-url",1371135342),"",new cljs.core.Keyword(null,"meeting-name","meeting-name",829298160),""], null));
var loading_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","loading?","bot-creation/loading?",-1601059818)], null));
var message = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681)], null));
var user_email = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"user-email","user-email",2126479881)], null));
return (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bot-creation-tab.p-6.max-w-2xl.mx-auto","div.bot-creation-tab.p-6.max-w-2xl.mx-auto",-195810561),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-2xl.font-bold.mb-6","h2.text-2xl.font-bold.mb-6",1427050606),"Create Recall Bot"], null),(cljs.core.truth_(cljs.core.deref(message))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.message-display.p-4.mb-4.rounded","div.message-display.p-4.mb-4.rounded",-934640921),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"type","type",1174270348).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(message)),new cljs.core.Keyword(null,"error","error",-978969032)))?"bg-red-100 text-red-700":"bg-green-100 text-green-700")], null),new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(message))], null):null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"form.space-y-4","form.space-y-4",538379850),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-submit","on-submit",1227871159),(function (e){
e.preventDefault();

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","create-bot","bot-creation/create-bot",724855344),cljs.core.deref(form_data)], null));
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.form-group","div.form-group",-1721134770),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.text-gray-700.mb-1","label.block.text-sm.font-medium.text-gray-700.mb-1",602608273),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"meeting-url"], null),"Meeting URL"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.w-full.px-3.py-2.border.border-gray-300.rounded-md.focus:outline-none.focus:ring-2.focus:ring-blue-500","input.w-full.px-3.py-2.border.border-gray-300.rounded-md.focus:outline-none.focus:ring-2.focus:ring-blue-500",-982839672),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"type","type",1174270348),"text",new cljs.core.Keyword(null,"id","id",-1388402092),"meeting-url",new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"meeting-url","meeting-url",1371135342).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(form_data)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__11499_SHARP_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(form_data,cljs.core.assoc,new cljs.core.Keyword(null,"meeting-url","meeting-url",1371135342),p1__11499_SHARP_.target.value);
}),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Enter the meeting URL",new cljs.core.Keyword(null,"required","required",1807647006),true,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(loading_QMARK_)], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.form-group","div.form-group",-1721134770),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.block.text-sm.font-medium.text-gray-700.mb-1","label.block.text-sm.font-medium.text-gray-700.mb-1",602608273),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"for","for",-1323786319),"meeting-name"], null),"Meeting Name (optional)"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.w-full.px-3.py-2.border.border-gray-300.rounded-md.focus:outline-none.focus:ring-2.focus:ring-blue-500","input.w-full.px-3.py-2.border.border-gray-300.rounded-md.focus:outline-none.focus:ring-2.focus:ring-blue-500",-982839672),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"type","type",1174270348),"text",new cljs.core.Keyword(null,"id","id",-1388402092),"meeting-name",new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"meeting-name","meeting-name",829298160).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(form_data)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__11500_SHARP_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(form_data,cljs.core.assoc,new cljs.core.Keyword(null,"meeting-name","meeting-name",829298160),p1__11500_SHARP_.target.value);
}),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Enter a name for this meeting",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(loading_QMARK_)], null)], null)], null),(cljs.core.truth_(cljs.core.deref(user_email))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.info-box.p-3.bg-blue-50.rounded-md","div.info-box.p-3.bg-blue-50.rounded-md",-836820350),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-700","p.text-sm.text-gray-700",500368414),"Transcript will be sent to: ",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.font-medium","span.font-medium",1169799421),cljs.core.deref(user_email)], null)], null)], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.w-full.px-4.py-2.bg-blue-600.text-white.rounded-md.hover:bg-blue-700.focus:outline-none.focus:ring-2.focus:ring-blue-500.disabled:opacity-50.disabled:cursor-not-allowed","button.w-full.px-4.py-2.bg-blue-600.text-white.rounded-md.hover:bg-blue-700.focus:outline-none.focus:ring-2.focus:ring-blue-500.disabled:opacity-50.disabled:cursor-not-allowed",-752195814),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"submit",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = cljs.core.deref(loading_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.empty_QMARK_(new cljs.core.Keyword(null,"meeting-url","meeting-url",1371135342).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(form_data)));
}
})()], null),(cljs.core.truth_(cljs.core.deref(loading_QMARK_))?"Creating Bot...":"Create Bot")], null)], null)], null);
});
});
cogito.bot_creation.bot_list = (function cogito$bot_creation$bot_list(){
var bots = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","bots","bot-creation/bots",156109706)], null));
return (function (){
if(cljs.core.seq(cljs.core.deref(bots))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bot-list.mt-8","div.bot-list.mt-8",-1887301040),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-lg.font-semibold.mb-4","h3.text-lg.font-semibold.mb-4",938611169),"Recently Created Bots"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-2","div.space-y-2",-924002995),(function (){var iter__5480__auto__ = (function cogito$bot_creation$bot_list_$_iter__11509(s__11510){
return (new cljs.core.LazySeq(null,(function (){
var s__11510__$1 = s__11510;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11510__$1);
if(temp__5804__auto__){
var s__11510__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11510__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11510__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11512 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11511 = (0);
while(true){
if((i__11511 < size__5479__auto__)){
var bot = cljs.core._nth(c__5478__auto__,i__11511);
cljs.core.chunk_append(b__11512,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bot-item.p-4.border.border-gray-200.rounded-md","div.bot-item.p-4.border.border-gray-200.rounded-md",-1374982335),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium","div.font-medium",-70133240),new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429).cljs$core$IFn$_invoke$arity$2(bot,"Unnamed Meeting")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600","div.text-sm.text-gray-600",103560118),new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635).cljs$core$IFn$_invoke$arity$1(bot)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500","div.text-xs.text-gray-500",1569373991),"Created: ",(new Date(new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(bot))).toLocaleString()], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)], null)));

var G__11586 = (i__11511 + (1));
i__11511 = G__11586;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11512),cogito$bot_creation$bot_list_$_iter__11509(cljs.core.chunk_rest(s__11510__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11512),null);
}
} else {
var bot = cljs.core.first(s__11510__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bot-item.p-4.border.border-gray-200.rounded-md","div.bot-item.p-4.border.border-gray-200.rounded-md",-1374982335),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium","div.font-medium",-70133240),new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429).cljs$core$IFn$_invoke$arity$2(bot,"Unnamed Meeting")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600","div.text-sm.text-gray-600",103560118),new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635).cljs$core$IFn$_invoke$arity$1(bot)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500","div.text-xs.text-gray-500",1569373991),"Created: ",(new Date(new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(bot))).toLocaleString()], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)], null)),cogito$bot_creation$bot_list_$_iter__11509(cljs.core.rest(s__11510__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(bots));
})()], null)], null);
} else {
return null;
}
});
});
cogito.bot_creation.running_bots_list = (function cogito$bot_creation$running_bots_list(){
var running_bots = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","running-bots","bot-creation/running-bots",1908155650)], null));
var fetching_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetching-bots?","bot-creation/fetching-bots?",1664817515)], null));
var shutting_down = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutting-down","bot-creation/shutting-down",1605083445)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.running-bots.mt-8","div.running-bots.mt-8",-873375768),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-4","div.flex.items-center.justify-between.mb-4",-2021621261),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-lg.font-semibold","h3.text-lg.font-semibold",-1287280831),"Running Bots"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50","button.px-3.py-1.text-sm.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50",-1147190603),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743)], null));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(fetching_QMARK_)], null),(cljs.core.truth_(cljs.core.deref(fetching_QMARK_))?"Refreshing...":"Refresh")], null)], null),(cljs.core.truth_(cljs.core.deref(fetching_QMARK_))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.text-center.text-gray-500","div.p-4.text-center.text-gray-500",1683595419),"Loading bots..."], null):((cljs.core.empty_QMARK_(cljs.core.deref(running_bots)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.text-center.text-gray-500","div.p-4.text-center.text-gray-500",1683595419),"No bots currently running"], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-3","div.space-y-3",592868256),(function (){var iter__5480__auto__ = (function cogito$bot_creation$running_bots_list_$_iter__11570(s__11571){
return (new cljs.core.LazySeq(null,(function (){
var s__11571__$1 = s__11571;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11571__$1);
if(temp__5804__auto__){
var s__11571__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11571__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11571__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11573 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11572 = (0);
while(true){
if((i__11572 < size__5479__auto__)){
var bot = cljs.core._nth(c__5478__auto__,i__11572);
cljs.core.chunk_append(b__11573,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bot-item.p-4.border.border-gray-200.rounded-md.bg-white.shadow-sm","div.bot-item.p-4.border.border-gray-200.rounded-md.bg-white.shadow-sm",-287970587),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-start.justify-between","div.flex.items-start.justify-between",-811841233),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-gray-900","div.font-medium.text-gray-900",-1491870707),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429).cljs$core$IFn$_invoke$arity$1(bot);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Unnamed Meeting";
}
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600.mt-1","div.text-sm.text-gray-600.mt-1",1497850448),new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635).cljs$core$IFn$_invoke$arity$1(bot)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-2","div.text-xs.text-gray-500.mt-2",131815574),"Bot ID: ",new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(bot))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.mt-1","div.text-xs.mt-1",973950958),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full","span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full",-1176437611),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(function (){var G__11578 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(bot);
switch (G__11578) {
case "active":
return "bg-green-100 text-green-800";

break;
case "joining":
return "bg-yellow-100 text-yellow-800";

break;
case "leaving":
return "bg-orange-100 text-orange-800";

break;
default:
return "bg-gray-100 text-gray-800";

}
})()], null),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(bot)], null)], null):null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-red-500.hover:bg-red-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed","button.px-3.py-1.text-sm.bg-red-500.hover:bg-red-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed",-1362085529),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__11572,bot,c__5478__auto__,size__5479__auto__,b__11573,s__11571__$2,temp__5804__auto__,running_bots,fetching_QMARK_,shutting_down){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutdown-bot","bot-creation/shutdown-bot",-1819973085),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)], null));
});})(i__11572,bot,c__5478__auto__,size__5479__auto__,b__11573,s__11571__$2,temp__5804__auto__,running_bots,fetching_QMARK_,shutting_down))
,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(shutting_down),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot),false)], null),(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shutting_down),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)))?"Shutting down...":"Shutdown")], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)], null)));

var G__11588 = (i__11572 + (1));
i__11572 = G__11588;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11573),cogito$bot_creation$running_bots_list_$_iter__11570(cljs.core.chunk_rest(s__11571__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11573),null);
}
} else {
var bot = cljs.core.first(s__11571__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bot-item.p-4.border.border-gray-200.rounded-md.bg-white.shadow-sm","div.bot-item.p-4.border.border-gray-200.rounded-md.bg-white.shadow-sm",-287970587),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-start.justify-between","div.flex.items-start.justify-between",-811841233),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-gray-900","div.font-medium.text-gray-900",-1491870707),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429).cljs$core$IFn$_invoke$arity$1(bot);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Unnamed Meeting";
}
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600.mt-1","div.text-sm.text-gray-600.mt-1",1497850448),new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635).cljs$core$IFn$_invoke$arity$1(bot)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-2","div.text-xs.text-gray-500.mt-2",131815574),"Bot ID: ",new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(bot))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.mt-1","div.text-xs.mt-1",973950958),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full","span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full",-1176437611),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),(function (){var G__11579 = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(bot);
switch (G__11579) {
case "active":
return "bg-green-100 text-green-800";

break;
case "joining":
return "bg-yellow-100 text-yellow-800";

break;
case "leaving":
return "bg-orange-100 text-orange-800";

break;
default:
return "bg-gray-100 text-gray-800";

}
})()], null),new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(bot)], null)], null):null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-red-500.hover:bg-red-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed","button.px-3.py-1.text-sm.bg-red-500.hover:bg-red-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed",-1362085529),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (bot,s__11571__$2,temp__5804__auto__,running_bots,fetching_QMARK_,shutting_down){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutdown-bot","bot-creation/shutdown-bot",-1819973085),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)], null));
});})(bot,s__11571__$2,temp__5804__auto__,running_bots,fetching_QMARK_,shutting_down))
,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(shutting_down),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot),false)], null),(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(shutting_down),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)))?"Shutting down...":"Shutdown")], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(bot)], null)),cogito$bot_creation$running_bots_list_$_iter__11570(cljs.core.rest(s__11571__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(running_bots));
})()], null)
))], null);
});
});
cogito.bot_creation.stuck_meetings_list = (function cogito$bot_creation$stuck_meetings_list(){
var stuck_meetings = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","meetings","stuck-meetings/meetings",743579265)], null));
var fetching_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetching?","stuck-meetings/fetching?",375784401)], null));
var completing = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","completing","stuck-meetings/completing",-436837248)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.stuck-meetings.mt-8","div.stuck-meetings.mt-8",-118179189),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.justify-between.mb-4","div.flex.items-center.justify-between.mb-4",-2021621261),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-lg.font-semibold.text-orange-700","h3.text-lg.font-semibold.text-orange-700",1520420126),"Stuck Meetings"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50","button.px-3.py-1.text-sm.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50",-1147190603),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetch","stuck-meetings/fetch",-377416991)], null));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(fetching_QMARK_)], null),(cljs.core.truth_(cljs.core.deref(fetching_QMARK_))?"Refreshing...":"Refresh")], null)], null),(cljs.core.truth_(cljs.core.deref(fetching_QMARK_))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.text-center.text-gray-500","div.p-4.text-center.text-gray-500",1683595419),"Loading stuck meetings..."], null):((cljs.core.empty_QMARK_(cljs.core.deref(stuck_meetings)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-4.text-center.text-gray-500","div.p-4.text-center.text-gray-500",1683595419),"No stuck meetings found"], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-3","div.space-y-3",592868256),(function (){var iter__5480__auto__ = (function cogito$bot_creation$stuck_meetings_list_$_iter__11580(s__11581){
return (new cljs.core.LazySeq(null,(function (){
var s__11581__$1 = s__11581;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11581__$1);
if(temp__5804__auto__){
var s__11581__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11581__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11581__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11583 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11582 = (0);
while(true){
if((i__11582 < size__5479__auto__)){
var meeting = cljs.core._nth(c__5478__auto__,i__11582);
cljs.core.chunk_append(b__11583,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.meeting-item.p-4.border.border-orange-200.rounded-md.bg-orange-50.shadow-sm","div.meeting-item.p-4.border.border-orange-200.rounded-md.bg-orange-50.shadow-sm",1582254199),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-start.justify-between","div.flex.items-start.justify-between",-811841233),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-gray-900","div.font-medium.text-gray-900",-1491870707),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Unnamed Meeting";
}
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600.mt-1","div.text-sm.text-gray-600.mt-1",1497850448),new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635).cljs$core$IFn$_invoke$arity$1(meeting)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-2","div.text-xs.text-gray-500.mt-2",131815574),"Meeting ID: ",new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-1","div.text-xs.text-gray-500.mt-1",-879308194),"Bot ID: ",(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"bot_id","bot_id",853215903).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "N/A";
}
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-1","div.text-xs.text-gray-500.mt-1",-879308194),"Turn Count: ",new cljs.core.Keyword(null,"turn_count","turn_count",399639826).cljs$core$IFn$_invoke$arity$1(meeting)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-1","div.text-xs.text-gray-500.mt-1",-879308194),"Stuck since: ",(new Date(new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(meeting))).toLocaleString()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.mt-2","div.text-xs.mt-2",-1284806341),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full.bg-orange-100.text-orange-800","span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full.bg-orange-100.text-orange-800",-1833019371),"Stuck in joining"], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-orange-500.hover:bg-orange-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed","button.px-3.py-1.text-sm.bg-orange-500.hover:bg-orange-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed",-1781650837),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__11582,meeting,c__5478__auto__,size__5479__auto__,b__11583,s__11581__$2,temp__5804__auto__,stuck_meetings,fetching_QMARK_,completing){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","force-complete","stuck-meetings/force-complete",-393535154),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting)], null));
});})(i__11582,meeting,c__5478__auto__,size__5479__auto__,b__11583,s__11581__$2,temp__5804__auto__,stuck_meetings,fetching_QMARK_,completing))
,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(completing),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting),false)], null),(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(completing),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting)))?"Completing...":"Force Complete")], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting)], null)));

var G__11595 = (i__11582 + (1));
i__11582 = G__11595;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11583),cogito$bot_creation$stuck_meetings_list_$_iter__11580(cljs.core.chunk_rest(s__11581__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11583),null);
}
} else {
var meeting = cljs.core.first(s__11581__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.meeting-item.p-4.border.border-orange-200.rounded-md.bg-orange-50.shadow-sm","div.meeting-item.p-4.border.border-orange-200.rounded-md.bg-orange-50.shadow-sm",1582254199),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-start.justify-between","div.flex.items-start.justify-between",-811841233),new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1","div.flex-1",2004402050),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium.text-gray-900","div.font-medium.text-gray-900",-1491870707),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Unnamed Meeting";
}
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600.mt-1","div.text-sm.text-gray-600.mt-1",1497850448),new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635).cljs$core$IFn$_invoke$arity$1(meeting)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-2","div.text-xs.text-gray-500.mt-2",131815574),"Meeting ID: ",new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-1","div.text-xs.text-gray-500.mt-1",-879308194),"Bot ID: ",(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"bot_id","bot_id",853215903).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "N/A";
}
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-1","div.text-xs.text-gray-500.mt-1",-879308194),"Turn Count: ",new cljs.core.Keyword(null,"turn_count","turn_count",399639826).cljs$core$IFn$_invoke$arity$1(meeting)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.text-gray-500.mt-1","div.text-xs.text-gray-500.mt-1",-879308194),"Stuck since: ",(new Date(new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(meeting))).toLocaleString()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-xs.mt-2","div.text-xs.mt-2",-1284806341),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full.bg-orange-100.text-orange-800","span.inline-flex.px-2.py-1.text-xs.font-semibold.rounded-full.bg-orange-100.text-orange-800",-1833019371),"Stuck in joining"], null)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-orange-500.hover:bg-orange-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed","button.px-3.py-1.text-sm.bg-orange-500.hover:bg-orange-600.text-white.rounded.disabled:opacity-50.disabled:cursor-not-allowed",-1781650837),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (meeting,s__11581__$2,temp__5804__auto__,stuck_meetings,fetching_QMARK_,completing){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","force-complete","stuck-meetings/force-complete",-393535154),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting)], null));
});})(meeting,s__11581__$2,temp__5804__auto__,stuck_meetings,fetching_QMARK_,completing))
,new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(completing),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting),false)], null),(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(completing),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting)))?"Completing...":"Force Complete")], null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(meeting)], null)),cogito$bot_creation$stuck_meetings_list_$_iter__11580(cljs.core.rest(s__11581__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(stuck_meetings));
})()], null)
))], null);
});
});
cogito.bot_creation.bot_creation_tab = (function cogito$bot_creation$bot_creation_tab(){
re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743)], null));

re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetch","stuck-meetings/fetch",-377416991)], null));

return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bot-creation-container","div.bot-creation-container",-1983562507),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.bot_creation.bot_creation_form], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.bot_creation.running_bots_list], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.bot_creation.stuck_meetings_list], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.bot_creation.bot_list], null)], null);
});

//# sourceMappingURL=cogito.bot_creation.js.map
