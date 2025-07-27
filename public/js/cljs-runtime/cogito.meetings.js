goog.provide('cogito.meetings');
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.meetings","delete-meeting","cogito.meetings/delete-meeting",-1708741737),(function (_,p__11306){
var vec__11307 = p__11306;
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11307,(0),null);
var block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11307,(1),null);
var meeting_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11307,(2),null);
if(cljs.core.truth_(confirm(["Are you sure you want to delete the meeting '",cljs.core.str.cljs$core$IFn$_invoke$arity$1(meeting_name),"'? This action cannot be undone."].join('')))){
fetch(["/api/meetings/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id)].join(''),({"method": "DELETE", "credentials": "same-origin"})).then((function (response){
if(cljs.core.truth_(response.ok)){
return response.json().then((function (p1__11304_SHARP_){
alert(cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__11304_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)),new cljs.core.Keyword(null,"message","message",-406056002),"Meeting deleted"));

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","load-meetings","cogito.meetings/load-meetings",-1936673641)], null));
}));
} else {
return response.json().then((function (p1__11305_SHARP_){
return alert(["Error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__11305_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0)),new cljs.core.Keyword(null,"error","error",-978969032),"Unknown error"))].join(''));
}));
}
})).catch((function (){
return alert("Network error occurred");
}));
} else {
}

return cljs.core.PersistentArrayMap.EMPTY;
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.meetings","load-meetings","cogito.meetings/load-meetings",-1936673641),(function (_,___$1){
fetch("/api/meetings",({"credentials": "same-origin"})).then((function (p1__11315_SHARP_){
return p1__11315_SHARP_.json();
})).then((function (data){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","meetings-loaded","cogito.meetings/meetings-loaded",1795033229),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))], null));
})).catch((function (error){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","meetings-load-failed","cogito.meetings/meetings-load-failed",1285555575),cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)], null));
}));

