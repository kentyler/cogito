goog.provide('cogito.file_list');
cogito.file_list.file_list = (function cogito$file_list$file_list(){
var files = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","files","upload-files/files",-568912197)], null));
var selected = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","selected-file","upload-files/selected-file",-1904254045)], null));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.overflow-y-auto","div.flex-1.overflow-y-auto",-417546528),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h3","h3",2067611163),"Uploaded Files"], null),((cljs.core.seq(cljs.core.deref(files)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),(function (){var iter__5480__auto__ = (function cogito$file_list$file_list_$_iter__11466(s__11467){
return (new cljs.core.LazySeq(null,(function (){
var s__11467__$1 = s__11467;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11467__$1);
if(temp__5804__auto__){
var s__11467__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11467__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11467__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11469 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11468 = (0);
while(true){
if((i__11468 < size__5479__auto__)){
var file = cljs.core._nth(c__5478__auto__,i__11468);
cljs.core.chunk_append(b__11469,cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),["flex items-center justify-between p-2 rounded hover:bg-gray-100 ",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected))))?"bg-blue-50 border border-blue-200":"")].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-left text-blue-600 hover:text-blue-800 underline flex-1",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__11468,file,c__5478__auto__,size__5479__auto__,b__11469,s__11467__$2,temp__5804__auto__,files,selected){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","select-file","upload-files/select-file",1340191829),file], null));
});})(i__11468,file,c__5478__auto__,size__5479__auto__,b__11469,s__11467__$2,temp__5804__auto__,files,selected))
], null),new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(file)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"ml-2 text-red-500 hover:text-red-700 px-2 py-1",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (i__11468,file,c__5478__auto__,size__5479__auto__,b__11469,s__11467__$2,temp__5804__auto__,files,selected){
return (function (p1__11458_SHARP_){
p1__11458_SHARP_.stopPropagation();

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","delete-file","upload-files/delete-file",-835407326),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(file)], null));
});})(i__11468,file,c__5478__auto__,size__5479__auto__,b__11469,s__11467__$2,temp__5804__auto__,files,selected))
], null),"\u00D7"], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(file)], null)));

var G__11478 = (i__11468 + (1));
i__11468 = G__11478;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11469),cogito$file_list$file_list_$_iter__11466(cljs.core.chunk_rest(s__11467__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11469),null);
}
} else {
var file = cljs.core.first(s__11467__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"class","class",-2030961996),["flex items-center justify-between p-2 rounded hover:bg-gray-100 ",((cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(file),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(cljs.core.deref(selected))))?"bg-blue-50 border border-blue-200":"")].join('')], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"text-left text-blue-600 hover:text-blue-800 underline flex-1",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (file,s__11467__$2,temp__5804__auto__,files,selected){
return (function (){
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","select-file","upload-files/select-file",1340191829),file], null));
});})(file,s__11467__$2,temp__5804__auto__,files,selected))
], null),new cljs.core.Keyword(null,"filename","filename",-1428840783).cljs$core$IFn$_invoke$arity$1(file)], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button","button",1456579943),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"class","class",-2030961996),"ml-2 text-red-500 hover:text-red-700 px-2 py-1",new cljs.core.Keyword(null,"on-click","on-click",1632826543),((function (file,s__11467__$2,temp__5804__auto__,files,selected){
return (function (p1__11458_SHARP_){
p1__11458_SHARP_.stopPropagation();

return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("upload-files","delete-file","upload-files/delete-file",-835407326),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(file)], null));
});})(file,s__11467__$2,temp__5804__auto__,files,selected))
], null),"\u00D7"], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"id","id",-1388402092).cljs$core$IFn$_invoke$arity$1(file)], null)),cogito$file_list$file_list_$_iter__11466(cljs.core.rest(s__11467__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.deref(files));
})()], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),"No files uploaded yet"], null))], null);
});
});

//# sourceMappingURL=cogito.file_list.js.map
