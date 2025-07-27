goog.provide('re_frame.fx');
re_frame.fx.kind = new cljs.core.Keyword(null,"fx","fx",-1237829572);
if(cljs.core.truth_((re_frame.registrar.kinds.cljs$core$IFn$_invoke$arity$1 ? re_frame.registrar.kinds.cljs$core$IFn$_invoke$arity$1(re_frame.fx.kind) : re_frame.registrar.kinds.call(null,re_frame.fx.kind)))){
} else {
throw (new Error("Assert failed: (re-frame.registrar/kinds kind)"));
}
re_frame.fx.reg_fx = (function re_frame$fx$reg_fx(id,handler){
return re_frame.registrar.register_handler(re_frame.fx.kind,id,handler);
});
/**
 * An interceptor whose `:after` actions the contents of `:effects`. As a result,
 *   this interceptor is Domino 3.
 * 
 *   This interceptor is silently added (by reg-event-db etc) to the front of
 *   interceptor chains for all events.
 * 
 *   For each key in `:effects` (a map), it calls the registered `effects handler`
 *   (see `reg-fx` for registration of effect handlers).
 * 
 *   So, if `:effects` was:
 *    {:dispatch  [:hello 42]
 *     :db        {...}
 *     :undo      "set flag"}
 * 
 *   it will call the registered effect handlers for each of the map's keys:
 *   `:dispatch`, `:undo` and `:db`. When calling each handler, provides the map
 *   value for that key - so in the example above the effect handler for :dispatch
 *   will be given one arg `[:hello 42]`.
 * 
 *   You cannot rely on the ordering in which effects are executed, other than that
 *   `:db` is guaranteed to be executed first.
 */
re_frame.fx.do_fx = re_frame.interceptor.__GT_interceptor.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"do-fx","do-fx",1194163050),new cljs.core.Keyword(null,"after","after",594996914),(function re_frame$fx$do_fx_after(context){
if(re_frame.trace.is_trace_enabled_QMARK_()){
var _STAR_current_trace_STAR__orig_val__10197 = re_frame.trace._STAR_current_trace_STAR_;
var _STAR_current_trace_STAR__temp_val__10198 = re_frame.trace.start_trace(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-type","op-type",-1636141668),new cljs.core.Keyword("event","do-fx","event/do-fx",1357330452)], null));
(re_frame.trace._STAR_current_trace_STAR_ = _STAR_current_trace_STAR__temp_val__10198);

try{try{var effects = new cljs.core.Keyword(null,"effects","effects",-282369292).cljs$core$IFn$_invoke$arity$1(context);
var effects_without_db = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(effects,new cljs.core.Keyword(null,"db","db",993250759));
var temp__5804__auto___10337 = new cljs.core.Keyword(null,"db","db",993250759).cljs$core$IFn$_invoke$arity$1(effects);
if(cljs.core.truth_(temp__5804__auto___10337)){
var new_db_10338 = temp__5804__auto___10337;
var fexpr__10225_10339 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,new cljs.core.Keyword(null,"db","db",993250759),false);
(fexpr__10225_10339.cljs$core$IFn$_invoke$arity$1 ? fexpr__10225_10339.cljs$core$IFn$_invoke$arity$1(new_db_10338) : fexpr__10225_10339.call(null,new_db_10338));
} else {
}

var seq__10226 = cljs.core.seq(effects_without_db);
var chunk__10227 = null;
var count__10228 = (0);
var i__10229 = (0);
while(true){
if((i__10229 < count__10228)){
var vec__10247 = chunk__10227.cljs$core$IIndexed$_nth$arity$2(null,i__10229);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10247,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10247,(1),null);
var temp__5802__auto___10340 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10340)){
var effect_fn_10341 = temp__5802__auto___10340;
(effect_fn_10341.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10341.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10341.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__10342 = seq__10226;
var G__10343 = chunk__10227;
var G__10344 = count__10228;
var G__10345 = (i__10229 + (1));
seq__10226 = G__10342;
chunk__10227 = G__10343;
count__10228 = G__10344;
i__10229 = G__10345;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10226);
if(temp__5804__auto__){
var seq__10226__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10226__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10226__$1);
var G__10349 = cljs.core.chunk_rest(seq__10226__$1);
var G__10350 = c__5525__auto__;
var G__10351 = cljs.core.count(c__5525__auto__);
var G__10352 = (0);
seq__10226 = G__10349;
chunk__10227 = G__10350;
count__10228 = G__10351;
i__10229 = G__10352;
continue;
} else {
var vec__10255 = cljs.core.first(seq__10226__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10255,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10255,(1),null);
var temp__5802__auto___10353 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10353)){
var effect_fn_10354 = temp__5802__auto___10353;
(effect_fn_10354.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10354.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10354.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__10355 = cljs.core.next(seq__10226__$1);
var G__10356 = null;
var G__10357 = (0);
var G__10358 = (0);
seq__10226 = G__10355;
chunk__10227 = G__10356;
count__10228 = G__10357;
i__10229 = G__10358;
continue;
}
} else {
return null;
}
}
break;
}
}finally {if(re_frame.trace.is_trace_enabled_QMARK_()){
var end__9632__auto___10359 = re_frame.interop.now();
var duration__9633__auto___10360 = (end__9632__auto___10359 - new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(re_frame.trace._STAR_current_trace_STAR_));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(re_frame.trace.traces,cljs.core.conj,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(re_frame.trace._STAR_current_trace_STAR_,new cljs.core.Keyword(null,"duration","duration",1444101068),duration__9633__auto___10360,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"end","end",-268185958),re_frame.interop.now()], 0)));

