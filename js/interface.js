
var $submissions = $('[data-submissions]');
var $form = $('[data-submission]');
var currentSubmission;
var submissionType;
var uploadedFiles = {};

$('input[type="file"]').each(function () {
  $(this).parent().append([
    '<p class="message hidden alert alert-info"></p>',
    '<ul class="files"></ul>'
  ].join(''));
});

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

  hideForm();

  if (!id) {
    return; // you didn't select a submission
  }

  Fliplet.App.Submissions.getById(id).then(function (submission) {
    currentSubmission = submission;
    fillForm();
  });
});

$('input[type="file"]').change(function () {
  var formData = new FormData();
  var files = this.files;
  var $field = $(this);
  var fieldName = $field.attr('name');
  var $message = $field.parent().find('.message');
  var currentFilesCount = $field.parent().find('.files li').length;
  var max = parseInt($field.data('max') || 99);

  $message.removeClass('hidden');

  if (currentFilesCount >= max) {
    event.preventDefault();
    $message.text('You can only upload ' + max + ' files for this field.');
    return;
  }

  for (var i = 0; i < files.length; i++) {
    formData.append(fieldName, files.item(i));
  }

  $field.val('');
  $message.text('Uploading ' + (files.length+1) + ' files...');

  Fliplet.Media.Files.upload({
    data: formData
  }).then(function (files) {
    $message.addClass('hidden');
    $message.text('');

    files.forEach(function (file) {
      addFile($field, file);
    });
  }).catch(function (err) {
    $message.html(err.message || err.description || err);
  });
});

function addFile($field, file) {
  var $ul = $field.parent().find('.files');
  var $li = $([
    '<li data-id="' + file.id + '">',
    '<img src="' + file.thumbnail + '" />',
    '<a data-delete href="#">Delete</a>',
    '</li>'
  ].join(''));

  uploadedFiles[file.id] = file;
  $ul.append($li);
}

$('.files').on('click', '[data-delete]', function (event) {
  event.preventDefault();
  var $li = $(this).parent();
  $li.remove();

  Fliplet.Media.Files.delete($li.data('id'));
});

$('input[name=submissionType]').change(function(){
    //submissionType = this.value;
    showForm();
});

function hideForm() {
  currentSubmission = undefined;
  $form.addClass('hidden');
  $form[0].reset();
  $form.find('.files').html('');
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
    var $element = $form.find('[name="' + key + '"]');

    if (key === 'submissionType' && value !== '') {
      submissionType = value;
    }

    if ($element.attr('type') === 'file') {
      if (Array.isArray(value)) {
        value.forEach(function (file) {
          addFile($element, file);
        });
      } else {
        console.warn('Files for field ' + key + ' are expected to be an array.')
      }

      return;
    }

    if ($element.attr('type') === 'radio') {
      $form.find('[name="' + key + '"][value="' + value + '"]').prop("checked", true);
      return;
    }

    $element.val(value);
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
    $('.has-errors:eq(0) input:eq(0)').focus()
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

  $('input[type="file"]').each(function () {
    var $el = $(this);
    var $files = $el.parent().find('.files li');
    var filesList = [];

    $files.each(function () {
      filesList.push(uploadedFiles[$(this).data('id')]);
    });

    data[$el.attr('name')] = filesList;
  });

  return Fliplet.App.Submissions.update(currentSubmission.id, data).catch(function (err) {
    alert(err.responseJSON.message);
  });
}

$form.submit(function (event) {
  event.preventDefault();

  if (validateForm(currentSubmission.platform, submissionType)){
    $('.has-errors:eq(0) input:eq(0)').focus();
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