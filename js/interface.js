var widgetId = Fliplet.Widget.getDefaultId();
var widgetData = Fliplet.Widget.getData(widgetId) || {};
var appName = '';
var organizationName = '';
var appIcon = '';
var appSettings = {};
var allAppData = [];
var appStoreSubmission = {};
var enterpriseSubmission = {};
var unsignedSubmission = {};
var notificationSettings = {};
var appInfo;
var statusTableTemplate = $('#status-table-template').html();
var $statusAppStoreTableElement = $('.app-build-appstore-status-holder');
var $statusEnterpriseTableElement = $('.app-build-enterprise-status-holder');
var $statusUnsignedTableElement = $('.app-build-unsigned-status-holder');
var initLoad;
var userInfo;

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

function incrementVersionNumber(versionNumber) {
  var splitNumber = versionNumber.split('.');
  var arrLength = splitNumber.length;

  while (arrLength--) {
    if (splitNumber[arrLength] < 99) {
      splitNumber[arrLength] = parseInt(splitNumber[arrLength], 10) + 1;
      break;
    }
  }

  return splitNumber.join('.');
}

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
        appStoreSubmission.data.appScreenshots = appSettings.screensToScreenshot;
      }
      $('[name="' + name + '"]').val(screenNames);
      return;
    }

    /* CHECK COUNTRIES */
    if (name === "fl-store-availability") {
      $('[name="' + name + '"]').selectpicker('val', ((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : []));
      return;
    }
    if (name === "fl-store-userCountry" || name === "fl-store-category1" || name === "fl-store-category2" || name === "fl-store-language") {
      $('[name="' + name + '"]').val((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : '').trigger('change');
      return;
    }

    /* ADD KEYWORDS */
    if (name === "fl-store-keywords") {
      $('#' + name).tokenfield('setTokens', ((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : ''));
    }

    /* ADD BUNDLE ID */
    if (name === "fl-store-bundleId" && typeof appStoreSubmission.data[name] === "undefined") {
      createBundleID(organizationName.toCamelCase(), appName.toCamelCase()).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-ast-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
        } else {
          $('.bundleId-ast-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
        }
      });
      return;
    }
    if (name === "fl-store-bundleId" && typeof appStoreSubmission.data[name] !== "undefined") {
      $('.bundleId-ast-text').html(appStoreSubmission.data[name]);
      $('[name="' + name + '"]').val(appStoreSubmission.data[name]);
      return;
    }

    if (name === "_fl-store-appDevPass") {
      if (appStoreSubmission.data[name] !== "") {
        $('[name="' + name + '"]').removeAttr('required');
        $('[name="' + name + '"] ~ .hasPassword').removeClass('hidden');
      }
      return;
    }

    if (name === "fl-store-versionNumber") {
      if (typeof appStoreSubmission.data[name] !== 'undefined' && appStoreSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.data[name]);
      } else if (typeof appStoreSubmission.previousResults !== 'undefined' && typeof appStoreSubmission.previousResults.versionNumber !== 'undefined' && appStoreSubmission.previousResults.versionNumber !== '') {
        $('[name="' + name + '"]').val(appStoreSubmission.previousResults.versionNumber);
      } else {
        $('[name="' + name + '"]').val('1.0.0');
      }
      return;
    }

    $('[name="' + name + '"]').val((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : '');
  });

  if (appName !== '' && appIcon && (appSettings.screensToScreenshot && appSettings.screensToScreenshot.length)) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }
    if (appSettings.iconData && appSettings.iconData.size && (appSettings.iconData.size[0] && appSettings.iconData.size[1]) < 1024) {
      $('.app-details-appStore .app-icon-name').addClass('has-error');
    }
    allAppData.push('appStore');
  } else {
    $('.app-details-appStore').addClass('required-fill');

    if (appName === '') {
      $('.app-details-appStore .app-list-name').addClass('has-error');
    }
    if (!appIcon || !appSettings.iconData || !appSettings.iconData.size || (appSettings.iconData.size[0] && appSettings.iconData.size[1]) < 1024) {
      $('.app-details-appStore .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }
    if (!appSettings.screensToScreenshot || !appSettings.screensToScreenshot.length) {
      $('.app-details-appStore .app-screenshots').addClass('has-error');
    }
  }
}

function loadEnterpriseData() {

  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-ent-bundleId" && typeof enterpriseSubmission.data[name] === "undefined") {
      createBundleID(organizationName.toCamelCase(), appName.toCamelCase()).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-ent-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
        } else {
          $('.bundleId-ent-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
        }
      });
      return;
    }
    if (name === "fl-ent-bundleId" && typeof enterpriseSubmission.data[name] !== "undefined") {
      $('.bundleId-ent-text').html(enterpriseSubmission.data[name]);
      $('[name="' + name + '"]').val(enterpriseSubmission.data[name]);
      return;
    }
    if (name === "_fl-ent-appDevPass") {
      if (enterpriseSubmission.data[name] !== "") {
        $('[name="' + name + '"]').removeAttr('required');
        $('[name="' + name + '"] ~ .hasPassword').removeClass('hidden');
      }
      return;
    }
    if (name === "fl-ent-versionNumber") {
      if (typeof enterpriseSubmission.data[name] !== 'undefined' && enterpriseSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.data[name]);
      } else if (typeof enterpriseSubmission.previousResults !== 'undefined' && typeof enterpriseSubmission.previousResults.versionNumber !== 'undefined' && enterpriseSubmission.previousResults.versionNumber !== '') {
        $('[name="' + name + '"]').val(enterpriseSubmission.previousResults.versionNumber);
      } else {
        $('[name="' + name + '"]').val('1.0.0');
      }
      return;
    }

    $('[name="' + name + '"]').val((typeof enterpriseSubmission.data[name] !== "undefined") ? enterpriseSubmission.data[name] : '');
  });

  if (appIcon) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-ent .app-splash-screen').addClass('has-warning');
    }
    if (appSettings.iconData && appSettings.iconData.size && (appSettings.iconData.size[0] && appSettings.iconData.size[1]) < 1024) {
      $('.app-details-ent .app-icon-name').addClass('has-error');
    }
    allAppData.push('enterprise');
  } else {
    $('.app-details-ent').addClass('required-fill');

    if (!appIcon || !appSettings.iconData || !appSettings.iconData.size || (appSettings.iconData.size[0] && appSettings.iconData.size[1]) < 1024) {
      $('.app-details-ent .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-ent .app-splash-screen').addClass('has-warning');
    }
  }
}

