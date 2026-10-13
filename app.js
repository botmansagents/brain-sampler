(function(){
  var C = window.SAMPLER, $ = function(id){return document.getElementById(id);};
  $("signup").addEventListener("submit", function(e){
    e.preventDefault();
    var name = $("name").value.trim(), email = $("email").value.trim();
    if (C.signupFormUrl) { window.open(C.signupFormUrl, "_blank", "noopener"); return; }
    var body = "Please add me as a free member.\n\nName: " + name + "\nEmail: " + email;
    window.location.href = "mailto:" + C.signupEmail + "?subject=" + encodeURIComponent("Free member signup") + "&body=" + encodeURIComponent(body);
    $("signupNote").textContent = "Your email app should open. Hit send and you are on the list.";
  });
})();
