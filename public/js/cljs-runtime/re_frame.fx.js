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
var _STAR_current_trace_STAR__orig_val__13194 = re_frame.trace._STAR_current_trace_STAR_;
var _STAR_current_trace_STAR__temp_val__13195 = re_frame.trace.start_trace(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-type","op-type",-1636141668),new cljs.core.Keyword("event","do-fx","event/do-fx",1357330452)], null));
(re_frame.trace._STAR_current_trace_STAR_ = _STAR_current_trace_STAR__temp_val__13195);

try{try{var effects = new cljs.core.Keyword(null,"effects","effects",-282369292).cljs$core$IFn$_invoke$arity$1(context);
var effects_without_db = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(effects,new cljs.core.Keyword(null,"db","db",993250759));
var temp__5804__auto___13280 = new cljs.core.Keyword(null,"db","db",993250759).cljs$core$IFn$_invoke$arity$1(effects);
if(cljs.core.truth_(temp__5804__auto___13280)){
var new_db_13281 = temp__5804__auto___13280;
var fexpr__13199_13282 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,new cljs.core.Keyword(null,"db","db",993250759),false);
(fexpr__13199_13282.cljs$core$IFn$_invoke$arity$1 ? fexpr__13199_13282.cljs$core$IFn$_invoke$arity$1(new_db_13281) : fexpr__13199_13282.call(null,new_db_13281));
} else {
}

var seq__13200 = cljs.core.seq(effects_without_db);
var chunk__13201 = null;
var count__13202 = (0);
var i__13203 = (0);
while(true){
if((i__13203 < count__13202)){
var vec__13211 = chunk__13201.cljs$core$IIndexed$_nth$arity$2(null,i__13203);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13211,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13211,(1),null);
var temp__5802__auto___13283 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___13283)){
var effect_fn_13284 = temp__5802__auto___13283;
(effect_fn_13284.cljs$core$IFn$_invoke$arity$1 ? effect_fn_13284.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_13284.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__13285 = seq__13200;
var G__13286 = chunk__13201;
var G__13287 = count__13202;
var G__13288 = (i__13203 + (1));
seq__13200 = G__13285;
chunk__13201 = G__13286;
count__13202 = G__13287;
i__13203 = G__13288;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13200);
if(temp__5804__auto__){
var seq__13200__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13200__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13200__$1);
var G__13289 = cljs.core.chunk_rest(seq__13200__$1);
var G__13290 = c__5525__auto__;
var G__13291 = cljs.core.count(c__5525__auto__);
var G__13292 = (0);
seq__13200 = G__13289;
chunk__13201 = G__13290;
count__13202 = G__13291;
i__13203 = G__13292;
continue;
} else {
var vec__13217 = cljs.core.first(seq__13200__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13217,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13217,(1),null);
var temp__5802__auto___13293 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___13293)){
var effect_fn_13294 = temp__5802__auto___13293;
(effect_fn_13294.cljs$core$IFn$_invoke$arity$1 ? effect_fn_13294.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_13294.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__13295 = cljs.core.next(seq__13200__$1);
var G__13296 = null;
var G__13297 = (0);
var G__13298 = (0);
seq__13200 = G__13295;
chunk__13201 = G__13296;
count__13202 = G__13297;
i__13203 = G__13298;
continue;
}
} else {
return null;
}
}
break;
}
}finally {if(re_frame.trace.is_trace_enabled_QMARK_()){
var end__12807__auto___13299 = re_frame.interop.now();
var duration__12808__auto___13300 = (end__12807__auto___13299 - new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(re_frame.trace._STAR_current_trace_STAR_));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(re_frame.trace.traces,cljs.core.conj,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(re_frame.trace._STAR_current_trace_STAR_,new cljs.core.Keyword(null,"duration","duration",1444101068),duration__12808__auto___13300,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"end","end",-268185958),re_frame.interop.now()], 0)));

re_frame.trace.run_tracing_callbacks_BANG_(end__12807__auto___13299);
} else {
}
}}finally {(re_frame.trace._STAR_current_trace_STAR_ = _STAR_current_trace_STAR__orig_val__13194);
}} else {
var effects = new cljs.core.Keyword(null,"effects","effects",-282369292).cljs$core$IFn$_invoke$arity$1(context);
var effects_without_db = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(effects,new cljs.core.Keyword(null,"db","db",993250759));
var temp__5804__auto___13301 = new cljs.core.Keyword(null,"db","db",993250759).cljs$core$IFn$_invoke$arity$1(effects);
if(cljs.core.truth_(temp__5804__auto___13301)){
var new_db_13302 = temp__5804__auto___13301;
var fexpr__13221_13303 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,new cljs.core.Keyword(null,"db","db",993250759),false);
(fexpr__13221_13303.cljs$core$IFn$_invoke$arity$1 ? fexpr__13221_13303.cljs$core$IFn$_invoke$arity$1(new_db_13302) : fexpr__13221_13303.call(null,new_db_13302));
} else {
}

