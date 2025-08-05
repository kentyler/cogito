goog.provide('cogito.response_renderer');
if((typeof cogito !== 'undefined') && (typeof cogito.response_renderer !== 'undefined') && (typeof cogito.response_renderer.render_component !== 'undefined')){
} else {
cogito.response_renderer.render_component = (function (){var method_table__5599__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var prefer_table__5600__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var method_cache__5601__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var cached_hierarchy__5602__auto__ = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
var hierarchy__5603__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentArrayMap.EMPTY,new cljs.core.Keyword(null,"hierarchy","hierarchy",-1053470341),(function (){var fexpr__10532 = cljs.core.get_global_hierarchy;
return (fexpr__10532.cljs$core$IFn$_invoke$arity$0 ? fexpr__10532.cljs$core$IFn$_invoke$arity$0() : fexpr__10532.call(null));
})());
return (new cljs.core.MultiFn(cljs.core.symbol.cljs$core$IFn$_invoke$arity$2("cogito.response-renderer","render-component"),new cljs.core.Keyword(null,"response-type","response-type",-1493770458),new cljs.core.Keyword(null,"default","default",-1987822328),hierarchy__5603__auto__,method_table__5599__auto__,prefer_table__5600__auto__,method_cache__5601__auto__,cached_hierarchy__5602__auto__));
})();
}
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"text","text",-1790561697),(function (response){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-response.space-y-3","div.text-response.space-y-3",1869632836),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__10534(s__10535){
return (new cljs.core.LazySeq(null,(function (){
var s__10535__$1 = s__10535;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__10535__$1);
if(temp__5804__auto__){
var s__10535__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__10535__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__10535__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__10537 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__10536 = (0);
while(true){
if((i__10536 < size__5479__auto__)){
var vec__10540 = cljs.core._nth(c__5478__auto__,i__10536);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10540,(0),null);
var paragraph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10540,(1),null);
cljs.core.chunk_append(b__10537,((clojure.string.blank_QMARK_(paragraph))?null:cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-700.leading-relaxed","p.text-gray-700.leading-relaxed",-497622854),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),idx], null))));

var G__10859 = (i__10536 + (1));
i__10536 = G__10859;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__10537),cogito$response_renderer$iter__10534(cljs.core.chunk_rest(s__10535__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__10537),null);
}
} else {
var vec__10546 = cljs.core.first(s__10535__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10546,(0),null);
var paragraph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10546,(1),null);
return cljs.core.cons(((clojure.string.blank_QMARK_(paragraph))?null:cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-700.leading-relaxed","p.text-gray-700.leading-relaxed",-497622854),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),idx], null))),cogito$response_renderer$iter__10534(cljs.core.rest(s__10535__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,clojure.string.split_lines(new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(response))));
})()], null);
}));
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"list","list",765357683),(function (response){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"ul.list-response.space-y-2.pl-5.list-disc","ul.list-response.space-y-2.pl-5.list-disc",-550830087),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__10557(s__10558){
return (new cljs.core.LazySeq(null,(function (){
var s__10558__$1 = s__10558;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__10558__$1);
if(temp__5804__auto__){
var s__10558__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__10558__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__10558__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__10560 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__10559 = (0);
while(true){
if((i__10559 < size__5479__auto__)){
var vec__10563 = cljs.core._nth(c__5478__auto__,i__10559);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10563,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10563,(1),null);
cljs.core.chunk_append(b__10560,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.text-gray-700.leading-relaxed","li.text-gray-700.leading-relaxed",1009474291),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"interactions","interactions",550841811),new cljs.core.Keyword(null,"on-click","on-click",1632826543)], null)))?"cursor-pointer hover:text-blue-600 transition-colors":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){var temp__5804__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"interactions","interactions",550841811),new cljs.core.Keyword(null,"on-click","on-click",1632826543)], null));
if(cljs.core.truth_(temp__5804__auto____$1)){
var handler = temp__5804__auto____$1;
return ((function (i__10559,handler,temp__5804__auto____$1,vec__10563,idx,item,c__5478__auto__,size__5479__auto__,b__10560,s__10558__$2,temp__5804__auto__){
return (function (){
return (handler.cljs$core$IFn$_invoke$arity$1 ? handler.cljs$core$IFn$_invoke$arity$1(item) : handler.call(null,item));
});
;})(i__10559,handler,temp__5804__auto____$1,vec__10563,idx,item,c__5478__auto__,size__5479__auto__,b__10560,s__10558__$2,temp__5804__auto__))
} else {
return null;
}
})()], null),item], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),idx], null)));

