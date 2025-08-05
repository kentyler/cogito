goog.provide('cogito.transcripts_tab');
cogito.transcripts_tab.transcripts_tab = (function cogito$transcripts_tab$transcripts_tab(){
var dates = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","available-dates","transcripts/available-dates",1253086128)], null));
var selected_date = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","selected-date","transcripts/selected-date",1339492685)], null));
var transcript = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","transcript-data","transcripts/transcript-data",1626967012)], null));
if(cljs.core.empty_QMARK_(cljs.core.deref(dates))){
re_frame.core.dispatch(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","load-available-dates","transcripts/load-available-dates",-659360171)], null));
} else {
}

return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.h-full.flex","div.h-full.flex",474459035),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.w-1-3.border-r.p-4","div.w-1-3.border-r.p-4",-1873976169),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2","h2",-372662728),"Transcript Dates"], null),(function (){var iter__5480__auto__ = (function cogito$transcripts_tab$transcripts_tab_$_iter__11526(s__11527){
return (new cljs.core.LazySeq(null,(function (){
var s__11527__$1 = s__11527;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11527__$1);
if(temp__5804__auto__){
var s__11527__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11527__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11527__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11529 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11528 = (0);
while(true){
if((i__11528 < size__5479__auto__)){
var date_info = cljs.core._nth(c__5478__auto__,i__11528);
cljs.core.chunk_append(b__11529,cljs.core.with_meta(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__11528,date_info,c__5478__auto__,size__5479__auto__,b__11529,s__11527__$2,temp__5804__auto__,dates,selected_date,transcript){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","select-date","transcripts/select-date",1906999211),new cljs.core.Keyword(null,"date","date",-1463434462).cljs$core$IFn$_invoke$arity$1(date_info)], null));
});})(i__11528,date_info,c__5478__auto__,size__5479__auto__,b__11529,s__11527__$2,temp__5804__auto__,dates,selected_date,transcript))
], null),new cljs.core.Keyword(null,"date","date",-1463434462).cljs$core$IFn$_invoke$arity$1(date_info)," (",new cljs.core.Keyword(null,"turn_count","turn_count",399639826).cljs$core$IFn$_invoke$arity$1(date_info)," turns)"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"date","date",-1463434462).cljs$core$IFn$_invoke$arity$1(date_info)], null)));

var G__11574 = (i__11528 + (1));
i__11528 = G__11574;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11529),cogito$transcripts_tab$transcripts_tab_$_iter__11526(cljs.core.chunk_rest(s__11527__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11529),null);
}
} else {
var date_info = cljs.core.first(s__11527__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 6, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (date_info,s__11527__$2,temp__5804__auto__,dates,selected_date,transcript){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","select-date","transcripts/select-date",1906999211),new cljs.core.Keyword(null,"date","date",-1463434462).cljs$core$IFn$_invoke$arity$1(date_info)], null));
});})(date_info,s__11527__$2,temp__5804__auto__,dates,selected_date,transcript))
], null),new cljs.core.Keyword(null,"date","date",-1463434462).cljs$core$IFn$_invoke$arity$1(date_info)," (",new cljs.core.Keyword(null,"turn_count","turn_count",399639826).cljs$core$IFn$_invoke$arity$1(date_info)," turns)"], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"date","date",-1463434462).cljs$core$IFn$_invoke$arity$1(date_info)], null)),cogito$transcripts_tab$transcripts_tab_$_iter__11526(cljs.core.rest(s__11527__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(dates));
})()], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.p-4","div.flex-1.p-4",-785429428),(cljs.core.truth_(cljs.core.deref(selected_date))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),["Conversations for ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected_date))].join('')], null),(function (){var iter__5480__auto__ = (function cogito$transcripts_tab$transcripts_tab_$_iter__11550(s__11551){
return (new cljs.core.LazySeq(null,(function (){
var s__11551__$1 = s__11551;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11551__$1);
if(temp__5804__auto__){
var s__11551__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11551__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11551__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11553 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11552 = (0);
while(true){
if((i__11552 < size__5479__auto__)){
var turn = cljs.core._nth(c__5478__auto__,i__11552);
cljs.core.chunk_append(b__11553,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-bold","div.font-bold",2116623818),"User: ",new cljs.core.Keyword(null,"prompt","prompt",-78109487).cljs$core$IFn$_invoke$arity$1(turn)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Assistant: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"response","response",-1068424192).cljs$core$IFn$_invoke$arity$1(turn))], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(turn)], null)));

var G__11577 = (i__11552 + (1));
i__11552 = G__11577;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11553),cogito$transcripts_tab$transcripts_tab_$_iter__11550(cljs.core.chunk_rest(s__11551__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11553),null);
}
} else {
var turn = cljs.core.first(s__11551__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-bold","div.font-bold",2116623818),"User: ",new cljs.core.Keyword(null,"prompt","prompt",-78109487).cljs$core$IFn$_invoke$arity$1(turn)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),"Assistant: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"response","response",-1068424192).cljs$core$IFn$_invoke$arity$1(turn))], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(turn)], null)),cogito$transcripts_tab$transcripts_tab_$_iter__11550(cljs.core.rest(s__11551__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(transcript));
})()], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Select a date to view transcripts"], null))], null)], null);
});
});

//# sourceMappingURL=cogito.transcripts_tab.js.map
