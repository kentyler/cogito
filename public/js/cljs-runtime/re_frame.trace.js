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
re_frame.trace.start_trace = (function re_frame$trace$start_trace(p__12831){
var map__12832 = p__12831;
var map__12832__$1 = cljs.core.__destructure_map(map__12832);
var operation = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12832__$1,new cljs.core.Keyword(null,"operation","operation",-1267664310));
var op_type = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12832__$1,new cljs.core.Keyword(null,"op-type","op-type",-1636141668));
var tags = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12832__$1,new cljs.core.Keyword(null,"tags","tags",1771418977));
var child_of = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12832__$1,new cljs.core.Keyword(null,"child-of","child-of",-903376662));
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
var seq__12834_12862 = cljs.core.seq(cljs.core.deref(re_frame.trace.trace_cbs));
var chunk__12835_12863 = null;
var count__12836_12864 = (0);
var i__12837_12865 = (0);
while(true){
if((i__12837_12865 < count__12836_12864)){
var vec__12849_12866 = chunk__12835_12863.cljs$core$IIndexed$_nth$arity$2(null,i__12837_12865);
var k_12867 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12849_12866,(0),null);
var cb_12868 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12849_12866,(1),null);
try{var G__12853_12869 = cljs.core.deref(re_frame.trace.traces);
(cb_12868.cljs$core$IFn$_invoke$arity$1 ? cb_12868.cljs$core$IFn$_invoke$arity$1(G__12853_12869) : cb_12868.call(null,G__12853_12869));
}catch (e12852){var e_12870 = e12852;
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error thrown from trace cb",k_12867,"while storing",cljs.core.deref(re_frame.trace.traces),e_12870], 0));
}

var G__12871 = seq__12834_12862;
var G__12872 = chunk__12835_12863;
var G__12873 = count__12836_12864;
var G__12874 = (i__12837_12865 + (1));
seq__12834_12862 = G__12871;
chunk__12835_12863 = G__12872;
count__12836_12864 = G__12873;
i__12837_12865 = G__12874;
continue;
} else {
var temp__5804__auto___12875 = cljs.core.seq(seq__12834_12862);
if(temp__5804__auto___12875){
var seq__12834_12876__$1 = temp__5804__auto___12875;
if(cljs.core.chunked_seq_QMARK_(seq__12834_12876__$1)){
var c__5525__auto___12877 = cljs.core.chunk_first(seq__12834_12876__$1);
var G__12878 = cljs.core.chunk_rest(seq__12834_12876__$1);
var G__12879 = c__5525__auto___12877;
var G__12880 = cljs.core.count(c__5525__auto___12877);
var G__12881 = (0);
seq__12834_12862 = G__12878;
chunk__12835_12863 = G__12879;
count__12836_12864 = G__12880;
i__12837_12865 = G__12881;
continue;
} else {
var vec__12854_12882 = cljs.core.first(seq__12834_12876__$1);
var k_12883 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12854_12882,(0),null);
var cb_12884 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12854_12882,(1),null);
try{var G__12858_12885 = cljs.core.deref(re_frame.trace.traces);
(cb_12884.cljs$core$IFn$_invoke$arity$1 ? cb_12884.cljs$core$IFn$_invoke$arity$1(G__12858_12885) : cb_12884.call(null,G__12858_12885));
}catch (e12857){var e_12886 = e12857;
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["Error thrown from trace cb",k_12883,"while storing",cljs.core.deref(re_frame.trace.traces),e_12886], 0));
}

var G__12887 = cljs.core.next(seq__12834_12876__$1);
var G__12888 = null;
var G__12889 = (0);
var G__12890 = (0);
seq__12834_12862 = G__12887;
chunk__12835_12863 = G__12888;
count__12836_12864 = G__12889;
i__12837_12865 = G__12890;
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
