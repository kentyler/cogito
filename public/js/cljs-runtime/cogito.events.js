goog.provide('cogito.events');
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"initialize-db","initialize-db",230998432),(function (_,___$1){
return cogito.db.default_db;
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"set-current-prompt","set-current-prompt",-1655270417),(function (db,p__12115){
var vec__12116 = p__12115;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12116,(0),null);
var prompt = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12116,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"current-prompt","current-prompt",998257734),prompt);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"submit-prompt","submit-prompt",502791731),(function (p__12119,p__12120){
var map__12121 = p__12119;
var map__12121__$1 = cljs.core.__destructure_map(map__12121);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12121__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12122 = p__12120;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12122,(0),null);
var prompt = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12122,(1),null);
var most_recent_turn = cljs.core.last(new cljs.core.Keyword(null,"turns","turns",-1118736892).cljs$core$IFn$_invoke$arity$1(db));
var response_context = (cljs.core.truth_((function (){var and__5000__auto__ = most_recent_turn;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"response-set","response-set",-2006269211),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(most_recent_turn,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"response","response",-1068424192),new cljs.core.Keyword(null,"response-type","response-type",-1493770458)], null)));
} else {
return and__5000__auto__;
}
})())?(function (){var turn_id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(most_recent_turn);
var current_index = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"alternative-indices","alternative-indices",2011932146),turn_id], null),(0));
var alternatives = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(most_recent_turn,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"response","response",-1068424192),new cljs.core.Keyword(null,"alternatives","alternatives",1927759600)], null));
var selected_alt = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(alternatives,current_index,null);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"responding-to-alternative","responding-to-alternative",-92380684),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"turn-id","turn-id",648025504),turn_id,new cljs.core.Keyword(null,"alternative-index","alternative-index",-14641964),current_index,new cljs.core.Keyword(null,"alternative-id","alternative-id",-1221261414),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(selected_alt),new cljs.core.Keyword(null,"alternative-summary","alternative-summary",-457706629),new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(selected_alt)], null)], null);
})():null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"loading?","loading?",1905707049),true),new cljs.core.Keyword(null,"fetch-response","fetch-response",-810170312),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"prompt","prompt",-78109487),prompt,new cljs.core.Keyword(null,"context","context",-830191113),response_context], null)], null);
}));
re_frame.core.reg_fx(new cljs.core.Keyword(null,"fetch-response","fetch-response",-810170312),(function (p__12128){
var map__12129 = p__12128;
var map__12129__$1 = cljs.core.__destructure_map(map__12129);
var prompt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12129__$1,new cljs.core.Keyword(null,"prompt","prompt",-78109487));
var context = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12129__$1,new cljs.core.Keyword(null,"context","context",-830191113));
return fetch("/api/conversational-turn",cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"method","method",55703592),"POST",new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null),new cljs.core.Keyword(null,"credentials","credentials",1373178854),"include",new cljs.core.Keyword(null,"body","body",-2049205669),JSON.stringify(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"content","content",15833224),prompt,new cljs.core.Keyword(null,"context","context",-830191113),context], null)))], null))).then((function (p1__12125_SHARP_){
return p1__12125_SHARP_.json();
})).then((function (p1__12126_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"handle-llm-response","handle-llm-response",-249310704),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__12126_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))], null));
})).catch((function (p1__12127_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"handle-error","handle-error",1613855484),p1__12127_SHARP_], null));
}));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"handle-llm-response","handle-llm-response",-249310704),(function (db,p__12130){
var vec__12131 = p__12130;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12131,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12131,(1),null);
console.log("Events: Received response from server:",response);

var parsed_response = cogito.edn_parser.parse_cljs_response(new cljs.core.Keyword(null,"response","response",-1068424192).cljs$core$IFn$_invoke$arity$1(response));
console.log("Events: Parsed response:",parsed_response);

return cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"loading?","loading?",1905707049),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-prompt","current-prompt",998257734),""], 0)),new cljs.core.Keyword(null,"turns","turns",-1118736892),cljs.core.conj,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(response),new cljs.core.Keyword(null,"prompt","prompt",-78109487),new cljs.core.Keyword(null,"prompt","prompt",-78109487).cljs$core$IFn$_invoke$arity$1(response),new cljs.core.Keyword(null,"response","response",-1068424192),parsed_response], null));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"handle-error","handle-error",1613855484),(function (db,p__12134){
var vec__12135 = p__12134;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12135,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12135,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"loading?","loading?",1905707049),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"error","error",-978969032),error], 0));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"check-auth-status","check-auth-status",898872782),(function (_,___$1){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fetch-auth-status","fetch-auth-status",670770267),cljs.core.PersistentArrayMap.EMPTY], null);
}));
re_frame.core.reg_fx(new cljs.core.Keyword(null,"fetch-auth-status","fetch-auth-status",670770267),(function (_){
return fetch("/api/auth-status",cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"credentials","credentials",1373178854),"include"], null))).then((function (p1__12138_SHARP_){
return p1__12138_SHARP_.json();
})).then((function (p1__12139_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"auth-status-received","auth-status-received",490143799),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__12139_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))], null));
})).catch((function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"auth-status-received","auth-status-received",490143799),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"authenticated","authenticated",1282954211),false], null)], null));
}));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"auth-status-received","auth-status-received",490143799),(function (db,p__12140){
var vec__12141 = p__12140;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12141,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12141,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),new cljs.core.Keyword(null,"authenticated","authenticated",1282954211).cljs$core$IFn$_invoke$arity$1(response),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804),new cljs.core.Keyword(null,"pendingClientSelection","pendingClientSelection",-1292453434).cljs$core$IFn$_invoke$arity$1(response),new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),new cljs.core.Keyword(null,"clients","clients",1436018090).cljs$core$IFn$_invoke$arity$1(response),new cljs.core.Keyword(null,"user","user",1532431356),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(response)], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"login-success","login-success",1089283105),(function (db,p__12144){
var vec__12145 = p__12144;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12145,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12145,(1),null);
if(cljs.core.truth_(new cljs.core.Keyword(null,"clients","clients",1436018090).cljs$core$IFn$_invoke$arity$1(response))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804),true,new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),new cljs.core.Keyword(null,"clients","clients",1436018090).cljs$core$IFn$_invoke$arity$1(response)], 0));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"user","user",1532431356),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(response)], 0));
}
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"select-client","select-client",1739667626),(function (p__12148,p__12149){
var map__12150 = p__12148;
var map__12150__$1 = cljs.core.__destructure_map(map__12150);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12150__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12151 = p__12149;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12151,(0),null);
var client_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12151,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"selecting-client?","selecting-client?",-865934466),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/select-client",new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null),new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"client_id","client_id",48809273),client_id], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"client-selected","client-selected",1880556560)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"client-selection-failed","client-selection-failed",1516198)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-selected","client-selected",1880556560),(function (db,p__12154){
var vec__12155 = p__12154;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12155,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12155,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804),false,new cljs.core.Keyword(null,"selecting-client?","selecting-client?",-865934466),false,new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),null,new cljs.core.Keyword(null,"user","user",1532431356),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(response)], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-selection-failed","client-selection-failed",1516198),(function (db,p__12158){
var vec__12159 = p__12158;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12159,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12159,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"selecting-client?","selecting-client?",-865934466),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-selection-error","client-selection-error",-2090086776),"Failed to select client"], 0));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"logout","logout",1418564329),(function (p__12162,_){
var map__12163 = p__12162;
var map__12163__$1 = cljs.core.__destructure_map(map__12163);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12163__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"logging-out?","logging-out?",-1351512203),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/logout",new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"logout-success","logout-success",-2070457265)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"logout-success","logout-success",-2070457265)], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"fetch-available-clients","fetch-available-clients",-142097161),(function (p__12164,_){
var map__12165 = p__12164;
var map__12165__$1 = cljs.core.__destructure_map(map__12165);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12165__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/available-clients",new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"available-clients-received","available-clients-received",255895846)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"available-clients-failed","available-clients-failed",-1729959612)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"available-clients-received","available-clients-received",255895846),(function (db,p__12166){
var vec__12167 = p__12166;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12167,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12167,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),new cljs.core.Keyword(null,"clients","clients",1436018090).cljs$core$IFn$_invoke$arity$1(response),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-client-id","current-client-id",1374727409),new cljs.core.Keyword(null,"current_client_id","current_client_id",1124354000).cljs$core$IFn$_invoke$arity$1(response)], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"available-clients-failed","available-clients-failed",-1729959612),(function (db,p__12170){
var vec__12171 = p__12170;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12171,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12171,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"available-clients-error","available-clients-error",1629838916),"Failed to fetch available clients");
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"switch-client","switch-client",-1365588951),(function (p__12174,p__12175){
var map__12176 = p__12174;
var map__12176__$1 = cljs.core.__destructure_map(map__12176);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12176__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12177 = p__12175;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12177,(0),null);
var client_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12177,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"switching-client?","switching-client?",-2000769521),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/switch-client",new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null),new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"client_id","client_id",48809273),client_id], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"client-switched","client-switched",342711407)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"client-switch-failed","client-switch-failed",-195399750)], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-switched","client-switched",342711407),(function (p__12180,p__12181){
var map__12182 = p__12180;
var map__12182__$1 = cljs.core.__destructure_map(map__12182);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12182__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12183 = p__12181;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12183,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12183,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"switching-client?","switching-client?",-2000769521),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"user","user",1532431356),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(response)], 0)),new cljs.core.Keyword(null,"meetings","meetings",39002138),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"meetings-error","meetings-error",-235243810)], 0)),new cljs.core.Keyword(null,"selected-meeting","selected-meeting",1294338347)),new cljs.core.Keyword("bot-creation","bots","bot-creation/bots",156109706),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("bot-creation","running-bots","bot-creation/running-bots",1908155650)], 0)),new cljs.core.Keyword("stuck-meetings","meetings","stuck-meetings/meetings",743579265)),new cljs.core.Keyword(null,"dispatch-n","dispatch-n",-504469236),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","load-meetings","cogito.meetings/load-meetings",-1936673641)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743)], null),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"fetch-available-clients","fetch-available-clients",-142097161)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-switch-failed","client-switch-failed",-195399750),(function (db,p__12186){
var vec__12187 = p__12186;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12187,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12187,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"switching-client?","switching-client?",-2000769521),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-switch-error","client-switch-error",2116368278),"Failed to switch client"], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"logout-success","logout-success",-2070457265),(function (db,_){
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),false,new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804),false,new cljs.core.Keyword(null,"user","user",1532431356),null,new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),null,new cljs.core.Keyword(null,"logging-out?","logging-out?",-1351512203),false,new cljs.core.Keyword(null,"turns","turns",-1118736892),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"current-prompt","current-prompt",998257734),""], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"submit-meeting-prompt","submit-meeting-prompt",676334045),(function (p__12190,p__12191){
var map__12192 = p__12190;
var map__12192__$1 = cljs.core.__destructure_map(map__12192);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12192__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12193 = p__12191;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12193,(0),null);
var prompt = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12193,(1),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12193,(2),null);
var most_recent_turn = cljs.core.last(new cljs.core.Keyword(null,"turns","turns",-1118736892).cljs$core$IFn$_invoke$arity$1(db));
var response_context = (cljs.core.truth_((function (){var and__5000__auto__ = most_recent_turn;
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"response-set","response-set",-2006269211),cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(most_recent_turn,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"response","response",-1068424192),new cljs.core.Keyword(null,"response-type","response-type",-1493770458)], null)));
} else {
return and__5000__auto__;
}
})())?(function (){var turn_id = new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(most_recent_turn);
var current_index = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"alternative-indices","alternative-indices",2011932146),turn_id], null),(0));
var alternatives = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(most_recent_turn,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"response","response",-1068424192),new cljs.core.Keyword(null,"alternatives","alternatives",1927759600)], null));
var selected_alt = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(alternatives,current_index,null);
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"responding-to-alternative","responding-to-alternative",-92380684),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"turn-id","turn-id",648025504),turn_id,new cljs.core.Keyword(null,"alternative-index","alternative-index",-14641964),current_index,new cljs.core.Keyword(null,"alternative-id","alternative-id",-1221261414),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(selected_alt),new cljs.core.Keyword(null,"alternative-summary","alternative-summary",-457706629),new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(selected_alt)], null)], null);
})():null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"loading?","loading?",1905707049),true),new cljs.core.Keyword(null,"fetch-response","fetch-response",-810170312),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"prompt","prompt",-78109487),prompt,new cljs.core.Keyword(null,"context","context",-830191113),response_context], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"set-current-alternative","set-current-alternative",1752281524),(function (db,p__12196){
var vec__12197 = p__12196;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12197,(0),null);
var turn_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12197,(1),null);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12197,(2),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"alternative-indices","alternative-indices",2011932146),turn_id], null),index);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"get-current-alternative","get-current-alternative",1214332997),(function (db,p__12200){
var vec__12201 = p__12200;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12201,(0),null);
var turn_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12201,(1),null);
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"alternative-indices","alternative-indices",2011932146),turn_id], null),(0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),(function (db,p__12204){
var vec__12205 = p__12204;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12205,(0),null);
var tab = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12205,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("workbench","active-tab","workbench/active-tab",-23767367),tab);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","create-bot","bot-creation/create-bot",724855344),(function (p__12208,p__12209){
var map__12210 = p__12208;
var map__12210__$1 = cljs.core.__destructure_map(map__12210);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12210__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12211 = p__12209;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12211,(0),null);
var form_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12211,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","loading?","bot-creation/loading?",-1601059818),true),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681)),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/create-bot",new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635),new cljs.core.Keyword(null,"meeting-url","meeting-url",1371135342).cljs$core$IFn$_invoke$arity$1(form_data),new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429),new cljs.core.Keyword(null,"meeting-name","meeting-name",829298160).cljs$core$IFn$_invoke$arity$1(form_data)], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","create-success","bot-creation/create-success",-1872616930)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","create-failure","bot-creation/create-failure",-1098545174)], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","create-success","bot-creation/create-success",-1872616930),(function (p__12214,p__12215){
var map__12216 = p__12214;
var map__12216__$1 = cljs.core.__destructure_map(map__12216);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12216__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12217 = p__12215;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12217,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12217,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","loading?","bot-creation/loading?",-1601059818),false),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"text","text",-1790561697),"Bot created successfully! The bot will join your meeting."], null)),new cljs.core.Keyword("bot-creation","bots","bot-creation/bots",156109706),cljs.core.conj,response),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","create-failure","bot-creation/create-failure",-1098545174),(function (db,p__12220){
var vec__12221 = p__12220;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12221,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12221,(1),null);
var error_message = (function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"response","response",-1068424192),new cljs.core.Keyword(null,"error","error",-978969032)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Failed to create bot. Please try again.";
}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","loading?","bot-creation/loading?",-1601059818),false),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"text","text",-1790561697),error_message], null));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743),(function (p__12224,_){
var map__12225 = p__12224;
var map__12225__$1 = cljs.core.__destructure_map(map__12225);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12225__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","fetching-bots?","bot-creation/fetching-bots?",1664817515),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/bots",new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots-success","bot-creation/fetch-bots-success",775254484)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots-failure","bot-creation/fetch-bots-failure",623621355)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","fetch-bots-success","bot-creation/fetch-bots-success",775254484),(function (db,p__12226){
var vec__12227 = p__12226;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12227,(0),null);
var bots = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12227,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","fetching-bots?","bot-creation/fetching-bots?",1664817515),false),new cljs.core.Keyword("bot-creation","running-bots","bot-creation/running-bots",1908155650),bots);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","fetch-bots-failure","bot-creation/fetch-bots-failure",623621355),(function (db,p__12230){
var vec__12231 = p__12230;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12231,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12231,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","fetching-bots?","bot-creation/fetching-bots?",1664817515),false),new cljs.core.Keyword("bot-creation","running-bots","bot-creation/running-bots",1908155650),cljs.core.PersistentVector.EMPTY);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","shutdown-bot","bot-creation/shutdown-bot",-1819973085),(function (p__12234,p__12235){
var map__12236 = p__12234;
var map__12236__$1 = cljs.core.__destructure_map(map__12236);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12236__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12237 = p__12235;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12237,(0),null);
var bot_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12237,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutting-down","bot-creation/shutting-down",1605083445),bot_id], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),["/api/bots/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(bot_id),"/leave"].join(''),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutdown-success","bot-creation/shutdown-success",-213598063),bot_id], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutdown-failure","bot-creation/shutdown-failure",-269107968),bot_id], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","shutdown-success","bot-creation/shutdown-success",-213598063),(function (p__12240,p__12241){
var map__12242 = p__12240;
var map__12242__$1 = cljs.core.__destructure_map(map__12242);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12242__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12243 = p__12241;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12243,(0),null);
var bot_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12243,(1),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12243,(2),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("bot-creation","shutting-down","bot-creation/shutting-down",1605083445),cljs.core.dissoc,bot_id),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"text","text",-1790561697),"Bot shut down successfully"], null)),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","shutdown-failure","bot-creation/shutdown-failure",-269107968),(function (db,p__12246){
var vec__12247 = p__12246;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12247,(0),null);
var bot_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12247,(1),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12247,(2),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("bot-creation","shutting-down","bot-creation/shutting-down",1605083445),cljs.core.dissoc,bot_id),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"text","text",-1790561697),"Failed to shut down bot"], null));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"join-meeting","join-meeting",2081058138),(function (db,p__12250){
var vec__12251 = p__12250;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12251,(0),null);
var meeting = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12251,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"active-meeting","active-meeting",-1062790),meeting);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"create-new-meeting","create-new-meeting",2096826229),(function (p__12254,p__12255){
var map__12256 = p__12254;
var map__12256__$1 = cljs.core.__destructure_map(map__12256);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12256__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12257 = p__12255;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12257,(0),null);
var meeting_name = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12257,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"creating-meeting?","creating-meeting?",372595060),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/meetings/create",new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429),meeting_name], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"meeting-created","meeting-created",-1079239477)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"meeting-creation-failed","meeting-creation-failed",1826688122)], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"meeting-created","meeting-created",-1079239477),(function (p__12260,p__12261){
var map__12262 = p__12260;
var map__12262__$1 = cljs.core.__destructure_map(map__12262);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12262__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12263 = p__12261;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12263,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12263,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"creating-meeting?","creating-meeting?",372595060),false),new cljs.core.Keyword(null,"active-meeting","active-meeting",-1062790),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(response,new cljs.core.Keyword(null,"block_id","block_id",-759441496),new cljs.core.Keyword(null,"meeting_id","meeting_id",-193127343).cljs$core$IFn$_invoke$arity$1(response))),new cljs.core.Keyword(null,"dispatch-n","dispatch-n",-504469236),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.meetings","load-meetings","cogito.meetings/load-meetings",-1936673641)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),new cljs.core.Keyword(null,"conversation","conversation",1148767509)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"meeting-creation-failed","meeting-creation-failed",1826688122),(function (db,p__12266){
var vec__12267 = p__12266;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12267,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12267,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"creating-meeting?","creating-meeting?",372595060),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"meeting-creation-error","meeting-creation-error",-154737185),error], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"leave-meeting","leave-meeting",-1760139326),(function (db,_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.Keyword(null,"active-meeting","active-meeting",-1062790));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","fetch","stuck-meetings/fetch",-377416991),(function (p__12270,_){
var map__12271 = p__12270;
var map__12271__$1 = cljs.core.__destructure_map(map__12271);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12271__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("stuck-meetings","fetching?","stuck-meetings/fetching?",375784401),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/stuck-meetings",new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetch-success","stuck-meetings/fetch-success",1587948040)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetch-failure","stuck-meetings/fetch-failure",69757432)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","fetch-success","stuck-meetings/fetch-success",1587948040),(function (db,p__12272){
var vec__12273 = p__12272;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12273,(0),null);
var meetings = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12273,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("stuck-meetings","fetching?","stuck-meetings/fetching?",375784401),false),new cljs.core.Keyword("stuck-meetings","meetings","stuck-meetings/meetings",743579265),meetings);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","fetch-failure","stuck-meetings/fetch-failure",69757432),(function (db,p__12276){
var vec__12277 = p__12276;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12277,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12277,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("stuck-meetings","fetching?","stuck-meetings/fetching?",375784401),false),new cljs.core.Keyword("stuck-meetings","meetings","stuck-meetings/meetings",743579265),cljs.core.PersistentVector.EMPTY);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","force-complete","stuck-meetings/force-complete",-393535154),(function (p__12280,p__12281){
var map__12282 = p__12280;
var map__12282__$1 = cljs.core.__destructure_map(map__12282);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12282__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12283 = p__12281;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12283,(0),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12283,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","completing","stuck-meetings/completing",-436837248),meeting_id], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),["/api/stuck-meetings/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(meeting_id),"/complete"].join(''),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","complete-success","stuck-meetings/complete-success",-635788468),meeting_id], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","complete-failure","stuck-meetings/complete-failure",-2013592263),meeting_id], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","complete-success","stuck-meetings/complete-success",-635788468),(function (p__12286,p__12287){
var map__12288 = p__12286;
var map__12288__$1 = cljs.core.__destructure_map(map__12288);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12288__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12289 = p__12287;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12289,(0),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12289,(1),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12289,(2),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("stuck-meetings","completing","stuck-meetings/completing",-436837248),cljs.core.dissoc,meeting_id),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"text","text",-1790561697),"Meeting marked as completed"], null)),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetch","stuck-meetings/fetch",-377416991)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","complete-failure","stuck-meetings/complete-failure",-2013592263),(function (db,p__12292){
var vec__12293 = p__12292;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12293,(0),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12293,(1),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12293,(2),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("stuck-meetings","completing","stuck-meetings/completing",-436837248),cljs.core.dissoc,meeting_id),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"text","text",-1790561697),"Failed to complete meeting"], null));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","set-selected-date","daily-summary/set-selected-date",-473551510),(function (db,p__12296){
var vec__12297 = p__12296;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12297,(0),null);
var date = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12297,(1),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null),date);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","set-selected-year","daily-summary/set-selected-year",715654611),(function (p__12300,p__12301){
var map__12302 = p__12300;
var map__12302__$1 = cljs.core.__destructure_map(map__12302);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12302__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12303 = p__12301;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12303,(0),null);
var year = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12303,(1),null);
var current_date = (new Date(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null))));
var new_date = (new Date(year,current_date.getMonth(),current_date.getDate()));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null),new_date.toISOString()),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","load-day","daily-summary/load-day",-1212284636)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","set-selected-month","daily-summary/set-selected-month",-2002452904),(function (p__12306,p__12307){
var map__12308 = p__12306;
var map__12308__$1 = cljs.core.__destructure_map(map__12308);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12308__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12309 = p__12307;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12309,(0),null);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12309,(1),null);
var current_date = (new Date(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null))));
var new_date = (new Date(current_date.getFullYear(),month,current_date.getDate()));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null),new_date.toISOString()),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","load-day","daily-summary/load-day",-1212284636)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","set-loading","daily-summary/set-loading",1545404529),(function (db,p__12312){
var vec__12313 = p__12312;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12313,(0),null);
var loading_QMARK_ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12313,(1),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"loading?","loading?",1905707049)], null),loading_QMARK_);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","set-data","daily-summary/set-data",-422065122),(function (db,p__12316){
var vec__12317 = p__12316;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12317,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12317,(1),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"data","data",-232669377)], null),data);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","load-day","daily-summary/load-day",-1212284636),(function (p__12320,_){
var map__12321 = p__12320;
var map__12321__$1 = cljs.core.__destructure_map(map__12321);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12321__$1,new cljs.core.Keyword(null,"db","db",993250759));
var selected_date = cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null),(function (){var today = (new Date());
today.setHours((0),(0),(0),(0));

return today.toISOString();
})());
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"loading?","loading?",1905707049)], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),["/api/daily-summary/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(selected_date.substring((0),(10)))].join(''),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","load-success","daily-summary/load-success",-1636170847)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","load-failure","daily-summary/load-failure",1624567563)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","load-success","daily-summary/load-success",-1636170847),(function (db,p__12322){
var vec__12323 = p__12322;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12323,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12323,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"loading?","loading?",1905707049)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"data","data",-232669377)], null),response);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","load-failure","daily-summary/load-failure",1624567563),(function (db,p__12326){
var vec__12327 = p__12326;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12327,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12327,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"loading?","loading?",1905707049)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"data","data",-232669377)], null),null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","previous-day","daily-summary/previous-day",767970656),(function (p__12330,_){
var map__12331 = p__12330;
var map__12331__$1 = cljs.core.__destructure_map(map__12331);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12331__$1,new cljs.core.Keyword(null,"db","db",993250759));
var current_date = (new Date(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null))));
var previous_date = (new Date(current_date.setDate((current_date.getDate() - (1)))));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null),previous_date.toISOString()),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","load-day","daily-summary/load-day",-1212284636)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","next-day","daily-summary/next-day",1586689342),(function (p__12332,_){
var map__12333 = p__12332;
var map__12333__$1 = cljs.core.__destructure_map(map__12333);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12333__$1,new cljs.core.Keyword(null,"db","db",993250759));
var current_date = (new Date(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null))));
var next_date = (new Date(current_date.setDate((current_date.getDate() + (1)))));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null),next_date.toISOString()),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","load-day","daily-summary/load-day",-1212284636)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","generate-summary","daily-summary/generate-summary",-1103361698),(function (p__12334,_){
var map__12335 = p__12334;
var map__12335__$1 = cljs.core.__destructure_map(map__12335);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12335__$1,new cljs.core.Keyword(null,"db","db",993250759));
var selected_date = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"summary","summary",380847952),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/generate-daily-summary",new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"date","date",-1463434462),selected_date.substring((0),(10))], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","summary-success","daily-summary/summary-success",-985474087)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","summary-failure","daily-summary/summary-failure",1243299102)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","summary-success","daily-summary/summary-success",-985474087),(function (db,p__12336){
var vec__12337 = p__12336;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12337,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12337,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"summary","summary",380847952),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),false),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"summary","summary",380847952),new cljs.core.Keyword(null,"content","content",15833224)], null),new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(response));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","summary-failure","daily-summary/summary-failure",1243299102),(function (db,p__12340){
var vec__12341 = p__12340;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12341,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12341,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"summary","summary",380847952),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),false),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"summary","summary",380847952),new cljs.core.Keyword(null,"content","content",15833224)], null),"Failed to generate summary. Please try again.");
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","generate-monthly-summaries","daily-summary/generate-monthly-summaries",-458749591),(function (p__12344,p__12345){
var map__12346 = p__12344;
var map__12346__$1 = cljs.core.__destructure_map(map__12346);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12346__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12347 = p__12345;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12347,(0),null);
var year = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12347,(1),null);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12347,(2),null);
var target_year = (function (){var or__5002__auto__ = year;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new Date()).getFullYear();
}
})();
var target_month = (function (){var or__5002__auto__ = month;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new Date()).getMonth();
}
})();
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"monthly-summaries","monthly-summaries",370815406),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/generate-monthly-summaries",new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"year","year",335913393),target_year,new cljs.core.Keyword(null,"month","month",-1960248533),target_month], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","monthly-summaries-success","daily-summary/monthly-summaries-success",-1978292072)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","monthly-summaries-failure","daily-summary/monthly-summaries-failure",121566532)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","monthly-summaries-success","daily-summary/monthly-summaries-success",-1978292072),(function (db,p__12350){
var vec__12351 = p__12350;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12351,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12351,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"monthly-summaries","monthly-summaries",370815406),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),false),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"monthly-summaries","monthly-summaries",370815406),new cljs.core.Keyword(null,"data","data",-232669377)], null),new cljs.core.Keyword(null,"summaries","summaries",-1012011200).cljs$core$IFn$_invoke$arity$1(response)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"monthly-summaries","monthly-summaries",370815406),new cljs.core.Keyword(null,"year","year",335913393)], null),new cljs.core.Keyword(null,"year","year",335913393).cljs$core$IFn$_invoke$arity$1(response)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"monthly-summaries","monthly-summaries",370815406),new cljs.core.Keyword(null,"month","month",-1960248533)], null),new cljs.core.Keyword(null,"month","month",-1960248533).cljs$core$IFn$_invoke$arity$1(response));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("daily-summary","monthly-summaries-failure","daily-summary/monthly-summaries-failure",121566532),(function (db,p__12354){
var vec__12355 = p__12354;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12355,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12355,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"monthly-summaries","monthly-summaries",370815406),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),false),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"daily-summary","daily-summary",1982237767),new cljs.core.Keyword(null,"monthly-summaries","monthly-summaries",370815406),new cljs.core.Keyword(null,"data","data",-232669377)], null),null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("monthly-summary","generate-yearly-summaries","monthly-summary/generate-yearly-summaries",112671599),(function (p__12358,p__12359){
var map__12360 = p__12358;
var map__12360__$1 = cljs.core.__destructure_map(map__12360);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12360__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12361 = p__12359;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12361,(0),null);
var year = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12361,(1),null);
var target_year = (function (){var or__5002__auto__ = year;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (new Date()).getFullYear();
}
})();
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"monthly-summary","monthly-summary",-1040971255),new cljs.core.Keyword(null,"yearly-summaries","yearly-summaries",1157871970),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/generate-yearly-summaries",new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"year","year",335913393),target_year], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("monthly-summary","yearly-summaries-success","monthly-summary/yearly-summaries-success",1787216222)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("monthly-summary","yearly-summaries-failure","monthly-summary/yearly-summaries-failure",581201536)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("monthly-summary","yearly-summaries-success","monthly-summary/yearly-summaries-success",1787216222),(function (db,p__12364){
var vec__12365 = p__12364;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12365,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12365,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"monthly-summary","monthly-summary",-1040971255),new cljs.core.Keyword(null,"yearly-summaries","yearly-summaries",1157871970),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),false),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"monthly-summary","monthly-summary",-1040971255),new cljs.core.Keyword(null,"yearly-summaries","yearly-summaries",1157871970),new cljs.core.Keyword(null,"data","data",-232669377)], null),new cljs.core.Keyword(null,"summaries","summaries",-1012011200).cljs$core$IFn$_invoke$arity$1(response)),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"monthly-summary","monthly-summary",-1040971255),new cljs.core.Keyword(null,"yearly-summaries","yearly-summaries",1157871970),new cljs.core.Keyword(null,"year","year",335913393)], null),new cljs.core.Keyword(null,"year","year",335913393).cljs$core$IFn$_invoke$arity$1(response));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("monthly-summary","yearly-summaries-failure","monthly-summary/yearly-summaries-failure",581201536),(function (db,p__12368){
var vec__12369 = p__12368;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12369,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12369,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"monthly-summary","monthly-summary",-1040971255),new cljs.core.Keyword(null,"yearly-summaries","yearly-summaries",1157871970),new cljs.core.Keyword(null,"generating?","generating?",1505583643)], null),false),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"monthly-summary","monthly-summary",-1040971255),new cljs.core.Keyword(null,"yearly-summaries","yearly-summaries",1157871970),new cljs.core.Keyword(null,"data","data",-232669377)], null),null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","handle-files","upload-files/handle-files",249709760),(function (p__12372,p__12373){
var map__12374 = p__12372;
var map__12374__$1 = cljs.core.__destructure_map(map__12374);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12374__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12375 = p__12373;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12375,(0),null);
var file_list = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12375,(1),null);
var files = cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(file_list);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"uploading?","uploading?",316182892)], null),true),new cljs.core.Keyword(null,"upload-files-to-server","upload-files-to-server",1169869960),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"files","files",-472457450),files], null)], null);
}));
re_frame.core.reg_fx(new cljs.core.Keyword(null,"upload-files-to-server","upload-files-to-server",1169869960),(function (p__12381){
var map__12382 = p__12381;
var map__12382__$1 = cljs.core.__destructure_map(map__12382);
var files = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12382__$1,new cljs.core.Keyword(null,"files","files",-472457450));
var seq__12383 = cljs.core.seq(files);
var chunk__12384 = null;
var count__12385 = (0);
var i__12386 = (0);
while(true){
if((i__12386 < count__12385)){
var file = chunk__12384.cljs$core$IIndexed$_nth$arity$2(null,i__12386);
var form_data_12486 = (new FormData());
form_data_12486.append("file",file);

fetch("/api/upload-files/upload",cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"method","method",55703592),"POST",new cljs.core.Keyword(null,"credentials","credentials",1373178854),"include",new cljs.core.Keyword(null,"body","body",-2049205669),form_data_12486], null))).then(((function (seq__12383,chunk__12384,count__12385,i__12386,form_data_12486,file,map__12382,map__12382__$1,files){
return (function (p1__12378_SHARP_){
return p1__12378_SHARP_.json();
});})(seq__12383,chunk__12384,count__12385,i__12386,form_data_12486,file,map__12382,map__12382__$1,files))
).then(((function (seq__12383,chunk__12384,count__12385,i__12386,form_data_12486,file,map__12382,map__12382__$1,files){
return (function (p1__12379_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","file-uploaded","upload-files/file-uploaded",2121710078),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__12379_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))], null));
});})(seq__12383,chunk__12384,count__12385,i__12386,form_data_12486,file,map__12382,map__12382__$1,files))
).catch(((function (seq__12383,chunk__12384,count__12385,i__12386,form_data_12486,file,map__12382,map__12382__$1,files){
return (function (p1__12380_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","upload-failed","upload-files/upload-failed",1609814918),p1__12380_SHARP_.message], null));
});})(seq__12383,chunk__12384,count__12385,i__12386,form_data_12486,file,map__12382,map__12382__$1,files))
);


