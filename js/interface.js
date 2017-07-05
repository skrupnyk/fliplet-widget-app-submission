var widgetId = Fliplet.Widget.getDefaultId();
var widgetData = Fliplet.Widget.getData(widgetId) || {};
var appName = '';
var organisationName = '';
var appIcon = '';
var appSettings = {};
var allAppData = false;

widgetData.formData = $.extend(true, widgetData.formData, {
  notificationSettings: {},
  appStore: {
    submissionType: 'appstore',
  },
  enterprise: {
    submissionType: 'enterprise',
  },
  unsigned: {
    submissionType: 'unsigned'
  }
});

console.log(widgetData);

/* FUNCTIONS */
String.prototype.toCamelCase = function() {
  return this.replace(/^([A-Z])|[^A-Za-z]+(\w)/g, function(match, p1, p2, offset) {
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  }).replace(/([^A-Z-a-z])/g, '').toLowerCase();
};

var createBundleID = function(orgName, appName) {
  return $.ajax({
    url: "https://itunes.apple.com/lookup?bundleId=com." + orgName + "." + appName,
    dataType: "jsonp"
  });
};

function loadAppStoreData() {

  $('#appStoreConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* APP NAME */
    if (name === "fl-store-appName") {
      $('[name="' + name + '"]').val(appName);
      return;
    }

    /* APP SCREENSHOTS */
    if (name === "fl-store-screenshots") {
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
    if (name === "fl-store-availability") {
      $('[name="' + name + '"]').selectpicker('val', ((typeof widgetData.formData.appStore[name] !== "undefined") ? widgetData.formData.appStore[name] : []));
      return;
    }
    if (name === "fl-store-userCountry" || name === "fl-store-category1" || name === "fl-store-category2" || name === "fl-store-language") {
      $('[name="' + name + '"]').val(widgetData.formData.appStore[name]).trigger('change');
      return;
    }

    if (name === "fl-store-pricing") {
      $('[name="' + name + '"]').val((typeof widgetData.formData.appStore[name] !== "undefined") ? widgetData.formData.appStore[name] : 'free').trigger('change');
    }

    /* ADD KEYWORDS */
    if (name === "fl-store-keywords") {
      $('#' + name).tokenfield('setTokens', ((typeof widgetData.formData.appStore[name] !== "undefined") ? widgetData.formData.appStore[name] : ''));
    }

    /* ADD BUNDLE ID */
    if (name === "fl-store-bundleId" && typeof widgetData.formData.appStore[name] === "undefined") {
      createBundleID(organisationName.toCamelCase(), appName.toCamelCase()).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-ast-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
          $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
        } else {
          $('.bundleId-ast-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
          $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
        }
      });
      return;
    }
    if (name === "fl-store-bundleId" && typeof widgetData.formData.appStore[name] !== "undefined") {
      $('.bundleId-ast-text').html(widgetData.formData.appStore[name]);
      $('[name="' + name + '"]').val(widgetData.formData.appStore[name]);
      return;
    }

    $('[name="' + name + '"]').val(widgetData.formData.appStore[name]);
  });
}

function loadEnterpriseData() {

  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-enterprise-bundleId" && typeof widgetData.formData.enterprise[name] === "undefined") {
      createBundleID(organisationName.toCamelCase(), appName.toCamelCase()).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-ent-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
          $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
        } else {
          $('.bundleId-ent-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
          $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
        }
      });
      return;
    }
    if (name === "fl-enterprise-bundleId" && typeof widgetData.formData.enterprise[name] !== "undefined") {
      $('.bundleId-ent-text').html(widgetData.formData.enterprise[name]);
      $('[name="' + name + '"]').val(widgetData.formData.enterprise[name]);
      return;
    }

    $('[name="' + name + '"]').val(widgetData.formData.enterprise[name]);
  });
}

function loadUnsignedData() {

  $('#unsignedConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-unsigned-bundleId" && typeof widgetData.formData.unsigned[name] === "undefined") {
      createBundleID(organisationName.toCamelCase(), appName.toCamelCase()).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-uns-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
          $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase());
        } else {
          $('.bundleId-uns-text').html('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
          $('[name="' + name + '"]').val('com.' + organisationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
        }
      });
      return;
    }
    if (name === "fl-unsigned-bundleId" && typeof widgetData.formData.unsigned[name] !== "undefined") {
      $('.bundleId-uns-text').html(widgetData.formData.unsigned[name]);
      $('[name="' + name + '"]').val(widgetData.formData.unsigned[name]);
      return;
    }

    $('[name="' + name + '"]').val(widgetData.formData.unsigned[name]);
  });
}

