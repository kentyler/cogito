goog.provide('cogito.response_renderer');
if((typeof cogito !== 'undefined') && (typeof cogito.response_renderer !== 'undefined') && (typeof cogito.response_renderer.render_component !== 'undefined')){
} else {
cogito.response_renderer.render_component = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__6708 = cljs.core.get_global_hierarchy;
return (fexpr__6708.cljs$core$IFn$_invoke$arity$0 ? fexpr__6708.cljs$core$IFn$_invoke$arity$0() : fexpr__6708.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cogito.response-renderer","render-component"),new cljs.core.Keyword(null,"response-type","response-type",-1493770458),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"text","text",-1790561697),(function (response){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-response","div.text-response",-1781417080),new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(response)], null);
}));
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"list","list",765357683),(function (response){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.list-response","ul.list-response",902656614),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__6716(s__6717){
return (new cljs.core.LazySeq(null,(function (){
var s__6717__$1 = s__6717;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__6717__$1);
if(temp__5804__auto__){
var s__6717__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__6717__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__6717__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__6719 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__6718 = (0);
while(true){
if((i__6718 < size__5479__auto__)){
var vec__6723 = cljs.core._nth(c__5478__auto__,i__6718);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6723,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6723,(1),null);
cljs.core.chunk_append(b__6719,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){var temp__5804__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"interactions","interactions",550841811),new cljs.core.Keyword(null,"on-click","on-click",1632826543)], null));
if(cljs.core.truth_(temp__5804__auto____$1)){
var handler = temp__5804__auto____$1;
return ((function (i__6718,handler,temp__5804__auto____$1,vec__6723,idx,item,c__5478__auto__,size__5479__auto__,b__6719,s__6717__$2,temp__5804__auto__){
return (function (){
return (handler.cljs$core$IFn$_invoke$arity$1 ? handler.cljs$core$IFn$_invoke$arity$1(item) : handler.call(null,item));
});
;})(i__6718,handler,temp__5804__auto____$1,vec__6723,idx,item,c__5478__auto__,size__5479__auto__,b__6719,s__6717__$2,temp__5804__auto__))
} else {
return null;
}
})()], null),item], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),idx], null)));