function loadUnsignedData() {

  $('#unsignedConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-uns-bundleId" && typeof unsignedSubmission.data[name] === "undefined") {
      createBundleID(organizationName.toCamelCase(), appName.toCamelCase()).then(function(response) {
        if (response.resultCount === 0) {
          $('.bundleId-uns-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase());
        } else {
          $('.bundleId-uns-text').html('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
          $('[name="' + name + '"]').val('com.' + organizationName.toCamelCase() + '.' + appName.toCamelCase() + (response.resultCount + 1));
        }
      });
      return;
    }
    if (name === "fl-uns-bundleId" && typeof unsignedSubmission.data[name] !== "undefined") {
      $('.bundleId-uns-text').html(unsignedSubmission.data[name]);
      $('[name="' + name + '"]').val(unsignedSubmission.data[name]);
      return;
    }
    if (name === "fl-uns-versionNumber") {
      if (typeof unsignedSubmission.data[name] !== 'undefined' && unsignedSubmission.data[name] !== '') {
        $('[name="' + name + '"]').val(unsignedSubmission.data[name]);
      } else if (typeof unsignedSubmission.previousResults !== 'undefined' && typeof unsignedSubmission.previousResults.versionNumber !== 'undefined' && unsignedSubmission.previousResults.versionNumber !== '') {
        $('[name="' + name + '"]').val(unsignedSubmission.previousResults.versionNumber);
      } else {
        $('[name="' + name + '"]').val('1.0.0');
      }
      return;
    }

    $('[name="' + name + '"]').val((typeof unsignedSubmission.data[name] !== "undefined") ? unsignedSubmission.data[name] : '');
  });

  if (appIcon) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-uns .app-splash-screen').addClass('has-warning');
    }
    if (appSettings.iconData && appSettings.iconData.size && (appSettings.iconData.size[0] && appSettings.iconData.size[1]) < 1024) {
      $('.app-details-uns .app-icon-name').addClass('has-error');
    }
    allAppData.push('unsigned');
  } else {
    $('.app-details-uns').addClass('required-fill');

    if (!appIcon || !appSettings.iconData || !appSettings.iconData.size || (appSettings.iconData.size[0] && appSettings.iconData.size[1]) < 1024) {
      $('.app-details-uns .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-uns .app-splash-screen').addClass('has-warning');
    }
  }
}


