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
var _STAR_current_trace_STAR__orig_val__10078 = re_frame.trace._STAR_current_trace_STAR_;
var _STAR_current_trace_STAR__temp_val__10079 = re_frame.trace.start_trace(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"op-type","op-type",-1636141668),new cljs.core.Keyword("event","do-fx","event/do-fx",1357330452)], null));
(re_frame.trace._STAR_current_trace_STAR_ = _STAR_current_trace_STAR__temp_val__10079);

try{try{var effects = new cljs.core.Keyword(null,"effects","effects",-282369292).cljs$core$IFn$_invoke$arity$1(context);
var effects_without_db = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(effects,new cljs.core.Keyword(null,"db","db",993250759));
var temp__5804__auto___10227 = new cljs.core.Keyword(null,"db","db",993250759).cljs$core$IFn$_invoke$arity$1(effects);
if(cljs.core.truth_(temp__5804__auto___10227)){
var new_db_10228 = temp__5804__auto___10227;
var fexpr__10084_10229 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,new cljs.core.Keyword(null,"db","db",993250759),false);
(fexpr__10084_10229.cljs$core$IFn$_invoke$arity$1 ? fexpr__10084_10229.cljs$core$IFn$_invoke$arity$1(new_db_10228) : fexpr__10084_10229.call(null,new_db_10228));
} else {
}

var seq__10085 = cljs.core.seq(effects_without_db);
var chunk__10086 = null;
var count__10087 = (0);
var i__10088 = (0);
while(true){
if((i__10088 < count__10087)){
var vec__10100 = chunk__10086.cljs$core$IIndexed$_nth$arity$2(null,i__10088);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10100,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10100,(1),null);
var temp__5802__auto___10231 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10231)){
var effect_fn_10232 = temp__5802__auto___10231;
(effect_fn_10232.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10232.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10232.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__10233 = seq__10085;
var G__10234 = chunk__10086;
var G__10235 = count__10087;
var G__10236 = (i__10088 + (1));
seq__10085 = G__10233;
chunk__10086 = G__10234;
count__10087 = G__10235;
i__10088 = G__10236;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10085);
if(temp__5804__auto__){
var seq__10085__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10085__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10085__$1);
var G__10237 = cljs.core.chunk_rest(seq__10085__$1);
var G__10238 = c__5525__auto__;
var G__10239 = cljs.core.count(c__5525__auto__);
var G__10240 = (0);
seq__10085 = G__10237;
chunk__10086 = G__10238;
count__10087 = G__10239;
i__10088 = G__10240;
continue;
} else {
var vec__10106 = cljs.core.first(seq__10085__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10106,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10106,(1),null);
var temp__5802__auto___10241 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10241)){
var effect_fn_10242 = temp__5802__auto___10241;
(effect_fn_10242.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10242.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10242.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__10243 = cljs.core.next(seq__10085__$1);
var G__10244 = null;
var G__10245 = (0);
var G__10246 = (0);
seq__10085 = G__10243;
chunk__10086 = G__10244;
count__10087 = G__10245;
i__10088 = G__10246;
continue;
}
} else {
return null;
}
}
break;
}
}finally {if(re_frame.trace.is_trace_enabled_QMARK_()){
var end__9576__auto___10247 = re_frame.interop.now();
var duration__9577__auto___10248 = (end__9576__auto___10247 - new cljs.core.Keyword(null,"start","start",-355208981).cljs$core$IFn$_invoke$arity$1(re_frame.trace._STAR_current_trace_STAR_));
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(re_frame.trace.traces,cljs.core.conj,cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(re_frame.trace._STAR_current_trace_STAR_,new cljs.core.Keyword(null,"duration","duration",1444101068),duration__9577__auto___10248,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"end","end",-268185958),re_frame.interop.now()], 0)));

re_frame.trace.run_tracing_callbacks_BANG_(end__9576__auto___10247);
} else {
}
}}finally {(re_frame.trace._STAR_current_trace_STAR_ = _STAR_current_trace_STAR__orig_val__10078);
}} else {
var effects = new cljs.core.Keyword(null,"effects","effects",-282369292).cljs$core$IFn$_invoke$arity$1(context);
var effects_without_db = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(effects,new cljs.core.Keyword(null,"db","db",993250759));
var temp__5804__auto___10249 = new cljs.core.Keyword(null,"db","db",993250759).cljs$core$IFn$_invoke$arity$1(effects);
if(cljs.core.truth_(temp__5804__auto___10249)){
var new_db_10250 = temp__5804__auto___10249;
var fexpr__10110_10251 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,new cljs.core.Keyword(null,"db","db",993250759),false);
(fexpr__10110_10251.cljs$core$IFn$_invoke$arity$1 ? fexpr__10110_10251.cljs$core$IFn$_invoke$arity$1(new_db_10250) : fexpr__10110_10251.call(null,new_db_10250));
} else {
}

