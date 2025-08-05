goog.provide('cogito.daily_summary');
cogito.daily_summary.format_date = (function cogito$daily_summary$format_date(date_str){

if(cljs.core.truth_(date_str)){
try{return (new Date(date_str)).toLocaleDateString("en-US",({"weekday": "long", "year": "numeric", "month": "long", "day": "numeric"}));
}catch (e11396){if((e11396 instanceof Error)){
var _ = e11396;
return date_str;
} else {
throw e11396;

}
}} else {
return "Unknown Date";
}
});
cogito.daily_summary.generate_year_options = (function cogito$daily_summary$generate_year_options(){

var current_year = (new Date()).getFullYear();
var start_year = (2020);
var iter__5480__auto__ = (function cogito$daily_summary$generate_year_options_$_iter__11398(s__11399){
return (new cljs.core.LazySeq(null,(function (){
var s__11399__$1 = s__11399;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11399__$1);
if(temp__5804__auto__){
var s__11399__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11399__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11399__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11401 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11400 = (0);
while(true){
if((i__11400 < size__5479__auto__)){
var year = cljs.core._nth(c__5478__auto__,i__11400);
cljs.core.chunk_append(b__11401,year);

var G__11479 = (i__11400 + (1));
i__11400 = G__11479;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11401),cogito$daily_summary$generate_year_options_$_iter__11398(cljs.core.chunk_rest(s__11399__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11401),null);
}
} else {
var year = cljs.core.first(s__11399__$2);
return cljs.core.cons(year,cogito$daily_summary$generate_year_options_$_iter__11398(cljs.core.rest(s__11399__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$2(start_year,((current_year + (1)) + (1))));
});
cogito.daily_summary.month_names = (function cogito$daily_summary$month_names(){
return new cljs.core.PersistentVector(null, 12, 5, cljs.core.PersistentVector.EMPTY_NODE, ["January","February","March","April","May","June","July","August","September","October","November","December"], null);
});
cogito.daily_summary.get_month_year_options = (function cogito$daily_summary$get_month_year_options(){

var today = (new Date());
var current_year = today.getFullYear();
var current_month = today.getMonth();
var iter__5480__auto__ = (function cogito$daily_summary$get_month_year_options_$_iter__11407(s__11408){
return (new cljs.core.LazySeq(null,(function (){
var s__11408__$1 = s__11408;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11408__$1);
if(temp__5804__auto__){
var s__11408__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11408__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11408__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11410 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11409 = (0);
while(true){
if((i__11409 < size__5479__auto__)){
var i = cljs.core._nth(c__5478__auto__,i__11409);
cljs.core.chunk_append(b__11410,(function (){var target_date = (new Date(current_year,(current_month - i),(1)));
var year = target_date.getFullYear();
var month = target_date.getMonth();
var month_name = target_date.toLocaleDateString("en-US",({"month": "long"}));
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(year),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(month)].join(''),new cljs.core.Keyword(null,"label","label",1718410804),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(month_name)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(year)].join(''),new cljs.core.Keyword(null,"year","year",335913393),year,new cljs.core.Keyword(null,"month","month",-1960248533),month], null);
})());

var G__11483 = (i__11409 + (1));
i__11409 = G__11483;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11410),cogito$daily_summary$get_month_year_options_$_iter__11407(cljs.core.chunk_rest(s__11408__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11410),null);
}
} else {
var i = cljs.core.first(s__11408__$2);
return cljs.core.cons((function (){var target_date = (new Date(current_year,(current_month - i),(1)));
var year = target_date.getFullYear();
var month = target_date.getMonth();
var month_name = target_date.toLocaleDateString("en-US",({"month": "long"}));
return new cljs.core.PersistentArrayMap(null, 4, [new cljs.core.Keyword(null,"value","value",305978217),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(year),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1(month)].join(''),new cljs.core.Keyword(null,"label","label",1718410804),[cljs.core.str.cljs$core$IFn$_invoke$arity$1(month_name)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(year)].join(''),new cljs.core.Keyword(null,"year","year",335913393),year,new cljs.core.Keyword(null,"month","month",-1960248533),month], null);
})(),cogito$daily_summary$get_month_year_options_$_iter__11407(cljs.core.rest(s__11408__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.range.cljs$core$IFn$_invoke$arity$1((12)));
});
cogito.daily_summary.daily_summary_tab = (function cogito$daily_summary$daily_summary_tab(){
var monthly_summaries = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","monthly-summaries","daily-summary/monthly-summaries",869659036)], null));
var monthly_generating_QMARK_ = re_frame.core.subscribe.cljs$core$IFn$_invoke$arity$1(new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","monthly-summaries-generating?","daily-summary/monthly-summaries-generating?",-1333528782)], null));
var selected_period = reagent.core.atom.cljs$core$IFn$_invoke$arity$1([cljs.core.str.cljs$core$IFn$_invoke$arity$1((new Date()).getFullYear()),"-",cljs.core.str.cljs$core$IFn$_invoke$arity$1((new Date()).getMonth())].join(''));
return (function (){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.daily-summary-tab.h-full.flex.flex-col","div.daily-summary-tab.h-full.flex.flex-col",-2036551803),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.header.border-b.pb-4.mb-4","div.header.border-b.pb-4.mb-4",-556773263),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-between.items-center","div.flex.justify-between.items-center",-1855308582),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h2.text-xl.font-semibold.text-gray-900","h2.text-xl.font-semibold.text-gray-900",713028381),"Daily Summary"], null),new cljs.core.PersistentVector(null, 4, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.items-center.space-x-4","div.flex.items-center.space-x-4",1559862292),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"select.text-sm.bg-white.border.border-gray-300.rounded.px-3.py-2.focus:outline-none.focus:ring-2.focus:ring-blue-500","select.text-sm.bg-white.border.border-gray-300.rounded.px-3.py-2.focus:outline-none.focus:ring-2.focus:ring-blue-500",-1422361691),new cljs.core.PersistentArrayMap(null, 3, [new cljs.core.Keyword(null,"value","value",305978217),cljs.core.deref(selected_period),new cljs.core.Keyword(null,"on-change","on-change",-732046149),(function (p1__11414_SHARP_){
return cljs.core.reset_BANG_(selected_period,p1__11414_SHARP_.target.value);
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(monthly_generating_QMARK_)], null),(function (){var iter__5480__auto__ = (function cogito$daily_summary$daily_summary_tab_$_iter__11415(s__11416){
return (new cljs.core.LazySeq(null,(function (){
var s__11416__$1 = s__11416;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11416__$1);
if(temp__5804__auto__){
var s__11416__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11416__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11416__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11418 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11417 = (0);
while(true){
if((i__11417 < size__5479__auto__)){
var option = cljs.core._nth(c__5478__auto__,i__11417);
cljs.core.chunk_append(b__11418,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(option)], null),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(option)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(option)], null)));

var G__11492 = (i__11417 + (1));
i__11417 = G__11492;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11418),cogito$daily_summary$daily_summary_tab_$_iter__11415(cljs.core.chunk_rest(s__11416__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11418),null);
}
} else {
var option = cljs.core.first(s__11416__$2);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"option","option",65132272),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"value","value",305978217),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(option)], null),new cljs.core.Keyword(null,"label","label",1718410804).cljs$core$IFn$_invoke$arity$1(option)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),new cljs.core.Keyword(null,"value","value",305978217).cljs$core$IFn$_invoke$arity$1(option)], null)),cogito$daily_summary$daily_summary_tab_$_iter__11415(cljs.core.rest(s__11416__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cogito.daily_summary.get_month_year_options());
})()], null),new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"button.px-4.py-2.text-sm.bg-blue-500.text-white.rounded.hover:bg-blue-600.disabled:opacity-50","button.px-4.py-2.text-sm.bg-blue-500.text-white.rounded.hover:bg-blue-600.disabled:opacity-50",-1487488273),new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"on-click","on-click",1632826543),(function (){
var vec__11425 = clojure.string.split.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(selected_period),/-/);
var year = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11425,(0),null);
var month = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11425,(1),null);
return re_frame.core.dispatch(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword("daily-summary","generate-monthly-summaries","daily-summary/generate-monthly-summaries",-458749591),parseInt(year),parseInt(month)], null));
}),new cljs.core.Keyword(null,"disabled","disabled",-1529784218),cljs.core.deref(monthly_generating_QMARK_)], null),(cljs.core.truth_(cljs.core.deref(monthly_generating_QMARK_))?"Generating...":"Generate")], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-xs.text-blue-500.font-mono","p.text-xs.text-blue-500.font-mono",-1626879105),"v2.3.0"], null)], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-600","p.text-sm.text-gray-600",-1212846130),"AI summaries for selected month's conversations"], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex-1.overflow-y-auto.p-4","div.flex-1.overflow-y-auto.p-4",-1791789067),(cljs.core.truth_(cljs.core.deref(monthly_generating_QMARK_))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.flex.justify-center.items-center.py-12","div.flex.justify-center.items-center.py-12",695335457),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.animate-spin.rounded-full.h-8.w-8.border-b-2.border-blue-600.mr-3","div.animate-spin.rounded-full.h-8.w-8.border-b-2.border-blue-600.mr-3",366882456)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span.text-gray-600","span.text-gray-600",-825179194),"Generating monthly summaries..."], null)], null):(cljs.core.truth_((function (){var and__5000__auto__ = cljs.core.deref(monthly_summaries);
if(cljs.core.truth_(and__5000__auto__)){
return cljs.core.seq(cljs.core.deref(monthly_summaries));
} else {
return and__5000__auto__;
}
})())?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.space-y-6","div.space-y-6",-1218954066),(function (){var iter__5480__auto__ = (function cogito$daily_summary$daily_summary_tab_$_iter__11428(s__11429){
return (new cljs.core.LazySeq(null,(function (){
var s__11429__$1 = s__11429;
while(true){
var temp__5804__auto__ = cljs.core.seq(s__11429__$1);
if(temp__5804__auto__){
var s__11429__$2 = temp__5804__auto__;
if(cljs.core.chunked_seq_QMARK_(s__11429__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11429__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11431 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11430 = (0);
while(true){
if((i__11430 < size__5479__auto__)){
var vec__11436 = cljs.core._nth(c__5478__auto__,i__11430);
var date = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11436,(0),null);
var summary_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11436,(1),null);
cljs.core.chunk_append(b__11431,cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm","div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm",-285235472),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4.text-xl.font-semibold.text-gray-800","h4.text-xl.font-semibold.text-gray-800",-305600821),(function (){try{var clean_date = ((clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(date),":"))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(date),(1)):cljs.core.str.cljs$core$IFn$_invoke$arity$1(date));
var date_obj = (new Date([clean_date,"T00:00:00.000Z"].join('')));
return date_obj.toLocaleDateString("en-US",({"weekday": "long", "month": "long", "day": "numeric", "year": "numeric"}));
}catch (e11439){if((e11439 instanceof Error)){
var _ = e11439;
return ["Date: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(date)].join('');
} else {
throw e11439;

}
}})()], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.leading-relaxed.space-y-3","div.text-gray-700.leading-relaxed.space-y-3",1069243840),(function (){var summary_text = new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(summary_data);
var paragraphs = clojure.string.split.cljs$core$IFn$_invoke$arity$2(summary_text,/\n\n/);
var iter__5480__auto__ = ((function (i__11430,summary_text,paragraphs,vec__11436,date,summary_data,c__5478__auto__,size__5479__auto__,b__11431,s__11429__$2,temp__5804__auto__,monthly_summaries,monthly_generating_QMARK_,selected_period){
return (function cogito$daily_summary$daily_summary_tab_$_iter__11428_$_iter__11440(s__11441){
return (new cljs.core.LazySeq(null,((function (i__11430,summary_text,paragraphs,vec__11436,date,summary_data,c__5478__auto__,size__5479__auto__,b__11431,s__11429__$2,temp__5804__auto__,monthly_summaries,monthly_generating_QMARK_,selected_period){
return (function (){
var s__11441__$1 = s__11441;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__11441__$1);
if(temp__5804__auto____$1){
var s__11441__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__11441__$2)){
var c__5478__auto____$1 = cljs.core.chunk_first(s__11441__$2);
var size__5479__auto____$1 = cljs.core.count(c__5478__auto____$1);
var b__11443 = cljs.core.chunk_buffer(size__5479__auto____$1);
if((function (){var i__11442 = (0);
while(true){
if((i__11442 < size__5479__auto____$1)){
var paragraph = cljs.core._nth(c__5478__auto____$1,i__11442);
cljs.core.chunk_append(b__11443,(((!(cljs.core.empty_QMARK_(paragraph))))?cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),paragraph], null)):null));

var G__11496 = (i__11442 + (1));
i__11442 = G__11496;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11443),cogito$daily_summary$daily_summary_tab_$_iter__11428_$_iter__11440(cljs.core.chunk_rest(s__11441__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11443),null);
}
} else {
var paragraph = cljs.core.first(s__11441__$2);
return cljs.core.cons((((!(cljs.core.empty_QMARK_(paragraph))))?cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),paragraph], null)):null),cogito$daily_summary$daily_summary_tab_$_iter__11428_$_iter__11440(cljs.core.rest(s__11441__$2)));
}
} else {
return null;
}
break;
}
});})(i__11430,summary_text,paragraphs,vec__11436,date,summary_data,c__5478__auto__,size__5479__auto__,b__11431,s__11429__$2,temp__5804__auto__,monthly_summaries,monthly_generating_QMARK_,selected_period))
,null,null));
});})(i__11430,summary_text,paragraphs,vec__11436,date,summary_data,c__5478__auto__,size__5479__auto__,b__11431,s__11429__$2,temp__5804__auto__,monthly_summaries,monthly_generating_QMARK_,selected_period))
;
return iter__5480__auto__(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,paragraphs));
})()], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),date], null)));