re_frame.trace.run_tracing_callbacks_BANG_(end__9632__auto___10359);
} else {
}
}}finally {(re_frame.trace._STAR_current_trace_STAR_ = _STAR_current_trace_STAR__orig_val__10197);
}} else {
var effects = new cljs.core.Keyword(null,"effects","effects",-282369292).cljs$core$IFn$_invoke$arity$1(context);
var effects_without_db = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(effects,new cljs.core.Keyword(null,"db","db",993250759));
var temp__5804__auto___10361 = new cljs.core.Keyword(null,"db","db",993250759).cljs$core$IFn$_invoke$arity$1(effects);
if(cljs.core.truth_(temp__5804__auto___10361)){
var new_db_10362 = temp__5804__auto___10361;
var fexpr__10260_10363 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,new cljs.core.Keyword(null,"db","db",993250759),false);
(fexpr__10260_10363.cljs$core$IFn$_invoke$arity$1 ? fexpr__10260_10363.cljs$core$IFn$_invoke$arity$1(new_db_10362) : fexpr__10260_10363.call(null,new_db_10362));
} else {
}

var seq__10262 = cljs.core.seq(effects_without_db);
var chunk__10263 = null;
var count__10264 = (0);
var i__10265 = (0);
while(true){
if((i__10265 < count__10264)){
var vec__10273 = chunk__10263.cljs$core$IIndexed$_nth$arity$2(null,i__10265);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10273,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10273,(1),null);
var temp__5802__auto___10364 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10364)){
var effect_fn_10365 = temp__5802__auto___10364;
(effect_fn_10365.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10365.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10365.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__10366 = seq__10262;
var G__10367 = chunk__10263;
var G__10368 = count__10264;
var G__10369 = (i__10265 + (1));
seq__10262 = G__10366;
chunk__10263 = G__10367;
count__10264 = G__10368;
i__10265 = G__10369;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10262);
if(temp__5804__auto__){
var seq__10262__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10262__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10262__$1);
var G__10370 = cljs.core.chunk_rest(seq__10262__$1);
var G__10371 = c__5525__auto__;
var G__10372 = cljs.core.count(c__5525__auto__);
var G__10373 = (0);
seq__10262 = G__10370;
chunk__10263 = G__10371;
count__10264 = G__10372;
i__10265 = G__10373;
continue;
} else {
var vec__10278 = cljs.core.first(seq__10262__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10278,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10278,(1),null);
var temp__5802__auto___10374 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10374)){
var effect_fn_10375 = temp__5802__auto___10374;
(effect_fn_10375.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10375.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10375.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__10376 = cljs.core.next(seq__10262__$1);
var G__10377 = null;
var G__10378 = (0);
var G__10379 = (0);
seq__10262 = G__10376;
chunk__10263 = G__10377;
count__10264 = G__10378;
i__10265 = G__10379;
continue;
}
} else {
return null;
}
}
break;
}
}
})], 0));
re_frame.fx.dispatch_later = (function re_frame$fx$dispatch_later(p__10281){
var map__10282 = p__10281;
var map__10282__$1 = cljs.core.__destructure_map(map__10282);
var effect = map__10282__$1;
var ms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__10282__$1,new cljs.core.Keyword(null,"ms","ms",-1152709733));
var dispatch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__10282__$1,new cljs.core.Keyword(null,"dispatch","dispatch",1319337009));
if(((cljs.core.empty_QMARK_(dispatch)) || ((!(typeof ms === 'number'))))){
return re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: ignoring bad :dispatch-later value:",effect], 0));
} else {
return re_frame.interop.set_timeout_BANG_((function (){
return re_frame.router.dispatch(dispatch);
}),ms);
}
});
re_frame.fx.reg_fx(new cljs.core.Keyword(null,"dispatch-later","dispatch-later",291951390),(function (value){
if(cljs.core.map_QMARK_(value)){
return re_frame.fx.dispatch_later(value);
} else {
var seq__10283 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,value));
var chunk__10284 = null;
var count__10285 = (0);
var i__10286 = (0);
while(true){
if((i__10286 < count__10285)){
var effect = chunk__10284.cljs$core$IIndexed$_nth$arity$2(null,i__10286);
re_frame.fx.dispatch_later(effect);


var G__10385 = seq__10283;
var G__10386 = chunk__10284;
var G__10387 = count__10285;
var G__10388 = (i__10286 + (1));
seq__10283 = G__10385;
chunk__10284 = G__10386;
count__10285 = G__10387;
i__10286 = G__10388;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10283);
if(temp__5804__auto__){
var seq__10283__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10283__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10283__$1);
var G__10390 = cljs.core.chunk_rest(seq__10283__$1);
var G__10391 = c__5525__auto__;
var G__10392 = cljs.core.count(c__5525__auto__);
var G__10393 = (0);
seq__10283 = G__10390;
chunk__10284 = G__10391;
count__10285 = G__10392;
i__10286 = G__10393;
continue;
} else {
var effect = cljs.core.first(seq__10283__$1);
re_frame.fx.dispatch_later(effect);


var G__10394 = cljs.core.next(seq__10283__$1);
var G__10395 = null;
var G__10396 = (0);
var G__10397 = (0);
seq__10283 = G__10394;
chunk__10284 = G__10395;
count__10285 = G__10396;
i__10286 = G__10397;
continue;
}
} else {
return null;
}
}
break;
}
}
}));
re_frame.fx.reg_fx(new cljs.core.Keyword(null,"fx","fx",-1237829572),(function (seq_of_effects){
if((!(cljs.core.sequential_QMARK_(seq_of_effects)))){
return re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \":fx\" effect expects a seq, but was given ",cljs.core.type(seq_of_effects)], 0));
} else {
var seq__10294 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,seq_of_effects));
var chunk__10295 = null;
var count__10296 = (0);
var i__10297 = (0);
while(true){
if((i__10297 < count__10296)){
var vec__10313 = chunk__10295.cljs$core$IIndexed$_nth$arity$2(null,i__10297);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10313,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10313,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db","db",993250759),effect_key)){
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \":fx\" effect should not contain a :db effect"], 0));
} else {
}

