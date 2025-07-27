goog.provide('re_frame.trace');
re_frame.trace.id = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
re_frame.trace._STAR_current_trace_STAR_ = null;
re_frame.trace.reset_tracing_BANG_ = (function re_frame$trace$reset_tracing_BANG_(){
return cljs.core.reset_BANG_(re_frame.trace.id,(0));
});
/**
 * @define {boolean}
 */
re_frame.trace.trace_enabled_QMARK_ = goog.define("re_frame.trace.trace_enabled_QMARK_",false);
/**
 * See https://groups.google.com/d/msg/clojurescript/jk43kmYiMhA/IHglVr_TPdgJ for more details
 */
re_frame.trace.is_trace_enabled_QMARK_ = (function re_frame$trace$is_trace_enabled_QMARK_(){
return re_frame.trace.trace_enabled_QMARK_;
});
re_frame.trace.trace_cbs = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
if((typeof re_frame !== 'undefined') && (typeof re_frame.trace !== 'undefined') && (typeof re_frame.trace.traces !== 'undefined')){
} else {
re_frame.trace.traces = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.EMPTY);
}
if((typeof re_frame !== 'undefined') && (typeof re_frame.trace !== 'undefined') && (typeof re_frame.trace.next_delivery !== 'undefined')){
} else {
re_frame.trace.next_delivery = cljs.core.atom.cljs$core$IFn$_invoke$arity$1((0));
}
/**
 * Registers a tracing callback function which will receive a collection of one or more traces.
 *   Will replace an existing callback function if it shares the same key.
 */