function loadPushNotesData() {
  $('#pushConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    // ADDING NOTIFICATIONS SETTINGS
    if (name === 'fl-push-authKey') {
      $('[name="' + name + '"]').val(notificationSettings.apnAuthKey || '');
      return;
    }
    if (name === 'fl-push-keyId') {
      $('[name="' + name + '"]').val(notificationSettings.apnKeyId || '');
      return;
    }
  });
}

function submissionBuild(appSubmission, origin) {
  Fliplet.App.Submissions.build(appSubmission.id).then(function(builtSubmission) {

    if (origin === "appStore") {
      appStoreSubmission = builtSubmission.submission;
      // Auto increments the version number and saves the submission
      var newVersionNumber = incrementVersionNumber(appStoreSubmission.data['fl-store-versionNumber']);
      $('[name="fl-store-versionNumber"]').val(newVersionNumber);
      saveAppStoreData();
    }
    if (origin === "enterprise") {
      enterpriseSubmission = builtSubmission.submission;
      // Auto increments the version number and saves the submission
      var newVersionNumber = incrementVersionNumber(enterpriseSubmission.data['fl-ent-versionNumber']);
      $('[name="fl-ent-versionNumber"]').val(newVersionNumber);
      saveEnterpriseData();
    }
    if (origin === "unsigned") {
      unsignedSubmission = builtSubmission.submission;
      // Auto increments the version number and saves the submission
      var newVersionNumber = incrementVersionNumber(unsignedSubmission.data['fl-uns-versionNumber']);
      $('[name="fl-uns-versionNumber"]').val(newVersionNumber);
      saveUnsignedData();
    }

    Fliplet.Studio.emit('refresh-app-submissions');

    $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
    $('.save-' + origin + '-request').addClass('saved');

    setTimeout(function() {
      $('.save-' + origin + '-request').removeClass('saved');
    }, 10000);
  }, function(err) {
    $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
    alert(err.responseJSON.message);
  });
}

function save(origin, submission) {

  Fliplet.App.Submissions.get()
    .then(function(submissions) {
      var savedSubmission = _.find(submissions, function(sub) {
        return sub.id === submission.id;
      });

      submission = _.extend(savedSubmission, submission);
      return Promise.resolve();
    })
    .then(function() {
      if (submission.status !== 'started') {
        return Fliplet.App.Submissions.create({
            platform: 'ios',
            data: $.extend(true, submission.data, {
              previousResults: submission.result
            })
          })
          .then(function(newSubmission) {
            if (origin === "appStore") {
              appStoreSubmission = newSubmission;
            }
            if (origin === "enterprise") {
              enterpriseSubmission = newSubmission;
            }
            if (origin === "unsigned") {
              unsignedSubmission = newSubmission;
            }

            Fliplet.App.Submissions.update(newSubmission.id, newSubmission.data).then(function() {
              $('.save-' + origin + '-progress').addClass('saved');

              setTimeout(function() {
                $('.save-' + origin + '-progress').removeClass('saved');
              }, 4000);
            });

          });
      }

      Fliplet.App.Submissions.update(submission.id, submission.data).then(function() {
        $('.save-' + origin + '-progress').addClass('saved');

        setTimeout(function() {
          $('.save-' + origin + '-progress').removeClass('saved');
        }, 4000);
      });
    })
    .catch(function(err) {
      alert(err.responseJSON.message);
    });
}

function requestBuild(origin, submission) {
  $('.button-' + origin + '-request').html('Requesting <i class="fa fa-spinner fa-pulse fa-fw"></i>');

  if (origin === 'appStore') {
    submission.data.screensToScreenshot = appSettings.screensToScreenshot;
  }

  var defaultSplashScreenData = {
    "url": $('[data-' + origin.toLowerCase() + '-default-splash-url]').data(origin.toLowerCase() + '-default-splash-url')
  };

  submission.data.splashScreen = appSettings.splashScreen ? appSettings.splashScreen : defaultSplashScreenData;
  submission.data.appIcon = appIcon;
  submission.data.legacyBuild = appSettings.legacyBuild || false;

  Fliplet.App.Submissions.get()
    .then(function(submissions) {
      var savedSubmission = _.find(submissions, function(sub) {
        return sub.id === submission.id;
      });

      submission = _.extend(savedSubmission, submission);
      return Promise.resolve();
    })
    .then(function() {
      if (submission.status !== 'started') {
        return Fliplet.App.Submissions.create({
            platform: 'ios',
            data: $.extend(true, submission.data, {
              previousResults: submission.result
            })
          })
          .then(function(newSubmission) {
            if (origin === "appStore") {
              appStoreSubmission = newSubmission;
            }
            if (origin === "enterprise") {
              enterpriseSubmission = newSubmission;
            }
            if (origin === "unsigned") {
              unsignedSubmission = newSubmission;
            }

            submissionBuild(newSubmission, origin);
          });
      }

      Fliplet.App.Submissions.update(submission.id, submission.data).then(function() {
        submissionBuild(submission, origin);
      });
    })
    .catch(function(err) {
      $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
      alert(err.responseJSON.message);
    });
}