var G__10870 = (i__10559 + (1));
i__10559 = G__10870;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__10560),cogito$response_renderer$iter__10557(cljs.core.chunk_rest(s__10558__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__10560),null);
}
} else {
var vec__10570 = cljs.core.first(s__10558__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10570,(0),null);
var item = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10570,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"li.text-gray-700.leading-relaxed","li.text-gray-700.leading-relaxed",1009474291),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),(cljs.core.truth_(cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"interactions","interactions",550841811),new cljs.core.Keyword(null,"on-click","on-click",1632826543)], null)))?"cursor-pointer hover:text-blue-600 transition-colors":null),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){var temp__5804__auto____$1 = cljs.core.get_in.cljs$core$IFn$_invoke$arity$2(response,new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"interactions","interactions",550841811),new cljs.core.Keyword(null,"on-click","on-click",1632826543)], null));
if(cljs.core.truth_(temp__5804__auto____$1)){
var handler = temp__5804__auto____$1;
return ((function (handler,temp__5804__auto____$1,vec__10570,idx,item,s__10558__$2,temp__5804__auto__){
return (function (){
return (handler.cljs$core$IFn$_invoke$arity$1 ? handler.cljs$core$IFn$_invoke$arity$1(item) : handler.call(null,item));
});
;})(handler,temp__5804__auto____$1,vec__10570,idx,item,s__10558__$2,temp__5804__auto__))
} else {
return null;
}
})()], null),item], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),idx], null)),cogito$response_renderer$iter__10557(cljs.core.rest(s__10558__$2)));
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
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.spreadsheet-response","div.spreadsheet-response",-75501079),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),new cljs.core.Keyword(null,"title","title",636505583).cljs$core$IFn$_invoke$arity$1(response)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"table","table",-564943036),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"thead","thead",-291875296),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__10589(s__10590){
return (new cljs.core.LazySeq(null,(function (){
var s__10590__$1 = s__10590;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__10590__$1);
if(temp__5804__auto__){
var s__10590__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__10590__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__10590__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__10592 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__10591 = (0);
while(true){
if((i__10591 < size__5479__auto__)){
var header = cljs.core._nth(c__5478__auto__,i__10591);
cljs.core.chunk_append(b__10592,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"th","th",-545608566),header], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),header], null)));

