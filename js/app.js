/* PITWALL - Flighty for F1 */
(function () {
  "use strict";
  var SEASON = 2026, API = "https://f1api.dev/api/";

  var ISO = {Australia:"AU",Austria:"AT",Azerbaijan:"AZ",Bahrain:"BH",Belgium:"BE",Brazil:"BR",Canada:"CA",China:"CN",France:"FR",Germany:"DE",Hungary:"HU",Italy:"IT",Japan:"JP",Mexico:"MX",Monaco:"MC",Netherlands:"NL",Qatar:"QA","Saudi Arabia":"SA",Singapore:"SG",Spain:"ES",UAE:"AE","United Arab Emirates":"AE",UK:"GB","United Kingdom":"GB","Great Britain":"GB",USA:"US","United States":"US",Portugal:"PT",Turkey:"TR"};
  var CODE = {Australia:"AUS",Austria:"AUT",Azerbaijan:"AZE",Bahrain:"BHR",Belgium:"BEL",Brazil:"BRA",Canada:"CAN",China:"CHN",Hungary:"HUN",Italy:"ITA",Japan:"JPN",Mexico:"MEX",Monaco:"MON",Netherlands:"NED",Qatar:"QAT","Saudi Arabia":"SAU",Singapore:"SGP",Spain:"ESP",UAE:"UAE","United Arab Emirates":"UAE","United Kingdom":"GBR",UK:"GBR",USA:"USA","United States":"USA"};
  var TEAMC={red_bull:"#3671C6",ferrari:"#E8002D",mercedes:"#00D7B6",mclaren:"#FF8000",aston_martin:"#229971",alpine:"#0093CC",williams:"#1868DB",rb:"#6692FF",racing_bulls:"#6692FF",haas:"#9C9FA2",sauber:"#52E252",kick_sauber:"#52E252",audi:"#00B5A0",cadillac:"#B8862E",alphatauri:"#6692FF"};
  function flag(c){var i=ISO[c]||ISO[(c||"").trim()];if(!i)return"🏁";return i.replace(/./g,function(ch){return String.fromCodePoint(127397+ch.charCodeAt(0));});}
  function code(c){return CODE[c]||(c||"").slice(0,3).toUpperCase();}
  function teamColor(id){return TEAMC[id]||"#2f6bff";}

  function dt(s){if(!s||!s.date||!s.time)return null;var d=new Date(s.date+"T"+s.time);return isNaN(d)?null:d;}
  function pad(n){return(n<10?"0":"")+n;}
  function fTime(d){return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}
  function fDay(d){return d.toLocaleDateString([],{weekday:"short",day:"numeric",month:"short"});}
  function fShort(d){return d.toLocaleDateString([],{day:"numeric",month:"short"});}
  function monthName(d){return d.toLocaleDateString([],{month:"long"});}
  var SESS=[{k:"fp1",n:"Practice 1",d:60},{k:"fp2",n:"Practice 2",d:60},{k:"fp3",n:"Practice 3",d:60},{k:"sprintQualy",n:"Sprint Quali",d:45},{k:"sprintRace",n:"Sprint",d:60},{k:"qualy",n:"Qualifying",d:75},{k:"race",n:"Race",d:150}];
  function sessionsOf(r){var sc=r.schedule||{},l=[];SESS.forEach(function(s){var d=dt(sc[s.k]);if(d)l.push({name:s.n,start:d,end:new Date(d.getTime()+s.d*6e4)});});l.sort(function(a,b){return a.start-b.start;});return l;}
  function raceStart(r){return dt(r.schedule&&r.schedule.race);}
  function raceEnd(r){var ss=sessionsOf(r);return ss.length?ss[ss.length-1].end:null;}
  var now=function(){return new Date();};
  var getJSON=function(u){return fetch(u).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});};

  var DATA=null, NEXT=null, PREV=null, cTarget=null, cLabel="";

  /* ---------- UP NEXT ---------- */
  function renderNext(){
    var host=document.getElementById("nextWrap");
    if(!NEXT){host.innerHTML='<div class="err">Season complete. 🏁</div>';return;}
    var r=NEXT, country=r.circuit.country, ss=sessionsOf(r), n=now();
    var live=ss.find(function(s){return s.start<=n&&n<=s.end;});
    var nextUp=ss.find(function(s){return s.start>n;});
    cTarget=nextUp?nextUp.start:(live?live.end:null);
    cLabel=nextUp?nextUp.name:(live?live.name:"");
    document.getElementById("nextSub").textContent="Round "+r.round+" of "+DATA.races.length;

    var pill=live?'<span class="pill pill--live"><span class="pill__dot"></span>'+live.name+' live</span>'
                 :'<span class="pill pill--up"><span class="pill__dot"></span>Up next</span>';
    var oCode=PREV?code(PREV.circuit.country):"F1", dCode=code(country);
    var oDate=PREV?fShort(raceStart(PREV)):"Season", dDate=fShort(raceStart(r));

    var sx=ss.map(function(s){
      var cls=s.end<n?"sx--done":(live===s?"sx--live":(nextUp===s?"sx--next":""));
      var t=live===s?'<span class="sx__time" style="color:var(--red)">LIVE</span>':'<span class="sx__time">'+fTime(s.start)+'</span>';
      return '<div class="sx '+cls+'"><span class="sx__dot"></span><span class="sx__n">'+s.name+'</span><span class="sx__day">'+fDay(s.start)+'</span>'+t+'</div>';
    }).join("");

    host.innerHTML=
      '<div class="rc">'
      +'<div class="rc__top">'+pill+'<span class="rc__rnd">R'+r.round+'</span></div>'
      +'<div class="route"><div class="route__end"><div class="route__code">'+oCode+'</div><div class="route__date">'+oDate+'</div></div>'
        +'<div class="route__line" id="rline"></div>'
        +'<div class="route__end"><div class="route__code">'+dCode+'</div><div class="route__date">'+dDate+'</div></div></div>'
      +'<div class="rc__head"><span class="rc__flag">'+flag(country)+'</span><span class="rc__name">'+country+'</span></div>'
      +'<div class="rc__circuit">'+r.circuit.circuitName+(r.laps?' &middot; '+r.laps+' laps':'')+'</div>'
      +'<div class="cd__lab" id="cLab">&nbsp;</div>'
      +'<div class="cd" id="cd">'+u("--","Days")+u("--","Hrs")+u("--","Min")+u("--","Sec")+'</div>'
      +'<div class="sxn">'+sx+'</div>'
      +'</div>';

    // following races
    var later=DATA.races.filter(function(x){var e=raceEnd(x);return e&&e>n&&x.round!==r.round;}).slice(0,5);
    if(later.length){
      host.innerHTML+='<div class="slabel">Later this season</div>'+later.map(rrow).join("");
    }
    drawRoute(); tick();
  }
  function u(n,t){return '<div class="cd__u"><div class="cd__n">'+n+'</div><div class="cd__t">'+t+'</div></div>';}

  function drawRoute(){
    var box=document.getElementById("rline");if(!box)return;
    var prog=0.04;
    if(PREV){var a=raceStart(PREV),b=raceStart(NEXT),n=now();if(a&&b&&b>a)prog=Math.min(.98,Math.max(.02,(n-a)/(b-a)));}
    var x=(2+prog*96).toFixed(1);
    box.innerHTML='<svg viewBox="0 0 100 32" preserveAspectRatio="none">'
      +'<line x1="2" y1="16" x2="98" y2="16" stroke="rgba(60,60,67,.2)" stroke-width="1.5" stroke-dasharray="2 3"/>'
      +'<line x1="2" y1="16" x2="'+x+'" y2="16" stroke="#2f6bff" stroke-width="2"/>'
      +'<circle cx="2" cy="16" r="3" fill="#2f6bff"/>'
      +'<circle cx="98" cy="16" r="3" fill="#fff" stroke="rgba(60,60,67,.25)" stroke-width="1.5"/></svg>'
      +'<span class="route__car" style="left:'+x+'%">🏎️</span>';
  }

  function tick(){
    var box=document.getElementById("cd");if(!box)return;
    var lab=document.getElementById("cLab");
    if(!cTarget){box.innerHTML=u("--","Days")+u("--","Hrs")+u("--","Min")+u("--","Sec");return;}
    var diff=cTarget-now();
    if(diff<=0){build();return;}
    var s=Math.floor(diff/1e3),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),se=s%60;
    box.innerHTML=u(d,"Days")+u(pad(h),"Hrs")+u(pad(m),"Min")+u(pad(se),"Sec");
    if(lab)lab.innerHTML=cLabel.toUpperCase()+' <em>in</em>';
  }

  /* ---------- rows ---------- */
  function rrow(r){
    var n=now(),e=raceEnd(r),done=e&&e<n,isNext=NEXT&&r.round===NEXT.round;
    var rd=raceStart(r);
    return '<div class="rrow '+(isNext?"rrow--next":(done?"rrow--done":""))+'">'
      +'<span class="rrow__flag">'+flag(r.circuit.country)+'</span>'
      +'<span class="rrow__main"><div class="rrow__name">'+r.circuit.country+'</div><div class="rrow__sub">'+r.circuit.circuitName+'</div></span>'
      +'<span class="rrow__right"><div class="rrow__date">'+(rd?fShort(rd):"TBC")+'</div><div class="rrow__rnd">Round '+r.round+'</div></span></div>';
  }

  /* ---------- CALENDAR ---------- */
  function renderCal(){
    var host=document.getElementById("calWrap");
    document.getElementById("calSub").textContent=DATA.races.length+" rounds";
    var html="",curMonth="";
    DATA.races.forEach(function(r){
      var rd=raceStart(r);var m=rd?monthName(rd):"TBC";
      if(m!==curMonth){curMonth=m;html+='<div class="month">'+m+'</div>';}
      html+=rrow(r);
    });
    host.innerHTML=html;
  }

  /* ---------- STANDINGS ---------- */
  function renderDrivers(rows){
    var h=document.getElementById("standDrivers");
    if(!rows||!rows.length){h.innerHTML='<div class="err">Not available yet.</div>';return;}
    h.innerHTML=rows.map(function(x){var d=x.driver||{};
      return '<div class="st '+(x.position==1?"st--p1":"")+'"><span class="st__pos">'+x.position+'</span>'
        +'<span class="st__bar" style="background:'+teamColor(x.teamId)+'"></span>'
        +'<span class="st__main"><div class="st__name">'+((d.name||"")+" "+(d.surname||"")).trim()+'</div><div class="st__sub">'+((x.team&&x.team.teamName)||x.teamId||"")+'</div></span>'
        +'<span class="st__pts"><div class="st__n">'+x.points+'</div><div class="st__l">pts &middot; '+(x.wins||0)+'W</div></span></div>';
    }).join("");
  }
  function renderTeams(rows){
    var h=document.getElementById("standTeams");
    if(!rows||!rows.length){h.innerHTML='<div class="err">Not available yet.</div>';return;}
    h.innerHTML=rows.map(function(x){var t=x.team||{};
      return '<div class="st '+(x.position==1?"st--p1":"")+'"><span class="st__pos">'+x.position+'</span>'
        +'<span class="st__bar" style="background:'+teamColor(x.teamId)+'"></span>'
        +'<span class="st__main"><div class="st__name">'+(t.teamName||x.teamId)+'</div><div class="st__sub">'+(t.country||"")+'</div></span>'
        +'<span class="st__pts"><div class="st__n">'+x.points+'</div><div class="st__l">pts &middot; '+(x.wins||0)+'W</div></span></div>';
    }).join("");
  }

  /* ---------- nav ---------- */
  document.querySelectorAll(".tabb").forEach(function(t){
    t.addEventListener("click",function(){
      document.querySelectorAll(".tabb").forEach(function(b){b.classList.remove("is-on");});
      document.querySelectorAll(".screen").forEach(function(s){s.classList.remove("is-active");});
      t.classList.add("is-on");
      document.getElementById(t.dataset.screen).classList.add("is-active");
    });
  });
  document.querySelectorAll(".seg__b").forEach(function(b){
    b.addEventListener("click",function(){
      document.querySelectorAll(".seg__b").forEach(function(x){x.classList.remove("is-on");});
      b.classList.add("is-on");
      var d=b.dataset.seg==="drivers";
      document.getElementById("standDrivers").hidden=!d;
      document.getElementById("standTeams").hidden=d;
    });
  });

  /* ---------- clock ---------- */
  function clock(){var el=document.getElementById("clock");if(el)el.textContent=new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}).replace(/\s?[AP]M/i,"");}

  /* ---------- boot ---------- */
  function build(){
    if(!DATA)return;var n=now();
    NEXT=DATA.races.find(function(r){var e=raceEnd(r);return e&&e>n;})||null;
    PREV=NEXT?(DATA.races.filter(function(r){return r.round<NEXT.round;}).pop()||null):null;
    renderNext();renderCal();
  }
  function init(){
    clock();setInterval(clock,1000*20);
    Promise.all([getJSON(API+SEASON),
      getJSON(API+SEASON+"/drivers-championship").catch(function(){return null;}),
      getJSON(API+SEASON+"/constructors-championship").catch(function(){return null;})
    ]).then(function(res){
      DATA={races:(res[0].races||[]).slice().sort(function(a,b){return a.round-b.round;})};
      build();
      renderDrivers(res[1]&&res[1].drivers_championship);
      renderTeams(res[2]&&res[2].constructors_championship);
      setInterval(tick,1000);
    }).catch(function(e){
      document.getElementById("nextWrap").innerHTML='<div class="err">Could not load F1 data ('+e.message+').<br>Check connection and refresh.</div>';
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
