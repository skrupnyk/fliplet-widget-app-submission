var widgetId = Fliplet.Widget.getDefaultId();
var widgetData = Fliplet.Widget.getData() || {};
var appName = '';
var organisationName = '';
var appIcon = '';
var appSettings = {};
var allAppData = false;

widgetData.formData = $.extend(true, widgetData.formData, {
  requestCreatedAt: '',
  requestBuild: false,
  appStore: {
    requestBuild: false,
    notificationSettings: {
      apn: false
    }
  },
  enterprise: {
    requestBuild: false,
    notificationSettings: {
      apn: false
    }
  },
  unsigned: {
    requestBuild: false
  }
});

console.log(widgetData);

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

    /* APP NAME */
    if (name === "fl-sb-ast-appName") {
      $('[name="' + name + '"]').val(appName);
      return;
    }

    /* APP SCREENSHOTS */
    if (name === "fl-sb-ast-screenshots") {
      var screenNames = '';
      if (appSettings.screensToScreenshot) {
        appSettings.screensToScreenshot.forEach(function(screen) {
          screenNames += screen.title + ", ";
        });
        screenNames = screenNames.replace(/\,[\s]$/g, '');
        widgetData.formData.appStore.appScreenshots = appSettings.screensToScreenshot;
      }
      $('[name="' + name + '"]').val(screenNames);
      return;
    }

    /* CHECK COUNTRIES */
    if (name === "fl-sb-ast-availability") {
      $('[name="' + name + '"]').selectpicker('val', ((typeof widgetData.formData.appStore[name] !== "undefined") ? widgetData.formData.appStore[name] : []));
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
      $('#' + name).tokenfield('setTokens', ((typeof widgetData.formData.appStore[name] !== "undefined") ? widgetData.formData.appStore[name] : ''));
    }

    /* ADD BUNDLE ID */
    if (name === "fl-appStore-bundleId" && typeof widgetData.formData.appStore[name] === "undefined") {
      $('.bundleId-ast-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      return;
    }
    if (name === "fl-appStore-bundleId" && typeof widgetData.formData.appStore[name] !== "undefined") {
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
    if (name === "fl-ent-bundleId" && typeof widgetData.formData.enterprise[name] === "undefined") {
      $('.bundleId-ent-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      return;
    }
    if (name === "fl-ent-bundleId" && typeof widgetData.formData.enterprise[name] !== "undefined") {
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
    if (name === "fl-uns-bundleId" && typeof widgetData.formData.unsigned[name] === "undefined") {
      $('.bundleId-uns-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
      return;
    }
    if (name === "fl-uns-bundleId" && typeof widgetData.formData.unsigned[name] !== "undefined") {
      $('.bundleId-uns-text').html(widgetData.formData.unsigned[name]);
      $('[name="' + name + '"]').val(widgetData.formData.unsigned[name]);
      return;
    }

    $('[name="' + name + '"]').val(widgetData.formData.unsigned[name]);
  });
}

function save(origin) {
  Fliplet.Widget.save(widgetData).then(function() {
    $('.save-' + origin + '-progress').addClass('saved');

    setTimeout(function() {
      $('.save-' + origin + '-progress').removeClass('saved');
    }, 4000);
  });
}

function requestBuild(origin) {
  console.log(widgetData);

  var data = widgetData.formData;
  data.requestCreatedAt = Date();
  data.requestBuild = true;

  if (origin === 'appStore') {
    data.appStore.requestBuild = true;
    data.appStore.splashScreen = appSettings.splashScreen;
    data.appStore.screensToScreenshot = appSettings.screensToScreenshot;
    data.appStore.appIcon = appIcon;

    widgetData.formData = data;

    Fliplet.Widget.save(widgetData).then(function() {
      // @TODO: After
      showRequestStatus();
      Fliplet.Widget.autosize();
    });
  }

  if (origin === 'enterprise') {
    data.enterprise.requestBuild = true;
    data.enterprise.splashScreen = appSettings.splashScreen;
    data.enterprise.appIcon = appIcon;

    widgetData.formData = data;

    Fliplet.Widget.save(widgetData).then(function() {
      // @TODO: After
      showRequestStatus();
      Fliplet.Widget.autosize();
    });
  }

  if (origin === 'unsigned') {
    data.unsigned.requestBuild = true;
    data.unsigned.splashScreen = appSettings.splashScreen;
    data.unsigned.appIcon = appIcon;

    widgetData.formData = data;

    Fliplet.Widget.save(widgetData).then(function() {
      // @TODO: After
      showRequestStatus();
      Fliplet.Widget.autosize();
    });
  }
}

function showRequestStatus() {
  if (widgetData.formData.requestBuild) {
    var requestCreatedAt = moment(widgetData.formData.requestCreatedAt).format('MMMM Do, YYYY - h:mm A');
    $('.app-status-panel span').html(requestCreatedAt);
    $('.app-status').removeClass('hidden');
  }
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

  if (request) {
    requestBuild('appStore');
  } else {
    save('appStore');
  }
}

function saveEnterpriseData(request) {
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
  console.log(widgetData);
  if (request) {
    requestBuild('enterprise');
  } else {
    save('enterprise');
  }
}

function saveUnsignedData(request) {
  var data = widgetData.formData.unsigned;

  $('#unsignedConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    data[name] = value;
  });

  widgetData.formData.unsigned = data;

  if (request) {
    requestBuild('unsigned');
  } else {
    save('unsigned');
  }
}

function init() {
  $('#fl-sb-ast-keywords').tokenfield();

  /* APP ICON */
  if (appIcon) {
    $('.setting-app-icon.userUploaded').attr('src', appIcon);
    $('.setting-app-icon.userUploaded').removeClass('hidden');
    $('.setting-app-icon.default').addClass('hidden');
  }

  /* APP SPLASH SCREEN */
  if (appSettings.splashScreen) {
    $('.setting-splash-screen.userUploaded').css('background-image', 'url(' + appSettings.splashScreen.url + ')');
    $('.setting-splash-screen.userUploaded').removeClass('hidden');
    $('.setting-splash-screen.default').addClass('hidden');
  }

  if (appName === '' || !appIcon || !appSettings.splashScreen || !appSettings.screensToScreenshot) {
    $('.app-details').addClass('required-fill');
  } else {
    allAppData = true;
  }

  loadAppStoreData();
  loadEnterpriseData();
  loadUnsignedData();
  showRequestStatus();
  Fliplet.Widget.autosize();
}

/* AUX FUNCTIONS */
function checkGroupErrors() {
  $('.has-error').each(function(i, el) {
    $(el).parents('.panel-default').addClass('required-fill');
  });

  $('.panel-default').each(function(i, el) {
    var withError = $(el).find('.has-error').length;

    if (withError === 0) {
      $(el).not('.app-details').removeClass('required-fill');
    }
  });
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

$('#redirectToSettings').on('click', function() {
  Fliplet.Studio.emit('navigate', {
    name: 'appSettings',
    params: {
      appId: Fliplet.Env.get('appId')
    }
  });
});

$('#appStoreConfiguration, #enterpriseConfiguration, #unsignedConfiguration').on('validated.bs.validator', function() {
  checkGroupErrors();
  Fliplet.Widget.autosize();
});

$('#appStoreConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    console.log('ERRORS');
  } else {
    event.preventDefault();

    if (allAppData) {
      saveAppStoreData(true);
    } else {
      console.log('ERRORS');
    }
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
  }
});

$('#enterpriseConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    console.log('ERRORS');
  } else {
    event.preventDefault();

    if (allAppData) {
      saveEnterpriseData(true);
    } else {
      console.log('ERRORS');
    }
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
  }
});

$('#unsignedConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    console.log('ERRORS');
  } else {
    event.preventDefault();

    if (allAppData) {
      saveUnsignedData(true);
    } else {
      console.log('ERRORS');
    }
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
  }
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

if (!Fliplet.Env.get('development')) {
  Fliplet.API.request({
      cache: true,
      url: 'v1/apps/' + Fliplet.Env.get('appId')
    })
    .then(function(result) {
      appName = result.app.name;
      appIcon = result.app.icon;
      appSettings = result.app.settings;
    })
    .then(function() {
      Fliplet.API.request({
          cache: true,
          url: 'v1/organizations/' + Fliplet.Env.get('organizationId')
        })
        .then(function(org) {
          organisationName = org.name;
          init();
        });
    });
} else {
  init();
}
