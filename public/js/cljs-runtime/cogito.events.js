goog.provide('cogito.events');
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"initialize-db","initialize-db",230998432),(function (_,___$1){
return cogito.db.default_db;
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"set-current-prompt","set-current-prompt",-1655270417),(function (db,p__6758){
var vec__6759 = p__6758;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6759,(0),null);
var prompt = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6759,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"current-prompt","current-prompt",998257734),prompt);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"submit-prompt","submit-prompt",502791731),(function (p__6762,p__6763){
var map__6764 = p__6762;
var map__6764__$1 = cljs.core.__destructure_map(map__6764);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6764__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6765 = p__6763;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6765,(0),null);
var prompt = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6765,(1),null);
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
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"loading?","loading?",1905707049),true),new cljs.core.Keyword(null,"fetch-response","fetch-response",-810170312),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"prompt","prompt",-78109487),prompt,new cljs.core.Keyword(null,"conversation-id","conversation-id",1220978913),new cljs.core.Keyword(null,"conversation-id","conversation-id",1220978913).cljs$core$IFn$_invoke$arity$1(db),new cljs.core.Keyword(null,"context","context",-830191113),response_context], null)], null);
}));
re_frame.core.reg_fx(new cljs.core.Keyword(null,"fetch-response","fetch-response",-810170312),(function (p__6779){
var map__6780 = p__6779;
var map__6780__$1 = cljs.core.__destructure_map(map__6780);
var prompt = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6780__$1,new cljs.core.Keyword(null,"prompt","prompt",-78109487));
var conversation_id = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6780__$1,new cljs.core.Keyword(null,"conversation-id","conversation-id",1220978913));
var context = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6780__$1,new cljs.core.Keyword(null,"context","context",-830191113));
return fetch("/api/conversational-turn",cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"method","method",55703592),"POST",new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null),new cljs.core.Keyword(null,"credentials","credentials",1373178854),"include",new cljs.core.Keyword(null,"body","body",-2049205669),JSON.stringify(cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"content","content",15833224),prompt,new cljs.core.Keyword(null,"conversation_id","conversation_id",-172324980),conversation_id,new cljs.core.Keyword(null,"context","context",-830191113),context], null)))], null))).then((function (p1__6776_SHARP_){
return p1__6776_SHARP_.json();
})).then((function (p1__6777_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"handle-llm-response","handle-llm-response",-249310704),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__6777_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))], null));
})).catch((function (p1__6778_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"handle-error","handle-error",1613855484),p1__6778_SHARP_], null));
}));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"handle-llm-response","handle-llm-response",-249310704),(function (db,p__6785){
var vec__6786 = p__6785;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6786,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6786,(1),null);
var parsed_response = (function (){try{return eval(["(",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"response","response",-1068424192).cljs$core$IFn$_invoke$arity$1(response)),")"].join(''));
}catch (e6790){if((e6790 instanceof Error)){
var e = e6790;
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"response-type","response-type",-1493770458),new cljs.core.Keyword(null,"text","text",-1790561697),new cljs.core.Keyword(null,"content","content",15833224),["Parse error: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"response","response",-1068424192).cljs$core$IFn$_invoke$arity$1(response))].join('')], null);
} else {
throw e6790;

}
}})();
return cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"loading?","loading?",1905707049),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"current-prompt","current-prompt",998257734),"",new cljs.core.Keyword(null,"conversation-id","conversation-id",1220978913),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"conversation-id","conversation-id",1220978913).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return new cljs.core.Keyword(null,"conversation-id","conversation-id",1220978913).cljs$core$IFn$_invoke$arity$1(db);
}
})()], 0)),new cljs.core.Keyword(null,"turns","turns",-1118736892),cljs.core.conj,new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"id","id",-1388402092),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(response),new cljs.core.Keyword(null,"prompt","prompt",-78109487),new cljs.core.Keyword(null,"prompt","prompt",-78109487).cljs$core$IFn$_invoke$arity$1(response),new cljs.core.Keyword(null,"response","response",-1068424192),parsed_response], null));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"handle-error","handle-error",1613855484),(function (db,p__6791){
var vec__6792 = p__6791;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6792,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6792,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"loading?","loading?",1905707049),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"error","error",-978969032),error], 0));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"check-auth-status","check-auth-status",898872782),(function (_,___$1){
return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fetch-auth-status","fetch-auth-status",670770267),cljs.core.PersistentArrayMap.EMPTY], null);
}));
re_frame.core.reg_fx(new cljs.core.Keyword(null,"fetch-auth-status","fetch-auth-status",670770267),(function (_){
return fetch("/api/auth-status",cljs.core.clj__GT_js(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"credentials","credentials",1373178854),"include"], null))).then((function (p1__6795_SHARP_){
return p1__6795_SHARP_.json();
})).then((function (p1__6796_SHARP_){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"auth-status-received","auth-status-received",490143799),cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__6796_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0))], null));
})).catch((function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"auth-status-received","auth-status-received",490143799),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"authenticated","authenticated",1282954211),false], null)], null));
}));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"auth-status-received","auth-status-received",490143799),(function (db,p__6798){
var vec__6799 = p__6798;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6799,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6799,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),new cljs.core.Keyword(null,"authenticated","authenticated",1282954211).cljs$core$IFn$_invoke$arity$1(response),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804),new cljs.core.Keyword(null,"pendingClientSelection","pendingClientSelection",-1292453434).cljs$core$IFn$_invoke$arity$1(response),new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),new cljs.core.Keyword(null,"clients","clients",1436018090).cljs$core$IFn$_invoke$arity$1(response),new cljs.core.Keyword(null,"user","user",1532431356),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(response)], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"login-success","login-success",1089283105),(function (db,p__6802){
var vec__6803 = p__6802;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6803,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6803,(1),null);
if(cljs.core.truth_(new cljs.core.Keyword(null,"clients","clients",1436018090).cljs$core$IFn$_invoke$arity$1(response))){
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804),true,new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),new cljs.core.Keyword(null,"clients","clients",1436018090).cljs$core$IFn$_invoke$arity$1(response)], 0));
} else {
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"user","user",1532431356),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(response)], 0));
}
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"select-client","select-client",1739667626),(function (p__6806,p__6807){
var map__6808 = p__6806;
var map__6808__$1 = cljs.core.__destructure_map(map__6808);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6808__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6809 = p__6807;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6809,(0),null);
var client_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6809,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"selecting-client?","selecting-client?",-865934466),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 8, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/select-client",new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null),new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"client_id","client_id",48809273),client_id], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"client-selected","client-selected",1880556560)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"client-selection-failed","client-selection-failed",1516198)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-selected","client-selected",1880556560),(function (db,p__6812){
var vec__6813 = p__6812;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6813,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6813,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804),false,new cljs.core.Keyword(null,"selecting-client?","selecting-client?",-865934466),false,new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),null,new cljs.core.Keyword(null,"user","user",1532431356),new cljs.core.Keyword(null,"user","user",1532431356).cljs$core$IFn$_invoke$arity$1(response)], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"client-selection-failed","client-selection-failed",1516198),(function (db,p__6820){
var vec__6821 = p__6820;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6821,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6821,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword(null,"selecting-client?","selecting-client?",-865934466),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"client-selection-error","client-selection-error",-2090086776),"Failed to select client"], 0));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"logout","logout",1418564329),(function (p__6824,_){
var map__6825 = p__6824;
var map__6825__$1 = cljs.core.__destructure_map(map__6825);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6825__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword(null,"logging-out?","logging-out?",-1351512203),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/logout",new cljs.core.Keyword(null,"headers","headers",-835030129),new cljs.core.PersistentArrayMap(null, 1, ["Content-Type","application/json"], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"logout-success","logout-success",-2070457265)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"logout-success","logout-success",-2070457265)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"logout-success","logout-success",-2070457265),(function (db,_){
return new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"authenticated?","authenticated?",-1988130123),false,new cljs.core.Keyword(null,"pending-client-selection?","pending-client-selection?",268730804),false,new cljs.core.Keyword(null,"user","user",1532431356),null,new cljs.core.Keyword(null,"available-clients","available-clients",-667188798),null,new cljs.core.Keyword(null,"logging-out?","logging-out?",-1351512203),false,new cljs.core.Keyword(null,"turns","turns",-1118736892),cljs.core.PersistentVector.EMPTY,new cljs.core.Keyword(null,"current-prompt","current-prompt",998257734),""], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"set-current-alternative","set-current-alternative",1752281524),(function (db,p__6826){
var vec__6827 = p__6826;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6827,(0),null);
var turn_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6827,(1),null);
var index = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6827,(2),null);
return cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"alternative-indices","alternative-indices",2011932146),turn_id], null),index);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"get-current-alternative","get-current-alternative",1214332997),(function (db,p__6831){
var vec__6832 = p__6831;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6832,(0),null);
var turn_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6832,(1),null);
return cljs.core.get_in.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"alternative-indices","alternative-indices",2011932146),turn_id], null),(0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("workbench","set-active-tab","workbench/set-active-tab",-930442748),(function (db,p__6835){
var vec__6836 = p__6835;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6836,(0),null);
var tab = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6836,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("workbench","active-tab","workbench/active-tab",-23767367),tab);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","create-bot","bot-creation/create-bot",724855344),(function (p__6840,p__6841){
var map__6842 = p__6840;
var map__6842__$1 = cljs.core.__destructure_map(map__6842);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6842__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6843 = p__6841;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6843,(0),null);
var form_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6843,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","loading?","bot-creation/loading?",-1601059818),true),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681)),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/create-bot",new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"meeting_url","meeting_url",-1436349635),new cljs.core.Keyword(null,"meeting-url","meeting-url",1371135342).cljs$core$IFn$_invoke$arity$1(form_data),new cljs.core.Keyword(null,"meeting_name","meeting_name",73574429),new cljs.core.Keyword(null,"meeting-name","meeting-name",829298160).cljs$core$IFn$_invoke$arity$1(form_data)], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","create-success","bot-creation/create-success",-1872616930)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","create-failure","bot-creation/create-failure",-1098545174)], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","create-success","bot-creation/create-success",-1872616930),(function (p__6846,p__6847){
var map__6848 = p__6846;
var map__6848__$1 = cljs.core.__destructure_map(map__6848);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6848__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6849 = p__6847;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6849,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6849,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","loading?","bot-creation/loading?",-1601059818),false),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"text","text",-1790561697),"Bot created successfully! The bot will join your meeting."], null)),new cljs.core.Keyword("bot-creation","bots","bot-creation/bots",156109706),cljs.core.conj,response),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","create-failure","bot-creation/create-failure",-1098545174),(function (db,p__6852){
var vec__6853 = p__6852;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6853,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6853,(1),null);
var error_message = (function (){var or__5002__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"response","response",-1068424192),new cljs.core.Keyword(null,"error","error",-978969032)], null));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Failed to create bot. Please try again.";
}
})();
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","loading?","bot-creation/loading?",-1601059818),false),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"text","text",-1790561697),error_message], null));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743),(function (p__6856,_){
var map__6857 = p__6856;
var map__6857__$1 = cljs.core.__destructure_map(map__6857);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6857__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","fetching-bots?","bot-creation/fetching-bots?",1664817515),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/bots",new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots-success","bot-creation/fetch-bots-success",775254484)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots-failure","bot-creation/fetch-bots-failure",623621355)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","fetch-bots-success","bot-creation/fetch-bots-success",775254484),(function (db,p__6858){
var vec__6859 = p__6858;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6859,(0),null);
var bots = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6859,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","fetching-bots?","bot-creation/fetching-bots?",1664817515),false),new cljs.core.Keyword("bot-creation","running-bots","bot-creation/running-bots",1908155650),bots);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","fetch-bots-failure","bot-creation/fetch-bots-failure",623621355),(function (db,p__6862){
var vec__6863 = p__6862;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6863,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6863,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("bot-creation","fetching-bots?","bot-creation/fetching-bots?",1664817515),false),new cljs.core.Keyword("bot-creation","running-bots","bot-creation/running-bots",1908155650),cljs.core.PersistentVector.EMPTY);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","shutdown-bot","bot-creation/shutdown-bot",-1819973085),(function (p__6866,p__6867){
var map__6868 = p__6866;
var map__6868__$1 = cljs.core.__destructure_map(map__6868);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6868__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6869 = p__6867;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6869,(0),null);
var bot_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6869,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutting-down","bot-creation/shutting-down",1605083445),bot_id], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),["/api/bots/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(bot_id),"/leave"].join(''),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutdown-success","bot-creation/shutdown-success",-213598063),bot_id], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","shutdown-failure","bot-creation/shutdown-failure",-269107968),bot_id], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","shutdown-success","bot-creation/shutdown-success",-213598063),(function (p__6872,p__6873){
var map__6876 = p__6872;
var map__6876__$1 = cljs.core.__destructure_map(map__6876);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6876__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6877 = p__6873;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6877,(0),null);
var bot_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6877,(1),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6877,(2),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("bot-creation","shutting-down","bot-creation/shutting-down",1605083445),cljs.core.dissoc,bot_id),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"text","text",-1790561697),"Bot shut down successfully"], null)),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("bot-creation","fetch-bots","bot-creation/fetch-bots",-1003787743)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("bot-creation","shutdown-failure","bot-creation/shutdown-failure",-269107968),(function (db,p__6880){
var vec__6881 = p__6880;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6881,(0),null);
var bot_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6881,(1),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6881,(2),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("bot-creation","shutting-down","bot-creation/shutting-down",1605083445),cljs.core.dissoc,bot_id),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"text","text",-1790561697),"Failed to shut down bot"], null));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","fetch","stuck-meetings/fetch",-377416991),(function (p__6884,_){
var map__6885 = p__6884;
var map__6885__$1 = cljs.core.__destructure_map(map__6885);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6885__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("stuck-meetings","fetching?","stuck-meetings/fetching?",375784401),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/stuck-meetings",new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetch-success","stuck-meetings/fetch-success",1587948040)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetch-failure","stuck-meetings/fetch-failure",69757432)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","fetch-success","stuck-meetings/fetch-success",1587948040),(function (db,p__6886){
var vec__6887 = p__6886;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6887,(0),null);
var meetings = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6887,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("stuck-meetings","fetching?","stuck-meetings/fetching?",375784401),false),new cljs.core.Keyword("stuck-meetings","meetings","stuck-meetings/meetings",743579265),meetings);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","fetch-failure","stuck-meetings/fetch-failure",69757432),(function (db,p__6890){
var vec__6891 = p__6890;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6891,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6891,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("stuck-meetings","fetching?","stuck-meetings/fetching?",375784401),false),new cljs.core.Keyword("stuck-meetings","meetings","stuck-meetings/meetings",743579265),cljs.core.PersistentVector.EMPTY);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","force-complete","stuck-meetings/force-complete",-393535154),(function (p__6895,p__6896){
var map__6897 = p__6895;
var map__6897__$1 = cljs.core.__destructure_map(map__6897);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6897__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6898 = p__6896;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6898,(0),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6898,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc_in(db,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","completing","stuck-meetings/completing",-436837248),meeting_id], null),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),["/api/stuck-meetings/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(meeting_id),"/complete"].join(''),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","complete-success","stuck-meetings/complete-success",-635788468),meeting_id], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","complete-failure","stuck-meetings/complete-failure",-2013592263),meeting_id], null)], null)], null);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","complete-success","stuck-meetings/complete-success",-635788468),(function (p__6901,p__6902){
var map__6903 = p__6901;
var map__6903__$1 = cljs.core.__destructure_map(map__6903);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6903__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6904 = p__6902;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6904,(0),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6904,(1),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6904,(2),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("stuck-meetings","completing","stuck-meetings/completing",-436837248),cljs.core.dissoc,meeting_id),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"success","success",1890645906),new cljs.core.Keyword(null,"text","text",-1790561697),"Meeting marked as completed"], null)),new cljs.core.Keyword(null,"dispatch","dispatch",1319337009),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("stuck-meetings","fetch","stuck-meetings/fetch",-377416991)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("stuck-meetings","complete-failure","stuck-meetings/complete-failure",-2013592263),(function (db,p__6907){
var vec__6908 = p__6907;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6908,(0),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6908,(1),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6908,(2),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(db,new cljs.core.Keyword("stuck-meetings","completing","stuck-meetings/completing",-436837248),cljs.core.dissoc,meeting_id),new cljs.core.Keyword("bot-creation","message","bot-creation/message",-1731784681),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"type","type",1174270348),new cljs.core.Keyword(null,"error","error",-978969032),new cljs.core.Keyword(null,"text","text",-1790561697),"Failed to complete meeting"], null));
}));

//# sourceMappingURL=cogito.events.js.map
