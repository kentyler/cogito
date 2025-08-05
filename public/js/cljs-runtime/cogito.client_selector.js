goog.provide('cogito.client_selector');
cogito.client_selector.client_switching_spinner = (function cogito$client_selector$client_switching_spinner(){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.space-x-2","div.flex.items-center.space-x-2",1577492984),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.text-gray-500","span.text-sm.text-gray-500",-84506544),"Switching clients..."], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.animate-spin.rounded-full.h-3.w-3.border-b-2.border-blue-600","div.animate-spin.rounded-full.h-3.w-3.border-b-2.border-blue-600",640374058)], null)], null);
});
cogito.client_selector.client_dropdown = (function cogito$client_selector$client_dropdown(user,available_clients,switching_client_QMARK_){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select.text-sm.bg-white.border.border-gray-300.rounded.px-2.py-1.focus:outline-none.focus:ring-2.focus:ring-blue-500","select.text-sm.bg-white.border.border-gray-300.rounded.px-2.py-1.focus:outline-none.focus:ring-2.focus:ring-blue-500",934617536),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"client","client",-1323448117).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(user))),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__11596_SHARP_){
var selected_client_name = p1__11596_SHARP_.target.value;
var selected_client = cljs.core.first(cljs.core.filter.cljs$core$IFn$_invoke$arity$2((function (c){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client_name","client_name",1164448310).cljs$core$IFn$_invoke$arity$1(c),selected_client_name);
}),cljs.core.deref(available_clients)));
if(cljs.core.truth_(selected_client)){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"switch-client","switch-client",-1365588951),new cljs.core.Keyword(null,"client_id","client_id",48809273).cljs$core$IFn$_invoke$arity$1(selected_client)], null));
} else {
return null;
}
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(switching_client_QMARK_)], null),(function (){var iter__5480__auto__ = (function cogito$client_selector$client_dropdown_$_iter__11597(s__11598){
return (new cljs.core.LazySeq(null,(function (){
var s__11598__$1 = s__11598;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11598__$1);
if(temp__5804__auto__){
var s__11598__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11598__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11598__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11600 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11599 = (0);
while(true){
if((i__11599 < size__5479__auto__)){
var client = cljs.core._nth(c__5478__auto__,i__11599);
cljs.core.chunk_append(b__11600,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"client_name","client_name",1164448310).cljs$core$IFn$_invoke$arity$1(client)], null),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"client_name","client_name",1164448310).cljs$core$IFn$_invoke$arity$1(client)),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(user)))].join('')], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"client_id","client_id",48809273).cljs$core$IFn$_invoke$arity$1(client)], null)));

var G__11601 = (i__11599 + (1));
i__11599 = G__11601;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11600),cogito$client_selector$client_dropdown_$_iter__11597(cljs.core.chunk_rest(s__11598__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11600),null);
}
} else {
var client = cljs.core.first(s__11598__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"client_name","client_name",1164448310).cljs$core$IFn$_invoke$arity$1(client)], null),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"client_name","client_name",1164448310).cljs$core$IFn$_invoke$arity$1(client)),":",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(user)))].join('')], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"client_id","client_id",48809273).cljs$core$IFn$_invoke$arity$1(client)], null)),cogito$client_selector$client_dropdown_$_iter__11597(cljs.core.rest(s__11598__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(available_clients));
})()], null);
});
cogito.client_selector.multi_client_section = (function cogito$client_selector$multi_client_section(user,available_clients,switching_client_QMARK_){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.space-x-2","div.flex.items-center.space-x-2",1577492984),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.text-gray-600","span.text-sm.text-gray-600",-806917613),"Logged in as"], null),(cljs.core.truth_(cljs.core.deref(switching_client_QMARK_))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.client_selector.client_switching_spinner], null):new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.client_selector.client_dropdown,user,available_clients,switching_client_QMARK_], null))], null);
});
cogito.client_selector.single_client_section = (function cogito$client_selector$single_client_section(user){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.text-gray-600","span.text-sm.text-gray-600",-806917613),["Logged in as ",(cljs.core.truth_(new cljs.core.Keyword(null,"client","client",-1323448117).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(user)))?[cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"client","client",-1323448117).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(user))),":"].join(''):null),cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(user)))].join('')], null);
});
cogito.client_selector.client_selector = (function cogito$client_selector$client_selector(){
var user = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"user","user",1532431356)], null));
var available_clients = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"available-clients","available-clients",-667188798)], null));
var switching_client_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"switching-client?","switching-client?",-2000769521)], null));
return (function (){
if((cljs.core.count(cljs.core.deref(available_clients)) > (1))){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.client_selector.multi_client_section,user,available_clients,switching_client_QMARK_], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.client_selector.single_client_section,user], null);
}
});
});

//# sourceMappingURL=cogito.client_selector.js.map
