// Fliplet.Env.set('appId', 6);

var $submissions = $('[data-submissions]');
var $form = $('[data-submission]');
var currentSubmission;

$('[data-create]').click(function (event) {
  event.preventDefault();

  Fliplet.App.Submissions.create({
    platform: prompt('Platform', 'ios')
  }).then(function () {
    loadSubmissions();
  })
});

$('[data-submissions]').change(function () {
  var id = $(this).val();

  if (!id) {
    return hideForm();
  }

  Fliplet.App.Submissions.getById(id).then(function (submission) {
    currentSubmission = submission;
    fillForm();
  });
});

function hideForm() {
  currentSubmission = undefined;
  $form.addClass('hidden');
}

function showForm() {
  $form.removeClass('hidden');
}

function fillForm() {
  _.forIn(currentSubmission, function (value, key) {
    $form.find('[name="' + key + '"]').val(value);
  });

  $form.find('[data-save]').toggleClass('hidden', ['started', 'failed'].indexOf(currentSubmission.status) === -1);
  $form.find('[data-build]').toggleClass('hidden', ['started', 'failed'].indexOf(currentSubmission.status) === -1);

  showForm();
}

function loadSubmissions() {
  Fliplet.App.Submissions.get().then(function (submissions) {
    $submissions.html('');

    if (!submissions.length) {
      return $submissions.append('<option value="">No submissions found for iOS</option>');
    }

    $submissions.append('<option value="">-- Select a submission</option>');

    submissions.forEach(function (s) {
      $submissions.append('<option value="' + s.id + '">#' + s.id + ' ' + s.platform + ' (' + s.status + ')</option>');
    });
  });
}

loadSubmissions();

$form.find('[data-build]').click(function (event) {
  event.preventDefault();

  saveForm().then(function () {
    return Fliplet.App.Submissions.build(currentSubmission.id);
  }).then(function () {
    hideForm();
    loadSubmissions();
  }).catch(function (err) {
    alert(err.responseJSON.message);
  });
});

function saveForm() {
  var data = $form.serializeArray().reduce(function(obj, item) {
    obj[item.name] = item.value;
    return obj;
  }, {});

  return Fliplet.App.Submissions.update(currentSubmission.id, data).catch(function (err) {
    alert(err.responseJSON.message);
  });
}

$form.submit(function (event) {
  event.preventDefault();

  saveForm().then(function () {
    hideForm();
    loadSubmissions();
  });
});

// Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  $form.submit();
});