function saveAppStoreData(request) {
  var data = appStoreSubmission.data;
  var pushData = notificationSettings;

  $('#appStoreConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (name === "_fl-store-appDevPass") {
      if (data[name] !== '' && value === '') {
        return;
      }
    }

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

  appStoreSubmission.data = data;
  notificationSettings = pushData;

  if (request) {
    requestBuild('appStore', appStoreSubmission);
  } else {
    save('appStore', appStoreSubmission);
  }
}

function saveEnterpriseData(request) {
  var data = enterpriseSubmission.data;
  var pushData = notificationSettings;

  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (name === "_fl-ent-appDevPass") {
      if (data[name] !== '' && value === '') {
        return;
      }
    }
    
    if (name === 'fl-ent-teamId') {
      pushData.apnTeamId = value;
      data[name] = value;
      return;
    }

    if (name === 'fl-ent-bundleId') {
      pushData.apnTopic = value;
      data[name] = value;
      return;
    }

    data[name] = value;
  });

  enterpriseSubmission.data = data;
  notificationSettings = pushData;

  if (request) {
    requestBuild('enterprise', enterpriseSubmission);
  } else {
    save('enterprise', enterpriseSubmission);
  }
}

function saveUnsignedData(request) {
  var data = unsignedSubmission.data;

  $('#unsignedConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    data[name] = value;
  });

  unsignedSubmission.data = data;

  if (request) {
    requestBuild('unsigned', unsignedSubmission);
  } else {
    save('unsigned', unsignedSubmission);
  }
}

function savePushData() {
  var data = notificationSettings;

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

  notificationSettings = data;

  Fliplet.API.request({
    method: 'PUT',
    url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId'),
    data: notificationSettings
  }).then(function() {
    $('.save-push-progress').addClass('saved');
    if (!notificationSettings.apn) {
      alert('You will need to fill in the Bundle ID and Team ID (App Store and Enterprise only) fields and request an app.');
    }

    setTimeout(function() {
      $('.save-push-progress').removeClass('saved');
    }, 4000);
  });
}