var G__6846 = (i__6718 + (1));
i__6718 = G__6846;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__6719),cogito$response_renderer$iter__6716(cljs.core.chunk_rest(s__6717__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__6719),null);
}
} else {
var vec__6729 = cljs.core.first(s__6717__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6729,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6729,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li","li",723558921),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){var temp__5804__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"interactions","interactions",550841811),new cljs.core.Keyword(null,"on-click","on-click",1632826543)], null));
if(cljs.core.truth_(temp__5804__auto____$1)){
var handler = temp__5804__auto____$1;
return ((function (handler,temp__5804__auto____$1,vec__6729,idx,item,s__6717__$2,temp__5804__auto__){
return (function (){
return (handler.cljs$core$IFn$_invoke$arity$1 ? handler.cljs$core$IFn$_invoke$arity$1(item) : handler.call(null,item));
});
;})(handler,temp__5804__auto____$1,vec__6729,idx,item,s__6717__$2,temp__5804__auto__))
} else {
return null;
}
})()], null),item], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),idx], null)),cogito$response_renderer$iter__6716(cljs.core.rest(s__6717__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,new cljs.core.Keyword(null,"items","items",1031954938).cljs$core$IFn$_invoke$arity$1(response)));
})()], null);
}));
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"spreadsheet","spreadsheet",-166817223),(function (response){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.spreadsheet-response","div.spreadsheet-response",-75501079),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(response)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"table","table",-564943036),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"thead","thead",-291875296),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__6732(s__6733){
return (new cljs.core.LazySeq(null,(function (){
var s__6733__$1 = s__6733;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__6733__$1);
if(temp__5804__auto__){
var s__6733__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__6733__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__6733__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__6735 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__6734 = (0);
while(true){
if((i__6734 < size__5479__auto__)){
var header = cljs.core._nth(c__5478__auto__,i__6734);
cljs.core.chunk_append(b__6735,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"th","th",-545608566),header], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),header], null)));

var G__6851 = (i__6734 + (1));
i__6734 = G__6851;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__6735),cogito$response_renderer$iter__6732(cljs.core.chunk_rest(s__6733__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__6735),null);
}
} else {
var header = cljs.core.first(s__6733__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"th","th",-545608566),header], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),header], null)),cogito$response_renderer$iter__6732(cljs.core.rest(s__6733__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"headers","headers",-835030129).cljs$core$IFn$_invoke$arity$1(response));
})()], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tbody","tbody",-80678300),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__6749(s__6750){
return (new cljs.core.LazySeq(null,(function (){
var s__6750__$1 = s__6750;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__6750__$1);
if(temp__5804__auto__){
var s__6750__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__6750__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__6750__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__6752 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__6751 = (0);
while(true){
if((i__6751 < size__5479__auto__)){
var vec__6754 = cljs.core._nth(c__5478__auto__,i__6751);
var row_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6754,(0),null);
var row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6754,(1),null);
cljs.core.chunk_append(b__6752,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646),(function (){var iter__5480__auto__ = ((function (i__6751,vec__6754,row_idx,row,c__5478__auto__,size__5479__auto__,b__6752,s__6750__$2,temp__5804__auto__){
return (function cogito$response_renderer$iter__6749_$_iter__6757(s__6758){
return (new cljs.core.LazySeq(null,((function (i__6751,vec__6754,row_idx,row,c__5478__auto__,size__5479__auto__,b__6752,s__6750__$2,temp__5804__auto__){
return (function (){
var s__6758__$1 = s__6758;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__6758__$1);
if(temp__5804__auto____$1){
var s__6758__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__6758__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__6758__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__6760 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__6759 = (0);
while(true){
if((i__6759 < size__5479__auto____$1)){
var vec__6772 = cljs.core._nth(c__5478__auto____$1,i__6759);
var col_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6772,(0),null);
var cell = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6772,(1),null);
cljs.core.chunk_append(b__6760,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),cell], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),col_idx], null)));

var G__6852 = (i__6759 + (1));
i__6759 = G__6852;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__6760),cogito$response_renderer$iter__6749_$_iter__6757(cljs.core.chunk_rest(s__6758__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__6760),null);
}
} else {
var vec__6780 = cljs.core.first(s__6758__$2);
var col_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6780,(0),null);
var cell = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6780,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),cell], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),col_idx], null)),cogito$response_renderer$iter__6749_$_iter__6757(cljs.core.rest(s__6758__$2)));
}
} else {
return null;
}
break;
}
});})(i__6751,vec__6754,row_idx,row,c__5478__auto__,size__5479__auto__,b__6752,s__6750__$2,temp__5804__auto__))
,null,null));
});})(i__6751,vec__6754,row_idx,row,c__5478__auto__,size__5479__auto__,b__6752,s__6750__$2,temp__5804__auto__))
;
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,row));
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),row_idx], null)));