var seq__10111 = cljs.core.seq(effects_without_db);
var chunk__10112 = null;
var count__10113 = (0);
var i__10114 = (0);
while(true){
if((i__10114 < count__10113)){
var vec__10124 = chunk__10112.cljs$core$IIndexed$_nth$arity$2(null,i__10114);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10124,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10124,(1),null);
var temp__5802__auto___10256 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10256)){
var effect_fn_10257 = temp__5802__auto___10256;
(effect_fn_10257.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10257.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10257.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__10258 = seq__10111;
var G__10259 = chunk__10112;
var G__10260 = count__10113;
var G__10261 = (i__10114 + (1));
seq__10111 = G__10258;
chunk__10112 = G__10259;
count__10113 = G__10260;
i__10114 = G__10261;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10111);
if(temp__5804__auto__){
var seq__10111__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10111__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10111__$1);
var G__10262 = cljs.core.chunk_rest(seq__10111__$1);
var G__10263 = c__5525__auto__;
var G__10264 = cljs.core.count(c__5525__auto__);
var G__10265 = (0);
seq__10111 = G__10262;
chunk__10112 = G__10263;
count__10113 = G__10264;
i__10114 = G__10265;
continue;
} else {
var vec__10140 = cljs.core.first(seq__10111__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10140,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10140,(1),null);
var temp__5802__auto___10266 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10266)){
var effect_fn_10267 = temp__5802__auto___10266;
(effect_fn_10267.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10267.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10267.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: no handler registered for effect:",effect_key,". Ignoring."], 0));
}


var G__10268 = cljs.core.next(seq__10111__$1);
var G__10269 = null;
var G__10270 = (0);
var G__10271 = (0);
seq__10111 = G__10268;
chunk__10112 = G__10269;
count__10113 = G__10270;
i__10114 = G__10271;
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
re_frame.fx.dispatch_later = (function re_frame$fx$dispatch_later(p__10143){
var map__10144 = p__10143;
var map__10144__$1 = cljs.core.__destructure_map(map__10144);
var effect = map__10144__$1;
var ms = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__10144__$1,new cljs.core.Keyword(null,"ms","ms",-1152709733));
var dispatch = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__10144__$1,new cljs.core.Keyword(null,"dispatch","dispatch",1319337009));
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
var seq__10145 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,value));
var chunk__10146 = null;
var count__10147 = (0);
var i__10148 = (0);
while(true){
if((i__10148 < count__10147)){
var effect = chunk__10146.cljs$core$IIndexed$_nth$arity$2(null,i__10148);
re_frame.fx.dispatch_later(effect);


var G__10272 = seq__10145;
var G__10273 = chunk__10146;
var G__10274 = count__10147;
var G__10275 = (i__10148 + (1));
seq__10145 = G__10272;
chunk__10146 = G__10273;
count__10147 = G__10274;
i__10148 = G__10275;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10145);
if(temp__5804__auto__){
var seq__10145__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10145__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10145__$1);
var G__10276 = cljs.core.chunk_rest(seq__10145__$1);
var G__10277 = c__5525__auto__;
var G__10278 = cljs.core.count(c__5525__auto__);
var G__10279 = (0);
seq__10145 = G__10276;
chunk__10146 = G__10277;
count__10147 = G__10278;
i__10148 = G__10279;
continue;
} else {
var effect = cljs.core.first(seq__10145__$1);
re_frame.fx.dispatch_later(effect);


var G__10280 = cljs.core.next(seq__10145__$1);
var G__10281 = null;
var G__10282 = (0);
var G__10283 = (0);
seq__10145 = G__10280;
chunk__10146 = G__10281;
count__10147 = G__10282;
i__10148 = G__10283;
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
var seq__10149 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,seq_of_effects));
var chunk__10150 = null;
var count__10151 = (0);
var i__10152 = (0);
while(true){
if((i__10152 < count__10151)){
var vec__10173 = chunk__10150.cljs$core$IIndexed$_nth$arity$2(null,i__10152);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10173,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10173,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db","db",993250759),effect_key)){
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \":fx\" effect should not contain a :db effect"], 0));
} else {
}

var temp__5802__auto___10286 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10286)){
var effect_fn_10287 = temp__5802__auto___10286;
(effect_fn_10287.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10287.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10287.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: in \":fx\" effect found ",effect_key," which has no associated handler. Ignoring."], 0));
}


