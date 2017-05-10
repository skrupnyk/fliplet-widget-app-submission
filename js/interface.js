
var $submissions = $('[data-submissions]');
var $form = $('[data-submission]');
var currentSubmission;
var submissionType;

$('[data-create]').click(function (event) {
  event.preventDefault();

  hideForm();

  Fliplet.App.Submissions.create({
    platform: prompt('Platform', 'ios')
  }).then(function () {
    loadSubmissions();
  }).catch(function (err) {
    alert(err.responseJSON.message);
  });
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

$('input[name=submissionType]').change(function(){
    //submissionType = this.value;
    showForm();
});

function hideForm() {
  currentSubmission = undefined;
  $form.addClass('hidden');
  $form[0].reset();
}

function showForm() {
  $form.removeClass('hidden');
  $form.find('.ios-only, .android-only, .windows-only, .appstore, .enterprise').addClass('hidden');

  submissionType = $('input:radio[name=submissionType]:checked').val()
  //alert($('input:radio[name=submissionType]').filter(":checked").val());

  $(".appName-help-block").html("There is a limit of 50 characters, however we recommend keeping this to 23");
  $('input[name="appName"]').attr('maxlength', 50);

  if (currentSubmission.platform === "android"){
    $(".appName-help-block").html("There is a limit of 30 characters");
    $('input[name="appName"]').attr('maxlength', 30);
  }

  $form.find('.' + currentSubmission.platform + '-only').removeClass('hidden');
  $form.find('.' + submissionType).removeClass('hidden');
}

function fillForm() {
  _.forIn(currentSubmission.data, function (value, key) {
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
      return $submissions.append('<option value="">No submissions found</option>');
    }

    $submissions.append('<option value="">-- Select a submission</option>');

    submissions.forEach(function (s) {
      $submissions.append('<option value="' + s.id + '">#' + s.id + ' ' + s.platform + ' (' + s.status + ')</option>');
    });
  }).catch(function (err) {
    alert(err.responseJSON.message);
  });
}

loadSubmissions();

$form.find('[data-build]').click(function (event) {
  event.preventDefault();

  if (validateForm(currentSubmission.platform, submissionType)){
    return;
  }

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

  if (validateForm(currentSubmission.platform, submissionType)){
    return;
  }

  saveForm().then(function () {
    hideForm();
    loadSubmissions();
  });
});

// Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  $form.submit();
});