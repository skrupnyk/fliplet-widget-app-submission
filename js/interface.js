var widgetId = Fliplet.Widget.getDefaultId();
var widgetData = Fliplet.Widget.getData() || {};
var appName = Fliplet.Env.get('appName');
var organisationName = Fliplet.Env.get('organizationName');
widgetData.formData = $.extend(true, widgetData.formData, {
  appStore: {
    notificationSettings: {
      apn: false
    }
  },
  enterprise: {
    notificationSettings: {
      apn: false
    }
  },
  unsigned: {}
});

/* FUNCTIONS */
String.prototype.toCamelCase = function() {
  return this.replace(/^([A-Z])|[^A-Za-z]+(\w)/g, function(match, p1, p2, offset) {
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  }).replace(/([^A-Z-a-z])/g, '');
};

function loadAppStoreData() {

  $('#appStoreConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* CHECK COUNTRIES */
    if (name === "fl-sb-ast-availability") {
      $('[name="' + name + '"]').selectpicker('val', ((typeof widgetData.formData !== "undefined") ? widgetData.formData.appStore[name] : []));
      return;
    }
    if (name === "fl-sb-ast-userCountry" || name === "fl-sb-ast-category1" || name === "fl-sb-ast-category2" || name === "fl-sb-ast-language") {
      $('[name="' + name + '"]').val(widgetData.formData.appStore[name]).trigger('change');
      return;
    }

    if (name === "fl-sb-ast-pricing") {
      $('[name="' + name + '"]').val((typeof widgetData.formData.appStore[name] !== "undefined") ? widgetData.formData.appStore[name] : 'free').trigger('change');
    }

    /* ADD KEYWORDS */
    if (name === "fl-sb-ast-keywords") {
      $('#' + name).tokenfield('setTokens', ((typeof widgetData.formData !== "undefined") ? widgetData.formData.appStore[name] : ''));
    }

    /* ADD BUNDLE ID */
    if (name === "fl-appStore-bundleId" && typeof widgetData.formData === "undefined") {
      $('.bundleId-ast-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      return;
    }
    if (name === "fl-appStore-bundleId" && typeof widgetData.formData !== "undefined") {
      $('.bundleId-ast-text').html(widgetData.formData.appStore[name]);
      $('[name="' + name + '"]').val(widgetData.formData.appStore[name]);
      return;
    }

    /* SAVING NOTIFICATIONS SETTINGS */
    if (name === 'fl-appStore-authKey') {
      $('[name="' + name + '"]').val(widgetData.formData.appStore.notificationSettings.apnAuthKey || '');
      return;
    }
    if (name === 'fl-appStore-keyId') {
      $('[name="' + name + '"]').val(widgetData.formData.appStore.notificationSettings.apnKeyId || '');
      return;
    }
    if (name === 'fl-appStore-topic') {
      $('[name="' + name + '"]').val(widgetData.formData.appStore.notificationSettings.apnTopic || '');
      return;
    }
    if (name === 'fl-sb-ast-teamId') {
      $('[name="' + name + '"]').val(widgetData.formData.appStore.notificationSettings.apnTeamId || '');
      return;
    }

    $('[name="' + name + '"]').val(widgetData.formData.appStore[name]);
  });
}

function loadEnterpriseData() {

  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-ent-bundleId" && typeof widgetData.formData === "undefined") {
      $('.bundleId-ent-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      return;
    }
    if (name === "fl-ent-bundleId" && typeof widgetData.formData !== "undefined") {
      $('.bundleId-ent-text').html(widgetData.formData.enterprise[name]);
      $('[name="' + name + '"]').val(widgetData.formData.enterprise[name]);
      return;
    }

    /* SAVING NOTIFICATIONS SETTINGS */
    if (name === 'fl-ent-authKey') {
      $('[name="' + name + '"]').val(widgetData.formData.enterprise.notificationSettings.apnAuthKey || '');
      return;
    }
    if (name === 'fl-ent-keyId') {
      $('[name="' + name + '"]').val(widgetData.formData.enterprise.notificationSettings.apnKeyId || '');
      return;
    }
    if (name === 'fl-ent-topic') {
      $('[name="' + name + '"]').val(widgetData.formData.enterprise.notificationSettings.apnTopic || '');
      return;
    }
    if (name === 'fl-sb-ent-teamId') {
      $('[name="' + name + '"]').val(widgetData.formData.enterprise.notificationSettings.apnTeamId || '');
      return;
    }

    $('[name="' + name + '"]').val(widgetData.formData.enterprise[name]);
  });
}

function loadUnsignedData() {

  $('#unsignedConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-uns-bundleId" && typeof widgetData.formData === "undefined") {
      $('.bundleId-uns-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      return;
    }
    if (name === "fl-uns-bundleId" && typeof widgetData.formData !== "undefined") {
      $('.bundleId-uns-text').html(widgetData.formData.unsigned[name]);
      $('[name="' + name + '"]').val(widgetData.formData.unsigned[name]);
      return;
    }

    $('[name="' + name + '"]').val(widgetData.formData.unsigned[name]);
  });
}

