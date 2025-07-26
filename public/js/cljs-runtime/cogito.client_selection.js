goog.provide('cogito.client_selection');
cogito.client_selection.client_selection_form = (function cogito$client_selection$client_selection_form(){
var available_clients = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"available-clients","available-clients",-667188798)], null));
var selecting_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"selecting-client?","selecting-client?",-865934466)], null));
var error = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"client-selection-error","client-selection-error",-2090086776)], null));
var selected_client = reagent.core.atom.cljs$core$IFn$_invoke$arity$1(null);
return (function (){
console.log("Available clients:",cljs.core.clj__GT_js(cljs.core.deref(available_clients)));

return new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.client-selection-form","div.client-selection-form",527071621),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),"Select Client Account"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-600.mb-4","p.text-gray-600.mb-4",883842354),"You have access to multiple client accounts. Please select which one to use:"], null),(cljs.core.truth_(cljs.core.deref(error))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.error-message.bg-red-100.text-red-700.p-3.rounded.mb-4","div.error-message.bg-red-100.text-red-700.p-3.rounded.mb-4",-927749477),cljs.core.deref(error)], null):null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"form","form",-1624062471),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-submit","on-submit",1227871159),(function (e){
e.preventDefault();

if(cljs.core.truth_(cljs.core.deref(selected_client))){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select-client","select-client",1739667626),new cljs.core.Keyword(null,"client_id","client_id",48809273).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected_client))], null));
} else {
return null;
}
})], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-3.mb-6","div.space-y-3.mb-6",590448287),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Debug: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(available_clients))], null),(function (){var iter__5480__auto__ = (function cogito$client_selection$client_selection_form_$_iter__6716(s__6717){
return (new cljs.core.LazySeq(null,(function (){
var s__6717__$1 = s__6717;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__6717__$1);
if(temp__5804__auto__){
var s__6717__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__6717__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__6717__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__6719 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__6718 = (0);
while(true){
if((i__6718 < size__5479__auto__)){
var client = cljs.core._nth(c__5478__auto__,i__6718);
cljs.core.chunk_append(b__6719,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.flex.items-center.p-3.border.rounded.cursor-pointer.hover:bg-gray-50","label.flex.items-center.p-3.border.rounded.cursor-pointer.hover:bg-gray-50",-678075869),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(client,cljs.core.deref(selected_client)))?"border-blue-500 bg-blue-50":"border-gray-300")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.mr-3","input.mr-3",100966768),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),"radio",new cljs.core.Keyword(null,"name","name",1843675177),"client",new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"client_id","client_id",48809273).cljs$core$IFn$_invoke$arity$1(client),new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(client,cljs.core.deref(selected_client)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),((function (i__6718,client,c__5478__auto__,size__5479__auto__,b__6719,s__6717__$2,temp__5804__auto__,available_clients,selecting_QMARK_,error,selected_client){
return (function (){
return cljs.core.reset_BANG_(selected_client,client);
});})(i__6718,client,c__5478__auto__,size__5479__auto__,b__6719,s__6717__$2,temp__5804__auto__,available_clients,selecting_QMARK_,error,selected_client))
], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium","div.font-medium",-70133240),new cljs.core.Keyword(null,"client_name","client_name",1164448310).cljs$core$IFn$_invoke$arity$1(client)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"role","role",-736691072).cljs$core$IFn$_invoke$arity$1(client))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600","div.text-sm.text-gray-600",103560118),["Role: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"role","role",-736691072).cljs$core$IFn$_invoke$arity$1(client))].join('')], null):null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"client_id","client_id",48809273).cljs$core$IFn$_invoke$arity$1(client)], null)));

var G__6720 = (i__6718 + (1));
i__6718 = G__6720;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__6719),cogito$client_selection$client_selection_form_$_iter__6716(cljs.core.chunk_rest(s__6717__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__6719),null);
}
} else {
var client = cljs.core.first(s__6717__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"label.flex.items-center.p-3.border.rounded.cursor-pointer.hover:bg-gray-50","label.flex.items-center.p-3.border.rounded.cursor-pointer.hover:bg-gray-50",-678075869),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(client,cljs.core.deref(selected_client)))?"border-blue-500 bg-blue-50":"border-gray-300")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"input.mr-3","input.mr-3",100966768),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"type","type",1174270348),"radio",new cljs.core.Keyword(null,"name","name",1843675177),"client",new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"client_id","client_id",48809273).cljs$core$IFn$_invoke$arity$1(client),new cljs.core.Keyword(null,"checked","checked",-50955819),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(client,cljs.core.deref(selected_client)),new cljs.core.Keyword(null,"on-change","on-change",-732046149),((function (client,s__6717__$2,temp__5804__auto__,available_clients,selecting_QMARK_,error,selected_client){
return (function (){
return cljs.core.reset_BANG_(selected_client,client);
});})(client,s__6717__$2,temp__5804__auto__,available_clients,selecting_QMARK_,error,selected_client))
], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium","div.font-medium",-70133240),new cljs.core.Keyword(null,"client_name","client_name",1164448310).cljs$core$IFn$_invoke$arity$1(client)], null),(cljs.core.truth_(new cljs.core.Keyword(null,"role","role",-736691072).cljs$core$IFn$_invoke$arity$1(client))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600","div.text-sm.text-gray-600",103560118),["Role: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"role","role",-736691072).cljs$core$IFn$_invoke$arity$1(client))].join('')], null):null)], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"client_id","client_id",48809273).cljs$core$IFn$_invoke$arity$1(client)], null)),cogito$client_selection$client_selection_form_$_iter__6716(cljs.core.rest(s__6717__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(available_clients));
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.w-full.px-4.py-2.bg-blue-600.text-white.rounded.hover:bg-blue-700.disabled:opacity-50.disabled:cursor-not-allowed","button.w-full.px-4.py-2.bg-blue-600.text-white.rounded.hover:bg-blue-700.disabled:opacity-50.disabled:cursor-not-allowed",870702931),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),"submit",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = cljs.core.deref(selecting_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (cljs.core.deref(selected_client) == null);
}
})()], null),(cljs.core.truth_(cljs.core.deref(selecting_QMARK_))?"Selecting...":"Continue")], null)], null)], null);
});
});

//# sourceMappingURL=cogito.client_selection.js.map