var seq__13222 = cljs.core.seq(effects_without_db);
var chunk__13223 = null;
var count__13224 = (0);
var i__13225 = (0);
while(true){
if((i__13225 < count__13224)){
var vec__13240 = chunk__13223.cljs$core$IIndexed$_nth$arity$2(null,i__13225);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13240,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13240,(1),null);
var temp__5802__auto___13304 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___13304)){
var effect_fn_13305 = temp__5802__auto___13304;
(effect_fn_13305.cljs$core$IFn$_invoke$arity$1 ? effect_fn_13305.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_13305.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__13306 = seq__13222;
var G__13307 = chunk__13223;
var G__13308 = count__13224;
var G__13309 = (i__13225 + (1));
seq__13222 = G__13306;
chunk__13223 = G__13307;
count__13224 = G__13308;
i__13225 = G__13309;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13222);
if(temp__5804__auto__){
var seq__13222__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13222__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13222__$1);
var G__13310 = cljs.core.chunk_rest(seq__13222__$1);
var G__13311 = c__5525__auto__;
var G__13312 = cljs.core.count(c__5525__auto__);
var G__13313 = (0);
seq__13222 = G__13310;
chunk__13223 = G__13311;
count__13224 = G__13312;
i__13225 = G__13313;
continue;
} else {
var vec__13247 = cljs.core.first(seq__13222__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13247,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13247,(1),null);
var temp__5802__auto___13314 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___13314)){
var effect_fn_13315 = temp__5802__auto___13314;
(effect_fn_13315.cljs$core$IFn$_invoke$arity$1 ? effect_fn_13315.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_13315.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__13316 = cljs.core.next(seq__13222__$1);
var G__13317 = null;
var G__13318 = (0);
var G__13319 = (0);
seq__13222 = G__13316;
chunk__13223 = G__13317;
count__13224 = G__13318;
i__13225 = G__13319;
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
re_frame.fx.dispatch_later = (function re_frame$fx$dispatch_later(p__13250){
var map__13251 = p__13250;
var map__13251__$1 = cljs.core.__destructure_map(map__13251);
var effect = map__13251__$1;
var ms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__13251__$1,new cljs.core.Keyword(null,"ms","ms",-1152709733));
var dispatch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__13251__$1,new cljs.core.Keyword(null,"dispatch","dispatch",1319337009));
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
var seq__13252 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,value));
var chunk__13253 = null;
var count__13254 = (0);
var i__13255 = (0);
while(true){
if((i__13255 < count__13254)){
var effect = chunk__13253.cljs$core$IIndexed$_nth$arity$2(null,i__13255);
re_frame.fx.dispatch_later(effect);


var G__13320 = seq__13252;
var G__13321 = chunk__13253;
var G__13322 = count__13254;
var G__13323 = (i__13255 + (1));
seq__13252 = G__13320;
chunk__13253 = G__13321;
count__13254 = G__13322;
i__13255 = G__13323;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13252);
if(temp__5804__auto__){
var seq__13252__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13252__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13252__$1);
var G__13324 = cljs.core.chunk_rest(seq__13252__$1);
var G__13325 = c__5525__auto__;
var G__13326 = cljs.core.count(c__5525__auto__);
var G__13327 = (0);
seq__13252 = G__13324;
chunk__13253 = G__13325;
count__13254 = G__13326;
i__13255 = G__13327;
continue;
} else {
var effect = cljs.core.first(seq__13252__$1);
re_frame.fx.dispatch_later(effect);


var G__13328 = cljs.core.next(seq__13252__$1);
var G__13329 = null;
var G__13330 = (0);
var G__13331 = (0);
seq__13252 = G__13328;
chunk__13253 = G__13329;
count__13254 = G__13330;
i__13255 = G__13331;
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
var seq__13256 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,seq_of_effects));
var chunk__13257 = null;
var count__13258 = (0);
var i__13259 = (0);
while(true){
if((i__13259 < count__13258)){
var vec__13266 = chunk__13257.cljs$core$IIndexed$_nth$arity$2(null,i__13259);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13266,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13266,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db","db",993250759),effect_key)){
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \":fx\" effect should not contain a :db effect"], 0));
} else {
}