function save() {
  Fliplet.Widget.save(widgetData);
}

function saveAppStoreData() {
  var data = widgetData.formData.appStore;

  $('#appStoreConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    /* SAVING NOTIFICATIONS SETTINGS */
    if (name === 'fl-appStore-authKey') {
      data.notificationSettings.apnAuthKey = value;
    }
    if (name === 'fl-appStore-keyId') {
      data.notificationSettings.apnKeyId = value;
    }
    if (name === 'fl-appStore-topic') {
      data.notificationSettings.apnTopic = value;
    }
    if (name === 'fl-sb-ast-teamId') {
      data.notificationSettings.apnTeamId = value;
      data[name] = value;
      return;
    }

    /* PROCESSING KEYWORDS */
    if (name === 'fl-sb-ast-keywords') {
      var newValue = value.replace(/,\s+/g, ',');
      data[name] = newValue;
      return;
    }

    data[name] = value;
  });

  data.notificationSettings.apn = !!(data.notificationSettings.apnAuthKey !== '' && data.notificationSettings.apnKeyId !== '' && data.notificationSettings.apnTeamId !== '' && data.notificationSettings.apnTopic !== '');

  widgetData.formData.appStore = data;
  save();
}

function saveEnterpriseData() {
  var data = widgetData.formData.enterprise;

  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    /* SAVING NOTIFICATIONS SETTINGS */
    if (name === 'fl-ent-authKey') {
      data.notificationSettings.apnAuthKey = value;
    }
    if (name === 'fl-ent-keyId') {
      data.notificationSettings.apnKeyId = value;
    }
    if (name === 'fl-ent-topic') {
      data.notificationSettings.apnTopic = value;
    }
    if (name === 'fl-sb-ent-teamId') {
      data.notificationSettings.apnTeamId = value;
      data[name] = value;
      return;
    }

    data[name] = value;
  });

  data.notificationSettings.apn = !!(data.notificationSettings.apnAuthKey !== '' && data.notificationSettings.apnKeyId !== '' && data.notificationSettings.apnTeamId !== '' && data.notificationSettings.apnTopic !== '');

  widgetData.formData.enterprise = data;
  save();
}

function saveUnsignedData() {
  var data = widgetData.formData.unsigned;

  $('#unsignedConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    data[name] = value;
  });

  widgetData.formData.unsigned = data;
  save();
}

function init() {
  $('#fl-sb-ast-keywords').tokenfield();

  loadAppStoreData();
  loadEnterpriseData();
  loadUnsignedData();
  Fliplet.Widget.autosize();
}

/* ATTACH LISTENERS */
$('[name="submissionType"]').on('change', function() {
  var selectedOptionId = $(this).attr('id');

  $('.fl-sb-panel').removeClass('show');
  $('.' + selectedOptionId).addClass('show');

  Fliplet.Widget.autosize();
});

$('.fl-sb-appStore [change-bundleid], .fl-sb-enterprise [change-bundleid], .fl-sb-unsigned [change-bundleid]').on('click', function() {
  var changeBundleId = confirm("Are you sure you want to change the unique Bundle ID?");

  if (changeBundleId) {
    $('.fl-bundleId-holder').addClass('hidden');
    $('.fl-bundleId-field').addClass('show');

    Fliplet.Widget.autosize();
  }
});

$('.panel-group').on('shown.bs.collapse', '.panel-collapse', function() {
    Fliplet.Widget.autosize();
  })
  .on('hidden.bs.collapse', '.panel-collapse', function() {
    Fliplet.Widget.autosize();
  });

$('[name="fl-sb-ast-keywords"]').on('tokenfield:createtoken', function(e) {
  var currentValue = e.currentTarget.value.replace(/,\s+/g, ',');
  var newValue = e.attrs.value;
  var oldAndNew = currentValue + ',' + newValue;

  if (oldAndNew.length > 100) {
    e.preventDefault();
  }
});

$('#appStoreConfiguration').on('submit', function(event) {
  event.preventDefault();
  save();
});

$('#enterpriseConfiguration').on('submit', function(event) {
  event.preventDefault();
  save();
});

$('#unsignedConfiguration').on('submit', function(event) {
  event.preventDefault();
  save();
});

/* SAVE PROGRESS CLICK */
$('[data-app-store-save]').on('click', function() {
  saveAppStoreData();
});
$('[data-enterprise-save]').on('click', function() {
  saveEnterpriseData();
});
$('[data-unsigned-save]').on('click', function() {
  saveUnsignedData();
});

/* INIT */
$('[name="submissionType"][value="appStore"]').prop('checked', true).trigger('change');
init();
