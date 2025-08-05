goog.provide('day8.re_frame.http_fx');
/**
 * ajax-request only provides a single handler for success and errors
 */
day8.re_frame.http_fx.ajax_xhrio_handler = (function day8$re_frame$http_fx$ajax_xhrio_handler(on_success,on_failure,xhrio,p__11614){
var vec__11615 = p__11614;
var success_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11615,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11615,(1),null);
if(cljs.core.truth_(success_QMARK_)){
return (on_success.cljs$core$IFn$_invoke$arity$1 ? on_success.cljs$core$IFn$_invoke$arity$1(response) : on_success.call(null,response));
} else {
var details = cljs.core.merge.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"uri","uri",-774711847),xhrio.getLastUri(),new cljs.core.Keyword(null,"last-method","last-method",-563909920),xhrio.lastMethod_,new cljs.core.Keyword(null,"last-error","last-error",1848699973),xhrio.getLastError(),new cljs.core.Keyword(null,"last-error-code","last-error-code",276598110),xhrio.getLastErrorCode(),new cljs.core.Keyword(null,"debug-message","debug-message",-502855302),goog.net.ErrorCode.getDebugMessage(xhrio.getLastErrorCode())], null),response], 0));
return (on_failure.cljs$core$IFn$_invoke$arity$1 ? on_failure.cljs$core$IFn$_invoke$arity$1(details) : on_failure.call(null,details));
}
});
day8.re_frame.http_fx.request__GT_xhrio_options = (function day8$re_frame$http_fx$request__GT_xhrio_options(p__11621){
var map__11622 = p__11621;
var map__11622__$1 = cljs.core.__destructure_map(map__11622);
var request = map__11622__$1;
var on_success = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__11622__$1,new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"http-no-on-success","http-no-on-success",-1593227158)], null));
var on_failure = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map__11622__$1,new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"http-no-on-failure","http-no-on-failure",962976084)], null));
var api = (new goog.net.XhrIo());
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(request,new cljs.core.Keyword(null,"api","api",-899839580),api,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"handler","handler",-195596612),cljs.core.partial.cljs$core$IFn$_invoke$arity$4(day8.re_frame.http_fx.ajax_xhrio_handler,(function (p1__11619_SHARP_){
return re_frame.core.dispatch(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(on_success,p1__11619_SHARP_));
}),(function (p1__11620_SHARP_){
return re_frame.core.dispatch(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(on_failure,p1__11620_SHARP_));
}),api)], 0)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.Keyword(null,"on-request","on-request",972531605)], 0));
});
day8.re_frame.http_fx.dispatch_on_request = (function day8$re_frame$http_fx$dispatch_on_request(request,xhrio){
var temp__5802__auto__ = new cljs.core.Keyword(null,"on-request","on-request",972531605).cljs$core$IFn$_invoke$arity$1(request);
if(cljs.core.truth_(temp__5802__auto__)){
var on_request = temp__5802__auto__;
return re_frame.core.dispatch(cljs.core.conj.cljs$core$IFn$_invoke$arity$2(on_request,xhrio));
} else {
return null;
}
});
day8.re_frame.http_fx.http_effect = (function day8$re_frame$http_fx$http_effect(request){
var seq_request_maps = ((cljs.core.sequential_QMARK_(request))?request:new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [request], null));
var seq__11629 = cljs.core.seq(seq_request_maps);
var chunk__11630 = null;
var count__11631 = (0);
var i__11632 = (0);
while(true){
if((i__11632 < count__11631)){
var request__$1 = chunk__11630.cljs$core$IIndexed$_nth$arity$2(null,i__11632);
var xhrio_11639 = ajax.simple.ajax_request(day8.re_frame.http_fx.request__GT_xhrio_options(request__$1));
day8.re_frame.http_fx.dispatch_on_request(request__$1,xhrio_11639);


var G__11640 = seq__11629;
var G__11641 = chunk__11630;
var G__11642 = count__11631;
var G__11643 = (i__11632 + (1));
seq__11629 = G__11640;
chunk__11630 = G__11641;
count__11631 = G__11642;
i__11632 = G__11643;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__11629);
if(temp__5804__auto__){
var seq__11629__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__11629__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__11629__$1);
var G__11644 = cljs.core.chunk_rest(seq__11629__$1);
var G__11645 = c__5525__auto__;
var G__11646 = cljs.core.count(c__5525__auto__);
var G__11647 = (0);
seq__11629 = G__11644;
chunk__11630 = G__11645;
count__11631 = G__11646;
i__11632 = G__11647;
continue;
} else {
var request__$1 = cljs.core.first(seq__11629__$1);
var xhrio_11648 = ajax.simple.ajax_request(day8.re_frame.http_fx.request__GT_xhrio_options(request__$1));
day8.re_frame.http_fx.dispatch_on_request(request__$1,xhrio_11648);


var G__11649 = cljs.core.next(seq__11629__$1);
var G__11650 = null;
var G__11651 = (0);
var G__11652 = (0);
seq__11629 = G__11649;
chunk__11630 = G__11650;
count__11631 = G__11651;
i__11632 = G__11652;
continue;
}
} else {
return null;
}
}
break;
}
});
re_frame.core.reg_fx(new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),day8.re_frame.http_fx.http_effect);

//# sourceMappingURL=day8.re_frame.http_fx.js.map