function loadPushNotesData() {
  $('#pushConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    console.log(name);
    /* ADDING NOTIFICATIONS SETTINGS */
    if (name === 'fl-push-authKey') {
      $('[name="' + name + '"]').val(widgetData.formData.notificationSettings.apnAuthKey || '');
      return;
    }
    if (name === 'fl-push-keyId') {
      $('[name="' + name + '"]').val(widgetData.formData.notificationSettings.apnKeyId || '');
      return;
    }
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
  var data = widgetData.formData;
  data.requestCreatedAt = Date();
  data.requestBuild = true;

  if (origin === 'appStore') {
    data.appStore.splashScreen = appSettings.splashScreen;
    data.appStore.screensToScreenshot = appSettings.screensToScreenshot;
    data.appStore.appIcon = appIcon;
    data.submissionType = 'App Store';

    widgetData.formData = data;

    Fliplet.Widget.save(widgetData).then(function() {
      $('.save-' + origin + '-request').addClass('saved');

      setTimeout(function() {
        $('.save-' + origin + '-request').removeClass('saved');
      }, 4000);

      showRequestStatus();
      Fliplet.Widget.autosize();
    });
  }

  if (origin === 'enterprise') {
    data.enterprise.splashScreen = appSettings.splashScreen;
    data.enterprise.appIcon = appIcon;
    data.submissionType = 'Enterprise';

    widgetData.formData = data;

    Fliplet.Widget.save(widgetData).then(function() {
      $('.save-' + origin + '-request').addClass('saved');

      setTimeout(function() {
        $('.save-' + origin + '-request').removeClass('saved');
      }, 4000);

      showRequestStatus();
      Fliplet.Widget.autosize();
    });
  }

  if (origin === 'unsigned') {
    data.unsigned.splashScreen = appSettings.splashScreen;
    data.unsigned.appIcon = appIcon;
    data.submissionType = 'Unsigned';

    widgetData.formData = data;

    Fliplet.Widget.save(widgetData).then(function() {
      $('.save-' + origin + '-request').addClass('saved');

      setTimeout(function() {
        $('.save-' + origin + '-request').removeClass('saved');
      }, 4000);

      showRequestStatus();
      Fliplet.Widget.autosize();
    });

    Fliplet.App.Submissions.create({
      platform: 'ios',
      data: widgetData.formData.unsigned
    }).then(function(response) {
      console.log(response);
    }).catch(function(err) {
      alert(err.responseJSON.message);
    });
  }
}

function showRequestStatus() {
  if (widgetData.formData.requestBuild) {
    var requestCreatedAt = moment(widgetData.formData.requestCreatedAt).format('MMMM Do, YYYY - h:mm A');
    $('.app-status-panel .requestDate').html(requestCreatedAt);
    $('.app-status-panel .requestType').html(widgetData.formData.submissionType);
    $('.app-status').removeClass('hidden');
  }
}

function saveAppStoreData(request) {
  var data = widgetData.formData.appStore;
  var pushData = widgetData.formData.notificationSettings;

  $('#appStoreConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    /* PROCESSING KEYWORDS */
    if (name === 'fl-store-keywords') {
      var newValue = value.replace(/,\s+/g, ',');
      data[name] = newValue;
      return;
    }

    if (name === 'fl-store-teamId') {
      pushData.apnTeamId = value;
      data[name] = value;
      return;
    }

    if (name === 'fl-store-bundleId') {
      pushData.apnTopic = value;
      data[name] = value;
      return;
    }

    data[name] = value;
  });

  widgetData.formData.appStore = data;
  widgetData.formData.notificationSettings = pushData;

  if (request) {
    requestBuild('appStore');
  } else {
    save('appStore');
  }
}

function saveEnterpriseData(request) {
  var data = widgetData.formData.enterprise;
  var pushData = widgetData.formData.notificationSettings;

  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (name === 'fl-enterprise-teamId') {
      pushData.apnTeamId = value;
      data[name] = value;
      return;
    }

    if (name === 'fl-enterprise-bundleId') {
      pushData.apnTopic = value;
      data[name] = value;
      return;
    }

    data[name] = value;
  });

  widgetData.formData.enterprise = data;
  widgetData.formData.notificationSettings = pushData;

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

function savePushData() {
  var data = widgetData.formData.notificationSettings;

  $('#pushConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (name === 'fl-push-authKey') {
      data.apnAuthKey = value;
      return;
    }
    if (name === 'fl-push-keyId') {
      data.apnKeyId = value;
      return;
    }
  });

  data.apn = !!((data.apnAuthKey && data.apnAuthKey !== '') && (data.apnKeyId && data.apnKeyId !== '') && (data.apnTeamId && data.apnTeamId !== '') && (data.apnTopic && data.apnTopic !== ''));

  widgetData.formData.notificationSettings = data;

  console.log(widgetData);
  Fliplet.Widget.save(widgetData).then(function() {
    $('.save-push-progress').addClass('saved');

    setTimeout(function() {
      $('.save-push-progress').removeClass('saved');
    }, 4000);

    if (data.apn) {
      Fliplet.API.request({
        method: 'PUT',
        url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId'),
        data: data
      });
    }
  });
}

function init() {
  $('#fl-store-keywords').tokenfield();

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
  loadPushNotesData();
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

$('a[data-toggle="tab"').on('shown.bs.tab', function() {
    Fliplet.Widget.autosize();
  })
  .on('hidden.bs.tab', function() {
    Fliplet.Widget.autosize();
  });

$('[name="fl-store-keywords"]').on('tokenfield:createtoken', function(e) {
  var currentValue = e.currentTarget.value.replace(/,\s+/g, ',');
  var newValue = e.attrs.value;
  var oldAndNew = currentValue + ',' + newValue;

  if (oldAndNew.length > 100) {
    e.preventDefault();
  }
});

$('.redirectToSettings').on('click', function() {
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
    alert('Please fill in all the required information.');
  } else {
    event.preventDefault();

    if (allAppData) {
      saveAppStoreData(true);
    } else {
      alert('Please configure your App Settings to contain the required information.');
    }
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
  }
});

$('#enterpriseConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    alert('Please fill in all the required information.');
  } else {
    event.preventDefault();

    if (allAppData) {
      saveEnterpriseData(true);
    } else {
      alert('Please configure your App Settings to contain the required information.');
    }
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
  }
});

$('#unsignedConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    alert('Please fill in all the required information.');
  } else {
    event.preventDefault();

    if (allAppData) {
      saveUnsignedData(true);
    } else {
      alert('Please configure your App Settings to contain the required information.');
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
$('[data-push-save]').on('click', function() {
  savePushData();
});

/* INIT */
$('[name="submissionType"][value="appStore"]').prop('checked', true).trigger('change');

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
