goog.provide('cogito.invitations.list');
cogito.invitations.list.pending_invitations = (function cogito$invitations$list$pending_invitations(){
return (function (){
var loading = cljs.core.deref(re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","loading","invitations/loading",887428505)], null)));
var invitations = cljs.core.deref(re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","pending","invitations/pending",-701758057)], null)));
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-lg.font-semibold.mb-4","h3.text-lg.font-semibold.mb-4",938611169),"Pending Invitations"], null),(cljs.core.truth_(loading)?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-500","div.text-gray-500",-827790885),"Loading..."], null):((cljs.core.empty_QMARK_(invitations))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-500","div.text-gray-500",-827790885),"No pending invitations"], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-2","div.space-y-2",-924002995),(function (){var iter__5480__auto__ = (function cogito$invitations$list$pending_invitations_$_iter__11590(s__11591){
return (new cljs.core.LazySeq(null,(function (){
var s__11591__$1 = s__11591;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11591__$1);
if(temp__5804__auto__){
var s__11591__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11591__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11591__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11593 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11592 = (0);
while(true){
if((i__11592 < size__5479__auto__)){
var invitation = cljs.core._nth(c__5478__auto__,i__11592);
cljs.core.chunk_append(b__11593,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-3.border.rounded","div.p-3.border.rounded",-1978268063),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium","div.font-medium",-70133240),new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(invitation)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600","div.text-sm.text-gray-600",103560118),["Invited by ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"invited_by","invited_by",289384144).cljs$core$IFn$_invoke$arity$1(invitation))," on ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((new Date(new cljs.core.Keyword(null,"invited_at","invited_at",-616430052).cljs$core$IFn$_invoke$arity$1(invitation))).toLocaleDateString())].join('')], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(invitation)], null)));

var G__11594 = (i__11592 + (1));
i__11592 = G__11594;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11593),cogito$invitations$list$pending_invitations_$_iter__11590(cljs.core.chunk_rest(s__11591__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11593),null);
}
} else {
var invitation = cljs.core.first(s__11591__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.p-3.border.rounded","div.p-3.border.rounded",-1978268063),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.font-medium","div.font-medium",-70133240),new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(invitation)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-sm.text-gray-600","div.text-sm.text-gray-600",103560118),["Invited by ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"invited_by","invited_by",289384144).cljs$core$IFn$_invoke$arity$1(invitation))," on ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((new Date(new cljs.core.Keyword(null,"invited_at","invited_at",-616430052).cljs$core$IFn$_invoke$arity$1(invitation))).toLocaleDateString())].join('')], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(invitation)], null)),cogito$invitations$list$pending_invitations_$_iter__11590(cljs.core.rest(s__11591__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(invitations);
})()], null)
))], null);
});
});

//# sourceMappingURL=cogito.invitations.list.js.map