var G__6853 = (i__6751 + (1));
i__6751 = G__6853;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__6752),cogito$response_renderer$iter__6749(cljs.core.chunk_rest(s__6750__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__6752),null);
}
} else {
var vec__6791 = cljs.core.first(s__6750__$2);
var row_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6791,(0),null);
var row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6791,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646),(function (){var iter__5480__auto__ = ((function (vec__6791,row_idx,row,s__6750__$2,temp__5804__auto__){
return (function cogito$response_renderer$iter__6749_$_iter__6795(s__6796){
return (new cljs.core.LazySeq(null,(function (){
var s__6796__$1 = s__6796;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__6796__$1);
if(temp__5804__auto____$1){
var s__6796__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__6796__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__6796__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__6798 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__6797 = (0);
while(true){
if((i__6797 < size__5479__auto__)){
var vec__6812 = cljs.core._nth(c__5478__auto__,i__6797);
var col_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6812,(0),null);
var cell = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6812,(1),null);
cljs.core.chunk_append(b__6798,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),cell], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),col_idx], null)));

var G__6859 = (i__6797 + (1));
i__6797 = G__6859;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__6798),cogito$response_renderer$iter__6749_$_iter__6795(cljs.core.chunk_rest(s__6796__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__6798),null);
}
} else {
var vec__6823 = cljs.core.first(s__6796__$2);
var col_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6823,(0),null);
var cell = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__6823,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),cell], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),col_idx], null)),cogito$response_renderer$iter__6749_$_iter__6795(cljs.core.rest(s__6796__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(vec__6791,row_idx,row,s__6750__$2,temp__5804__auto__))
;
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,row));
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),row_idx], null)),cogito$response_renderer$iter__6749(cljs.core.rest(s__6750__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(response)));
})()], null)], null)], null);
}));
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"diagram","diagram",1347243758),(function (response){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.diagram-response","div.diagram-response",-1979951870),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(response)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.diagram-placeholder","div.diagram-placeholder",-1695397089),"Diagram visualization would render here",new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"nodes","nodes",-2099585805).cljs$core$IFn$_invoke$arity$1(response)], 0))], null)], null)], null);
}));
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"email","email",1415816706),(function (response){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.email-response","div.email-response",774092333),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.email-header","div.email-header",1808890403),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"To: "], null),new cljs.core.Keyword(null,"to","to",192099007).cljs$core$IFn$_invoke$arity$1(response)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"strong","strong",269529000),"Subject: "], null),new cljs.core.Keyword(null,"subject","subject",-1411880451).cljs$core$IFn$_invoke$arity$1(response)], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.email-body","div.email-body",474166483),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"contentEditable","contentEditable",-823191689),true,new cljs.core.Keyword(null,"on-blur","on-blur",814300747),(function (){var temp__5804__auto__ = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"interactions","interactions",550841811),new cljs.core.Keyword(null,"on-edit","on-edit",745088083)], null));
if(cljs.core.truth_(temp__5804__auto__)){
var handler = temp__5804__auto__;
return (function (p1__6836_SHARP_){
var G__6837 = p1__6836_SHARP_.target.innerText;
return (handler.cljs$core$IFn$_invoke$arity$1 ? handler.cljs$core$IFn$_invoke$arity$1(G__6837) : handler.call(null,G__6837));
});
} else {
return null;
}
})()], null),new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(response)], null)], null);
}));
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"response-set","response-set",-2006269211),(function (response){
var alternatives = new cljs.core.Keyword(null,"alternatives","alternatives",1927759600).cljs$core$IFn$_invoke$arity$1(response);
var turn_id = new cljs.core.Keyword(null,"turn-id","turn-id",648025504).cljs$core$IFn$_invoke$arity$1(response);
var current_index = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"current-alternative-index","current-alternative-index",-989082446),turn_id], null));
var set_index_BANG_ = (function (index){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"set-current-alternative","set-current-alternative",1752281524),turn_id,index], null));
});
var current_alt = (function (){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(alternatives,(function (){var or__5002__auto__ = cljs.core.deref(current_index);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})());
});
return (function (response__$1){
var alt = current_alt();
var total_count = cljs.core.count(alternatives);
var index = (function (){var or__5002__auto__ = cljs.core.deref(current_index);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (0);
}
})();
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.response-set","div.response-set",-547756134),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.alternative-content","div.alternative-content",1719629624),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.response_renderer.render_component,alt], null)], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.navigation-controls","div.navigation-controls",-1941405056),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.nav-buttons","div.nav-buttons",1934111291),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-btn","button.nav-btn",-1510262707),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return set_index_BANG_((0));
})], null),"|<"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-btn","button.nav-btn",-1510262707),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return set_index_BANG_((index - (1)));
})], null),"<<"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-btn","button.nav-btn",-1510262707),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(total_count - (1))),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return set_index_BANG_((index + (1)));
})], null),">>"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-btn","button.nav-btn",-1510262707),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(total_count - (1))),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return set_index_BANG_((total_count - (1)));
})], null),">|"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.nav-counter","div.nav-counter",645061994),[cljs.core.str.cljs$core$IFn$_invoke$arity$1((index + (1)))," of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total_count)].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.alternative-summary","div.alternative-summary",-18568219),new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(alt)], null)], null)], null);
});
}));
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (response){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.unknown-response","div.unknown-response",-2137385894),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre","pre",2118456869),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([response], 0))], null)], null);
}));
cogito.response_renderer.render_response = (function cogito$response_renderer$render_response(response){
if(typeof response === 'string'){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-response","div.text-response",-1781417080),response], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.response_renderer.render_component,response], null);
}
});

//# sourceMappingURL=cogito.response_renderer.js.map