var G__10882 = (i__10591 + (1));
i__10591 = G__10882;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__10592),cogito$response_renderer$iter__10589(cljs.core.chunk_rest(s__10590__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__10592),null);
}
} else {
var header = cljs.core.first(s__10590__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"th","th",-545608566),header], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),header], null)),cogito$response_renderer$iter__10589(cljs.core.rest(s__10590__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(new cljs.core.Keyword(null,"headers","headers",-835030129).cljs$core$IFn$_invoke$arity$1(response));
})()], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tbody","tbody",-80678300),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__10600(s__10601){
return (new cljs.core.LazySeq(null,(function (){
var s__10601__$1 = s__10601;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__10601__$1);
if(temp__5804__auto__){
var s__10601__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__10601__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__10601__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__10603 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__10602 = (0);
while(true){
if((i__10602 < size__5479__auto__)){
var vec__10608 = cljs.core._nth(c__5478__auto__,i__10602);
var row_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10608,(0),null);
var row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10608,(1),null);
cljs.core.chunk_append(b__10603,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646),(function (){var iter__5480__auto__ = ((function (i__10602,vec__10608,row_idx,row,c__5478__auto__,size__5479__auto__,b__10603,s__10601__$2,temp__5804__auto__){
return (function cogito$response_renderer$iter__10600_$_iter__10611(s__10612){
return (new cljs.core.LazySeq(null,((function (i__10602,vec__10608,row_idx,row,c__5478__auto__,size__5479__auto__,b__10603,s__10601__$2,temp__5804__auto__){
return (function (){
var s__10612__$1 = s__10612;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__10612__$1);
if(temp__5804__auto____$1){
var s__10612__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__10612__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__10612__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__10614 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__10613 = (0);
while(true){
if((i__10613 < size__5479__auto____$1)){
var vec__10620 = cljs.core._nth(c__5478__auto____$1,i__10613);
var col_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10620,(0),null);
var cell = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10620,(1),null);
cljs.core.chunk_append(b__10614,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),cell], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),col_idx], null)));

var G__10896 = (i__10613 + (1));
i__10613 = G__10896;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__10614),cogito$response_renderer$iter__10600_$_iter__10611(cljs.core.chunk_rest(s__10612__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__10614),null);
}
} else {
var vec__10623 = cljs.core.first(s__10612__$2);
var col_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10623,(0),null);
var cell = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10623,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),cell], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),col_idx], null)),cogito$response_renderer$iter__10600_$_iter__10611(cljs.core.rest(s__10612__$2)));
}
} else {
return null;
}
break;
}
});})(i__10602,vec__10608,row_idx,row,c__5478__auto__,size__5479__auto__,b__10603,s__10601__$2,temp__5804__auto__))
,null,null));
});})(i__10602,vec__10608,row_idx,row,c__5478__auto__,size__5479__auto__,b__10603,s__10601__$2,temp__5804__auto__))
;
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,row));
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),row_idx], null)));

