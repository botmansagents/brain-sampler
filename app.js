(function(){
  var C = window.SAMPLER, $ = function(id){return document.getElementById(id);};
  var sel = $("county");
  C.openCounties.forEach(function(c){ sel.add(new Option(c + " County", c)); });
  C.soonCounties.forEach(function(c){ sel.add(new Option(c + " County (coming soon)", c)); });
  $("countyNote").textContent = "Open now: " + C.openCounties.join(", ") + " County. Coming soon: " + C.soonCounties.join(", ") + ". Join below to hear when your county opens.";
  var out = $("result");
  function show(html){ out.hidden = false; out.innerHTML = html; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(ch){ return "&#" + ch.charCodeAt(0) + ";"; }); }
  var paused = "Free searches are paused for a short time while we improve them. Join below and we will let you know when they are back.";
  function render(r){
    var v = r.result || r.view || r, h = "";
    if (v.address) h += "<p><b>Property:</b> " + esc(v.address) + "</p>";
    if (v.owner) h += "<p><b>Owner on the appraisal record:</b> " + esc(v.owner) + "</p>";
    (v.documents || []).slice(0, 25).forEach(function(d){ h += "<p>" + esc(d.recorded) + ": " + esc(d.docType) + " " + esc((d.grantors||[]).join("; ")) + " to " + esc((d.grantees||[]).join("; ")) + "</p>"; });
    if (r.id) h += '<p><a href="' + C.searchApi.replace(/\/api\/free-search$/, "") + "/free-report/" + esc(r.id) + '" target="_blank" rel="noopener">Open the full free report</a></p>';
    show(h || "<p>The search finished. No records came back for that address.</p>");
  }
  function poll(id, n){
    fetch(C.searchApi + "/" + id).then(function(x){ return x.json(); }).then(function(r){
      if (r.status === "complete") return render(r);
      if (r.status === "failed" || n > 120) return show("<p>" + esc(r.message || "That search did not finish. Please try again.") + "</p>");
      show("<p>Searching the county records. This can take a few minutes...</p>");
      setTimeout(function(){ poll(id, n + 1); }, 4000);
    }).catch(function(){ show("<p>" + paused + "</p>"); });
  }
  $("search").addEventListener("submit", function(e){
    e.preventDefault();
    var county = sel.value, address = $("address").value.trim();
    if (C.openCounties.indexOf(county) < 0) return show("<p>" + esc(county) + " County is coming soon. Join below and we will tell you when it opens.</p>");
    show("<p>Starting your free search...</p>");
    fetch(C.searchApi, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ county: county, address: address }) })
      .then(function(x){ if (!/json/.test(x.headers.get("content-type") || "")) throw 0; return x.json(); })
      .then(function(r){ if (r.id) poll(r.id, 0); else show("<p>" + esc(r.message || paused) + "</p>"); })
      .catch(function(){ show("<p>" + paused + "</p>"); });
  });
  $("signup").addEventListener("submit", function(e){
    e.preventDefault();
    var name = $("name").value.trim(), email = $("email").value.trim();
    if (C.signupFormUrl) { window.open(C.signupFormUrl, "_blank", "noopener"); $("signupNote").textContent = "Thanks! Finish the short form that just opened."; return; }
    location.href = "mailto:" + C.signupEmail + "?subject=" + encodeURIComponent("Free member signup") + "&body=" + encodeURIComponent("Name: " + name + "\nEmail: " + email + "\nPlease add me as a free member.");
    $("signupNote").textContent = "Thanks, " + name + "! Your email app should open. Press send and you are on the list.";
  });
})();
