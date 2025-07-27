goog.provide('cogito.workbench');
cogito.workbench.prompt_input = (function cogito$workbench$prompt_input(){
var current_prompt = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"current-prompt","current-prompt",998257734)], null));
var loading_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loading?","loading?",1905707049)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.prompt-input","div.prompt-input",1168661254),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"textarea","textarea",-650375824),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(current_prompt),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__11442_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set-current-prompt","set-current-prompt",-1655270417),p1__11442_SHARP_.target.value], null));
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (p1__11443_SHARP_){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__11443_SHARP_.key,"Enter")) && (((cljs.core.not(p1__11443_SHARP_.shiftKey)) && (cljs.core.not(cljs.core.deref(loading_QMARK_))))))){
p1__11443_SHARP_.preventDefault();

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"submit-prompt","submit-prompt",502791731),cljs.core.deref(current_prompt)], null));
} else {
return null;
}
}),new cljs.core.Keyword(null,"placeholder","placeholder",-104873083),"Enter your prompt...",new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(loading_QMARK_)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"submit-prompt","submit-prompt",502791731),cljs.core.deref(current_prompt)], null));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),(function (){var or__5002__auto__ = cljs.core.deref(loading_QMARK_);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return cljs.core.empty_QMARK_(cljs.core.deref(current_prompt));
}
})()], null),(cljs.core.truth_(cljs.core.deref(loading_QMARK_))?"Processing...":"Send")], null)], null);
});
});
cogito.workbench.turn_display = (function cogito$workbench$turn_display(turn){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.turn","div.turn",537193653),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.turn-prompt","div.turn-prompt",862687719),new cljs.core.Keyword(null,"prompt","prompt",-78109487).cljs$core$IFn$_invoke$arity$1(turn)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.turn-response","div.turn-response",-2015772052),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.response_renderer.render_response,cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(new cljs.core.Keyword(null,"response","response",-1068424192).cljs$core$IFn$_invoke$arity$1(turn),new cljs.core.Keyword(null,"turn-id","turn-id",648025504),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(turn))], null)], null)], null);
});
cogito.workbench.tab_nav = (function cogito$workbench$tab_nav(){
var active_tab = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","active-tab","workbench/active-tab",-23767367)], null));
var user = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"user","user",1532431356)], null));
var logging_out_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"logging-out?","logging-out?",-1351512203)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tab-nav.flex.border-b.border-gray-200.mb-4.justify-between","div.tab-nav.flex.border-b.border-gray-200.mb-4.justify-between",1762395533),new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex","div.flex",-396986231),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.tab-button.px-4.py-2.border-b-2","button.tab-button.px-4.py-2.border-b-2",581572723),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(active_tab),new cljs.core.Keyword(null,"conversation","conversation",1148767509)))?"border-blue-500 text-blue-600":"border-transparent text-gray-500 hover:text-gray-700"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),new cljs.core.Keyword(null,"conversation","conversation",1148767509)], null));
})], null),"Conversation"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.tab-button.px-4.py-2.border-b-2","button.tab-button.px-4.py-2.border-b-2",581572723),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(active_tab),new cljs.core.Keyword(null,"meetings","meetings",39002138)))?"border-blue-500 text-blue-600":"border-transparent text-gray-500 hover:text-gray-700"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),new cljs.core.Keyword(null,"meetings","meetings",39002138)], null));
})], null),"Meetings"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.tab-button.px-4.py-2.border-b-2","button.tab-button.px-4.py-2.border-b-2",581572723),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(active_tab),new cljs.core.Keyword(null,"bot-creation","bot-creation",-431891481)))?"border-blue-500 text-blue-600":"border-transparent text-gray-500 hover:text-gray-700"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),new cljs.core.Keyword(null,"bot-creation","bot-creation",-431891481)], null));
})], null),"Create Bot"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.tab-button.px-4.py-2.border-b-2","button.tab-button.px-4.py-2.border-b-2",581572723),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(active_tab),new cljs.core.Keyword(null,"map","map",1371690461)))?"border-blue-500 text-blue-600":"border-transparent text-gray-500 hover:text-gray-700"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),new cljs.core.Keyword(null,"map","map",1371690461)], null));
})], null),"Map"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.tab-button.px-4.py-2.border-b-2","button.tab-button.px-4.py-2.border-b-2",581572723),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(active_tab),new cljs.core.Keyword(null,"meeting-files","meeting-files",1883945510)))?"border-blue-500 text-blue-600":"border-transparent text-gray-500 hover:text-gray-700"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),new cljs.core.Keyword(null,"meeting-files","meeting-files",1883945510)], null));
})], null),"Meeting Files"], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.space-x-4","div.flex.items-center.space-x-4",1559862292),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-sm.text-gray-600","span.text-sm.text-gray-600",-806917613),["Logged in as ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(user)))].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-red-500.text-white.rounded.hover:bg-red-600.disabled:opacity-50","button.px-3.py-1.text-sm.bg-red-500.text-white.rounded.hover:bg-red-600.disabled:opacity-50",164118949),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"logout","logout",1418564329)], null));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(logging_out_QMARK_)], null),(cljs.core.truth_(cljs.core.deref(logging_out_QMARK_))?"Logging out...":"Logout")], null)], null)], null);
});
});
cogito.workbench.conversation_tab = (function cogito$workbench$conversation_tab(){
var turns = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"turns","turns",-1118736892)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.conversation-tab","div.conversation-tab",-1006893930),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.conversation-history","div.conversation-history",1470032434),(function (){var iter__5480__auto__ = (function cogito$workbench$conversation_tab_$_iter__11472(s__11473){
return (new cljs.core.LazySeq(null,(function (){
var s__11473__$1 = s__11473;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11473__$1);
if(temp__5804__auto__){
var s__11473__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11473__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11473__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11475 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11474 = (0);
while(true){
if((i__11474 < size__5479__auto__)){
var turn = cljs.core._nth(c__5478__auto__,i__11474);
cljs.core.chunk_append(b__11475,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.turn_display,turn], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(turn)], null)));

var G__11506 = (i__11474 + (1));
i__11474 = G__11506;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11475),cogito$workbench$conversation_tab_$_iter__11472(cljs.core.chunk_rest(s__11473__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11475),null);
}
} else {
var turn = cljs.core.first(s__11473__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.turn_display,turn], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(turn)], null)),cogito$workbench$conversation_tab_$_iter__11472(cljs.core.rest(s__11473__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(turns));
})()], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.prompt_input], null)], null);
});
});
cogito.workbench.meeting_files_tab = (function cogito$workbench$meeting_files_tab(){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.meeting-files-tab.p-4","div.meeting-files-tab.p-4",-856285520),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-xl.font-semibold.mb-4","h2.text-xl.font-semibold.mb-4",-929520145),"Meeting Files"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-600","p.text-gray-600",-123426867),"Coming soon: Upload and manage files for meeting contexts, search across meeting documents, and file-based insights."], null)], null);
});
cogito.workbench.panel = (function cogito$workbench$panel(){
var active_tab = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","active-tab","workbench/active-tab",-23767367)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.workbench-panel","div.workbench-panel",1133758954),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.tab_nav], null),(function (){var G__11491 = cljs.core.deref(active_tab);
var G__11491__$1 = (((G__11491 instanceof cljs.core.Keyword))?G__11491.fqn:null);
switch (G__11491__$1) {
case "conversation":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.conversation_tab], null);

break;
case "meetings":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.meetings.meetings_page], null);

break;
case "bot-creation":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.bot_creation.bot_creation_tab], null);

break;
case "map":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.semantic_map_simple.semantic_map_tab], null);

break;
case "meeting-files":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.meeting_files_tab], null);

break;
default:
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.conversation_tab], null);

}
})()], null);
});
});

//# sourceMappingURL=cogito.workbench.js.map