re_frame.trace.register_trace_cb = (function re_frame$trace$register_trace_cb(key,f){
if(re_frame.trace.trace_enabled_QMARK_){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(re_frame.trace.trace_cbs,cljs.core.assoc,key,f);
} else {
return re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Tracing is not enabled. Please set {\"re_frame.trace.trace_enabled_QMARK_\" true} in :closure-defines. See: https://github.com/day8/re-frame-10x#installation."], 0));
}
});
re_frame.trace.remove_trace_cb = (function re_frame$trace$remove_trace_cb(key){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(re_frame.trace.trace_cbs,cljs.core.dissoc,key);

return null;
});
re_frame.trace.next_id = (function re_frame$trace$next_id(){
return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(re_frame.trace.id,cljs.core.inc);
});
re_frame.trace.start_trace = (function re_frame$trace$start_trace(p__9677){
var map__9679 = p__9677;
var map__9679__$1 = cljs.core.__destructure_map(map__9679);
var operation = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__9679__$1,new cljs.core.Keyword(null,"operation","operation",-1267664310));
var op_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__9679__$1,new cljs.core.Keyword(null,"op-type","op-type",-1636141668));
var tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__9679__$1,new cljs.core.Keyword(null,"tags","tags",1771418977));
var child_of = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__9679__$1,new cljs.core.Keyword(null,"child-of","child-of",-903376662));
return new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"id","id",-1388402092),re_frame.trace.next_id(),new cljs.core.Keyword(null,"operation","operation",-1267664310),operation,new cljs.core.Keyword(null,"op-type","op-type",-1636141668),op_type,new cljs.core.Keyword(null,"tags","tags",1771418977),tags,new cljs.core.Keyword(null,"child-of","child-of",-903376662),(function (){var or__5002__auto__ = child_of;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(re_frame.trace._STAR_current_trace_STAR_);
}
})(),new cljs.core.Keyword(null,"start","start",-355208981),re_frame.interop.now()], null);
});
re_frame.trace.debounce_time = (50);
re_frame.trace.debounce = (function re_frame$trace$debounce(f,interval){
return goog.functions.debounce(f,interval);
});
re_frame.trace.schedule_debounce = re_frame.trace.debounce((function re_frame$trace$tracing_cb_debounced(){
var seq__9684_9728 = cljs.core.seq(cljs.core.deref(re_frame.trace.trace_cbs));
var chunk__9685_9729 = null;
var count__9686_9730 = (0);
var i__9687_9731 = (0);
while(true){
if((i__9687_9731 < count__9686_9730)){
var vec__9705_9732 = chunk__9685_9729.cljs$core$IIndexed$_nth$arity$2(null,i__9687_9731);
var k_9733 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__9705_9732,(0),null);
var cb_9734 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__9705_9732,(1),null);
try{var G__9709_9735 = cljs.core.deref(re_frame.trace.traces);
(cb_9734.cljs$core$IFn$_invoke$arity$1 ? cb_9734.cljs$core$IFn$_invoke$arity$1(G__9709_9735) : cb_9734.call(null,G__9709_9735));
}catch (e9708){var e_9736 = e9708;
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error thrown from trace cb",k_9733,"while storing",cljs.core.deref(re_frame.trace.traces),e_9736], 0));
}

var G__9738 = seq__9684_9728;
var G__9739 = chunk__9685_9729;
var G__9740 = count__9686_9730;
var G__9741 = (i__9687_9731 + (1));
seq__9684_9728 = G__9738;
chunk__9685_9729 = G__9739;
count__9686_9730 = G__9740;
i__9687_9731 = G__9741;
continue;
} else {
var temp__5804__auto___9742 = cljs.core.seq(seq__9684_9728);
if(temp__5804__auto___9742){
var seq__9684_9743__$1 = temp__5804__auto___9742;
if(cljs.core.chunked_seq_QMARK_(seq__9684_9743__$1)){
var c__5525__auto___9744 = cljs.core.chunk_first(seq__9684_9743__$1);
var G__9745 = cljs.core.chunk_rest(seq__9684_9743__$1);
var G__9746 = c__5525__auto___9744;
var G__9747 = cljs.core.count(c__5525__auto___9744);
var G__9748 = (0);
seq__9684_9728 = G__9745;
chunk__9685_9729 = G__9746;
count__9686_9730 = G__9747;
i__9687_9731 = G__9748;
continue;
} else {
var vec__9710_9749 = cljs.core.first(seq__9684_9743__$1);
var k_9750 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__9710_9749,(0),null);
var cb_9751 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__9710_9749,(1),null);
try{var G__9717_9752 = cljs.core.deref(re_frame.trace.traces);
(cb_9751.cljs$core$IFn$_invoke$arity$1 ? cb_9751.cljs$core$IFn$_invoke$arity$1(G__9717_9752) : cb_9751.call(null,G__9717_9752));
}catch (e9714){var e_9753 = e9714;
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error thrown from trace cb",k_9750,"while storing",cljs.core.deref(re_frame.trace.traces),e_9753], 0));
}

var G__9754 = cljs.core.next(seq__9684_9743__$1);
var G__9755 = null;
var G__9756 = (0);
var G__9757 = (0);
seq__9684_9728 = G__9754;
chunk__9685_9729 = G__9755;
count__9686_9730 = G__9756;
i__9687_9731 = G__9757;
continue;
}
} else {
}
}
break;
}

return cljs.core.reset_BANG_(re_frame.trace.traces,cljs.core.PersistentVector.EMPTY);
}),re_frame.trace.debounce_time);
re_frame.trace.run_tracing_callbacks_BANG_ = (function re_frame$trace$run_tracing_callbacks_BANG_(now){
if(((cljs.core.deref(re_frame.trace.next_delivery) - (25)) < now)){
(re_frame.trace.schedule_debounce.cljs$core$IFn$_invoke$arity$0 ? re_frame.trace.schedule_debounce.cljs$core$IFn$_invoke$arity$0() : re_frame.trace.schedule_debounce.call(null));

return cljs.core.reset_BANG_(re_frame.trace.next_delivery,(now + re_frame.trace.debounce_time));
} else {
return null;
}
});

//# sourceMappingURL=re_frame.trace.js.map