var temp__5802__auto___10399 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10399)){
var effect_fn_10402 = temp__5802__auto___10399;
(effect_fn_10402.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10402.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10402.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: in \":fx\" effect found ",effect_key," which has no associated handler. Ignoring."], 0));
}


var G__10403 = seq__10294;
var G__10404 = chunk__10295;
var G__10405 = count__10296;
var G__10406 = (i__10297 + (1));
seq__10294 = G__10403;
chunk__10295 = G__10404;
count__10296 = G__10405;
i__10297 = G__10406;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10294);
if(temp__5804__auto__){
var seq__10294__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10294__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10294__$1);
var G__10409 = cljs.core.chunk_rest(seq__10294__$1);
var G__10410 = c__5525__auto__;
var G__10411 = cljs.core.count(c__5525__auto__);
var G__10412 = (0);
seq__10294 = G__10409;
chunk__10295 = G__10410;
count__10296 = G__10411;
i__10297 = G__10412;
continue;
} else {
var vec__10318 = cljs.core.first(seq__10294__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10318,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10318,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db","db",993250759),effect_key)){
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \":fx\" effect should not contain a :db effect"], 0));
} else {
}

var temp__5802__auto___10414 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10414)){
var effect_fn_10415 = temp__5802__auto___10414;
(effect_fn_10415.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10415.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10415.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: in \":fx\" effect found ",effect_key," which has no associated handler. Ignoring."], 0));
}