var G__11497 = (i__11430 + (1));
i__11430 = G__11497;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11431),cogito$daily_summary$daily_summary_tab_$_iter__11428(cljs.core.chunk_rest(s__11429__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11431),null);
}
} else {
var vec__11455 = cljs.core.first(s__11429__$2);
var date = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11455,(0),null);
var summary_data = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__11455,(1),null);
return cljs.core.cons(cljs.core.with_meta(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm","div.border.border-gray-200.rounded-lg.p-6.bg-white.shadow-sm",-285235472),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.mb-4","div.mb-4",-1002350692),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"h4.text-xl.font-semibold.text-gray-800","h4.text-xl.font-semibold.text-gray-800",-305600821),(function (){try{var clean_date = ((clojure.string.starts_with_QMARK_(cljs.core.str.cljs$core$IFn$_invoke$arity$1(date),":"))?cljs.core.subs.cljs$core$IFn$_invoke$arity$2(cljs.core.str.cljs$core$IFn$_invoke$arity$1(date),(1)):cljs.core.str.cljs$core$IFn$_invoke$arity$1(date));
var date_obj = (new Date([clean_date,"T00:00:00.000Z"].join('')));
return date_obj.toLocaleDateString("en-US",({"weekday": "long", "month": "long", "day": "numeric", "year": "numeric"}));
}catch (e11459){if((e11459 instanceof Error)){
var _ = e11459;
return ["Date: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(date)].join('');
} else {
throw e11459;

}
}})()], null)], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-gray-700.leading-relaxed.space-y-3","div.text-gray-700.leading-relaxed.space-y-3",1069243840),(function (){var summary_text = new cljs.core.Keyword(null,"summary","summary",380847952).cljs$core$IFn$_invoke$arity$1(summary_data);
var paragraphs = clojure.string.split.cljs$core$IFn$_invoke$arity$2(summary_text,/\n\n/);
var iter__5480__auto__ = ((function (summary_text,paragraphs,vec__11455,date,summary_data,s__11429__$2,temp__5804__auto__,monthly_summaries,monthly_generating_QMARK_,selected_period){
return (function cogito$daily_summary$daily_summary_tab_$_iter__11428_$_iter__11460(s__11461){
return (new cljs.core.LazySeq(null,(function (){
var s__11461__$1 = s__11461;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__11461__$1);
if(temp__5804__auto____$1){
var s__11461__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__11461__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__11461__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__11463 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__11462 = (0);
while(true){
if((i__11462 < size__5479__auto__)){
var paragraph = cljs.core._nth(c__5478__auto__,i__11462);
cljs.core.chunk_append(b__11463,(((!(cljs.core.empty_QMARK_(paragraph))))?cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),paragraph], null)):null));

var G__11498 = (i__11462 + (1));
i__11462 = G__11498;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__11463),cogito$daily_summary$daily_summary_tab_$_iter__11428_$_iter__11460(cljs.core.chunk_rest(s__11461__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__11463),null);
}
} else {
var paragraph = cljs.core.first(s__11461__$2);
return cljs.core.cons((((!(cljs.core.empty_QMARK_(paragraph))))?cljs.core.with_meta(new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p","p",151049309),paragraph], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),paragraph], null)):null),cogito$daily_summary$daily_summary_tab_$_iter__11428_$_iter__11460(cljs.core.rest(s__11461__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});})(summary_text,paragraphs,vec__11455,date,summary_data,s__11429__$2,temp__5804__auto__,monthly_summaries,monthly_generating_QMARK_,selected_period))
;
return iter__5480__auto__(cljs.core.map.cljs$core$IFn$_invoke$arity$2(clojure.string.trim,paragraphs));
})()], null)], null),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),date], null)),cogito$daily_summary$daily_summary_tab_$_iter__11428(cljs.core.rest(s__11429__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.sort.cljs$core$IFn$_invoke$arity$1(cljs.core.deref(monthly_summaries)));
})()], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.text-center.py-12","div.text-center.py-12",875911986),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-gray-500.mb-4","p.text-gray-500.mb-4",525276662),"No summaries generated yet"], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"p.text-sm.text-gray-400","p.text-sm.text-gray-400",542560567),"Click 'Generate This Month' to create AI summaries of this month's conversations"], null)], null)
))], null)], null);
});
});

//# sourceMappingURL=cogito.daily_summary.js.map
