(async()=>{
const D=await (await fetch('assets/data.json')).json();
const {PAC,COM,VOTES,VOTES2,M,IND,INDN,AU,TR,XH,XTAG,XP,METH}=D;
const VH=VOTES.filter(v=>v[0]==="H"),VS=VOTES.filter(v=>v[0]==="S");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const A=(u,t)=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`;
const lk=u=>u.startsWith("h:")?"https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/"+u.slice(2):"https://efdsearch.senate.gov/search/view/ptr/"+u.slice(2)+"/";
const amt=a=>a.replace("-?","+"),xdec=s=>s.replace(/&amp;/g,"&");
const money=n=>"$"+n.toLocaleString("en-US");
const COLN={g:"Green",y:"Yellow",r:"Red",x:"Gray"},CV={g:"var(--g)",y:"var(--y)",r:"var(--r)",x:"var(--x)"};
const distLabel=r=>r[4]===-1?r[3]+" (Senate)":r[4]===0?r[3]+"-AL/Del":r[3]+"-"+r[4];
const comms=r=>r[6]?r[6].split(",").filter(x=>x):[];
const cname=c=>(COM[c.replace("*","")]||c)+(c.endsWith("*")?" (chair/ranking)":"");
function score(r){const sen=r[4]===-1,vs=sen?VS:VH,sc={};let cast=0;
 for(const k of IND){let a=0,n=0;vs.forEach((v,i)=>{if(v[1]!==k)return;const c=r[7].charAt(i);if(c==="Y"||c==="N"){n++;if(c===v[2])a++;}});cast+=n;sc[k]=n?Math.round(100*a/n)/10:null;}
 const got=IND.map(k=>sc[k]).filter(x=>x!==null&&x!==undefined);const comp=got.length?Math.round(10*got.reduce((p,q)=>p+q,0)/got.length)/10:null;
 const au=AU[r[0]];return{r,sen,sc:au?au.sc:sc,comp:au?au.w:comp,cast,tot:vs.length,col:au?au.col:r[8],osc:sc,oc:comp,ocol:r[8],pl:au?au.pl:0,brk:au?au.brk:0,ns:au?au.ns:""};}
const SM=M.map(score);
const fo=r=>{const o=[];for(let i=0;i+2<r[14].length;i+=3)o.push({p:PAC[r[14][i]]||"?",k:["direct","IE for","IE against"][r[14][i+1]]||"?",d:r[14][i+2]});return o;};
const top=r=>{const o=[];for(let i=0;i+1<r[13].length;i+=2)o.push({p:PAC[r[13][i]]||"?",d:r[13][i+1]});return o;};
const foDirect=r=>fo(r).filter(x=>x.k==="direct").reduce((p,q)=>p+q.d,0);
const uniT=s=>s.sen?8:10,pct=(d,t)=>t>0?(100*d/t).toFixed(1)+"%":"n/a";
const cnt=c=>SM.filter(s=>s.col===c).length,ocnt=c=>SM.filter(s=>s.ocol===c).length;
function csv(rows){const h=["bioguide","name","party","state","district","chamber","color","composite",...IND,"votes_cast","votes_total","uniparty_votes","receipts","pac_pct","top_donors","country_pac_entries","ptr_count","ptr_filings","ptr_transactions","x_handle"];
 const q=x=>'"'+String(x).replace(/"/g,'""')+'"';
 const L=rows.map(s=>{const r=s.r,t=TR[r[0]];return[r[0],r[1],r[2],r[3],r[4],s.sen?"Senate":"House",COLN[s.col],s.comp===null?"":s.comp,...IND.map(k=>s.sc[k]==null?"":s.sc[k]),s.cast,s.tot,r[10],r[11]?r[11]:"missing",r[12]<0?"":r[12],top(r).map(t=>t.p+" "+t.d).join("; "),fo(r).map(t=>t.p+" "+t.k+" "+t.d).join("; "),r[15]===null?"":r[15],t?t[0]:"",t?t[2]:"",XH[r[0]]||""].map(q).join(",");});
 const b=new Blob([[h.join(","),...L].join("\n")],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="congress119_scorecard.csv";a.click();}
// header
document.getElementById("summary").textContent="All "+M.length+" sitting members incl. non-voting delegates as of Nov 2, 2026. Scores computed only from recorded roll-call votes; money only from FEC filings. Gaps shown, never filled.";
document.getElementById("key").innerHTML=[["g","weighted ≥ 7.0, uniparty below flag, no indicator < 3 (was "+ocnt("g")+")"],["y","weighted 4.0–6.9, or ≥7 failing a Green test (was "+ocnt("y")+")"],["r","weighted < 4.0 (was "+ocnt("r")+")"],["x","insufficient data / delegate"]].map(([c,d])=>`<div class="m" style="--c:${CV[c]}"><b>${cnt(c)}</b>${COLN[c]}<br><span>${d}</span></div>`).join("");
document.getElementById("indnote").textContent="Indicators: B Border · I Immigration · A Foreign-aid restraint · W War powers (support congressional authorization) · E Energy (domestic production) · T Trade (tariff/sovereignty) · C Citizen priority (surveillance limits, insider-trading ban) · F Fiscal / consensus-spending restraint. Score per indicator = 10 × aligned votes ÷ Yea/Nay votes cast (independence-weighted; see Methodology).";
const th=document.getElementById("theme");th.onclick=()=>{const n=document.documentElement.dataset.theme==="light"?"dark":"light";document.documentElement.dataset.theme=n;localStorage.theme=n;};
const TABS=[["members","Members"],["clusters","Clusters"],["votes","Votes"],["audit","Green audit"],["stocks","Stock trades"],["x","X posts"],["method","Methodology"]];
let view=(location.hash.slice(1)||"members");const st={ch:"all",pa:"all",st:"all",co:"all",cm:"all",iss:"none",q:"",sort:"name",n:48};const open={};
const tabs=document.getElementById("tabs");
function drawTabs(){tabs.innerHTML=TABS.map(([v,l])=>`<button data-v="${v}" class="${v===view?"on":""}">${l}</button>`).join("");tabs.querySelectorAll("button").forEach(b=>b.onclick=()=>{view=b.dataset.v;location.hash=view;render();});}
const V=document.getElementById("view");
const table=(cols,rows)=>`<div class="tw"><table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const tb=(l,f)=>table(["Member","Party","State","Value"],l.map(s=>[esc(s.r[1]),s.r[2],distLabel(s.r),f(s)]));
const byD=(f,k,m=15)=>SM.filter(f).sort((a,b)=>k(b)-k(a)).slice(0,m);
const ieSum=s=>fo(s.r).filter(f=>f.k!=="direct").reduce((p,f)=>p+f.d,0);
const vlabel=c=>c==="Y"?"Yea":c==="N"?"Nay":c==="-"?"Not voting":c==="P"?"Present":"Not in office";
function card(s){const r=s.r,cc=CV[s.col],ff=fo(r),fd=foDirect(r),vs=s.sen?VS:VH,t=TR[r[0]];
 const chip=k=>{const v=s.sc[k];const c=v==null?"var(--x)":v>=7?"var(--g)":v>=4?"var(--y)":"var(--r)";return `<span class="chip" style="--c:${c}" title="${INDN[k]}">${k} ${v==null?"–":v}</span>`;};
 let h=`<div class="card" style="--c:${cc}"><div class="h"><b>${esc(r[1])}</b><span class="col">${COLN[s.col]}${s.comp!==null&&s.col!=="x"?" "+s.comp:""}</span></div>
 <div class="muted small">Previous equal-weight: ${COLN[s.ocol]}${s.oc!==null?" "+s.oc:""} · party-line share of aligned votes ${s.pl}% · breaks from own-party majority ${s.brk}</div>
 <div>${r[2]} · ${distLabel(r)} · since 20${r[5]} · ${A("https://bioguide.congress.gov/search/bio/"+r[0],"bio")}</div>${r[9]?`<div class="muted">${esc(r[9])}</div>`:""}
 <div style="margin:6px 0">${IND.map(chip).join("")}</div>
 <div class="muted">Votes cast ${s.cast}/${s.tot}${comms(r).length?" · "+esc(comms(r).map(cname).join(", ")):" · committees: none listed"}</div>
 <div>Receipts: ${r[11]?money(r[11]):"FEC data missing (gap)"}${r[12]>=0?" · PAC share "+r[12]+"%":""}${fd?" · country-focused PAC direct "+money(fd)+" ("+pct(fd,r[11])+")":""}</div>
 <div>${r[10]>=uniT(s)?`<span class="warn">⚑ Uniparty flag: ${r[10]} scored Yea votes cast alongside majorities of both parties</span>`:`<span class="muted">Uniparty count ${r[10]} (flag ≥${uniT(s)})</span>`}${t?" · STOCK Act PTR filings: "+t[0]:""}${XH[r[0]]?" · "+A("https://x.com/"+XH[r[0]],"@"+XH[r[0]]):""}</div>
 <button class="btn small" style="margin-top:6px" data-id="${r[0]}">${open[r[0]]?"Hide details":"Details"}</button>`;
 if(open[r[0]]){h+=`<div class="det"><h4>Top PAC donors (2025–26 cycle)</h4>${top(r).length?top(r).map(d=>`<div>${esc(d.p)}: ${money(d.d)} (${pct(d.d,r[11])} of receipts)</div>`).join(""):`<div class="muted">No data (gap)</div>`}
 <h4>Country-focused PAC money <span class="muted small">(sourced $ only; no inference of loyalty)</span></h4>${ff.length?ff.map(d=>`<div>${esc(d.p)} — ${d.k}: ${money(d.d)}</div>`).join(""):`<div class="muted">None recorded</div>`}
 <h4>Scored votes</h4>${vs.map((v,i)=>{const c=r[7].charAt(i);return `<div>${A(v[5],v[3])} (${v[4]}, ${v[1]}): <b>${vlabel(c)}</b>${c==="Y"||c==="N"?(c===v[2]?" ✓ aligned":" ✗"):""}</div>`;}).join("")}
 <h4>Added cross-party votes (both party majorities voted Yea)</h4>${VOTES2.filter(v=>v[0]===(s.sen?"S":"H")).map((v,i)=>{const c=s.ns.charAt(i);return `<div>${A(v[5],v[3])} (${v[4]}, F): <b>${vlabel(c)}</b>${c==="Y"||c==="N"?(c===v[2]?" ✓ aligned":" ✗"):""}</div>`;}).join("")}
 <h4>Stock trades (STOCK Act periodic transaction reports)</h4>`;
 if(t){h+=`<div>${t[0]} filings (${t[1]} machine-readable), ${t[2]} transactions disclosed · ${t[5]} transactions in sectors that overlap the member's committee jurisdiction</div>${t[1]<t[0]?`<div class="muted">${t[0]-t[1]} filing(s) are scanned/handwritten and were not parsed (gap).</div>`:""}${t[3].map(x=>`<div>${x[0]} · ${esc(x[1])} · ${esc(x[2])} · ${esc(amt(x[3]))} · ${A(lk(x[4]),"filing")}</div>`).join("")}${t[4].length?`<div class="muted">Committee-sector overlap (factual overlap only; no wrongdoing implied):</div>`:""}${t[4].map(x=>`<div>${x[0]} · ${esc(x[1])} · ${esc(x[2])} · ${esc(amt(x[3]))} · sector: ${esc(x[5])} · ${A(lk(x[4]),"filing")}</div>`).join("")}`;}
 else h+=`<div class="muted">${s.sen?"No calendar-2025 Senate PTR found; 2026 Senate PTRs not collected (gap).":"No PTRs matched in the 2025–26 House Clerk index."}</div>`;
 h+=`<h4>On X</h4>${XH[r[0]]?`<div>${A("https://x.com/"+XH[r[0]],"@"+XH[r[0]])} (official account, verified with the X user lookup; campaign handle not collected)</div>`:`<div class="muted">No verified official X handle found (gap).</div>`}`;
 const p=XP[r[0]];if(p)h+=`<div class="muted">${p[4]} keyword-matched post(s), Oct 3 – Nov 2, 2026. Most recent:</div><div>“${esc(xdec(p[3]))}…” — ${p[1]}${p[2]?" · tags: "+p[2].split("").map(c=>XTAG[c]??c).join(", "):""} · ${A("https://x.com/"+XH[r[0]]+"/status/"+p[0],"post")}</div><div class="muted">Says vs votes: no post explicitly contradicts a scored vote.</div>`;
 else if(XH[r[0]])h+=`<div class="muted">No keyword-matched posts in the 30-day window.</div>`;
 h+=`<div class="muted">${A("https://www.fec.gov/data/candidates/?q="+encodeURIComponent(r[1]),"FEC")}</div></div>`;}
 return h+"</div>";}
function rows(){let x=SM.filter(s=>(st.ch==="all"||(st.ch==="S")===s.sen)&&(st.pa==="all"||s.r[2]===st.pa)&&(st.st==="all"||s.r[3]===st.st)&&(st.co==="all"||s.col===st.co)&&(st.cm==="all"||comms(s.r).some(c=>c.replace("*","")===st.cm))&&(!st.q||s.r[1].toLowerCase().includes(st.q.toLowerCase())));
 const key=s=>st.sort==="comp"?(s.comp??-1):st.sort==="uni"?s.r[10]:st.sort==="fo"?foDirect(s.r):st.sort==="rec"?s.r[11]:st.sort==="ptr"?(TR[s.r[0]]?TR[s.r[0]][2]:-1):st.iss!=="none"?(s.sc[st.iss]??-1):0;
 x=[...x].sort((a,b)=>st.sort==="name"&&st.iss==="none"?a.r[1].localeCompare(b.r[1]):st.sort==="state"?(a.r[3]+String(a.r[4]).padStart(2,"0")).localeCompare(b.r[3]+String(b.r[4]).padStart(2,"0")):key(b)-key(a));
 if(st.iss!=="none")x=x.filter(s=>s.sc[st.iss]!==null);return x;}
const states=[...new Set(M.map(r=>r[3]))].sort();
const coms=[...new Set(M.flatMap(r=>comms(r).map(c=>c.replace("*",""))))].sort((a,b)=>(COM[a]||a).localeCompare(COM[b]||b));
const sel=(id,label,opts)=>`<label>${label}<select id="f_${id}">${opts.map(([v,l])=>`<option value="${esc(v)}"${st[id]===v?" selected":""}>${esc(l)}</option>`).join("")}</select></label>`;
function members(){V.innerHTML=`<div class="filters">${sel("ch","Chamber",[["all","All"],["H","House"],["S","Senate"]])}${sel("pa","Party",[["all","All"],["R","Republican"],["D","Democrat"],["I","Independent"]])}${sel("st","State",[["all","All"],...states.map(s=>[s,s])])}${sel("co","Color",[["all","All"],["g","Green"],["y","Yellow"],["r","Red"],["x","Gray"]])}${sel("cm","Committee",[["all","All"],...coms.map(c=>[c,COM[c]||c])])}${sel("iss","Issue (rank by)",[["none","None"],...IND.map(k=>[k,INDN[k]])])}${sel("sort","Sort",[["name","Name"],["state","State/district"],["comp","Composite score"],["uni","Uniparty count"],["fo","Country-PAC direct $"],["rec","Total receipts"],["ptr","PTR transactions"]])}<label>Search name<input id="f_q" value="${esc(st.q)}" placeholder="e.g. Massie" type="search"></label></div><div class="row"><b id="cnt"></b><button class="btn" id="csv">⬇ Export CSV of current filter</button></div><div class="grid" id="grid"></div><div id="more"></div>`;
 ["ch","pa","st","co","cm","iss","sort"].forEach(k=>document.getElementById("f_"+k).onchange=e=>{st[k]=e.target.value;st.n=48;drawCards();});
 document.getElementById("f_q").oninput=e=>{st.q=e.target.value;st.n=48;drawCards();};drawCards();}
function drawCards(){const R=rows();document.getElementById("cnt").textContent="Members ("+R.length+")";document.getElementById("csv").onclick=()=>csv(R);
 const g=document.getElementById("grid");g.innerHTML=R.slice(0,st.n).map(card).join("");
 g.querySelectorAll("button[data-id]").forEach(b=>b.onclick=()=>{open[b.dataset.id]=!open[b.dataset.id];const y=scrollY;drawCards();scrollTo(0,y);});
 const m=document.getElementById("more");m.innerHTML=st.n<R.length?`<button class="btn more">Show more (${R.length-st.n} left)</button>`:"";if(m.firstChild)m.firstChild.onclick=()=>{st.n+=48;drawCards();};}
const sec=(h,cap,body)=>`<h2>${h}</h2>${cap?`<p class="muted small">${cap}</p>`:""}${body}`;
function clusters(){V.innerHTML=sec("Largest direct contributions from country-focused U.S. PACs","Sum of the direct entries recorded per member; these are U.S.-registered committees (not FARA-checked). No loyalty claim implied.",tb(byD(s=>foDirect(s.r)>0,s=>foDirect(s.r)),s=>money(foDirect(s.r))+" ("+pct(foDirect(s.r),s.r[11])+" of receipts)"))
+sec("Outside spending (IE) by country-focused committees","",tb(byD(s=>ieSum(s)>0,ieSum,15),s=>esc(fo(s.r).filter(f=>f.k!=="direct").map(f=>f.p+" "+f.k+" "+money(f.d)).join("; "))))
+sec("Republicans supporting war-powers resolutions (W ≥ 5)","",tb(byD(s=>s.r[2]==="R"&&(s.sc.W??0)>=5,s=>s.sc.W??0,60),s=>"W "+s.sc.W))
+sec("Democrats/Independents aligned on border or immigration (B or I ≥ 5)","",tb(byD(s=>s.r[2]!=="R"&&((s.sc.B??0)>=5||(s.sc.I??0)>=5),s=>Math.max(s.sc.B??0,s.sc.I??0),60),s=>"B "+(s.sc.B??"–")+" / I "+(s.sc.I??"–")))
+sec("Border = 10 and foreign-aid restraint ≥ 7","",tb(byD(s=>s.sc.B===10&&(s.sc.A??0)>=7,s=>s.sc.A??0,60),s=>"A "+s.sc.A))
+sec("Highest uniparty counts","",tb(byD(()=>true,s=>s.r[10]),s=>String(s.r[10])))
+sec("Most stock-trade filings (House + Senate PTRs)","",tb(byD(s=>!!TR[s.r[0]],s=>TR[s.r[0]][0]),s=>TR[s.r[0]][0]+" filings, "+TR[s.r[0]][2]+" transactions"))
+sec("Most committee-sector overlap transactions","Factual overlap between traded sector and committee jurisdiction; not an allegation.",tb(byD(s=>!!TR[s.r[0]]&&TR[s.r[0]][5]>0,s=>TR[s.r[0]][5]),s=>String(TR[s.r[0]][5])));}
function votes(){const all=[...VOTES,...VOTES2];V.innerHTML=sec("Scored roll calls ("+all.length+", incl. "+VOTES2.length+" cross-party votes added in the Green audit)","",table(["Chamber","Indicator","AF position","Vote","Date","Source"],all.map(v=>[v[0]==="H"?"House":"Senate",INDN[v[1]],v[2]==="Y"?"Yea":"Nay",esc(v[3]),v[4],A(v[5],"roll call")])));}
function audit(){const L=SM.filter(s=>s.ocol==="g").sort((a,b)=>(b.comp??0)-(a.comp??0));
 V.innerHTML=sec("Green audit: the "+L.length+" previous Greens","Previous equal-weight composite → independence-weighted composite. Party-line share = aligned votes cast with own party on votes where the two party majorities split.",table(["Member","Party","State","Old","New","Now","Party-line share","Breaks","Uniparty","Lowest indicator"],L.map(s=>{const lo=IND.filter(k=>s.sc[k]!=null).sort((a,b)=>s.sc[a]-s.sc[b])[0];return[esc(s.r[1]),s.r[2],distLabel(s.r),String(s.oc),String(s.comp),`<b style="color:${CV[s.col]}">${COLN[s.col]}</b>`,s.pl+"%",String(s.brk),String(s.r[10]),lo?INDN[lo]+" "+s.sc[lo]:""];})));}
function stocks(){const L=SM.filter(s=>TR[s.r[0]]).sort((a,b)=>TR[b.r[0]][2]-TR[a.r[0]][2]);const f=L.reduce((p,s)=>p+TR[s.r[0]][0],0),t=L.reduce((p,s)=>p+TR[s.r[0]][2],0),o=L.filter(s=>TR[s.r[0]][5]>0).length;
 V.innerHTML=`<div class="callout">STOCK Act periodic transaction reports: ${L.length} members, ${f} filings, ${t} transactions disclosed, ${o} members with committee-sector overlap. Overlap is factual (traded sector vs. committee jurisdiction), not an allegation. Senate 2026 PTRs were not collected (gap); scanned filings were not parsed (gap).</div>`+table(["Member","Party","State","Filings (parsed)","Transactions","Overlap tx","Recent transactions (sample)"],L.map(s=>{const x=TR[s.r[0]];return[esc(s.r[1]),s.r[2],distLabel(s.r),x[0]+" ("+x[1]+")",String(x[2]),String(x[5]),x[3].slice(0,3).map(y=>`${y[0]} ${esc(y[1])} ${esc(y[2])} ${esc(amt(y[3]))} ${A(lk(y[4]),"filing")}`).join("<br>")];}));}
function xposts(){const L=SM.filter(s=>XP[s.r[0]]).sort((a,b)=>XP[b.r[0]][1].localeCompare(XP[a.r[0]][1]));const nh=Object.keys(XH).length,np=L.reduce((p,s)=>p+XP[s.r[0]][4],0);
 V.innerHTML=`<div class="callout">${nh} verified official handles · ${np} keyword-matched posts from ${L.length} members, Oct 3 – Nov 2, 2026 · campaign handles not collected (gap). Says vs votes: no post explicitly contradicts a scored vote.</div><div class="filters"><label>Filter by tag<select id="xt"><option value="">All</option>${Object.entries(XTAG).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join("")}</select></label><label>Search<input id="xq" type="search" placeholder="name or text"></label></div><div id="xl"></div>`;
 const draw=()=>{const tg=document.getElementById("xt").value,q=document.getElementById("xq").value.toLowerCase();document.getElementById("xl").innerHTML=table(["Member","Party","Handle","Date","Tags","Most recent matched post","Posts"],L.filter(s=>{const p=XP[s.r[0]];return(!tg||p[2].includes(tg))&&(!q||(s.r[1]+" "+p[3]).toLowerCase().includes(q));}).map(s=>{const p=XP[s.r[0]],h=XH[s.r[0]];return[esc(s.r[1]),s.r[2],A("https://x.com/"+h,"@"+h),p[1],p[2].split("").map(c=>XTAG[c]??c).join(", "),"“"+esc(xdec(p[3]))+"…” "+A("https://x.com/"+h+"/status/"+p[0],"post"),String(p[4])];}));};
 document.getElementById("xt").onchange=draw;document.getElementById("xq").oninput=draw;draw();}
function method(){V.innerHTML=sec("Methodology, weights and cut-offs","",`<ul>${METH.method.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`)+`<div class="callout"><b>Data gaps.</b> ${esc(METH.gaps)}</div><p class="muted">${esc(METH.note)}</p><p class="muted small">Raw data: ${A("assets/data.json","assets/data.json")}</p>`;}
function render(){if(!TABS.some(t=>t[0]===view))view="members";drawTabs();({members,clusters,votes,audit,stocks,x:xposts,method})[view]();}
addEventListener("hashchange",()=>{view=location.hash.slice(1)||"members";render();});render();
})();
