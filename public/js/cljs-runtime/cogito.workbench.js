goog.provide('cogito.workbench');
cogito.workbench.prompt_input = (function cogito$workbench$prompt_input(){
var current_prompt = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"current-prompt","current-prompt",998257734)], null));
var loading_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"loading?","loading?",1905707049)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.prompt-input","div.prompt-input",1168661254),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"textarea","textarea",-650375824),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(current_prompt),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__11602_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set-current-prompt","set-current-prompt",-1655270417),p1__11602_SHARP_.target.value], null));
}),new cljs.core.Keyword(null,"on-key-down","on-key-down",-1374733765),(function (p1__11603_SHARP_){
if(((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(p1__11603_SHARP_.key,"Enter")) && (((cljs.core.not(p1__11603_SHARP_.shiftKey)) && (cljs.core.not(cljs.core.deref(loading_QMARK_))))))){
p1__11603_SHARP_.preventDefault();

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
var user = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"user","user",1532431356)], null));
var available_clients = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"available-clients","available-clients",-667188798)], null));
if(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(user);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.empty_QMARK_(cljs.core.deref(available_clients));
} else {
return and__5000__auto__;
}
})())){
re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fetch-available-clients","fetch-available-clients",-142097161)], null));
} else {
}

return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.tab-nav.flex.border-b.border-gray-200.mb-4.justify-between","div.tab-nav.flex.border-b.border-gray-200.mb-4.justify-between",1762395533),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.tab_buttons.tab_buttons_section], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.space-x-4","div.flex.items-center.space-x-4",1559862292),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.client_selector.client_selector], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.logout_button.logout_button], null)], null)], null);
});
});
cogito.workbench.conversation_tab = (function cogito$workbench$conversation_tab(){
var turns = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"turns","turns",-1118736892)], null));
var active_meeting = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"active-meeting","active-meeting",-1062790)], null));
return (function (){
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.conversation-tab","div.conversation-tab",-1006893930),(cljs.core.truth_(cljs.core.deref(active_meeting))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-blue-50.border-b.border-blue-200.px-4.py-3.mb-4","div.bg-blue-50.border-b.border-blue-200.px-4.py-3.mb-4",-1679934696),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-between.items-center","div.flex.justify-between.items-center",-1855308582),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-lg.font-semibold.text-blue-900","h2.text-lg.font-semibold.text-blue-900",-1964251699),["Meeting: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"name","name",1843675177).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(active_meeting));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"block_name","block_name",-1541220297).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(active_meeting));
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
return "Unnamed Meeting";
}
}
})())].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-blue-700","p.text-sm.text-blue-700",-990826809),["ID: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var or__5002__auto__ = new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(active_meeting));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"block_id","block_id",-759441496).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(active_meeting));
}
})())].join('')], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-3.py-1.text-sm.bg-blue-600.text-white.rounded.hover:bg-blue-700","button.px-3.py-1.text-sm.bg-blue-600.text-white.rounded.hover:bg-blue-700",-74878218),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"leave-meeting","leave-meeting",-1760139326)], null));
})], null),"Leave Meeting"], null)], null)], null):null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.conversation-history","div.conversation-history",1470032434),(function (){var iter__5480__auto__ = (function cogito$workbench$conversation_tab_$_iter__11606(s__11607){
return (new cljs.core.LazySeq(null,(function (){
var s__11607__$1 = s__11607;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11607__$1);
if(temp__5804__auto__){
var s__11607__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11607__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11607__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11609 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11608 = (0);
while(true){
if((i__11608 < size__5479__auto__)){
var turn = cljs.core._nth(c__5478__auto__,i__11608);
cljs.core.chunk_append(b__11609,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.turn_display,turn], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(turn)], null)));

var G__11638 = (i__11608 + (1));
i__11608 = G__11638;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11609),cogito$workbench$conversation_tab_$_iter__11606(cljs.core.chunk_rest(s__11607__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11609),null);
}
} else {
var turn = cljs.core.first(s__11607__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.turn_display,turn], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(turn)], null)),cogito$workbench$conversation_tab_$_iter__11606(cljs.core.rest(s__11607__$2)));
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
cogito.workbench.upload_files_tab = (function cogito$workbench$upload_files_tab(){
var uploaded_files = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","files","upload-files/files",-568912197)], null));
if(cljs.core.empty_QMARK_(cljs.core.deref(uploaded_files))){
re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","load-files","upload-files/load-files",1900743151)], null));
} else {
}

return (function (){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"table.upload-files-tab.h-full.w-full","table.upload-files-tab.h-full.w-full",536402435),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"33%",new cljs.core.Keyword(null,"vertical-align","vertical-align",651007333),"top"], null),new cljs.core.Keyword(null,"class","class",-2030961996),"border-r border-gray-200 p-4"], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.upload_files_left_pane.upload_files_left_pane], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"67%",new cljs.core.Keyword(null,"vertical-align","vertical-align",651007333),"top"], null),new cljs.core.Keyword(null,"class","class",-2030961996),"p-4"], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.upload_files_right_pane.upload_files_right_pane], null)], null)], null)], null);
});
});
cogito.workbench.panel = (function cogito$workbench$panel(){
var active_tab = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","active-tab","workbench/active-tab",-23767367)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.workbench-panel","div.workbench-panel",1133758954),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.tab_nav], null),(function (){var G__11623 = cljs.core.deref(active_tab);
var G__11623__$1 = (((G__11623 instanceof cljs.core.Keyword))?G__11623.fqn:null);
switch (G__11623__$1) {
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
case "upload-files":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.upload_files_tab], null);

break;
case "daily-summary":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.daily_summary.daily_summary_tab], null);

break;
case "monthly-summary":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.monthly_summary.monthly_summary_tab], null);

break;
case "transcripts":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.transcripts_tab.transcripts_tab], null);

break;
case "invitations":
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.invitations.invitations_panel], null);

break;
default:
return new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.workbench.conversation_tab], null);

}
})()], null);
});
});

//# sourceMappingURL=cogito.workbench.js.map
