// Formulare: kleine Hilfe ohne Fremdanbieter. Ohne JavaScript sendet das Formular normal per POST.
(function () {
  var forms = document.querySelectorAll('form[data-form]');
  forms.forEach(function (form) {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    var ts = form.querySelector('input[name=ts]');
    if (ts) ts.value = String(Date.now());
    var status = form.querySelector('.status');
    var button = form.querySelector('button[type=submit]');
    function say(text, ok) {
      status.textContent = text;
      status.className = 'status ' + (ok ? 'status--ok' : 'status--fehler');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var mail = form.querySelector('input[type=email]');
      if (!form.checkValidity() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value)) {
        say('Bitte fülle alle Felder aus und prüfe die E-Mail-Adresse.', false);
        return;
      }
      button.disabled = true;
      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
        .then(function (r) {
          return r.json().then(function (j) { return { ok: r.ok, j: j }; });
        })
        .then(function (res) {
          if (res.ok && res.j.ok) {
            say(res.j.message || 'Danke, das hat geklappt.', true);
            form.reset();
            if (ts) ts.value = String(Date.now());
          } else {
            say((res.j && res.j.message) || 'Das hat leider nicht geklappt. Bitte versuche es später noch einmal.', false);
          }
        })
        .catch(function () {
          say('Das Formular ist gerade nicht erreichbar (in der Testversion noch nicht aktiv). Schreib mir bitte direkt an info@themediapro.de.', false);
        })
        .finally(function () { button.disabled = false; });
    });
  });
})();