function init() {
  Fliplet.Apps.get().then(function(apps) {
    appInfo = _.find(apps, function(app) {
      return app.id === Fliplet.Env.get('appId');
    });
  });

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

  loadAppStoreData();
  loadEnterpriseData();
  loadUnsignedData();
  loadPushNotesData();
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
      $(el).not('.app-details-appStore, .app-details-ent, .app-details-uns').removeClass('required-fill');
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

$('.redirectToSettings, [data-change-settings]').on('click', function(event) {
  event.preventDefault();

  Fliplet.Studio.emit('navigate', {
    name: 'appSettings',
    params: {
      appId: Fliplet.Env.get('appId')
    }
  });
});

$('[data-change-assets]').on('click', function(event) {
  event.preventDefault();

  Fliplet.Studio.emit('navigate', {
    name: 'launchAssets',
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
    return;
  }

  event.preventDefault();

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('appStore') > -1) {
      var requestAppConfirm;

      if (appStoreSubmission.status === "started") {
        requestAppConfirm = confirm("Are you sure you wish to request your app to be published?");
      } else {
        requestAppConfirm = confirm("Are you sure you wish to update your published app?");
      }

      if (requestAppConfirm) {
        saveAppStoreData(true);
      }
    } else {
      alert('Please configure your App Settings to contain the required information.');
    }
  } else {
    alert('You need to publish this app first.\nGo to "Step 1. Prepare your app" to publish your app.');
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

$('#enterpriseConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    alert('Please fill in all the required information.');
    return;
  }

  event.preventDefault();

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('enterprise') > -1) {
      var requestAppConfirm;

      if (enterpriseSubmission.status === "started") {
        requestAppConfirm = confirm("Are you sure you wish to request your app to be published?");
      } else {
        requestAppConfirm = confirm("Are you sure you wish to update your published app?");
      }

      if (requestAppConfirm) {
        saveEnterpriseData(true);
      }
    } else {
      alert('Please configure your App Settings to contain the required information.');
    }
  } else {
    alert('You need to publish this app first.\nGo to "Step 1. Prepare your app" to publish your app.');
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

$('#unsignedConfiguration').validator().on('submit', function(event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    alert('Please fill in all the required information.');
    return;
  }

  event.preventDefault();

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('unsigned') > -1) {
      var requestAppConfirm;

      if (unsignedSubmission.status === "started") {
        requestAppConfirm = confirm("Are you sure you wish to request your app to be published?");
      } else {
        requestAppConfirm = confirm("Are you sure you wish to update your published app?");
      }

      if (requestAppConfirm) {
        saveUnsignedData(true);
      }
    } else {
      alert('Please configure your App Settings to contain the required information.');
    }
  } else {
    alert('You need to publish this app first.\nGo to "Step 1. Prepare your app" to publish your app.');
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
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
$('#appStoreConfiguration, #enterpriseConfiguration, #unsignedConfiguration').validator().off('change.bs.validator focusout.bs.validator');
$('[name="submissionType"][value="appStore"]').prop('checked', true).trigger('change');

function compileStatusTable(withData, origin, buildsData) {
  if (withData) {
    var template = Handlebars.compile(statusTableTemplate);
    var html = template(buildsData);

    if (origin === "appStore") {
      $statusAppStoreTableElement.html(html);
    }
    if (origin === "enterprise") {
      $statusEnterpriseTableElement.html(html);
    }
    if (origin === "unsigned") {
      $statusUnsignedTableElement.html(html);
    }
  } else {
    if (origin === "appStore") {
      $statusAppStoreTableElement.html('');
    }
    if (origin === "enterprise") {
      $statusEnterpriseTableElement.html('');
    }
    if (origin === "unsigned") {
      $statusUnsignedTableElement.html('');
    }
  }

  Fliplet.Widget.autosize();
}

function checkSubmissionStatus(origin, iosSubmissions) {
  var submissionsToShow = _.filter(iosSubmissions, function(submission) {
    return submission.status === "queued" || submission.status === "submitted" || submission.status === "processing" || submission.status === "completed" || submission.status === "failed" || submission.status === "cancelled";
  });

  var buildsData = [];
  if (submissionsToShow.length) {
    submissionsToShow.forEach(function(submission) {
      var build = {};
      var appBuild;
      var debugHtmlPage;

      if (submission.result.appBuild && submission.result.appBuild.files) {
        appBuild = _.find(submission.result.appBuild.files, function(file) {
          var dotIndex = file.url.lastIndexOf('.');
          var ext = file.url.substring(dotIndex);
          if (ext === '.ipa') {
            return true;
          }
        });
      } else if (submission.data.previousResults && submission.data.previousResults.appBuild && submission.data.previousResults.appBuild.files) {
        appBuild = _.find(submission.data.previousResults.appBuild.files, function(file) {
          var dotIndex = file.url.lastIndexOf('.');
          var ext = file.url.substring(dotIndex);
          if (ext === '.ipa') {
            return true;
          }
        });
      }

      if (submission.result.debugHtmlPage && submission.result.debugHtmlPage.files) {
        debugHtmlPage = _.find(submission.result.debugHtmlPage.files, function(file) {
          var dotIndex = file.url.lastIndexOf('.');
          var ext = file.url.substring(dotIndex);
          if (ext === '.html') {
            return true;
          }
        });
      } else if (submission.data.previousResults && submission.data.previousResults.debugHtmlPage && submission.data.previousResults.debugHtmlPage.files) {
        debugHtmlPage = _.find(submission.data.previousResults.debugHtmlPage.files, function(file) {
          var dotIndex = file.url.lastIndexOf('.');
          var ext = file.url.substring(dotIndex);
          if (ext === '.html') {
            return true;
          }
        });
      }

      build.id = submission.id;
      build.updatedAt = ((submission.status === 'completed' || submission.status === 'failed' || submission.status === "cancelled") && submission.updatedAt) ?
        moment(submission.updatedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build.submittedAt = ((submission.status === 'queued' || submission.status === 'submitted') && submission.submittedAt) ?
        moment(submission.submittedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build[submission.status] = true;
      build.fileUrl = appBuild ? appBuild.url : '';

      if (userInfo.user.isAdmin || userInfo.user.isImpersonating) {
        build.debugFileUrl = debugHtmlPage ? debugHtmlPage.url : '';
      }

      buildsData.push(build);
    });

    compileStatusTable(true, origin, buildsData);
  } else {
    compileStatusTable(false, origin);
  }
}

function submissionChecker(submissions) {
  var asub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "appStore" && submission.platform === "ios";
  });

  checkSubmissionStatus("appStore", asub);

  asub = _.maxBy(asub, function(el) {
    return new Date(el.updatedAt).getTime();
  });
  appStoreSubmission = asub;

  var esub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "enterprise" && submission.platform === "ios";
  });

  checkSubmissionStatus("enterprise", esub);

  esub = _.maxBy(esub, function(el) {
    return new Date(el.updatedAt).getTime();
  });
  enterpriseSubmission = esub;

  var usub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "unsigned" && submission.platform === "ios";
  });

  checkSubmissionStatus("unsigned", usub);

  usub = _.maxBy(usub, function(el) {
    return new Date(el.updatedAt).getTime();
  });
  unsignedSubmission = usub;

  if (_.isEmpty(appStoreSubmission)) {
    Fliplet.App.Submissions.create({
        platform: 'ios',
        data: {
          submissionType: "appStore"
        }
      })
      .then(function(submission) {
        appStoreSubmission = submission;
      });
  }

  if (_.isEmpty(enterpriseSubmission)) {
    Fliplet.App.Submissions.create({
        platform: 'ios',
        data: {
          submissionType: "enterprise"
        }
      })
      .then(function(submission) {
        enterpriseSubmission = submission;
      });
  }

  if (_.isEmpty(unsignedSubmission)) {
    Fliplet.App.Submissions.create({
        platform: 'ios',
        data: {
          submissionType: "unsigned"
        }
      })
      .then(function(submission) {
        unsignedSubmission = submission;
      });
  }
}

