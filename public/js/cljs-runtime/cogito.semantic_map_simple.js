goog.provide('cogito.semantic_map_simple');
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.semantic-map-simple","set-current-meeting","cogito.semantic-map-simple/set-current-meeting",49777924),(function (db,p__6718){
var vec__6721 = p__6718;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6721,(0),null);
var meeting_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6721,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("map","current-meeting","map/current-meeting",-2054074801),meeting_id);
}));
re_frame.core.reg_event_fx.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.semantic-map-simple","load-embeddings","cogito.semantic-map-simple/load-embeddings",1806309465),(function (p__6727,p__6728){
var map__6729 = p__6727;
var map__6729__$1 = cljs.core.__destructure_map(map__6729);
var db = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__6729__$1,new cljs.core.Keyword(null,"db","db",993250759));
var vec__6730 = p__6728;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6730,(0),null);
var block_id = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6730,(1),null);
fetch(["/api/meetings/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(block_id),"/embeddings"].join(''),({"credentials": "same-origin"})).then((function (p1__6726_SHARP_){
return p1__6726_SHARP_.json();
})).then((function (data){
console.log("Raw API response:",data);

var clj_data = cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(data,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"keywordize-keys","keywordize-keys",1310784252),true], 0));
console.log("Converted data:",cljs.core.clj__GT_js(clj_data));

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","embeddings-loaded","cogito.semantic-map-simple/embeddings-loaded",1400440837),clj_data], null));
})).catch((function (error){
console.error("API error:",error);

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","embeddings-load-failed","cogito.semantic-map-simple/embeddings-load-failed",-1671208516),cljs.core.str.cljs$core$IFn$_invoke$arity$1(error)], null));
}));

return new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"db","db",993250759),cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("map","loading?","map/loading?",1905534285),true)], null);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.semantic-map-simple","embeddings-loaded","cogito.semantic-map-simple/embeddings-loaded",1400440837),(function (db,p__6738){
var vec__6739 = p__6738;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6739,(0),null);
var data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6739,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("map","embeddings","map/embeddings",-375973157),new cljs.core.Keyword(null,"embeddings","embeddings",-375880577).cljs$core$IFn$_invoke$arity$1(data)),new cljs.core.Keyword("map","stats","map/stats",-85620903),new cljs.core.Keyword(null,"stats","stats",-85643011).cljs$core$IFn$_invoke$arity$1(data)),new cljs.core.Keyword("map","loading?","map/loading?",1905534285),false);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.semantic-map-simple","embeddings-load-failed","cogito.semantic-map-simple/embeddings-load-failed",-1671208516),(function (db,p__6743){
var vec__6747 = p__6743;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6747,(0),null);
var error = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6747,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("map","error","map/error",-979141484),error),new cljs.core.Keyword("map","loading?","map/loading?",1905534285),false);
}));
re_frame.core.reg_event_db.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword("cogito.semantic-map-simple","set-selected-turn","cogito.semantic-map-simple/set-selected-turn",1855670088),(function (db,p__6750){
var vec__6751 = p__6750;
var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6751,(0),null);
var turn = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6751,(1),null);
return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(db,new cljs.core.Keyword("map","selected-turn","map/selected-turn",-1865000599),turn);
}));
re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("cogito.semantic-map-simple","current-meeting","cogito.semantic-map-simple/current-meeting",-1240772984),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (db,_){
return new cljs.core.Keyword("map","current-meeting","map/current-meeting",-2054074801).cljs$core$IFn$_invoke$arity$1(db);
})], 0));
re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("cogito.semantic-map-simple","embeddings","cogito.semantic-map-simple/embeddings",1512119094),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (db,_){
return new cljs.core.Keyword("map","embeddings","map/embeddings",-375973157).cljs$core$IFn$_invoke$arity$1(db);
})], 0));
re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("cogito.semantic-map-simple","loading?","cogito.semantic-map-simple/loading?",1090397622),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (db,_){
return new cljs.core.Keyword("map","loading?","map/loading?",1905534285).cljs$core$IFn$_invoke$arity$1(db);
})], 0));
re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("cogito.semantic-map-simple","error","cogito.semantic-map-simple/error",-183665511),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (db,_){
return new cljs.core.Keyword("map","error","map/error",-979141484).cljs$core$IFn$_invoke$arity$1(db);
})], 0));
re_frame.core.reg_sub.cljs$core$IFn$_invoke$arity$variadic(new cljs.core.Keyword("cogito.semantic-map-simple","selected-turn","cogito.semantic-map-simple/selected-turn",-333690360),cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([(function (db,_){
return new cljs.core.Keyword("map","selected-turn","map/selected-turn",-1865000599).cljs$core$IFn$_invoke$arity$1(db);
})], 0));
cogito.semantic_map_simple.get_participant_color = (function cogito$semantic_map_simple$get_participant_color(participant_name){
var colors = new cljs.core.PersistentVector(null, 8, 5, cljs.core.PersistentVector.EMPTY_NODE, ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#84CC16"], null);
var hash = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._PLUS_,(0),cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.int$,(function (){var or__5002__auto__ = participant_name;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return "Unknown";
}
})()));
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(colors,cljs.core.mod(hash,cljs.core.count(colors)));
});
cogito.semantic_map_simple.simple_map_view = (function cogito$semantic_map_simple$simple_map_view(){
var embeddings = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","embeddings","cogito.semantic-map-simple/embeddings",1512119094)], null));
var selected_turn = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","selected-turn","cogito.semantic-map-simple/selected-turn",-333690360)], null));
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"display","display",242065432),"flex",new cljs.core.Keyword(null,"height","height",1025178622),"600px",new cljs.core.Keyword(null,"background","background",-863952629),"#f9fafb",new cljs.core.Keyword(null,"border-radius","border-radius",419594011),"8px"], null)], null),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"width","width",-384071477),"60%",new cljs.core.Keyword(null,"padding","padding",1660304693),"16px"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),"Conversation Map"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),["Showing ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljs.core.count(cljs.core.deref(embeddings)))," turns"].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"svg","svg",856789142),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"width","width",-384071477),"100%",new cljs.core.Keyword(null,"height","height",1025178622),"400",new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"border","border",1444987323),"1px solid #ccc",new cljs.core.Keyword(null,"background","background",-863952629),"white"], null)], null),(function (){var iter__5480__auto__ = (function cogito$semantic_map_simple$simple_map_view_$_iter__6781(s__6782){
return (new cljs.core.LazySeq(null,(function (){
var s__6782__$1 = s__6782;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__6782__$1);
if(temp__5804__auto__){
var s__6782__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__6782__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__6782__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__6784 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__6783 = (0);
while(true){
if((i__6783 < size__5479__auto__)){
var turn = cljs.core._nth(c__5478__auto__,i__6783);
cljs.core.chunk_append(b__6784,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"circle","circle",1903212362),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"cx","cx",1272694324),new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(turn),new cljs.core.Keyword(null,"cy","cy",755331060),(new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(turn) * 0.8),new cljs.core.Keyword(null,"r","r",-471384190),(5),new cljs.core.Keyword(null,"fill","fill",883462889),cogito.semantic_map_simple.get_participant_color(new cljs.core.Keyword(null,"participant_name","participant_name",1835821395).cljs$core$IFn$_invoke$arity$1(turn)),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__6783,turn,c__5478__auto__,size__5479__auto__,b__6784,s__6782__$2,temp__5804__auto__,embeddings,selected_turn){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","set-selected-turn","cogito.semantic-map-simple/set-selected-turn",1855670088),turn], null));
});})(i__6783,turn,c__5478__auto__,size__5479__auto__,b__6784,s__6782__$2,temp__5804__auto__,embeddings,selected_turn))
], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"turn_id","turn_id",-911869226).cljs$core$IFn$_invoke$arity$1(turn)], null)));