var temp__5802__auto___13332 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___13332)){
var effect_fn_13333 = temp__5802__auto___13332;
(effect_fn_13333.cljs$core$IFn$_invoke$arity$1 ? effect_fn_13333.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_13333.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: in \":fx\" effect found ",effect_key," which has no associated handler. Ignoring."], 0));
}


var G__13334 = seq__13256;
var G__13335 = chunk__13257;
var G__13336 = count__13258;
var G__13337 = (i__13259 + (1));
seq__13256 = G__13334;
chunk__13257 = G__13335;
count__13258 = G__13336;
i__13259 = G__13337;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13256);
if(temp__5804__auto__){
var seq__13256__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13256__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13256__$1);
var G__13338 = cljs.core.chunk_rest(seq__13256__$1);
var G__13339 = c__5525__auto__;
var G__13340 = cljs.core.count(c__5525__auto__);
var G__13341 = (0);
seq__13256 = G__13338;
chunk__13257 = G__13339;
count__13258 = G__13340;
i__13259 = G__13341;
continue;
} else {
var vec__13269 = cljs.core.first(seq__13256__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13269,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__13269,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db","db",993250759),effect_key)){
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \":fx\" effect should not contain a :db effect"], 0));
} else {
}

var temp__5802__auto___13342 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___13342)){
var effect_fn_13343 = temp__5802__auto___13342;
(effect_fn_13343.cljs$core$IFn$_invoke$arity$1 ? effect_fn_13343.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_13343.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: in \":fx\" effect found ",effect_key," which has no associated handler. Ignoring."], 0));
}


var G__13344 = cljs.core.next(seq__13256__$1);
var G__13345 = null;
var G__13346 = (0);
var G__13347 = (0);
seq__13256 = G__13344;
chunk__13257 = G__13345;
count__13258 = G__13346;
i__13259 = G__13347;
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
var seq__13272 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,value));
var chunk__13273 = null;
var count__13274 = (0);
var i__13275 = (0);
while(true){
if((i__13275 < count__13274)){
var event = chunk__13273.cljs$core$IIndexed$_nth$arity$2(null,i__13275);
re_frame.router.dispatch(event);


var G__13350 = seq__13272;
var G__13351 = chunk__13273;
var G__13352 = count__13274;
var G__13353 = (i__13275 + (1));
seq__13272 = G__13350;
chunk__13273 = G__13351;
count__13274 = G__13352;
i__13275 = G__13353;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13272);
if(temp__5804__auto__){
var seq__13272__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13272__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13272__$1);
var G__13354 = cljs.core.chunk_rest(seq__13272__$1);
var G__13355 = c__5525__auto__;
var G__13356 = cljs.core.count(c__5525__auto__);
var G__13357 = (0);
seq__13272 = G__13354;
chunk__13273 = G__13355;
count__13274 = G__13356;
i__13275 = G__13357;
continue;
} else {
var event = cljs.core.first(seq__13272__$1);
re_frame.router.dispatch(event);


var G__13358 = cljs.core.next(seq__13272__$1);
var G__13359 = null;
var G__13360 = (0);
var G__13361 = (0);
seq__13272 = G__13358;
chunk__13273 = G__13359;
count__13274 = G__13360;
i__13275 = G__13361;
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
var seq__13276 = cljs.core.seq(value);
var chunk__13277 = null;
var count__13278 = (0);
var i__13279 = (0);
while(true){
if((i__13279 < count__13278)){
var event = chunk__13277.cljs$core$IIndexed$_nth$arity$2(null,i__13279);
clear_event(event);


var G__13362 = seq__13276;
var G__13363 = chunk__13277;
var G__13364 = count__13278;
var G__13365 = (i__13279 + (1));
seq__13276 = G__13362;
chunk__13277 = G__13363;
count__13278 = G__13364;
i__13279 = G__13365;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__13276);
if(temp__5804__auto__){
var seq__13276__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__13276__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__13276__$1);
var G__13366 = cljs.core.chunk_rest(seq__13276__$1);
var G__13367 = c__5525__auto__;
var G__13368 = cljs.core.count(c__5525__auto__);
var G__13369 = (0);
seq__13276 = G__13366;
chunk__13277 = G__13367;
count__13278 = G__13368;
i__13279 = G__13369;
continue;
} else {
var event = cljs.core.first(seq__13276__$1);
clear_event(event);


var G__13370 = cljs.core.next(seq__13276__$1);
var G__13371 = null;
var G__13372 = (0);
var G__13373 = (0);
seq__13276 = G__13370;
chunk__13277 = G__13371;
count__13278 = G__13372;
i__13279 = G__13373;
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