var G__12487 = seq__12383;
var G__12488 = chunk__12384;
var G__12489 = count__12385;
var G__12490 = (i__12386 + (1));
seq__12383 = G__12487;
chunk__12384 = G__12488;
count__12385 = G__12489;
i__12386 = G__12490;
continue;
} else {
var temp__5804__auto__ = cljs.core.seq(seq__12383);
if(temp__5804__auto__){
var seq__12383__$1 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(seq__12383__$1)){
var c__5525__auto__ = cljs.core.chunk_first(seq__12383__$1);
var G__12491 = cljs.core.chunk_rest(seq__12383__$1);
var G__12492 = c__5525__auto__;
var G__12493 = cljs.core.count(c__5525__auto__);
var G__12494 = (0);
seq__12383 = G__12491;
chunk__12384 = G__12492;
count__12385 = G__12493;
i__12386 = G__12494;
continue;
} else {
var file = cljs.core.first(seq__12383__$1);
var form_data_12495 = (new FormData());
form_data_12495.append("file",file);

fetch("/api/upload-files/upload",cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"method","method",55703592),"POST",new cljs.core.Keyword(null,"credentials","credentials",1373178854),"include",new cljs.core.Keyword(null,"body","body",-2049205669),form_data_12495], null))).then(((function (seq__12383,chunk__12384,count__12385,i__12386,form_data_12495,file,seq__12383__$1,temp__5804__auto__,map__12382,map__12382__$1,files){
return (function (p1__12378_SHARP_){
return p1__12378_SHARP_.json();
});})(seq__12383,chunk__12384,count__12385,i__12386,form_data_12495,file,seq__12383__$1,temp__5804__auto__,map__12382,map__12382__$1,files))
).then(((function (seq__12383,chunk__12384,count__12385,i__12386,form_data_12495,file,seq__12383__$1,temp__5804__auto__,map__12382,map__12382__$1,files){
return (function (p1__12379_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","file-uploaded","upload-files/file-uploaded",2121710078),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__12379_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))], null));
});})(seq__12383,chunk__12384,count__12385,i__12386,form_data_12495,file,seq__12383__$1,temp__5804__auto__,map__12382,map__12382__$1,files))
).catch(((function (seq__12383,chunk__12384,count__12385,i__12386,form_data_12495,file,seq__12383__$1,temp__5804__auto__,map__12382,map__12382__$1,files){
return (function (p1__12380_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","upload-failed","upload-files/upload-failed",1609814918),p1__12380_SHARP_.message], null));
});})(seq__12383,chunk__12384,count__12385,i__12386,form_data_12495,file,seq__12383__$1,temp__5804__auto__,map__12382,map__12382__$1,files))
);