return cljs.core.PersistentArrayMap.EMPTY;
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.meetings","meetings-loaded","cogito.meetings/meetings-loaded",1795033229),(function (db,p__11323){
var vec__11325 = p__11323;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11325,(0),null);
var meetings = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11325,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"meetings","meetings",39002138),meetings);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.meetings","meetings-load-failed","cogito.meetings/meetings-load-failed",1285555575),(function (db,p__11328){
var vec__11329 = p__11328;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11329,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11329,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"meetings-error","meetings-error",-235243810),error);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.meetings","set-selected-meeting","cogito.meetings/set-selected-meeting",-850642765),(function (db,p__11337){
var vec__11338 = p__11337;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11338,(0),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11338,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"selected-meeting","selected-meeting",1294338347),meeting_id);
}));
re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("cogito.meetings","meetings","cogito.meetings/meetings",608972925),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (db,_){
return new cljs.core.Keyword(null,"meetings","meetings",39002138).cljs$core$IFn$_invoke$arity$1(db);
})], 0));
re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("cogito.meetings","meetings-error","cogito.meetings/meetings-error",-1812248767),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (db,_){
return new cljs.core.Keyword(null,"meetings-error","meetings-error",-235243810).cljs$core$IFn$_invoke$arity$1(db);
})], 0));
re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("cogito.meetings","selected-meeting","cogito.meetings/selected-meeting",-1423500912),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (db,_){
return new cljs.core.Keyword(null,"selected-meeting","selected-meeting",1294338347).cljs$core$IFn$_invoke$arity$1(db);
})], 0));
cogito.meetings.format_date = (function cogito$meetings$format_date(date_str){
if(cljs.core.truth_(date_str)){
try{var date = (new Date(date_str));
return date.toLocaleDateString("en-US",({"year": "numeric", "month": "short", "day": "numeric"}));
}catch (e11349){if((e11349 instanceof Error)){
var e = e11349;
return date_str;
} else {
throw e11349;

}
}} else {
return null;
}
});
cogito.meetings.simple_meeting_item = (function cogito$meetings$simple_meeting_item(meeting){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow duration-200"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex justify-between items-center"], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex-1"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-lg font-medium text-gray-900"], null),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"block_name","block_name",-1541220297).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Unnamed Meeting";
}
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm text-gray-500 mt-1"], null),cogito.meetings.format_date(new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(meeting))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm text-gray-600 mt-1"], null),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"turn_count","turn_count",399639826).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})())," turns, ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"participant_count","participant_count",847947294).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})())," participants"].join('')], null)], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex gap-2"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-200",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","set-selected-meeting","cogito.meetings/set-selected-meeting",-850642765),new cljs.core.Keyword(null,"block_id","block_id",-759441496).cljs$core$IFn$_invoke$arity$1(meeting)], null));
})], null),"View"], null),(cljs.core.truth_((function (){var and__5000__auto__ = new cljs.core.Keyword(null,"embedded_count","embedded_count",-1370450916).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(and__5000__auto__)){
return (new cljs.core.Keyword(null,"embedded_count","embedded_count",-1370450916).cljs$core$IFn$_invoke$arity$1(meeting) > (0));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","set-current-meeting","cogito.semantic-map-simple/set-current-meeting",49777924),new cljs.core.Keyword(null,"block_id","block_id",-759441496).cljs$core$IFn$_invoke$arity$1(meeting)], null));

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),new cljs.core.Keyword(null,"map","map",1371690461)], null));
})], null),"See Map"], null):null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","delete-meeting","cogito.meetings/delete-meeting",-1708741737),new cljs.core.Keyword(null,"block_id","block_id",-759441496).cljs$core$IFn$_invoke$arity$1(meeting),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"block_name","block_name",-1541220297).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Unnamed Meeting";
}
})()], null));
})], null),"Delete"], null)], null)], null)], null);
});
cogito.meetings.meetings_list = (function cogito$meetings$meetings_list(){
var meetings = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","meetings","cogito.meetings/meetings",608972925)], null));
var error = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","meetings-error","cogito.meetings/meetings-error",-1812248767)], null));
return reagent.core.create_class.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"component-did-mount","component-did-mount",-1126910518),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","load-meetings","cogito.meetings/load-meetings",-1936673641)], null));
}),new cljs.core.Keyword(null,"reagent-render","reagent-render",-985383853),(function (){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mb-8"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h1","h1",-1896887462),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-3xl font-bold text-gray-900"], null),"Meetings"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-gray-600 mt-2"], null),"Browse and analyze your conversation data"], null)], null),(cljs.core.truth_(cljs.core.deref(error))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"bg-red-50 border border-red-200 rounded-md p-4 mb-6"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"ml-3"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm font-medium text-red-800"], null),"Error loading meetings"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mt-2 text-sm text-red-700"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(error))], null)], null)], null)], null)], null):null),(((((cljs.core.deref(meetings) == null)) && ((cljs.core.deref(error) == null))))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"flex justify-center items-center py-12"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"], null)], null)], null):null),(cljs.core.truth_(cljs.core.deref(meetings))?((cljs.core.seq(cljs.core.deref(meetings)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"space-y-4"], null),(function (){var iter__5480__auto__ = (function cogito$meetings$meetings_list_$_iter__11359(s__11360){
return (new cljs.core.LazySeq(null,(function (){
var s__11360__$1 = s__11360;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11360__$1);
if(temp__5804__auto__){
var s__11360__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11360__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11360__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11362 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11361 = (0);
while(true){
if((i__11361 < size__5479__auto__)){
var meeting = cljs.core._nth(c__5478__auto__,i__11361);
cljs.core.chunk_append(b__11362,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.meetings.simple_meeting_item,meeting], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"block_id","block_id",-759441496).cljs$core$IFn$_invoke$arity$1(meeting)], null)));

var G__11379 = (i__11361 + (1));
i__11361 = G__11379;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11362),cogito$meetings$meetings_list_$_iter__11359(cljs.core.chunk_rest(s__11360__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11362),null);
}
} else {
var meeting = cljs.core.first(s__11360__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.meetings.simple_meeting_item,meeting], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"block_id","block_id",-759441496).cljs$core$IFn$_invoke$arity$1(meeting)], null)),cogito$meetings$meetings_list_$_iter__11359(cljs.core.rest(s__11360__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(meetings));
})()], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-center py-12"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-gray-500"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-lg"], null),"No meetings found"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm mt-2"], null),"Create a new meeting bot to get started"], null)], null)], null)):null)], null);
})], null));
});
cogito.meetings.meeting_detail = (function cogito$meetings$meeting_detail(meeting_id){
var meetings = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","meetings","cogito.meetings/meetings",608972925)], null));
var meeting = (cljs.core.truth_(cljs.core.deref(meetings))?cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (p1__11369_SHARP_){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"block_id","block_id",-759441496).cljs$core$IFn$_invoke$arity$1(p1__11369_SHARP_),meeting_id);
}),cljs.core.deref(meetings))):null);
return (function (){
if(cljs.core.truth_(meeting)){
return new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"bg-white rounded-lg shadow-md p-6"], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mb-4"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-blue-600 hover:text-blue-800 mb-4",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","set-selected-meeting","cogito.meetings/set-selected-meeting",-850642765),null], null));
})], null),"\u2190 Back to list"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-2xl font-bold text-gray-900"], null),new cljs.core.Keyword(null,"block_name","block_name",-1541220297).cljs$core$IFn$_invoke$arity$1(meeting)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm text-gray-500 mt-1"], null),cogito.meetings.format_date(new cljs.core.Keyword(null,"created_at","created_at",1484050750).cljs$core$IFn$_invoke$arity$1(meeting))], null)], null),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"grid grid-cols-2 gap-4 mb-6"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"bg-gray-50 p-4 rounded"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm text-gray-600"], null),"Total Turns"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-2xl font-semibold"], null),new cljs.core.Keyword(null,"turn_count","turn_count",399639826).cljs$core$IFn$_invoke$arity$1(meeting)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"bg-gray-50 p-4 rounded"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm text-gray-600"], null),"Participants"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-2xl font-semibold"], null),new cljs.core.Keyword(null,"participant_count","participant_count",847947294).cljs$core$IFn$_invoke$arity$1(meeting)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"bg-gray-50 p-4 rounded"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm text-gray-600"], null),"Embeddings"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-2xl font-semibold"], null),new cljs.core.Keyword(null,"embedded_count","embedded_count",-1370450916).cljs$core$IFn$_invoke$arity$1(meeting)], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"bg-gray-50 p-4 rounded"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm text-gray-600"], null),"Status"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-lg font-semibold"], null),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"status","status",-1997798413).cljs$core$IFn$_invoke$arity$1(meeting);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Unknown";
}
})()], null)], null)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635).cljs$core$IFn$_invoke$arity$1(meeting))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"mb-4"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm text-gray-600"], null),"Meeting URL"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-sm font-mono bg-gray-100 p-2 rounded"], null),new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635).cljs$core$IFn$_invoke$arity$1(meeting)], null)], null):null),(((new cljs.core.Keyword(null,"embedded_count","embedded_count",-1370450916).cljs$core$IFn$_invoke$arity$1(meeting) > (0)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200",new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","set-current-meeting","cogito.semantic-map-simple/set-current-meeting",49777924),new cljs.core.Keyword(null,"block_id","block_id",-759441496).cljs$core$IFn$_invoke$arity$1(meeting)], null));

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),new cljs.core.Keyword(null,"map","map",1371690461)], null));
})], null),"View Semantic Map"], null):null)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Meeting not found"], null);
}
});
});
cogito.meetings.meetings_page = (function cogito$meetings$meetings_page(){
var selected_meeting = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","selected-meeting","cogito.meetings/selected-meeting",-1423500912)], null));
return (function (){
if(cljs.core.truth_(cljs.core.deref(selected_meeting))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.meetings.meeting_detail,cljs.core.deref(selected_meeting)], null);
} else {
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.meetings.meetings_list], null);
}
});
});

//# sourceMappingURL=cogito.meetings.js.map
