goog.provide('cogito.invitations.events');
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("invitations","send","invitations/send",963721900),(function (p__11524,p__11525){
var map__11530 = p__11524;
var map__11530__$1 = cljs.core.__destructure_map(map__11530);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11530__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__11531 = p__11525;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11531,(0),null);
var email = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11531,(1),null);
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("invitations","sending","invitations/sending",-209691876),true,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("invitations","error","invitations/error",634757678),null], 0)),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 7, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"post","post",269697687),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/invitations/send",new cljs.core.Keyword(null,"params","params",710516235),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"email","email",1415816706),email], null),new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","send-success","invitations/send-success",1420658083)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","send-failure","invitations/send-failure",-96938791)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("invitations","send-success","invitations/send-success",1420658083),(function (db,p__11537){
var vec__11540 = p__11537;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11540,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11540,(1),null);
return cljs.core.update.cljs$core$IFn$_invoke$arity$3(cljs.core.update.cljs$core$IFn$_invoke$arity$4(cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("invitations","sending","invitations/sending",-209691876),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("invitations","success-message","invitations/success-message",-569479151),["Invitation sent to ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(response))].join('')], 0)),new cljs.core.Keyword("invitations","sent","invitations/sent",1168902860),cljs.core.conj,new cljs.core.Keyword(null,"email","email",1415816706).cljs$core$IFn$_invoke$arity$1(response)),new cljs.core.Keyword("invitations","pending-count","invitations/pending-count",1632712639),cljs.core.inc);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("invitations","send-failure","invitations/send-failure",-96938791),(function (db,p__11545){
var vec__11546 = p__11545;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11546,(0),null);
var map__11549 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11546,(1),null);
var map__11549__$1 = cljs.core.__destructure_map(map__11549);
var response = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11549__$1,new cljs.core.Keyword(null,"response","response",-1068424192));
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("invitations","sending","invitations/sending",-209691876),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("invitations","error","invitations/error",634757678),(function (){var or__5002__auto__ = new cljs.core.Keyword(null,"error","error",-978969032).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Failed to send invitation";
}
})()], 0));
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("invitations","load-pending","invitations/load-pending",-1078481710),(function (p__11554,_){
var map__11556 = p__11554;
var map__11556__$1 = cljs.core.__destructure_map(map__11556);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__11556__$1,new cljs.core.Keyword(null,"db","db",993250759));
return new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("invitations","loading","invitations/loading",887428505),true),new cljs.core.Keyword(null,"http-xhrio","http-xhrio",1846166714),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"method","method",55703592),new cljs.core.Keyword(null,"get","get",1683182755),new cljs.core.Keyword(null,"uri","uri",-774711847),"/api/invitations/pending",new cljs.core.Keyword(null,"format","format",-1306924766),ajax.core.json_request_format(),new cljs.core.Keyword(null,"response-format","response-format",1664465322),ajax.core.json_response_format(new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"keywords?","keywords?",764949733),true], null)),new cljs.core.Keyword(null,"on-success","on-success",1786904109),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","load-success","invitations/load-success",611110825)], null),new cljs.core.Keyword(null,"on-failure","on-failure",842888245),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("invitations","load-failure","invitations/load-failure",-444030189)], null)], null)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("invitations","load-success","invitations/load-success",611110825),(function (db,p__11560){
var vec__11561 = p__11560;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11561,(0),null);
var response = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11561,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("invitations","loading","invitations/loading",887428505),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("invitations","pending","invitations/pending",-701758057),new cljs.core.Keyword(null,"invitations","invitations",-1668975235).cljs$core$IFn$_invoke$arity$1(response)], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("invitations","load-failure","invitations/load-failure",-444030189),(function (db,p__11565){
var vec__11567 = p__11565;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11567,(0),null);
var ___$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11567,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("invitations","loading","invitations/loading",887428505),false,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("invitations","pending","invitations/pending",-701758057),cljs.core.PersistentVector.EMPTY], 0));
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("invitations","clear-messages","invitations/clear-messages",-422565537),(function (db,_){
return cljs.core.dissoc.cljs$core$IFn$_invoke$arity$variadic(db,new cljs.core.Keyword("invitations","error","invitations/error",634757678),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword("invitations","success-message","invitations/success-message",-569479151)], 0));
}));

//# sourceMappingURL=cogito.invitations.events.js.map
