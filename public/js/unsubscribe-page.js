(function () {
    function initSurveyForm() {
        var endpoint = window.flexaTechSuReasonEndpoint;
        var form = document.getElementById('f-survey');

        if (!endpoint || !form) {
            return;
        }

        form.onsubmit = function (e) {
            e.preventDefault();

            var fd = new FormData(form);

            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    email: fd.get('email'),
                    token: fd.get('token'),
                    reason: fd.get('reason')
                })
            }).then(function () {
                var successPanel = document.getElementById('s1');
                var thankYouPanel = document.getElementById('s2');

                if (successPanel) {
                    successPanel.style.display = 'none';
                }

                if (thankYouPanel) {
                    thankYouPanel.style.display = 'block';
                }
            });
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSurveyForm);
    } else {
        initSurveyForm();
    }
})();