var G__12496 = cljs.core.next(seq__12383__$1);
var G__12497 = null;
var G__12498 = (0);
var G__12499 = (0);
seq__12383 = G__12496;
chunk__12384 = G__12497;
count__12385 = G__12498;
i__12386 = G__12499;
continue;
}
} else {
return null;
}
}
break;
}
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","file-uploaded","upload-files/file-uploaded",2121710078),(function (p__12387,p__12388){
var map__12389 = p__12387;
var map__12389__$1 = cljs.core.__destructure_map(map__12389);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12389__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12390 = p__12388;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12390,(0),null);
var file_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12390,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"uploading?","uploading?",316182892)], null),false),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","load-files","upload-files/load-files",1900743151)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","upload-failed","upload-files/upload-failed",1609814918),(function (db,p__12393){
var vec__12394 = p__12393;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12394,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12394,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"uploading?","uploading?",316182892)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"error","error",-978969032)], null),error);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","load-files","upload-files/load-files",1900743151),(function (p__12397,_){
var map__12398 = p__12397;
var map__12398__$1 = cljs.core.__destructure_map(map__12398);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12398__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/upload-files/files",new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","files-loaded","upload-files/files-loaded",-2060021531)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","files-load-failed","upload-files/files-load-failed",1489766315)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","files-loaded","upload-files/files-loaded",-2060021531),(function (db,p__12399){
var vec__12400 = p__12399;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12400,(0),null);
var files = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12400,(1),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"files","files",-472457450)], null),files);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","files-load-failed","upload-files/files-load-failed",1489766315),(function (db,p__12403){
var vec__12404 = p__12403;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12404,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12404,(1),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"error","error",-978969032)], null),"Failed to load files");
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","select-file","upload-files/select-file",1340191829),(function (p__12407,p__12408){
var map__12409 = p__12407;
var map__12409__$1 = cljs.core.__destructure_map(map__12409);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12409__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12410 = p__12408;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12410,(0),null);
var file = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12410,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"selected-file","selected-file",-189809986)], null),file),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),["/api/upload-files/files/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(file))].join(''),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","file-content-loaded","upload-files/file-content-loaded",-736831754)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","file-content-failed","upload-files/file-content-failed",-2084839985)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","file-content-loaded","upload-files/file-content-loaded",-736831754),(function (db,p__12413){
var vec__12414 = p__12413;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12414,(0),null);
var file_with_content = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12414,(1),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"selected-file","selected-file",-189809986)], null),file_with_content);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","file-content-failed","upload-files/file-content-failed",-2084839985),(function (db,p__12417){
var vec__12418 = p__12417;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12418,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12418,(1),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"content-error","content-error",620583431)], null),"Failed to load file content");
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","delete-file","upload-files/delete-file",-835407326),(function (p__12421,p__12422){
var map__12423 = p__12421;
var map__12423__$1 = cljs.core.__destructure_map(map__12423);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12423__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12424 = p__12422;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12424,(0),null);
var file_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12424,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"deleting","deleting",-1363310386),file_id], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"delete","delete",-1768633620),new cljs.core.Keyword(null,"uri","uri",-774711847),["/api/upload-files/files/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(file_id)].join(''),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","file-deleted","upload-files/file-deleted",-652710112),file_id], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","delete-failed","upload-files/delete-failed",-1283180850),file_id], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","file-deleted","upload-files/file-deleted",-652710112),(function (p__12427,p__12428){
var map__12429 = p__12427;
var map__12429__$1 = cljs.core.__destructure_map(map__12429);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12429__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12430 = p__12428;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12430,(0),null);
var file_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12430,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"deleting","deleting",-1363310386)], null),cljs.core.dissoc,file_id),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","load-files","upload-files/load-files",1900743151)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","delete-failed","upload-files/delete-failed",-1283180850),(function (db,p__12433){
var vec__12434 = p__12433;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12434,(0),null);
var file_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12434,(1),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12434,(2),null);
return cljs.core.assoc_in(cljs.core.update_in.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"deleting","deleting",-1363310386)], null),cljs.core.dissoc,file_id),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"error","error",-978969032)], null),"Failed to delete file");
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","create-text-file","upload-files/create-text-file",974509564),(function (p__12437,p__12438){
var map__12439 = p__12437;
var map__12439__$1 = cljs.core.__destructure_map(map__12439);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12439__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12440 = p__12438;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12440,(0),null);
var map__12443 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12440,(1),null);
var map__12443__$1 = cljs.core.__destructure_map(map__12443);
var title = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12443__$1,new cljs.core.Keyword(null,"title","title",636505583));
var content = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12443__$1,new cljs.core.Keyword(null,"content","content",15833224));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"uploading?","uploading?",316182892)], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/upload-files/create-text",new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"title","title",636505583),title,new cljs.core.Keyword(null,"content","content",15833224),content], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","text-file-created","upload-files/text-file-created",998533948)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","text-file-failed","upload-files/text-file-failed",-2051410491)], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","text-file-created","upload-files/text-file-created",998533948),(function (p__12444,p__12445){
var map__12446 = p__12444;
var map__12446__$1 = cljs.core.__destructure_map(map__12446);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12446__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12447 = p__12445;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12447,(0),null);
var file_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12447,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"uploading?","uploading?",316182892)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"show-text-creator?","show-text-creator?",897025761)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"selected-file","selected-file",-189809986)], null),file_data),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","load-files","upload-files/load-files",1900743151)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","text-file-failed","upload-files/text-file-failed",-2051410491),(function (db,p__12450){
var vec__12451 = p__12450;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12451,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12451,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"uploading?","uploading?",316182892)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"error","error",-978969032)], null),"Failed to create text file");
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","show-text-creator","upload-files/show-text-creator",1353714354),(function (db,p__12454){
var vec__12455 = p__12454;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12455,(0),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"show-text-creator?","show-text-creator?",897025761)], null),true);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("upload-files","hide-text-creator","upload-files/hide-text-creator",266975942),(function (db,p__12458){
var vec__12459 = p__12458;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12459,(0),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"upload-files","upload-files",-771877630),new cljs.core.Keyword(null,"show-text-creator?","show-text-creator?",897025761)], null),false);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("transcripts","load-available-dates","transcripts/load-available-dates",-659360171),(function (p__12462,_){
var map__12463 = p__12462;
var map__12463__$1 = cljs.core.__destructure_map(map__12463);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12463__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"loading-dates?","loading-dates?",-979594713)], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/transcripts/dates",new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","dates-loaded","transcripts/dates-loaded",-931347444)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","dates-load-failed","transcripts/dates-load-failed",1192762954)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("transcripts","dates-loaded","transcripts/dates-loaded",-931347444),(function (db,p__12464){
var vec__12465 = p__12464;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12465,(0),null);
var dates = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12465,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"loading-dates?","loading-dates?",-979594713)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"available-dates","available-dates",-1366714319)], null),dates);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("transcripts","dates-load-failed","transcripts/dates-load-failed",1192762954),(function (db,p__12468){
var vec__12469 = p__12468;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12469,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12469,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"loading-dates?","loading-dates?",-979594713)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"error","error",-978969032)], null),"Failed to load transcript dates");
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("transcripts","select-date","transcripts/select-date",1906999211),(function (p__12472,p__12473){
var map__12474 = p__12472;
var map__12474__$1 = cljs.core.__destructure_map(map__12474);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__12474__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__12475 = p__12473;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12475,(0),null);
var date = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12475,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"selected-date","selected-date",-1397749548)], null),date),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"loading-transcript?","loading-transcript?",1254881198)], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 5, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),["/api/transcripts/date/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(date)].join(''),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","transcript-loaded","transcripts/transcript-loaded",-1290976686)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("transcripts","transcript-load-failed","transcripts/transcript-load-failed",1950450889)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("transcripts","transcript-loaded","transcripts/transcript-loaded",-1290976686),(function (db,p__12478){
var vec__12479 = p__12478;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12479,(0),null);
var transcript_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12479,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"loading-transcript?","loading-transcript?",1254881198)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"transcript-data","transcript-data",-481260449)], null),transcript_data);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("transcripts","transcript-load-failed","transcripts/transcript-load-failed",1950450889),(function (db,p__12482){
var vec__12483 = p__12482;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12483,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__12483,(1),null);
return cljs.core.assoc_in(cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"loading-transcript?","loading-transcript?",1254881198)], null),false),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"transcripts","transcripts",1152913825),new cljs.core.Keyword(null,"error","error",-978969032)], null),"Failed to load transcript data");
}));

//# sourceMappingURL=cogito.events.js.map
