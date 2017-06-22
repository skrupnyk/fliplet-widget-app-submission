var widgetId = Fliplet.Widget.getDefaultId();
var widgetData = Fliplet.Widget.getData() || {};

$('[change-bundleId]').on('click', function() {
  var changeBundleId = confirm("Are you sure you want to change the unique Bundle ID?");
  if (changeBundleId) {
    $('.fl-bundleId-holder').addClass('hidden');
    $('.fl-bundleId-field').addClass('show');
  }
});

$('[change-price]').on('click', function() {
  $('.fl-price-holder').addClass('hidden');
  $('.fl-price-field').addClass('show');
});

$('[name="submissionType"]').on('change', function() {
  var value = $(this).val();
  var selectedOptionId = $(this).attr('id');

  $('.fl-sb-panel').removeClass('show');
  $('.' + selectedOptionId).addClass('show');
});

$('[name="submissionType"]').val(['appStore']).trigger('change');
$('#fl-sb-ast-keywords').tokenfield();