var G__6839 = (i__6783 + (1));
i__6783 = G__6839;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__6784),cogito$semantic_map_simple$simple_map_view_$_iter__6781(cljs.core.chunk_rest(s__6782__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__6784),null);
}
} else {
var turn = cljs.core.first(s__6782__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"circle","circle",1903212362),new cljs.core.PersistentArrayMap(null, 6, [new cljs.core.Keyword(null,"cx","cx",1272694324),new cljs.core.Keyword(null,"x","x",2099068185).cljs$core$IFn$_invoke$arity$1(turn),new cljs.core.Keyword(null,"cy","cy",755331060),(new cljs.core.Keyword(null,"y","y",-1757859776).cljs$core$IFn$_invoke$arity$1(turn) * 0.8),new cljs.core.Keyword(null,"r","r",-471384190),(5),new cljs.core.Keyword(null,"fill","fill",883462889),cogito.semantic_map_simple.get_participant_color(new cljs.core.Keyword(null,"participant_name","participant_name",1835821395).cljs$core$IFn$_invoke$arity$1(turn)),new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"cursor","cursor",1011937484),"pointer"], null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (turn,s__6782__$2,temp__5804__auto__,embeddings,selected_turn){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","set-selected-turn","cogito.semantic-map-simple/set-selected-turn",1855670088),turn], null));
});})(turn,s__6782__$2,temp__5804__auto__,embeddings,selected_turn))
], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"turn_id","turn_id",-911869226).cljs$core$IFn$_invoke$arity$1(turn)], null)),cogito$semantic_map_simple$simple_map_view_$_iter__6781(cljs.core.rest(s__6782__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(embeddings));
})()], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"width","width",-384071477),"40%",new cljs.core.Keyword(null,"padding","padding",1660304693),"16px",new cljs.core.Keyword(null,"border-left","border-left",-1150760178),"1px solid #ccc"], null)], null),(cljs.core.truth_(cljs.core.deref(selected_turn))?new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4","h4",2004862993),"Turn Details"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Participant: "], null),new cljs.core.Keyword(null,"participant_name","participant_name",1835821395).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected_turn))], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Content: "], null),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected_turn))], null)], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Click a dot to see details"], null))], null)], null);
});
cogito.semantic_map_simple.semantic_map_tab = (function cogito$semantic_map_simple$semantic_map_tab(){
var current_meeting = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","current-meeting","cogito.semantic-map-simple/current-meeting",-1240772984)], null));
var embeddings = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","embeddings","cogito.semantic-map-simple/embeddings",1512119094)], null));
return reagent.core.create_class.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"component-did-mount","component-did-mount",-1126910518),(function (){
if(cljs.core.truth_(cljs.core.deref(current_meeting))){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("cogito.semantic-map-simple","load-embeddings","cogito.semantic-map-simple/load-embeddings",1806309465),cljs.core.deref(current_meeting)], null));
} else {
return null;
}
}),new cljs.core.Keyword(null,"reagent-render","reagent-render",-985383853),(function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"style","style",-496642736),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"padding","padding",1660304693),"16px"], null)], null),(cljs.core.truth_(cljs.core.deref(embeddings))?new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.semantic_map_simple.simple_map_view], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"Loading..."], null))], null);
})], null));
});

//# sourceMappingURL=cogito.semantic_map_simple.js.map