var G__10900 = (i__10602 + (1));
i__10602 = G__10900;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__10603),cogito$response_renderer$iter__10600(cljs.core.chunk_rest(s__10601__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__10603),null);
}
} else {
var vec__10636 = cljs.core.first(s__10601__$2);
var row_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10636,(0),null);
var row = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10636,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"tr","tr",-1424774646),(function (){var iter__5480__auto__ = ((function (vec__10636,row_idx,row,s__10601__$2,temp__5804__auto__){
return (function cogito$response_renderer$iter__10600_$_iter__10640(s__10641){
return (new cljs.core.LazySeq(null,(function (){
var s__10641__$1 = s__10641;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__10641__$1);
if(temp__5804__auto____$1){
var s__10641__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__10641__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__10641__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__10643 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__10642 = (0);
while(true){
if((i__10642 < size__5479__auto__)){
var vec__10669 = cljs.core._nth(c__5478__auto__,i__10642);
var col_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10669,(0),null);
var cell = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10669,(1),null);
cljs.core.chunk_append(b__10643,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),cell], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),col_idx], null)));

var G__10907 = (i__10642 + (1));
i__10642 = G__10907;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__10643),cogito$response_renderer$iter__10600_$_iter__10640(cljs.core.chunk_rest(s__10641__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__10643),null);
}
} else {
var vec__10677 = cljs.core.first(s__10641__$2);
var col_idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10677,(0),null);
var cell = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10677,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"td","td",1479933353),cell], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),col_idx], null)),cogito$response_renderer$iter__10600_$_iter__10640(cljs.core.rest(s__10641__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(vec__10636,row_idx,row,s__10601__$2,temp__5804__auto__))
;
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,row));
})()], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),row_idx], null)),cogito$response_renderer$iter__10600(cljs.core.rest(s__10601__$2)));
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
return (function (p1__10696_SHARP_){
var G__10698 = p1__10696_SHARP_.target.innerText;
return (handler.cljs$core$IFn$_invoke$arity$1 ? handler.cljs$core$IFn$_invoke$arity$1(G__10698) : handler.call(null,G__10698));
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
return new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.response-set.border.border-gray-200.rounded-lg.p-4.space-y-4","div.response-set.border.border-gray-200.rounded-lg.p-4.space-y-4",1816694471),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.bg-gray-50.rounded-md.p-3","div.bg-gray-50.rounded-md.p-3",1739818296),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3.text-sm.font-semibold.text-gray-700.mb-1","h3.text-sm.font-semibold.text-gray-700.mb-1",284202284),["Response ",cljs.core.str.cljs$core$IFn$_invoke$arity$1((index + (1)))," of ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(total_count)].join('')], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-600","p.text-sm.text-gray-600",-1212846130),new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(alt)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.alternative-content.pl-4.border-l-4.border-blue-400","div.alternative-content.pl-4.border-l-4.border-blue-400",-1130376676),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.response_renderer.render_component,alt], null)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.navigation-controls.flex.items-center.justify-between.pt-3.border-t.border-gray-200","div.navigation-controls.flex.items-center.justify-between.pt-3.border-t.border-gray-200",2045221113),new cljs.core.PersistentVector(null, 5, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.nav-buttons.flex.gap-2","div.nav-buttons.flex.gap-2",406875114),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors","button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors",-427373004),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return set_index_BANG_((0));
})], null),"|<"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors","button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors",-427373004),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(0)),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return set_index_BANG_((index - (1)));
})], null),"<<"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors","button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors",-427373004),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(total_count - (1))),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return set_index_BANG_((index + (1)));
})], null),">>"], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors","button.nav-btn.px-3.py-1.bg-gray-100.hover:bg-gray-200.rounded.disabled:opacity-50.disabled:cursor-not-allowed.transition-colors",-427373004),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(index,(total_count - (1))),new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
return set_index_BANG_((total_count - (1)));
})], null),">|"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.gap-1","div.flex.gap-1",-128514922),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__10715(s__10716){
return (new cljs.core.LazySeq(null,(function (){
var s__10716__$1 = s__10716;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__10716__$1);
if(temp__5804__auto__){
var s__10716__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__10716__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__10716__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__10718 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__10717 = (0);
while(true){
if((i__10717 < size__5479__auto__)){
var i = cljs.core._nth(c__5478__auto__,i__10717);
cljs.core.chunk_append(b__10718,cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.w-2.h-2.rounded-full.transition-colors","button.w-2.h-2.rounded-full.transition-colors",-682174955),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(i,index))?"bg-blue-500":"bg-gray-300 hover:bg-gray-400"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__10717,i,c__5478__auto__,size__5479__auto__,b__10718,s__10716__$2,temp__5804__auto__,alt,total_count,index,alternatives,turn_id,current_index,set_index_BANG_,current_alt){
return (function (){
return set_index_BANG_(i);
});})(i__10717,i,c__5478__auto__,size__5479__auto__,b__10718,s__10716__$2,temp__5804__auto__,alt,total_count,index,alternatives,turn_id,current_index,set_index_BANG_,current_alt))
], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),i], null)));

