(function(){
  var C = window.SAMPLER || {}, $ = function(id){return document.getElementById(id);};
  var form = $("titleSearch"); if (!form) return;
  var api = String(C.searchApiUrl || "").replace(/\/+$/, "");
  var m = /[?&]api=([^&]+)/.exec(location.search);
  if (m && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) api = decodeURIComponent(m[1]).replace(/\/+$/, "");
  function esc(s){return String(s == null ? "" : s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function note(t){ $("searchNote").textContent = t; }
  function rows(list, cols){
    if (!list || !list.length) return "<p class=\"small\">None found.</p>";
    return "<table><tr>" + cols.map(function(c){return "<th>"+esc(c[0])+"</th>";}).join("") + "</tr>" +
      list.map(function(r){return "<tr>" + cols.map(function(c){return "<td>"+esc(r[c[1]])+"</td>";}).join("") + "</tr>";}).join("") + "</table>";
  }
  function show(r){
    var p = r.property || {}, h = "";
    h += "<h3>Property</h3><p>" + esc(p.address) + "<br>Owner: " + esc(p.owner) + "<br>Legal: " + esc(p.legal) + "</p>";
    if (r.complete === false) h += "<div class=\"flag\">" + esc(r.incompleteWhy || "This search did not finish every check.") + "</div>";
    var cr = r.courtRecords || {};
    h += "<h3>Foreclosure notices</h3>" + rows(cr.foreclosureNotices, [["Recorded","recorded"],["Number","instrument"],["Name","matched"]]);
    h += "<h3>Things to look at</h3>" + rows(r.review, [["Level","level"],["What","text"]]);
    h += "<h3>Chain of title</h3>" + rows(r.chain, [["Owner","owner"],["Since","since"],["Deed","deed"],["From","from"]]);
    h += "<h3>County records found</h3>" + rows(r.documents, [["Recorded","recorded"],["Type","type"],["Number","number"],["From","from"],["To","to"]]);
    h += "<h3>Tax</h3><p>" + esc((r.tax || {}).text) + "</p>";
    h += "<h3>Flood</h3><p>" + esc((r.flood || {}).text) + (r.flood && r.flood.zone ? " (zone " + esc(r.flood.zone) + ")" : "") + "</p>";
    if (r.disclaimer) h += "<p class=\"small\">" + esc(r.disclaimer) + "</p>";
    $("searchResult").innerHTML = "<div class=\"result\">" + h + "</div>";
  }
  form.addEventListener("submit", function(e){
    e.preventDefault();
    $("searchResult").innerHTML = "";
    if (!api) { note("The free search opens soon. Join below and I will let you know."); return; }
    var body = JSON.stringify({ county: $("county").value, address: $("address").value.trim() });
    note("Starting your search. Most take under a minute.");
    fetch(api + "/api/free-search", { method: "POST", headers: { "content-type": "application/json" }, body: body })
      .then(function(res){ return res.json(); })
      .then(function(j){
        if (!j.ok || !j.id) { note(j.message || "The search could not start. Try again in a minute."); return; }
        var t0 = Date.now();
        (function poll(){
          fetch(api + "/api/free-search/" + encodeURIComponent(j.id)).then(function(r){return r.json();}).then(function(v){
            if (v.status === "queued" || v.status === "running") { note((v.progress || "Searching") + "... " + Math.round((Date.now()-t0)/1000) + "s"); return setTimeout(poll, 1500); }
            if (v.result && v.reviewing) { show(v.result); note("Found the records. Now double checking the chain of title... " + Math.round((Date.now()-t0)/1000) + "s"); return setTimeout(poll, 2000); }
            if (v.result) { note("Done in " + Math.round((Date.now()-t0)/1000) + " seconds."); show(v.result); return; }
            var o = v.out || {}, ch = (o.choices || []).map(function(c){return c.address;}).join("; ");
            note((o.message || "The search did not finish. Please try again.") + (ch ? " Did you mean: " + ch : ""));
          }).catch(function(){ note("Lost touch with the search. Try again in a minute."); });
        })();
      })
      .catch(function(){ note("The search could not start. Try again in a minute."); });
  });
})();