var G__10416 = cljs.core.next(seq__10294__$1);
var G__10417 = null;
var G__10418 = (0);
var G__10419 = (0);
seq__10294 = G__10416;
chunk__10295 = G__10417;
count__10296 = G__10418;
i__10297 = G__10419;
continue;
}
} else {
return null;
}
}
break;
}
}
}));
re_frame.fx.reg_fx(new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),(function (value){
if((!(cljs.core.vector_QMARK_(value)))){
return re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: ignoring bad :dispatch value. Expected a vector, but got:",value], 0));
} else {
return re_frame.router.dispatch(value);
}
}));
re_frame.fx.reg_fx(new cljs.core.Keyword(null,"dispatch-n","dispatch-n",-504469236),(function (value){
if((!(cljs.core.sequential_QMARK_(value)))){
return re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"error","error",-978969032),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: ignoring bad :dispatch-n value. Expected a collection, but got:",value], 0));
} else {
var seq__10321 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,value));
var chunk__10322 = null;
var count__10323 = (0);
var i__10324 = (0);
while(true){
if((i__10324 < count__10323)){
var event = chunk__10322.cljs$core$IIndexed$_nth$arity$2(null,i__10324);
re_frame.router.dispatch(event);


var G__10422 = seq__10321;
var G__10423 = chunk__10322;
var G__10424 = count__10323;
var G__10425 = (i__10324 + (1));
seq__10321 = G__10422;
chunk__10322 = G__10423;
count__10323 = G__10424;
i__10324 = G__10425;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10321);
if(temp__5804__auto__){
var seq__10321__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10321__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10321__$1);
var G__10427 = cljs.core.chunk_rest(seq__10321__$1);
var G__10428 = c__5525__auto__;
var G__10429 = cljs.core.count(c__5525__auto__);
var G__10430 = (0);
seq__10321 = G__10427;
chunk__10322 = G__10428;
count__10323 = G__10429;
i__10324 = G__10430;
continue;
} else {
var event = cljs.core.first(seq__10321__$1);
re_frame.router.dispatch(event);


var G__10431 = cljs.core.next(seq__10321__$1);
var G__10432 = null;
var G__10433 = (0);
var G__10434 = (0);
seq__10321 = G__10431;
chunk__10322 = G__10432;
count__10323 = G__10433;
i__10324 = G__10434;
continue;
}
} else {
return null;
}
}
break;
}
}
}));
re_frame.fx.reg_fx(new cljs.core.Keyword(null,"deregister-event-handler","deregister-event-handler",-1096518994),(function (value){
var clear_event = cljs.core.partial.cljs$core$IFn$_invoke$arity$2(re_frame.registrar.clear_handlers,re_frame.events.kind);
if(cljs.core.sequential_QMARK_(value)){
var seq__10328 = cljs.core.seq(value);
var chunk__10329 = null;
var count__10330 = (0);
var i__10331 = (0);
while(true){
if((i__10331 < count__10330)){
var event = chunk__10329.cljs$core$IIndexed$_nth$arity$2(null,i__10331);
clear_event(event);


var G__10439 = seq__10328;
var G__10440 = chunk__10329;
var G__10441 = count__10330;
var G__10442 = (i__10331 + (1));
seq__10328 = G__10439;
chunk__10329 = G__10440;
count__10330 = G__10441;
i__10331 = G__10442;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10328);
if(temp__5804__auto__){
var seq__10328__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10328__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10328__$1);
var G__10444 = cljs.core.chunk_rest(seq__10328__$1);
var G__10445 = c__5525__auto__;
var G__10446 = cljs.core.count(c__5525__auto__);
var G__10447 = (0);
seq__10328 = G__10444;
chunk__10329 = G__10445;
count__10330 = G__10446;
i__10331 = G__10447;
continue;
} else {
var event = cljs.core.first(seq__10328__$1);
clear_event(event);


var G__10449 = cljs.core.next(seq__10328__$1);
var G__10450 = null;
var G__10451 = (0);
var G__10452 = (0);
seq__10328 = G__10449;
chunk__10329 = G__10450;
count__10330 = G__10451;
i__10331 = G__10452;
continue;
}
} else {
return null;
}
}
break;
}
} else {
return clear_event(value);
}
}));
re_frame.fx.reg_fx(new cljs.core.Keyword(null,"db","db",993250759),(function (value){
if((!((cljs.core.deref(re_frame.db.app_db) === value)))){
return cljs.core.reset_BANG_(re_frame.db.app_db,value);
} else {
return null;
}
}));

//# sourceMappingURL=re_frame.fx.js.map