var G__10288 = seq__10149;
var G__10289 = chunk__10150;
var G__10290 = count__10151;
var G__10291 = (i__10152 + (1));
seq__10149 = G__10288;
chunk__10150 = G__10289;
count__10151 = G__10290;
i__10152 = G__10291;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10149);
if(temp__5804__auto__){
var seq__10149__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10149__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10149__$1);
var G__10292 = cljs.core.chunk_rest(seq__10149__$1);
var G__10293 = c__5525__auto__;
var G__10294 = cljs.core.count(c__5525__auto__);
var G__10295 = (0);
seq__10149 = G__10292;
chunk__10150 = G__10293;
count__10151 = G__10294;
i__10152 = G__10295;
continue;
} else {
var vec__10176 = cljs.core.first(seq__10149__$1);
var effect_key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10176,(0),null);
var effect_value = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10176,(1),null);
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"db","db",993250759),effect_key)){
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: \":fx\" effect should not contain a :db effect"], 0));
} else {
}

var temp__5802__auto___10296 = re_frame.registrar.get_handler.cljs$core$IFn$_invoke$arity$3(re_frame.fx.kind,effect_key,false);
if(cljs.core.truth_(temp__5802__auto___10296)){
var effect_fn_10297 = temp__5802__auto___10296;
(effect_fn_10297.cljs$core$IFn$_invoke$arity$1 ? effect_fn_10297.cljs$core$IFn$_invoke$arity$1(effect_value) : effect_fn_10297.call(null,effect_value));
} else {
re_frame.loggers.console.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword(null,"warn","warn",-436710552),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(["re-frame: in \":fx\" effect found ",effect_key," which has no associated handler. Ignoring."], 0));
}


var G__10298 = cljs.core.next(seq__10149__$1);
var G__10299 = null;
var G__10300 = (0);
var G__10301 = (0);
seq__10149 = G__10298;
chunk__10150 = G__10299;
count__10151 = G__10300;
i__10152 = G__10301;
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
var seq__10182 = cljs.core.seq(cljs.core.remove.cljs$core$IFn$_invoke$arity$2(cljs.core.nil_QMARK_,value));
var chunk__10185 = null;
var count__10186 = (0);
var i__10187 = (0);
while(true){
if((i__10187 < count__10186)){
var event = chunk__10185.cljs$core$IIndexed$_nth$arity$2(null,i__10187);
re_frame.router.dispatch(event);


var G__10303 = seq__10182;
var G__10304 = chunk__10185;
var G__10305 = count__10186;
var G__10306 = (i__10187 + (1));
seq__10182 = G__10303;
chunk__10185 = G__10304;
count__10186 = G__10305;
i__10187 = G__10306;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10182);
if(temp__5804__auto__){
var seq__10182__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10182__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10182__$1);
var G__10308 = cljs.core.chunk_rest(seq__10182__$1);
var G__10309 = c__5525__auto__;
var G__10310 = cljs.core.count(c__5525__auto__);
var G__10311 = (0);
seq__10182 = G__10308;
chunk__10185 = G__10309;
count__10186 = G__10310;
i__10187 = G__10311;
continue;
} else {
var event = cljs.core.first(seq__10182__$1);
re_frame.router.dispatch(event);


var G__10312 = cljs.core.next(seq__10182__$1);
var G__10313 = null;
var G__10314 = (0);
var G__10315 = (0);
seq__10182 = G__10312;
chunk__10185 = G__10313;
count__10186 = G__10314;
i__10187 = G__10315;
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
var seq__10209 = cljs.core.seq(value);
var chunk__10210 = null;
var count__10211 = (0);
var i__10212 = (0);
while(true){
if((i__10212 < count__10211)){
var event = chunk__10210.cljs$core$IIndexed$_nth$arity$2(null,i__10212);
clear_event(event);


var G__10316 = seq__10209;
var G__10317 = chunk__10210;
var G__10318 = count__10211;
var G__10319 = (i__10212 + (1));
seq__10209 = G__10316;
chunk__10210 = G__10317;
count__10211 = G__10318;
i__10212 = G__10319;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__10209);
if(temp__5804__auto__){
var seq__10209__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__10209__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__10209__$1);
var G__10320 = cljs.core.chunk_rest(seq__10209__$1);
var G__10321 = c__5525__auto__;
var G__10322 = cljs.core.count(c__5525__auto__);
var G__10323 = (0);
seq__10209 = G__10320;
chunk__10210 = G__10321;
count__10211 = G__10322;
i__10212 = G__10323;
continue;
} else {
var event = cljs.core.first(seq__10209__$1);
clear_event(event);


var G__10324 = cljs.core.next(seq__10209__$1);
var G__10325 = null;
var G__10326 = (0);
var G__10327 = (0);
seq__10209 = G__10324;
chunk__10210 = G__10325;
count__10211 = G__10326;
i__10212 = G__10327;
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