var G__10917 = (i__10717 + (1));
i__10717 = G__10917;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__10718),cogito$response_renderer$iter__10715(cljs.core.chunk_rest(s__10716__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__10718),null);
}
} else {
var i = cljs.core.first(s__10716__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.w-2.h-2.rounded-full.transition-colors","button.w-2.h-2.rounded-full.transition-colors",-682174955),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(i,index))?"bg-blue-500":"bg-gray-300 hover:bg-gray-400"),new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i,s__10716__$2,temp__5804__auto__,alt,total_count,index,alternatives,turn_id,current_index,set_index_BANG_,current_alt){
return (function (){
return set_index_BANG_(i);
});})(i,s__10716__$2,temp__5804__auto__,alt,total_count,index,alternatives,turn_id,current_index,set_index_BANG_,current_alt))
], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),i], null)),cogito$response_renderer$iter__10715(cljs.core.rest(s__10716__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$1(total_count));
})()], null)], null)], null);
});
}));
cogito.response_renderer.render_component.cljs$core$IMultiFn$_add_method$arity$3(null,new cljs.core.Keyword(null,"default","default",-1987822328),(function (response){
var content = (function (){var or__5002__auto__ = new cljs.core.Keyword(null,"content","content",15833224).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
var or__5002__auto____$2 = new cljs.core.Keyword(null,"text","text",-1790561697).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(or__5002__auto____$2)){
return or__5002__auto____$2;
} else {
var or__5002__auto____$3 = new cljs.core.Keyword(null,"body","body",-2049205669).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(or__5002__auto____$3)){
return or__5002__auto____$3;
} else {
var or__5002__auto____$4 = new cljs.core.Keyword(null,"message","message",-406056002).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(or__5002__auto____$4)){
return or__5002__auto____$4;
} else {
var or__5002__auto____$5 = (function (){var temp__5804__auto__ = new cljs.core.Keyword(null,"items","items",1031954938).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(temp__5804__auto__)){
var items = temp__5804__auto__;
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",items);
} else {
return null;
}
})();
if(cljs.core.truth_(or__5002__auto____$5)){
return or__5002__auto____$5;
} else {
var temp__5804__auto__ = new cljs.core.Keyword(null,"data","data",-232669377).cljs$core$IFn$_invoke$arity$1(response);
if(cljs.core.truth_(temp__5804__auto__)){
var data = temp__5804__auto__;
if(cljs.core.sequential_QMARK_(data)){
return clojure.string.join.cljs$core$IFn$_invoke$arity$2("\n",cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.str,data));
} else {
return cljs.core.str.cljs$core$IFn$_invoke$arity$1(data);
}
} else {
return null;
}
}
}
}
}
}
}
})();
if(cljs.core.truth_(content)){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-response.space-y-3","div.text-response.space-y-3",1869632836),(function (){var iter__5480__auto__ = (function cogito$response_renderer$iter__10798(s__10799){
return (new cljs.core.LazySeq(null,(function (){
var s__10799__$1 = s__10799;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__10799__$1);
if(temp__5804__auto__){
var s__10799__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__10799__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__10799__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__10801 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__10800 = (0);
while(true){
if((i__10800 < size__5479__auto__)){
var vec__10814 = cljs.core._nth(c__5478__auto__,i__10800);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10814,(0),null);
var paragraph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10814,(1),null);
cljs.core.chunk_append(b__10801,((clojure.string.blank_QMARK_(paragraph))?null:cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-700.leading-relaxed","p.text-gray-700.leading-relaxed",-497622854),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),idx], null))));

var G__10921 = (i__10800 + (1));
i__10800 = G__10921;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__10801),cogito$response_renderer$iter__10798(cljs.core.chunk_rest(s__10799__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__10801),null);
}
} else {
var vec__10822 = cljs.core.first(s__10799__$2);
var idx = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10822,(0),null);
var paragraph = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__10822,(1),null);
return cljs.core.cons(((clojure.string.blank_QMARK_(paragraph))?null:cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-700.leading-relaxed","p.text-gray-700.leading-relaxed",-497622854),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),idx], null))),cogito$response_renderer$iter__10798(cljs.core.rest(s__10799__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,clojure.string.split_lines(cljs.core.str.cljs$core$IFn$_invoke$arity$1(content))));
})()], null);
} else {
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.unknown-response.text-gray-500.text-sm","div.unknown-response.text-gray-500.text-sm",1819817296),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.mb-2","p.mb-2",-1476899286),"Unknown response format:"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"pre.bg-gray-100.p-2.rounded.text-xs","pre.bg-gray-100.p-2.rounded.text-xs",-2005600923),cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([response], 0))], null)], null);
}
}));
cogito.response_renderer.render_response = (function cogito$response_renderer$render_response(response){
if(typeof response === 'string'){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-response","div.text-response",-1781417080),response], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [cogito.response_renderer.render_component,response], null);
}
});

//# sourceMappingURL=cogito.response_renderer.js.map