function iosSubmissionChecker(submissions) {
  var asub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "appStore" && submission.platform === "ios";
  });

  var esub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "enterprise" && submission.platform === "ios";
  });

  var usub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "unsigned" && submission.platform === "ios";
  });

  checkSubmissionStatus("appStore", asub);
  checkSubmissionStatus("enterprise", esub);
  checkSubmissionStatus("unsigned", usub);
}

function getSubmissions() {
  return Fliplet.App.Submissions.get();
}

function initialLoad(initial, timeout) {
  if (!initial) {
    initLoad = setTimeout(function() {
      getSubmissions()
        .then(function(submissions) {
          iosSubmissionChecker(submissions);
          initialLoad(false, 15000);
        });
    }, timeout);
  } else {
    getSubmissions()
      .then(function(submissions) {

        if (!submissions.length) {
          return Promise.all([
            Fliplet.App.Submissions.create({
              platform: 'ios',
              data: {
                submissionType: "appStore"
              }
            })
            .then(function(submission) {
              appStoreSubmission = submission;
            }),
            Fliplet.App.Submissions.create({
              platform: 'ios',
              data: {
                submissionType: "unsigned"
              }
            })
            .then(function(submission) {
              unsignedSubmission = submission;
            }),
            Fliplet.App.Submissions.create({
              platform: 'ios',
              data: {
                submissionType: "enterprise"
              }
            })
            .then(function(submission) {
              enterpriseSubmission = submission;
            })
          ]);
        }

       return Fliplet.API.request({
          cache: true,
          url: 'v1/user'
        })
        .then(function(user) {
          userInfo = user;
          submissionChecker(submissions);
          return Promise.resolve();
        });
      })
      .then(function() {
        // Fliplet.Env.get('appId')
        // Fliplet.Env.get('appName')
        // Fliplet.Env.get('appSettings')

        return Promise.all([
          Fliplet.API.request({
            cache: true,
            url: 'v1/apps/' + Fliplet.Env.get('appId')
          })
          .then(function(result) {
            appName = result.app.name;
            appIcon = result.app.icon;
            appSettings = result.app.settings;
          }),
          Fliplet.API.request({
            cache: true,
            url: 'v1/organizations/' + Fliplet.Env.get('organizationId')
          })
          .then(function(org) {
            organizationName = org.name;
          })
        ]);
      })
      .then(function() {
        return Fliplet.API.request({
          method: 'GET',
          url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId')
        });
      }).then(function(response) {
        if (response.widgetInstance.settings && response.widgetInstance.settings) {
          notificationSettings = response.widgetInstance.settings;
        } else {
          notificationSettings = {};
        }

        init();
        initialLoad(false, 5000);
      });
  }
}

// Start
initLoad = initialLoad(true, 0);
