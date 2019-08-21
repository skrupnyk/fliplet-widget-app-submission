var widgetId = Fliplet.Widget.getDefaultId();
var widgetData = Fliplet.Widget.getData(widgetId) || {};
var appName = '';
var organizationName = '';
var appIcon = '';
var appSettings = {};
var allAppData = [];
var appStoreLoggedIn = false;
var enterpriseLoggedIn = false;
var appStoreCertificateCreated = false;
var appStoreCertificateReplaced = false;
var enterpriseCertificateCreated = false;
var enterpriseCertificateReplaced = false;
var previousAppStoreSubmission = {};
var previousEnterpriseStoreSubmission = {};
var appStorePreviousCredential = undefined;
var appStoreFileField = undefined;
var appStoreTeamId = undefined;
var enterprisePreviousCredential = undefined;
var enterpriseFileField = undefined;
var enterpriseFileFieldManual = undefined;
var enterpriseFileProvisionFieldManual = undefined;
var enterpriseTeamId = undefined;
var enterpriseManual = false;
var appStoreSubmissionInStore = false;
var appStoreSubmission = {};
var enterpriseSubmission = {};
var unsignedSubmission = {};
var notificationSettings = {};
var appInfo;
var demoUser;
var userInput = false;
var autoFill = 0;
var statusTableTemplate = $('#status-table-template').html();
var $statusAppStoreTableElement = $('.app-build-appstore-status-holder');
var $statusEnterpriseTableElement = $('.app-build-enterprise-status-holder');
var $statusUnsignedTableElement = $('.app-build-unsigned-status-holder');
var initLoad;
var organizationID = Fliplet.Env.get('organizationId');
var userInfo;
var hasFolders = false;
// Each collection requirement will need to match at least one of the width/height sizes
var screenshotRequirements = [
  {
    type: 'mobile',
    name: 'iPhone 5.5-inch',
    sizes: [[1242, 2208]],
    screenshots: []
  },
  {
    type: 'mobilex',
    name: 'iPhone 6.5-inch',
    sizes: [[1242, 2688]],
    screenshots: []
  },
  {
    type: 'tablet',
    name: 'iPad Pro 12.9-inch',
    sizes: [[2048, 2732], [2732, 2048]],
    screenshots: []
  }
];
var hasAllScreenshots = false;
var screenshotValidationNotRequired = false;
var spinner = '<i class="fa fa-spinner fa-pulse fa-fw fa-lg"></i>';

var socketRequiresLogin = true;
var socket = Fliplet.Socket({
  login: socketRequiresLogin
});
var socketClientId;

/* ERROR MESSAGES */

var ERRORS = {
  INVALID_VERSION: 'The version number is incorrect. Please use a 3-part version number such as 1.0.0 where each part is no larger than 99.'
};

/* FUNCTIONS */
String.prototype.toCamelCase = function () {
  return this.replace(/^([A-Z])|[^A-Za-z]+(\w)/g, function (match, p1, p2, offset) {
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  }).replace(/([^A-Z-a-z])/g, '').toLowerCase();
};

function socketIsReady() {
  return socket.connected && (!socketRequiresLogin || socket.loggedIn);
}

function waitForSocketConnection() {
  if (socketIsReady()) {
    return Promise.resolve();
  }

  var interval;

  return new Promise(function (resolve) {
    interval = setInterval(function () {
      if (!socketIsReady()) {
        return;
      }

      clearInterval(interval);
      resolve();
    }, 200);
  });
}

function createBundleID(orgName, appName) {
  return $.ajax({
    url: "https://itunes.apple.com/lookup?bundleId=com." + orgName + "." + appName,
    dataType: "jsonp"
  });
}

function incrementVersionNumber(versionNumber) {
  var splitNumber = _.compact(versionNumber.split('.'));
  var arrLength = splitNumber.length;

  while (arrLength--) {
    if (splitNumber[arrLength] < 99) {
      splitNumber[arrLength] = parseInt(splitNumber[arrLength], 10) + 1;
      break;
    }
  }

  return splitNumber.join('.');
}

function checkHasAllScreenshots() {
  hasAllScreenshots = hasFolders && _.every(screenshotRequirements, function (req) {
    return req.screenshots.length;
  });
  return hasAllScreenshots;
}

function addThumb(thumb) {
  var template = Fliplet.Widget.Templates['templates.thumbs'];
  return template(thumb);
}

function addNoScreenshotWarning(req) {
  var template = Fliplet.Widget.Templates['templates.no-thumb'];
  return template(req);
}

function addScreenshotThumbContainers() {
  var template = Fliplet.Widget.Templates['templates.thumb-containers'];
  $('.screenshot-thumb-containers').html(template(screenshotRequirements));
}

function loadAppStoreData() {
  addScreenshotThumbContainers();
  $('#appStoreConfiguration [name]').each(function (i, el) {
    var name = $(el).attr("name");

    var hasAppId = !_.isUndefined(appStoreSubmission.data['iTunesAppId']);

    /* APP NAME */
    if (name === "fl-store-appName") {
      var storeAppName = !_.isUndefined(appStoreSubmission.data[name])
        ? appStoreSubmission.data[name]
        : appName;
      var maxLength = parseInt($('[name="' + name + '"]').attr('maxlength'), 10) || -1;
      if (maxLength > -1) {
        storeAppName = storeAppName.substr(0, maxLength);
      }
      $('[name="' + name + '"]').val(storeAppName);

      // Makes sure app store name is read-only if it's already provided
      // if (!_.isUndefined($('[name="' + name + '"]').val()) && hasAppId) {
      //   $('[name="' + name + '"]').prop('readonly', true);
      // }
      return;
    }

    if (name === "fl-store-screenshots") {
      if ($('[name="' + name + '"][value="' + appStoreSubmission.data[name] + '"]:checked').length) {
        return;
      }

      if (appStoreSubmission.data[name]) {
        $('[name="' + name + '"][value="' + appStoreSubmission.data[name] + '"]').prop('checked', true).trigger('change');
        screenshotValidationNotRequired = appStoreSubmission.data[name] === 'existing'
      } else if ($('[name="' + name + '"][value="new"]:checked').length) {
        return;
      } else {
        $('[name="' + name + '"][value="new"]').prop('checked', true).trigger('change');
      }

      return;
    }

    /* CHECK COUNTRIES */
    if (name === "fl-store-availability") {
      $('[name="' + name + '"]').selectpicker('val', ((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : []));
      return;
    }
    if (name === "fl-store-userCountry" || name === "fl-store-category1" || name === "fl-store-category2" || name === "fl-store-language") {
      $('[name="' + name + '"]').val((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : '').trigger('change');

      if (name === "fl-store-language" && !_.isUndefined($('[name="' + name + '"]').val()) && (hasAppId || appStoreSubmissionInStore)) {
        $('.dll-store-language').addClass('hidden');
        $('#fl-store-language').prop('required', false);
        $('.fl-store-language-placeholder').removeClass('hidden');
      }
      return;
    }

    /* ADD KEYWORDS */
    if (name === "fl-store-keywords") {
      $('#' + name).tokenfield('setTokens', ((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : ''));
    }

    /* ADD BUNDLE ID */
    if (name === "fl-store-bundleId" && typeof appStoreSubmission.data[name] === "undefined") {
      createBundleID(organizationName.toCamelCase(), appName.toCamelCase()).then(function (response) {
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

    if (name === "fl-store-distribution") {
      if (appStoreSubmission.data[name]) {
        $('[name="' + name + '"][value="' + appStoreSubmission.data[name] + '"]').prop('checked', true).trigger('change');
      } else {
        $('[name="' + name + '"][value="generate-file"]').prop('checked', true).trigger('change');
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

    /* Manual release */
    if (name === "fl-store-manualRelease") {
      if (!_.isUndefined(appStoreSubmission.data[name])) {
        $('#' + name).prop('checked', appStoreSubmission.data[name]);
      }

      return;
    }

    /* Review notes */
    if (name === "fl-store-revNotes") {
      // avoid resetting to empty string since this field has a default value
      if (appStoreSubmission.data[name]) {
        $('[name="' + name + '"]').val(appStoreSubmission.data[name]);
      }

      return;
    }

    $('[name="' + name + '"]').val((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : '');
  });

  // Saving 'demo user' value from API to compare it in checkDemoUser function
  demoUser = appStoreSubmission.data['fl-store-revDemoUser'];
  
  // When all data is loaded we can check if demo user was saved before
  checkDemoUser();

  if (appName !== '' && appIcon && (checkHasAllScreenshots() || screenshotValidationNotRequired)) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }

    $('.app-details-appStore .app-screenshots').removeClass('has-error');

    allAppData.push('appStore');
  } else {
    if (appName === '') {
      $('.app-details-appStore .app-list-name').addClass('has-error');
    }
    if (!appIcon) {
      $('.app-details-appStore .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }

    if ($('[name="fl-store-screenshots"]:checked').val() === 'new'
      && (!hasFolders || _.some(screenshotRequirements, function (req) {
        return !req.screenshots.length;
      }))
    ) {
      $('.app-details-appStore .app-screenshots').addClass('has-error');
    }
  }

  // Try to automatically login
  if (appStoreSubmission.data && appStoreSubmission.data['fl-credentials']) {
    // Submission data contains credential key
    var $loginButton = $('.login-appStore-button');
    toggleLoginForm('enterprise', 'logging-in');

    getCredential(appStoreSubmission.data['fl-credentials'])
      .then(function (credential) {
        if (credential && credential.appPassword) {
          // Restore app-specific password
          $('#fl-store-appPassword').val(credential.appPassword);
        }

        if (!credential || !credential.email) {
          // Allow users to manually log in if no email is found in credential
          toggleLoginForm('app-store', 'login');
          return;
        }

        return appStoreTeamSetup(credential.email);
      })
      .catch(function (error) {
        // Allow users to manually log in if an error is encountered
        toggleLoginForm('app-store', 'login');
      });
  }
}

function clearAppStoreCredentials() {
  return setCredentials(appStoreSubmission.id, {
    email: null,
    password: null,
    teamId: null
  }, false)
    .then(function () {
      appStoreLoggedIn = false;
      toggleLoginForm('app-store', 'login');
    });
}

function loadAppStoreTeams(devEmail) {
  // We're avoiding making both calls in one go with Promise.all() to avoid 2FA requests being received twice
  return getTeams(appStoreSubmission.id, true)
    .then(function (itunesTeams) {
      return Promise.all([
        Promise.resolve(itunesTeams),
        getTeams(appStoreSubmission.id, false)
      ]);
    })
    .then(function (teams) {
      var itunesTeams = teams[0];
      var appStoreTeams = teams[1];

      appStoreTeams = _.filter(appStoreTeams, function (team) {
        var itunesTeam = _.find(itunesTeams, function (itcTeam) {
          return itcTeam.team_name === team.name;
        });

        if (!itunesTeam) {
          return false;
        }

        return team.type !== "In-House";
      });

      var options = ['<option value="">-- Select a team</option>'];
      appStoreTeams.forEach(function (team, i) {
        options.push('<option value="' + team.teamId + '" data-team-name="' + team.name + '">'+ team.name + ' - ' + team.teamId + '</option>');
      });
      $('#fl-load-store-teams').hide();
      $('#fl-store-teams').html(options.join('')).parent().show();

      appStoreLoggedIn = true;
      var teamId = $('#fl-store-teams').val();
      var teamName = teamId ? $('#fl-store-teams').find(":selected").data('team-name') : '';

      if (teamId) {
        $('.appStore-more-options').addClass('show');
      } else {
        $('.appStore-more-options').removeClass('show');
      }

      return refreshAppStoreOptions(devEmail, teamId, teamName);
    });
}

function appStoreTeamSetup(email, loadTeams) {
  var load = Promise.resolve();

  if (loadTeams) {
    load = loadAppStoreTeams(email);
  }

  return load.then(function () {
    toggleLoginForm('app-store', 'logged-in', { email: email });
  });
}

function loadEnterpriseData() {
  $('#enterpriseConfiguration [name]').each(function (i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-ent-bundleId" && typeof enterpriseSubmission.data[name] === "undefined") {
      createBundleID(organizationName.toCamelCase(), appName.toCamelCase()).then(function (response) {
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

    if (name === "fl-ent-distribution") {
      if (enterpriseSubmission.data[name]) {
        $('[name="' + name + '"][value="' + enterpriseSubmission.data[name] + '"]').prop('checked', true).trigger('change');
      } else {
        $('[name="' + name + '"][value="generate-file"]').prop('checked', true).trigger('change');
      }
      return;
    }

    if (name === "fl-ent-certificate-manual-details" || name === "fl-ent-mobileprovision-manual-details") {
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

    if (!appIcon) {
      $('.app-details-ent .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-ent .app-splash-screen').addClass('has-warning');
    }
  }

  // Try to automatically login
  if (enterpriseSubmission.data && enterpriseSubmission.data['fl-credentials']) {
    // Submission data contains credential key
    var $loginButton = $('.login-enterprise-button');
    toggleLoginForm('enterprise', 'logging-in');

    getCredential(enterpriseSubmission.data['fl-credentials']).then(function (credential) {
      if (!credential || !credential.email) {
        toggleLoginForm('enterprise', 'login');
        return;
      }

      return enterpriseTeamSetup(credential.email);
    }).catch(function (error) {
      // Allow users to manually log in if an error is encountered
      toggleLoginForm('enterprise', 'login');

      console.error('Error retrieving previous enterprise submission credentials', error);
    });
  }
}

function clearEnterpriseCredentials() {
  return setCredentials(enterpriseSubmission.id, {
    email: null,
    password: null,
    teamId: null
  }, false)
    .then(function () {
      enterpriseLoggedIn = false;
      toggleLoginForm('enterprise', 'login');
    });
}

function loadEnterpriseTeams(devEmail) {
  return getTeams(enterpriseSubmission.id, false)
    .then(function (teams) {
      var enterpriseTeams = _.filter(teams, function (team) {
        return team.type === "In-House";
      })
      var options = ['<option value="">-- Select a team</option>'];
      enterpriseTeams.forEach(function (team, i) {
        options.push('<option value="' + team.teamId + '" data-team-name="' + team.name + '">'+ team.name +' - ' + team.teamId + '</option>');
      });
      $('#fl-load-ent-teams').hide();
      $('#fl-ent-teams').html(options.join('')).parent().show();

      enterpriseLoggedIn = true;
      var teamId = $('#fl-ent-teams').val();
      var teamName = teamId ? $('#fl-ent-teams').find(":selected").data('team-name') : '';

      if (teamId) {
        $('.enterprise-more-options').addClass('show');
      } else {
        $('.enterprise-more-options').removeClass('show');
      }

      return refreshAppEnterpriseOptions(devEmail, teamId, teamName);
    });
}

function enterpriseTeamSetup(email, loadTeams) {
  var load = Promise.resolve();

  if (loadTeams) {
    load = loadEnterpriseTeams(email);
  }

  return load.then(function () {
    toggleLoginForm('enterprise', 'logged-in', { email: email });
  });
}

function loadUnsignedData() {
  $('#unsignedConfiguration [name]').each(function (i, el) {
    var name = $(el).attr("name");

    /* ADD BUNDLE ID */
    if (name === "fl-uns-bundleId" && typeof unsignedSubmission.data[name] === "undefined") {
      createBundleID(organizationName.toCamelCase(), appName.toCamelCase()).then(function (response) {
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

    if (!appIcon) {
      $('.app-details-uns .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-uns .app-splash-screen').addClass('has-warning');
    }
  }
}


function loadPushNotesData() {
  $('#pushConfiguration [name]').each(function (i, el) {
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
  Fliplet.App.Submissions.build(appSubmission.id).then(function (builtSubmission) {

    if (origin === "appStore") {
      appStoreSubmission = builtSubmission.submission;
      // Auto increments the version number and saves the submission
      var newVersionNumber = incrementVersionNumber(appStoreSubmission.data['fl-store-versionNumber']);
      $('[name="fl-store-versionNumber"]').val(newVersionNumber);

      saveAppStoreData();
      $('#fl-store-teams').val('');
      $('.appStore-more-options').removeClass('show');
    }
    if (origin === "enterprise") {
      enterpriseSubmission = builtSubmission.submission;
      // Auto increments the version number and saves the submission
      var newVersionNumber = incrementVersionNumber(enterpriseSubmission.data['fl-ent-versionNumber']);
      $('[name="fl-ent-versionNumber"]').val(newVersionNumber);

      saveEnterpriseData();
      $('#fl-ent-teams').val('');
      $('.enterprise-more-options').removeClass('show');
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
    $('.button-' + origin + '-request').prop('disabled', false);
    $('.save-' + origin + '-request').addClass('saved').hide().fadeIn(250);

    clearTimeout(initLoad);
    initialLoad(false, 0);

    Fliplet.Widget.autosize();

    setTimeout(function () {
      $('.save-' + origin + '-request').fadeOut(250, function () {
        $('.save-' + origin + '-request').removeClass('saved');
        Fliplet.Widget.autosize();
      });
    }, 10000);
  }, function (err) {
    $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
    $('.button-' + origin + '-request').prop('disabled', false);
    Fliplet.Modal.alert({
      message: Fliplet.parseError(err)
    });
  });
}

function save(origin, submission) {

  Fliplet.App.Submissions.get()
    .then(function (submissions) {
      var savedSubmission = _.find(submissions, function (sub) {
        return sub.id === submission.id;
      });

      submission = _.extend(savedSubmission, submission);
      return Promise.resolve();
    })
    .then(function () {
      if (submission.status !== 'started') {
        var previousCredentials = submission.data['fl-credentials'];
        if (submission.data.hasOwnProperty('fl-credentials')) {
          delete submission.data['fl-credentials'];
        }
        return Fliplet.App.Submissions.create({
            platform: 'ios',
            data: $.extend(true, submission.data, {
              previousResults: submission.result
            })
          })
          .then(function (newSubmission) {
            var cloneCredentialsPromise = Promise.resolve();

            if (origin === "appStore") {
              newSubmission.data['fl-credentials'] = 'submission-' + newSubmission.id;
              appStoreSubmission = newSubmission;
              cloneCredentialsPromise = cloneCredentials(previousCredentials, appStoreSubmission);
            }
            if (origin === "enterprise") {
              newSubmission.data['fl-credentials'] = 'submission-' + newSubmission.id;
              enterpriseSubmission = newSubmission;
              cloneCredentialsPromise = cloneCredentials(previousCredentials, enterpriseSubmission);
            }
            if (origin === "unsigned") {
              unsignedSubmission = newSubmission;
            }

            return cloneCredentialsPromise.then(function () {
              return Fliplet.App.Submissions.update(newSubmission.id, newSubmission.data);
            }).then(function () {
              $('.save-' + origin + '-progress').addClass('saved');

              setTimeout(function () {
                $('.save-' + origin + '-progress').removeClass('saved');
              }, 4000);
            });
          });
      }

      // Save app-specific password before saving remaining submission data
      return setCredentials(submission.id, {
        appPassword: $('#fl-store-appPassword').val().trim()
      }, false).then(function () {
        return Fliplet.App.Submissions.update(submission.id, submission.data)
      }).then(function () {
        $('.save-' + origin + '-progress').addClass('saved');

        setTimeout(function () {
          $('.save-' + origin + '-progress').removeClass('saved');
        }, 4000);
      });
    })
    .catch(function (err) {
      Fliplet.Modal.alert({
        message: Fliplet.parseError(err)
      });
    });
}

function requestBuild(origin, submission) {
  $('.button-' + origin + '-request').html('Requesting ' + spinner);

  if (origin === 'appStore') {
    submission.data.folderStructure = appSettings.folderStructure;
  }

  var defaultSplashScreenData = {
    "url": $('[data-' + origin.toLowerCase() + '-default-splash-url]').data(origin.toLowerCase() + '-default-splash-url')
  };

  submission.data.splashScreen = appSettings.splashScreen ? appSettings.splashScreen : defaultSplashScreenData;
  submission.data.appIcon = appIcon;
  submission.data.legacyBuild = appSettings.legacyBuild || false;

  Fliplet.App.Submissions.get()
    .then(function (submissions) {
      var savedSubmission = _.find(submissions, function (sub) {
        return sub.id === submission.id;
      });

      submission = _.extend(savedSubmission, submission);
      return Promise.resolve();
    })
    .then(function () {
      if (submission.status !== 'started') {
        if (submission.data.hasOwnProperty('fl-credentials')) {
          delete submission.data['fl-credentials'];
        }
        return Fliplet.App.Submissions.create({
            platform: 'ios',
            data: $.extend(true, submission.data, {
              previousResults: submission.result
            })
          })
          .then(function (newSubmission) {
            if (origin === "appStore") {
              appStoreSubmission = newSubmission;
            }
            if (origin === "enterprise") {
              enterpriseSubmission = newSubmission;
            }
            if (origin === "unsigned") {
              unsignedSubmission = newSubmission;
            }

            // Check which type of certificate was given
            if (origin === "appStore" && appStoreSubmission.data['fl-store-distribution'] === 'previous-file' && appStorePreviousCredential) {
              return setCredentials(appStoreSubmission.id, {
                teamId: appStorePreviousCredential.teamId,
                teamName: appStorePreviousCredential.teamName,
                certSigningRequest: appStorePreviousCredential.certSigningRequest,
                p12: appStorePreviousCredential.p12,
                certificate: appStorePreviousCredential.certificate,
                content: appStorePreviousCredential.content
              })
                .then(function () {
                  submissionBuild(newSubmission, origin);
                });
            }

            if (origin === "appStore" && appStoreSubmission.data['fl-store-distribution'] === 'upload-file') {
              var formData = new FormData();
              var fileName = appStoreFileField.value.replace(/\\/g, '/').replace(/.*\//, '');
              var teamID = $('#fl-store-teams').val();
              var teamName = $('#fl-store-teams').find(":selected").data('team-name');

              if (appStoreFileField.files && appStoreFileField.files[0]) {
                formData.append('p12', appStoreFileField.files[0])
                formData.append('certificateName', fileName)
              }

              return setCertificateP12(appStoreSubmission.id, formData)
                .then(function () {
                  return setCredentials(appStoreSubmission.id, {
                    teamId: teamID,
                    teamName: teamName
                  });
                })
                .then(function () {
                  submissionBuild(newSubmission, origin);
                });
            }

            if (origin === "enterprise" && enterpriseSubmission.data['fl-ent-distribution'] === 'previous-file' && enterprisePreviousCredential) {
              return setCredentials(enterpriseSubmission.id, {
                teamId: enterprisePreviousCredential.teamId,
                teamName: enterprisePreviousCredential.teamName,
                certSigningRequest: enterprisePreviousCredential.certSigningRequest,
                p12: enterprisePreviousCredential.p12,
                certificate: enterprisePreviousCredential.certificate,
                content: enterprisePreviousCredential.content
              })
                .then(function () {
                  submissionBuild(newSubmission, origin);
                });
            }

            if (origin === "enterprise" && enterpriseSubmission.data['fl-ent-distribution'] === 'upload-file') {
              var formData = new FormData();
              var fileName = enterpriseFileField.value.replace(/\\/g, '/').replace(/.*\//, '');

              if (enterpriseFileField.files && enterpriseFileField.files[0]) {
                formData.append('p12', enterpriseFileField.files[0])
                formData.append('certificateName', fileName)
              }

              var teamId = $('#fl-ent-teams').val();
              var teamName = $('#fl-ent-teams').find(":selected").data('team-name');

              return setCredentials(enterpriseSubmission.id, {
                teamId: teamId,
                teamName: teamName
              })
                .then(function () {
                  return setCertificateP12(enterpriseSubmission.id, formData)
                })
                .then(function () {
                  return setCredentials(enterpriseSubmission.id, {
                    teamId: teamID,
                    teamName: teamName
                  });
                })
                .then(function () {
                  submissionBuild(newSubmission, origin);
                });
            }

            submissionBuild(newSubmission, origin);
          });
      }

      setCredentials(appStoreSubmission.id, {
        appPassword: $('#fl-store-appPassword').val().trim()
      }, false).then(function () {
        return Fliplet.App.Submissions.update(submission.id, submission.data);
      }).then(function () {
        // Check which type of certificate was given
        if (origin === "appStore" && appStoreSubmission.data['fl-store-distribution'] === 'previous-file' && appStorePreviousCredential) {
          return setCredentials(appStoreSubmission.id, {
            teamId: appStorePreviousCredential.teamId,
            teamName: appStorePreviousCredential.teamName,
            certSigningRequest: appStorePreviousCredential.certSigningRequest,
            p12: appStorePreviousCredential.p12,
            certificate: appStorePreviousCredential.certificate,
            content: appStorePreviousCredential.content
          })
            .then(function () {
              submissionBuild(submission, origin);
            });
        }

        if (origin === "appStore" && appStoreSubmission.data['fl-store-distribution'] === 'upload-file') {
          var formData = new FormData();
          var fileName = appStoreFileField.value.replace(/\\/g, '/').replace(/.*\//, '');
          var teamID = $('#fl-store-teams').val();
          var teamName = $('#fl-store-teams').find(":selected").data('team-name');

          if (appStoreFileField.files && appStoreFileField.files[0]) {
            formData.append('p12', appStoreFileField.files[0])
            formData.append('certificateName', fileName)
          }

          return setCertificateP12(appStoreSubmission.id, formData)
            .then(function () {
              return setCredentials(appStoreSubmission.id, {
                teamId: teamID,
                teamName: teamName
              });
            })
            .then(function () {
              submissionBuild(submission, origin);
            });
        }

        if (origin === "enterprise" && enterpriseSubmission.data['fl-ent-distribution'] === 'previous-file' && enterprisePreviousCredential) {
          return setCredentials(enterpriseSubmission.id, {
            teamId: enterprisePreviousCredential.teamId,
            teamName: enterprisePreviousCredential.teamName,
            certSigningRequest: enterprisePreviousCredential.certSigningRequest,
            p12: enterprisePreviousCredential.p12,
            certificate: enterprisePreviousCredential.certificate,
            content: enterprisePreviousCredential.content
          })
            .then(function () {
              submissionBuild(submission, origin);
            });
        }

        if (origin === "enterprise" && enterpriseSubmission.data['fl-ent-distribution'] === 'upload-file') {
          var formData = new FormData();
          var fileName = enterpriseFileField.value.replace(/\\/g, '/').replace(/.*\//, '');
          var teamID = $('#fl-ent-teams').val();
          var teamName = $('#fl-ent-teams').find(":selected").data('team-name');

          if (enterpriseFileField.files && enterpriseFileField.files[0]) {
            formData.append('p12', enterpriseFileField.files[0])
            formData.append('certificateName', fileName)
          }

          return setCertificateP12(enterpriseSubmission.id, formData)
            .then(function () {
              return setCredentials(enterpriseSubmission.id, {
                teamId: teamID,
                teamName: teamName
              });
            })
            .then(function () {
              submissionBuild(submission, origin);
            });
        }

        submissionBuild(submission, origin);
      });
    })
    .catch(function (err) {
      $('.button-' + origin + '-request').html('Request App <i class="fa fa-paper-plane"></i>');
      $('.button-' + origin + '-request').prop('disabled', false);
      Fliplet.Modal.alert({
        message: Fliplet.parseError(err)
      });
    });
}

function saveAppStoreData(request) {
  var data = appStoreSubmission.data;
  var pushData = notificationSettings;

  $('#appStoreConfiguration [name]').each(function (i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (typeof value === 'string') {
      value = value.trim();
    }

    if (name === 'fl-store-appPassword') {
      // Skip saving app-specific password
      // This will be saved in credentials
      return;
    }

    /* PROCESSING KEYWORDS */
    if (name === 'fl-store-keywords') {
      var newValue = value.replace(/,\s+/g, ',');
      data[name] = newValue;
      return;
    }

    if (name === 'fl-store-screenshots') {
      var newValue = $('[name="'+name+'"]:checked').val();
      data[name] = newValue;
      return;
    }

    /* Manual release */
    if (name === "fl-store-manualRelease") {
      data[name] = $('[name="'+name+'"]').is(':checked');
      return;
    }

    if (name === 'fl-store-distribution') {
      var newValue = $('[name="'+name+'"]:checked').val();
      if (newValue === 'previous-file' && appStorePreviousCredential) {
        pushData.apnTeamId = appStorePreviousCredential.teamId;
      }
      if (newValue === 'generate-file' || newValue === 'upload-file') {
        pushData.apnTeamId = $('#fl-store-teams').val();
      }

      data[name] = newValue;
      return;
    }

    if (name === 'fl-store-bundleId') {
      pushData.apnTopic = value;
      data[name] = value;
      return;
    }

    data[name] = value;
  });

  data['fl-credentials'] = 'submission-' + appStoreSubmission.id;
  appStoreSubmission.data = data;
  notificationSettings = pushData;

  savePushData(true);

  if (request) {
    requestBuild('appStore', appStoreSubmission);
  } else {
    save('appStore', appStoreSubmission);
  }
}

function saveEnterpriseData(request) {
  var data = enterpriseSubmission.data;
  var pushData = notificationSettings;
  var uploadFilePromise = Promise.resolve();

  $('#enterpriseConfiguration [name]').each(function (i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (typeof value === 'string') {
      value = value.trim();
    }

    if (name === 'fl-ent-distribution') {
      var newValue = $('[name="'+name+'"]:checked').val();
      if (newValue === 'previous-file' && enterprisePreviousCredential) {
        pushData.apnTeamId = enterprisePreviousCredential.teamId;
      }
      if (newValue === 'generate-file' || newValue === 'upload-file') {
        pushData.apnTeamId = $('#fl-ent-teams').val();
      }
      data[name] = newValue;
      return;
    }

    if (name === 'fl-ent-teamId') {
      if (enterpriseManual) {
        data[name] = value;
        pushData.apnTeamId = enterpriseTeamId;
        return;
      }
      return;
    }

    if (name === 'fl-ent-teamName') {
      if (enterpriseManual) {
        data[name] = value;
        return;
      }
      return;
    }


    if (name === 'fl-ent-bundleId') {
      pushData.apnTopic = value;
      data[name] = value;
      return;
    }

    data[name] = value;
  });

  if (enterpriseManual) {
    var fileList = enterpriseFileFieldManual.files
    var fileProvisionList = enterpriseFileProvisionFieldManual.files
    var file = new FormData();

    if (fileList.length > 0 && fileProvisionList.length > 0) {
      for (var i = 0; i < fileList.length; i++) {
        file.append('fl-ent-certificate-manual-file', fileList[i]);
      }

      for (var i = 0; i < fileProvisionList.length; i++) {
        file.append('fl-ent-provision-manual-file', fileProvisionList[i]);
      }

      uploadFilePromise = Fliplet.Media.Files.upload({
        data: file,
        appId: Fliplet.Env.get('appId')
      }).then(function (files) {
        data['fl-ent-certificate-files'] = files;
        return Promise.resolve();
      });
    }

    uploadFilePromise.then(function () {
      enterpriseSubmission.data = data;
      notificationSettings = pushData;

      delete enterpriseSubmission.data['fl-credentials'];

      savePushData(true);

      if (request) {
        requestBuild('enterprise', enterpriseSubmission);
      } else {
        save('enterprise', enterpriseSubmission);
      }
    });
  } else {
    data['fl-credentials'] = 'submission-' + enterpriseSubmission.id;
    enterpriseSubmission.data = data;
    notificationSettings = pushData;

    savePushData(true);

    if (request) {
      requestBuild('enterprise', enterpriseSubmission);
    } else {
      save('enterprise', enterpriseSubmission);
    }
  }
}

function saveUnsignedData(request) {
  var data = unsignedSubmission.data;

  $('#unsignedConfiguration [name]').each(function (i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (typeof value === 'string') {
      value = value.trim();
    }

    data[name] = value;
  });

  unsignedSubmission.data = data;

  if (request) {
    requestBuild('unsigned', unsignedSubmission);
  } else {
    save('unsigned', unsignedSubmission);
  }
}

function savePushData(silentSave) {
  var data = notificationSettings;
  var pushDataMap = {
    'fl-push-authKey': 'apnAuthKey',
    'fl-push-keyId': 'apnKeyId'
  };

  $('#pushConfiguration [name]').each(function (i, el) {
    var name = $(el).attr("name");

    if (!pushDataMap.hasOwnProperty(name)) {
      return;
    }

    var value = $(el).val();
    if (typeof value === 'string') {
      value = value.trim();
    }

    data[pushDataMap[name]] = value;
  });

  data.apn = !!((data.apnAuthKey && data.apnAuthKey !== '') && (data.apnKeyId && data.apnKeyId !== '') && (data.apnTeamId && data.apnTeamId !== '') && (data.apnTopic && data.apnTopic !== ''));

  notificationSettings = data;

  Fliplet.API.request({
    method: 'PUT',
    url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId'),
    data: notificationSettings
  }).then(function () {
    $('.save-push-progress').addClass('saved');
    if (!notificationSettings.apn && !silentSave) {
      Fliplet.Modal.alert({
        title: 'Your settings have been saved!',
        message: [
          'However push notifications will only work on App Store and Enterprise apps. Request an app for one of those types and fill in the Bundle ID and Team/Team ID fields.',
          '',
          'You don\'t need to request another app if you have requested an app for App Store or Enterprise before with those two fields filled in already.'].join('<br>')
      });
    }

    setTimeout(function () {
      $('.save-push-progress').removeClass('saved');
    }, 4000);
  });
}

function cloneCredentials(credentialKey, submission, saveData) {
  return Fliplet.API.request({
    method: 'POST',
    url: 'v1/organizations/' + organizationID + '/credentials/' + credentialKey + '/clone',
    data: {
      key: submission.data['fl-credentials']
    }
  }).then(function () {
    if (saveData) {
      return Fliplet.App.Submissions.update(submission.id, submission.data);
    }

    return Promise.resolve();
  });
}

function setCredentials(id, data, verify) {
  verify = typeof verify === 'undefined' ? true : verify;

  return waitForSocketConnection().then(function () {
    return Fliplet.API.request({
      method: 'PUT',
      url: 'v1/organizations/' + organizationID + '/credentials/submission-' + id + '?verify=' + verify,
      data: data
    });
  });
}

function getTeams(id, isItunes) {
  return waitForSocketConnection().then(function () {
    return Fliplet.API.request({
      method: 'GET',
      url: 'v1/organizations/' + organizationID + '/credentials/submission-' + id + '/teams?itunes=' + isItunes
    });
  }).then(function (result) {
    return Promise.resolve(result.teams);
  });
}

function searchCredentials(data) {
  return Fliplet.API.request({
    method: 'POST',
    url: 'v1/organizations/' + organizationID + '/credentials/search',
    data: data
  }).then(function (response) {
    if (!response) {
      return;
    }

    var credentialKey;
    var submissionsWithCred = _.filter(Object.keys(response), function (o) {
      return response[o].hasCertificate === true;
    });

    credentialKey = _.max(submissionsWithCred, function (o) {
      return response[o].updatedAt;
    });

    if (!credentialKey) {
      return;
    }

    return getCredential(credentialKey);
  });
}

function getAppCredentials(credentialKey, teamId) {
  if (credentialKey) {
    return getCredential(credentialKey)
      .then(function (credential) {
        if (credential && credential.teamId === teamId && (credential.p12 || credential.certificate)) {
          return credential;
        }

        return;
      });
  }

  return Promise.resolve();
}

function setAppStorePrevCredentials(credential) {
  if (credential && (credential.certificate || credential.p12)) {
    appStorePreviousCredential = credential;
    $('.if-appStore-credential').removeClass('hidden');
    $('[name="fl-store-distribution"][value="previous-file"]').prop('checked', true).trigger('change');
  } else {
    $('.if-appStore-credential').addClass('hidden');
    $('[name="fl-store-distribution"][value="generate-file"]').prop('checked', true).trigger('change');
  }

  Fliplet.Widget.autosize();
}

function refreshAppStoreOptions(devEmail, selectedTeamId, selectedTeamName) {
  if (!selectedTeamId) {
    setAppStorePrevCredentials();
    return;
  }

  return getAppCredentials(appStoreSubmission.data['fl-credentials'],
    selectedTeamId)
    .then(function (credential) {
      if (credential) {
        return credential;
      }

      return searchCredentials({
        email: devEmail,
        type: 'apple',
        teamId: selectedTeamId
      });
    })
    .then(function (credential) {
      if (credential) {
        return credential;
      }

      var previousResults = appStoreSubmission.data.previousResults;
      //make sure that previous results are obtained from latest completed submission.
      if (!_.isUndefined(previousAppStoreSubmission)) {
        previousResults = previousAppStoreSubmission.result;
      }

      //if we dont have any credentials we need to check previous result for a credential object
      if (!_.isUndefined(previousResults) && (!_.isUndefined(previousResults.p12) || !_.isUndefined(previousResults.certificate)) && appStoreSubmission.data['fl-store-teamId'] === selectedTeamId) {
        return {
          teamId: selectedTeamId,
          teamName: selectedTeamName,
          certSigningRequest: previousResults.certSigningRequest,
          p12: previousResults.p12.files[0],
          certificate: previousResults.certificate.files[0],
          content: previousResults.content
        };
      }

      return getCompletedSubmissions(devEmail, selectedTeamId, selectedTeamName);
    })
    .then(function (credential) {
      return setAppStorePrevCredentials(credential);
    })
    .catch(function (error) {
      return setAppStorePrevCredentials();
    });
}

function setAppEnterprisePrevCredential(credential) {
  if (credential && (credential.certificate || credential.p12)) {
    enterprisePreviousCredential = credential;
    $('.if-enterprise-credential').removeClass('hidden');
    $('[name="fl-ent-distribution"][value="previous-file"]').prop('checked', true).trigger('change');
  } else {
    $('.if-enterprise-credential').addClass('hidden');
    $('[name="fl-ent-distribution"][value="generate-file"]').prop('checked', true).trigger('change');
  }

  Fliplet.Widget.autosize();
}

function refreshAppEnterpriseOptions(devEmail, selectedTeamId, selectedTeamName) {
  if (!selectedTeamId) {
    setAppEnterprisePrevCredential();
    return;
  }

  return getAppCredentials(enterpriseSubmission.data['fl-credentials'],
    selectedTeamId)
    .then(function (credential) {
      if (credential) {
        return credential;
      }

      return searchCredentials({
        email: devEmail,
        type: 'apple-enterprise',
        teamId: selectedTeamId
      });
    })
    .then(function (credential) {
      if (credential) {
        return credential;
      }

      var previousResults = enterpriseSubmission.data.previousResults;
      //make sure that previous results are obtained from latest completed submission.
      if (!_.isUndefined(previousEnterpriseStoreSubmission)) {
        previousResults = previousEnterpriseStoreSubmission.result;
      }

      //if we dont have any credentials we need to check previous result for a credential object
      if (!_.isUndefined(previousResults) && (!_.isUndefined(previousResults.p12) || !_.isUndefined(previousResults.certificate)) && enterpriseSubmission.data['fl-ent-teamId'] === selectedTeamId) {
        return {
          teamId: selectedTeamId,
          teamName: selectedTeamName,
          certSigningRequest: previousResults.certSigningRequest,
          p12: previousResults.p12.files[0],
          certificate: previousResults.certificate.files[0],
          content: previousResults.content
        };
      }

      return getCompletedSubmissions(devEmail, selectedTeamId, selectedTeamName);
    })
    .then(function (credential) {
      return setAppEnterprisePrevCredential(credential);
    })
    .catch(function (error) {
      return setAppEnterprisePrevCredential();
    });
}

function getCompletedSubmissions(devEmail, teamId, teamName) {
  var statusList = [
    'started',            // Default status when the submission is started from the user
    'submitted',          // Submission has been submitted
    'queued',             // Submission has been sent tot he CI
    'processing',         // CI is processing the submission
    'ready-for-testing',  // AAB finished and CS should now test the build
    'tested',             // Build marked as tested from CS. CI will get informed so can submit to store
    'completed',          // Finished or submitted to store
    'failed',             // CI failed
    'cancelled'           // user canceled
  ];
  var statusFilter = _.filter(statusList, function (s) {
    return s !== 'failed';
  });
  var url = [
    'v1/organizations/' + organizationID,
    '/submissions?status=' + statusFilter.join(','),
    '&email=' + devEmail,
    '&teamId=' + teamId
  ].join('');
  return Fliplet.API.request({
    method: 'GET',
    url: url
  })
  .then(function (result) {
    if (!result.submissions) {
      return;
    }

    var sortedSubmissions = _.orderBy(result.submissions, ['updatedAt'], ['desc']);
    var latestSubmission = _.find(sortedSubmissions, function (sub) {
      return !_.isUndefined(sub.data.previousResults)
        && (!_.isUndefined(sub.data.previousResults.p12)
          || !_.isUndefined(sub.data.previousResults.certificate)
        )
    });

    if (!_.isUndefined(latestSubmission)) {
      return {
        teamId: teamId,
        teamName: teamName,
        certSigningRequest: latestSubmission.data.previousResults.certSigningRequest,
        p12: latestSubmission.data.previousResults.p12.files[0],
        certificate: latestSubmission.data.previousResults.certificate.files[0],
        content: latestSubmission.data.previousResults.content
      };
    }

    return;
  });
}

function getCredential(credentialKey) {
  if (!credentialKey) {
    return Promise.resolve();
  }

  return Fliplet.API.request({
    method: 'GET',
    url: 'v1/organizations/' + organizationID + '/credentials/' + credentialKey
  }).catch(function (error) {
    if (error && error.status === 404) {
      // Credential not found
      return Promise.resolve();
    }

    return Promise.reject(error);
  });
}

function createCertificates(options) {
  options = options || {};
  return Fliplet.API.request({
    method: 'POST',
    url: 'v1/organizations/' + options.organizationId + '/credentials/submission-' + options.submissionId + '/certificates',
    data: {
      inHouse: options.inHouse
    }
  })
  .then(function (credential) {
    return Promise.resolve(credential);
  });
}

function setCertificateP12(id, file) {
  return Fliplet.API.request({
    method: 'PUT',
    url: 'v1/organizations/' + organizationID + '/credentials/submission-' + id + '?fileName=p12',
    data: file,
    contentType: false,
    processData: false
  });
}

function revokeCertificate(id, certId) {
  return Fliplet.API.request({
    method: 'DELETE',
    url: 'v1/organizations/' + organizationID + '/credentials/submission-' + id + '/' + certId
  });
}

function init() {
  Fliplet.Apps.get().then(function (apps) {
    appInfo = _.find(apps, function (app) {
      return app.id === Fliplet.Env.get('appId');
    });
  });

  $('#fl-store-keywords').tokenfield({
    createTokensOnBlur: true
  });

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
  $('.has-error').each(function (i, el) {
    $(el).parents('.panel-default').addClass('required-fill');
  });

  $('.panel-default').each(function (i, el) {
    var withError = $(el).find('.has-error').length;

    if (withError === 0) {
      $(el).not('.app-details-appStore, .app-details-ent, .app-details-uns').removeClass('required-fill');
    }
  });
}

// We set required attribute to 'demo password' only if 'demo user' field is not empty
function checkDemoUser() {
  // When google tries to auto-fill 'demo user' field, we checking data from API and delete google auto-fill
  // if no saved data for this field
  // To allow a user to use auto-fill from google but disallow google to put the information to the field by itself.
  // We check how many times use google auto-fill after numerous tries found out that google inserts data to this input
  // only three times at a row, so, therefore, the fourth time it's a user trying to input information from auto-fill.
  var $demoUserFiled = $('#fl-store-revDemoUser');
  if (!userInput && autoFill < 3) {
    $demoUserFiled.val(demoUser ? demoUser : '');
    autoFill++;
  }
  $('#fl-store-revDemoPass').prop('required', $demoUserFiled.val() !== ''); 
}

function isValidVersion(version) {
  return /^[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}$/.test(version);
}

function validateScreenshots() {
  var imageErrors = [];
  var supportedFormats = _.uniqBy(_.concat.apply(null, _.map(screenshotRequirements, 'sizes')),
    function (req) {
      return req[0] + ' x ' + req[1];
    });

  _.forEach(screenshotRequirements, function (req) {
    _.forEach(req.screenshots, function (screenshot) {
      var supportedSize = _.some(req.sizes, function (size) {
        return size[0] === screenshot.size[0] && size[1] === screenshot.size[1];
      });

      // @BUG This should be using the && logic operator. Otherwise, it's ignoring the size check.
      //      However, there's an API bug where sizes are not stored using the correct pixel sizes,
      //      so we're allowing this bug for now.
      //      https://github.com/Fliplet/fliplet-studio/issues/4109
      if (screenshot.appId || supportedSize) {
        return;
      }

      imageErrors.push(screenshot.name + ' - ' + screenshot.size[0] + ' x ' + screenshot.size[1]);
    });
  });

  if (imageErrors.length > 0) {
    imageErrors.push('Supported screenshot sizes are:');
    imageErrors.push(_.map(supportedFormats, function (format) {
      return format[0] + ' &times; ' + format[1];
    }).join(' | '));
    Fliplet.Modal.alert({
      title: 'The following screenshots have an invalid size',
      message: _.join(imageErrors, '<br>')
    });
    return false;
  }

  return true;
}

function publishApp(context) {
  var options = {
    release: {
      type: 'silent',
      changelog: 'Initial version'
    }
  };

  return Fliplet.API.request({
    method: 'POST',
    url: 'v1/apps/' + Fliplet.Env.get('appId') + '/publish',
    data: options
  }).then(function (response) {
    // Update appInfo
    appInfo.productionAppId = response.app.id;

    switch(context) {
      case 'appStore':
        $('.button-appStore-request').html('Request App <i class="fa fa-paper-plane"></i>');
        $('.button-appStore-request').prop('disabled', false);
        $('#appStoreConfiguration').validator().trigger('submit');
        break;
      case 'enterprise':
        $('.button-enterprise-request').html('Request App <i class="fa fa-paper-plane"></i>');
        $('.button-enterprise-request').prop('disabled', false);
        $('#enterpriseConfiguration').validator().trigger('submit');
        break;
      case 'unsigned':
        $('.button-unsigned-request').html('Request App <i class="fa fa-paper-plane"></i>');
        $('.button-unsigned-request').prop('disabled', false);
        $('#unsignedConfiguration').validator().trigger('submit');
        break;
      default:
        break;
    }
  }).catch(function (err) {
    Fliplet.Modal.alert({ message: Fliplet.parseError(err) });
    return Promise.reject(err);
  });
}

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
  var submissionsToShow = _.filter(iosSubmissions, function (submission) {
    return submission.status === "queued" || submission.status === "submitted" || submission.status === "processing" || submission.status === "completed" || submission.status === "failed" || submission.status === "cancelled" || submission.status === "ready-for-testing" || submission.status === "tested";
  });

  var buildsData = [];
  if (submissionsToShow.length) {
    submissionsToShow.forEach(function (submission) {
      var build = {};
      var appBuild;
      var debugHtmlPage;

      // Default copy for testing status for different users
      if (submission.status === 'ready-for-testing') {
        if (userInfo.user && (userInfo.user.isAdmin || userInfo.user.isImpersonating)) {
          // Fliplet users
          build.testingStatus = 'Ready for testing';
          build.testingMessage = 'App is ready for testing';
        } else {
          // Normal users
          build.testingStatus = 'In testing';
          build.testingMessage = 'Your app is being tested by Fliplet';
        }
      }

      if (submission.result.appBuild && submission.result.appBuild.files) {
        appBuild = _.find(submission.result.appBuild.files, function (file) {
          return file.contentType === 'application/octet-stream';
        });
      } else if (submission.data.previousResults && submission.data.previousResults.appBuild && submission.data.previousResults.appBuild.files) {
        appBuild = _.find(submission.data.previousResults.appBuild.files, function (file) {
          return file.contentType === 'application/octet-stream';
        });
      }

      if (submission.result.debugHtmlPage && submission.result.debugHtmlPage.files) {
        debugHtmlPage = _.find(submission.result.debugHtmlPage.files, function (file) {
          return file.contentType === 'text/html';
        });
      } else if (submission.data.previousResults && submission.data.previousResults.debugHtmlPage && submission.data.previousResults.debugHtmlPage.files) {
        debugHtmlPage = _.find(submission.data.previousResults.debugHtmlPage.files, function (file) {
          return file.contentType === 'text/html';
        });
      }

      build.id = submission.id;
      build.updatedAt = ((submission.status === 'completed' || submission.status === 'failed' || submission.status === 'cancelled' || submission.status === 'ready-for-testing' || submission.status === 'tested') && submission.updatedAt) ?
        moment(submission.updatedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build.submittedAt = ((submission.status === 'queued' || submission.status === 'submitted') && submission.submittedAt) ?
        moment(submission.submittedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build[submission.status] = true;
      build.fileUrl = appBuild ? appBuild.url : '';

      if (submission.result.message) {
        build.message = submission.result.message;
      }

      if (userInfo.user && (userInfo.user.isAdmin || userInfo.user.isImpersonating)) {
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
  var asub = _.filter(submissions, function (submission) {
    return submission.data.submissionType === "appStore" && submission.platform === "ios";
  });

  var completedAsub = _.filter(asub, function (submission) {
    return submission.status === "completed";
  });

  //Get the Submission data from the first completed submission, it has the certification values that are in use on the app store.
  previousAppStoreSubmission = _.minBy(completedAsub, function (el) {
    return el.id;
  });

  appStoreSubmissionInStore = (completedAsub.length > 0);

  asub = _.orderBy(asub, function (submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);
  checkSubmissionStatus("appStore", asub);

  appStoreSubmission = _.maxBy(asub, function (el) {
    return new Date(el.createdAt).getTime();
  });

  if (!appStoreSubmission) {
    appStoreSubmission = {};
  }

  var cloneAppStoreCredentialsPromise = Promise.resolve();
  if (appStoreSubmission.data && !appStoreSubmission.data['fl-credentials']) {

    var prevSubCred = _.filter(asub, function (submission) {
      return submission.data && submission.data['fl-credentials'];
    });

    var previousSubWithCredentials = _.maxBy(prevSubCred, function (el) {
      return new Date(el.createdAt).getTime();
    });

    appStoreSubmission.data['fl-credentials'] = 'submission-' + appStoreSubmission.id;

    if (previousSubWithCredentials) {
      cloneAppStoreCredentialsPromise = cloneCredentials(previousSubWithCredentials.data['fl-credentials'], appStoreSubmission, true);
    }
  }

  var esub = _.filter(submissions, function (submission) {
    return submission.data.submissionType === "enterprise" && submission.platform === "ios";
  });

  var completedEsub = _.filter(esub, function (submission) {
    return submission.status === "completed";
  });
  //Get the Submission data from the first completed submission, it has certification values that are in use on the developer portal.
  previousEnterpriseStoreSubmission = _.minBy(completedEsub, function (el) {
    return el.id;
  });

  esub = _.orderBy(esub, function (submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);
  checkSubmissionStatus("enterprise", esub);

  enterpriseSubmission = _.maxBy(esub, function (el) {
    return new Date(el.createdAt).getTime();
  });

  if (!enterpriseSubmission) {
    enterpriseSubmission = {};
  }

  var cloneEnterpriseCredentialsPromise = Promise.resolve();
  if (enterpriseSubmission.data && !enterpriseSubmission.data['fl-credentials']) {

    var prevSubCred = _.filter(esub, function (submission) {
      return submission.data && submission.data['fl-credentials'];
    });

    var previousSubWithCredentials = _.maxBy(prevSubCred, function (el) {
      return new Date(el.createdAt).getTime();
    });

    enterpriseSubmission.data['fl-credentials'] = 'submission-' + enterpriseSubmission.id;

    if (previousSubWithCredentials) {
      cloneEnterpriseCredentialsPromise = cloneCredentials(previousSubWithCredentials.data['fl-credentials'], enterpriseSubmission, true);
    }
  }

  var usub = _.filter(submissions, function (submission) {
    return submission.data.submissionType === "unsigned" && submission.platform === "ios";
  });

  usub = _.orderBy(usub, function (submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);
  checkSubmissionStatus("unsigned", usub);

  usub = _.maxBy(usub, function (el) {
    return new Date(el.createdAt).getTime();
  });
  unsignedSubmission = usub;

  return cloneAppStoreCredentialsPromise.then(function () {
    return cloneEnterpriseCredentialsPromise;
  }).then(function () {
    if (_.isEmpty(appStoreSubmission)) {
      return Fliplet.App.Submissions.create({
        platform: 'ios',
        data: {
          submissionType: "appStore"
        }
      })
      .then(function (submission) {
        appStoreSubmission = submission;
        return Promise.resolve();
      });
    }

    return Promise.resolve();
  }).then(function () {
    if (_.isEmpty(enterpriseSubmission)) {
      return Fliplet.App.Submissions.create({
        platform: 'ios',
        data: {
          submissionType: "enterprise"
        }
      })
      .then(function (submission) {
        enterpriseSubmission = submission;
        return Promise.resolve();
      });
    }

    return Promise.resolve();
  }).then(function () {
    if (_.isEmpty(unsignedSubmission)) {
      return Fliplet.App.Submissions.create({
        platform: 'ios',
        data: {
          submissionType: "unsigned"
        }
      })
      .then(function (submission) {
        unsignedSubmission = submission;
        return Promise.resolve();
      });
    }

    return Promise.resolve();
  });
}

function iosSubmissionChecker(submissions) {
  var asub = _.filter(submissions, function (submission) {
    return submission.data.submissionType === "appStore" && submission.platform === "ios";
  });

  var esub = _.filter(submissions, function (submission) {
    return submission.data.submissionType === "enterprise" && submission.platform === "ios";
  });

  var usub = _.filter(submissions, function (submission) {
    return submission.data.submissionType === "unsigned" && submission.platform === "ios";
  });

  // Ordering
  asub = _.orderBy(asub, function (submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);
  esub = _.orderBy(esub, function (submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);
  usub = _.orderBy(usub, function (submission) {
    return new Date(submission.createdAt).getTime();
  }, ['desc']);

  checkSubmissionStatus("appStore", asub);
  checkSubmissionStatus("enterprise", esub);
  checkSubmissionStatus("unsigned", usub);
}

function getSubmissions() {
  return Fliplet.App.Submissions.get();
}

function initialLoad(initial, timeout) {
  if (!initial) {
    initLoad = setTimeout(function () {
      getSubmissions()
        .then(function (submissions) {
          iosSubmissionChecker(submissions);
          initialLoad(false, 15000);
        });
    }, timeout);
  } else {
    getSubmissions()
      .then(function (submissions) {
        if (!submissions.length) {
          return Promise.all([
            Fliplet.App.Submissions.create({
              platform: 'ios',
              data: {
                submissionType: "appStore"
              }
            })
            .then(function (submission) {
              appStoreSubmission = submission;
            }),
            Fliplet.App.Submissions.create({
              platform: 'ios',
              data: {
                submissionType: "unsigned"
              }
            })
            .then(function (submission) {
              unsignedSubmission = submission;
            }),
            Fliplet.App.Submissions.create({
              platform: 'ios',
              data: {
                submissionType: "enterprise"
              }
            })
            .then(function (submission) {
              enterpriseSubmission = submission;
            })
          ]);
        }

       return Fliplet.API.request({
          cache: true,
          url: 'v1/user'
        })
        .then(function (user) {
          userInfo = user;
          return submissionChecker(submissions);
        });
      })
      .then(function () {
        // Fliplet.Env.get('appId')
        // Fliplet.Env.get('appName')
        // Fliplet.Env.get('appSettings')

        return Promise.all([
          Fliplet.API.request({
            method: 'GET',
            url: 'v1/apps/' + Fliplet.Env.get('appId')
          })
          .then(function (result) {
            appName = result.app.name;
            appIcon = result.app.icon;
            appSettings = result.app.settings;
          }),
          Fliplet.API.request({
            method: 'GET',
            url: 'v1/organizations/' + organizationID
          })
          .then(function (org) {
            organizationName = org.name;
          })
        ]);
      })
      .then(function () {
        if (appSettings.folderStructure) {
          var structure = [];
          hasFolders = true;
          var appleOnly = _.filter(appSettings.folderStructure, function (obj) {
            return obj.platform === 'apple';
          });

          return Promise.all(appleOnly.map(function (obj) {
            return Fliplet.Media.Folders.get({folderId: obj.folderId})
              .then(function (result) {
                var tempObject = {
                  type: obj.type,
                  folderContent: result
                }

                structure.push(tempObject);
                return Promise.resolve(structure);
              });
          }))
          .then(function () {
            structure.forEach(function (el) {
              var idx = _.findIndex(screenshotRequirements, {
                type: el.type
              });

              if (idx > -1) {
                screenshotRequirements[idx].screenshots = el.folderContent.files;
              }
            });
          });
        } else {
          hasFolders = false;
          return;
        }
      })
      .then(function () {
        return Fliplet.API.request({
          method: 'GET',
          url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId')
        });
      })
      .then(function (response) {
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

function updateServerLocation() {
  var region = Fliplet.User.getAuthToken().substr(0, 2);
  var serverLocations = {
    eu: 'Dublin, Ireland',
    us: 'San Francisco, US'
  };

  if (serverLocations[region]) {
    $('.region-server-location').html(serverLocations[region]);
  }
}

function getCurrentLoginForm() {
  var id = $('.nav-tabs > li.active').prop('id');

  if (!id) {
    return;
  }

  var ids = {
    'appstore-control': 'app-store',
    'enterprise-control': 'enterprise'
  };

  return ids[id];
}

function mapSelectors(selectors, keys) {
  selectors = selectors || {};

  if (typeof keys === 'string') {
    keys = [keys];
  }

  keys = keys || [];

  return _.values(_.pick(selectors, keys)).join(',');
}

function toggleLoginForm(form, state, data) {
  // form @param (String) app-store | enterprise
  // state @param (String) login | logging-in | 2fa-device | 2fa-waiting | 2fa-code | 2fa-verifying | logged-in
  // data @param (Object) Data for configuring forms (Optional)

  var selectors = {
    'app-store': {
      emailField: '#fl-store-appDevLogin',
      passwordField: '#fl-store-appDevPass',
      loginButton: '.login-appStore-button',
      mfaDevices: '.appStore-login-2fa-devices',
      mfaDeviceField: '#fl-store-2fa-select',
      mfaDeviceName: 'fl-store-device',
      mfaCodeWaiting: '.appStore-login-2fa-waiting',
      mfaCode: '.appStore-login-2fa-code',
      mfaSms: '.appStore-2fa-sms',
      mfaCodeField: '#fl-store-2fa-code',
      mfaCodeButton: '.2fa-code-store-button',
      loginDetails: '.appStore-login-details',
      loggedInEmail: '.appStore-logged-email',
      loggedIn: '.appStore-logged-in',
      moreOptions: '.appStore-more-options',
      teams: '.appStore-teams'
    },
    enterprise: {
      emailField: '#fl-ent-appDevLogin',
      passwordField: '#fl-ent-appDevPass',
      loginButton: '.login-enterprise-button',
      mfaDevices: '.enterprise-login-2fa-devices',
      mfaDeviceField: '#fl-ent-2fa-select',
      mfaDeviceName: 'fl-ent-device',
      mfaCodeWaiting: '.enterprise-login-2fa-waiting',
      mfaCode: '.enterprise-login-2fa-code',
      mfaSms: '.enterprise-2fa-sms',
      mfaCodeField: '#fl-ent-2fa-code',
      mfaCodeButton: '.2fa-code-ent-button',
      loginDetails: '.enterprise-login-details',
      loggedInEmail: '.enterprise-logged-email',
      loggedIn: '.enterprise-logged-in',
      moreOptions: '.enterprise-more-options',
      teams: '.enterprise-teams'
    }
  };

  if (!Object.keys(selectors).indexOf(form) === -1) {
    // Invalid form
    return;
  }

  var sel = selectors[form];
  data = data || {};

  switch (state) {
    case 'login':
      $(mapSelectors(sel, ['emailField', 'passwordField'])).prop({
        readonly: false,
        required: true
      });
      $(mapSelectors(sel, ['mfaDeviceField', 'mfaCodeField'])).prop('required', false);
      $(sel.loginButton).html('Log in').removeClass('disabled');
      $(sel.loginDetails).removeClass('hidden');
      $(mapSelectors(sel, ['mfaDevices', 'mfaCode', 'loggedIn', 'moreOptions', 'teams'])).removeClass('show');
      break;
    case 'logging-in':
      $(mapSelectors(['emailField', 'passwordField'])).prop({
        readonly: true
      });
      $(sel.loginButton).html('Logging in ' + spinner).addClass('disabled');
      $(sel.loginDetails).removeClass('hidden');
      $(mapSelectors(sel, ['mfaDevices', 'mfaCode', 'loggedIn', 'moreOptions', 'teams'])).removeClass('show');
      break;
    case '2fa-device':
      var options = _.map(_.get(data, 'devices', []), function eachDevice(device, i) {
        return  [
          '<span class="btn btn-secondary btn-lg">',
          '<input type="radio" name="' + sel.mfaDeviceName + '" value="' + (i+1) + '" />' + device,
          '</span>'
        ].join('');
      }).join('');
      $(mapSelectors(sel, ['emailField', 'passwordField', 'mfaCodeField'])).prop({
        required: false
      });
      $(sel.mfaDeviceField).html(options).find('input').prop('required', true);
      $(mapSelectors(sel, ['emailField', 'passwordField', 'mfaCodeField'])).prop('required', false);
      $(sel.mfaDevices).addClass('show');
      $(sel.loginDetails).addClass('hidden');
      $(mapSelectors(sel, ['mfaCodeWaiting', 'mfaCode', 'loggedIn', 'moreOptions', 'teams'])).removeClass('show');
      break;
    case '2fa-waiting':
      $(sel.mfaCodeWaiting).addClass('show');
      $(mapSelectors(sel, ['mfaDeviceField', 'mfaCodeField'])).prop('required', false);
      $(mapSelectors(sel, ['mfaCode', 'mfaDevices', 'mfaSms'])).removeClass('show');
      break;
    case '2fa-code':
      $(sel.mfaCode).addClass('show');
      $(sel.mfaCodeField).val('').prop({
        required: true,
        readonly: false
      }).focus();
      // Show SMS option if allowed
      $(sel.mfaSms)[data.smsAllowed ? 'addClass' : 'removeClass']('show');
      $(sel.mfaCodeButton).html('Verify').prop('disabled', false);
      $(mapSelectors(sel, 'emailField, passwordField, mfaDeviceField')).prop('required', false);
      $(sel.loginDetails).addClass('hidden');
      $(mapSelectors(sel, ['mfaDevices', 'mfaCodeWaiting', 'loggedIn', 'moreOptions', 'teams'])).removeClass('show');
      break;
    case '2fa-verifying':
      $(sel.mfaCodeField).prop('readonly', true);
      $(sel.mfaCodeButton).html('Verifying ' + spinner).prop('disabled', true);
      break;
    case 'logged-in':
      $(mapSelectors(sel, ['emailField', 'passwordField', 'mfaDeviceField', 'mfaCodeField'])).prop({
        required: false
      });
      $(sel.emailField).val(data.email);
      $(sel.loggedInEmail).html(data.email);
      $(sel.loginDetails).addClass('hidden');
      $(mapSelectors(sel, ['loggedIn', 'teams'])).addClass('show');
      $(mapSelectors(sel, ['mfaDevices', 'mfaCode'])).removeClass('show');
      break;
  }

  Fliplet.Widget.autosize();
}

/* ATTACH LISTENERS */

$('[data-toggle="tooltip"]').tooltip();

$('.appStore-2fa-sms, .enterprise-2fa-sms').find('a').on('click', function (e) {
  e.preventDefault();
  // Send SMS request via socket
  toggleLoginForm(getCurrentLoginForm(), '2fa-waiting');
  socket.to(socketClientId).emit('aab.apple.login.2fa.sms');
});

$('#fl-store-2fa-select, #fl-ent-2fa-select').on('change', function (e) {
  // Send device selection via socket
  toggleLoginForm(getCurrentLoginForm(), '2fa-waiting');
  socket.to(socketClientId).emit('aab.apple.login.2fa.device', e.target.value);
});

Fliplet().then(function () {
  checkDemoUser();
});

// After user blur from 'demo user' field we check again to make sure that the field is empty. 
// If field is empty we remove required attribute.
$('#fl-store-revDemoUser').on('input', function (event) {
  userInput = event.originalEvent.inputType || false;
  
  checkDemoUser();
});

$('.2fa-code-store-button, .2fa-code-ent-button').on('click', function (e) {
  var code = $(this).parents('.form-group').prev().find('.form-control').val();

  if (!code) {
    Fliplet.Modal.alert({
      message: 'You must enter the verification code to continue'
    });
    return;
  }

  toggleLoginForm(getCurrentLoginForm(), '2fa-verifying');
  socket.to(socketClientId).emit('aab.apple.login.2fa.code', code);
});

$('[name="fl-store-screenshots"]').on('change', function () {
  var id = $(this).attr('id');

  switch ($(this).val()) {
    case 'new':
      _.forEach(screenshotRequirements, function (req) {
        var $thumbContainer = $('.thumbs[data-type="' + req.type + '"]');
        $thumbContainer.html('');

        if (!req.screenshots.length) {
          $thumbContainer.append(addNoScreenshotWarning(req));
          return;
        }

        _.forEach(_.take(req.screenshots, 4), function (thumb) {
          $thumbContainer.append(addThumb(thumb));
        });
      });

      $('[data-item="fl-store-screenshots-new"]').removeClass('hidden');
      $('[data-item="fl-store-screenshots-existing"]').addClass('hidden');
      break;
    case 'existing':
      $('.app-details-appStore .app-screenshots').removeClass('has-error');
      $('[data-item="fl-store-screenshots-existing"]').removeClass('hidden');
      $('[data-item="fl-store-screenshots-new-warning"]').addClass('hidden');
      $('[data-item="fl-store-screenshots-new"]').addClass('hidden');
      break;
  }
});

$('[name="submissionType"]').on('change', function () {
  var selectedOptionId = $(this).attr('id');

  $('.fl-sb-panel').removeClass('show');
  $('.' + selectedOptionId).addClass('show');

  Fliplet.Widget.autosize();
});

$('[name="fl-store-credentials"]').on('change', function () {
  var value = $(this).val();

  if (value === 'useOwn') {
    $('.fl-store-credential.indented-area').removeClass('hidden');
  } else {
    $('.fl-store-credential.indented-area').addClass('hidden');
  }

  Fliplet.Widget.autosize();
});

$('.fl-sb-appStore [change-bundleid], .fl-sb-enterprise [change-bundleid], .fl-sb-unsigned [change-bundleid]').on('click', function () {
  Fliplet.Modal.confirm({
    message: 'Are you sure you want to change the unique Bundle ID?'
  }).then(function (confirmed) {
    if (!confirmed) {
      return;
    }

    $('.fl-bundleId-holder').addClass('hidden');
    $('.fl-bundleId-field').addClass('show');

    Fliplet.Widget.autosize();
  });
});

$('.panel-group')
  .on('shown.bs.collapse', '.panel-collapse', function () {
    Fliplet.Widget.autosize();
  })
  .on('hidden.bs.collapse', '.panel-collapse', function () {
    Fliplet.Widget.autosize();
  });

$('a[data-toggle="tab"]')
  .on('shown.bs.tab', function () {
    Fliplet.Widget.autosize();

    if (socketClientId) {
      socket.to(socketClientId).emit('aab.apple.login.2fa.cancel');
    }
  })
  .on('hidden.bs.tab', function () {
    Fliplet.Widget.autosize();
  });

$('[name="fl-store-keywords"]').on('tokenfield:createtoken', function (e) {
  var currentValue = e.currentTarget.value.replace(/,\s+/g, ',');
  var newValue = e.attrs.value;
  var oldAndNew = currentValue + ',' + newValue;

  if (oldAndNew.length > 100) {
    e.preventDefault();
  }
});

$('.redirectToSettings, [data-change-settings]').on('click', function (event) {
  event.preventDefault();

  Fliplet.Studio.emit('close-overlay', {
    name: 'publish-apple'
  });

  Fliplet.Studio.emit('overlay', {
    name: 'app-settings',
    options: {
      size: 'large',
      title: 'App Settings',
      section: 'appSettingsGeneral',
      appId: Fliplet.Env.get('appId')
    }
  });
});

$(document).on('click', '[data-change-assets]', function (event) {
  event.preventDefault();

  Fliplet.Studio.emit('close-overlay', {
    name: 'publish-apple'
  });

  Fliplet.Studio.emit('overlay', {
    name: 'app-settings',
    options: {
      size: 'large',
      title: 'App Settings',
      section: 'launchAssets',
      appId: Fliplet.Env.get('appId')
    }
  });
});

$('#appStoreConfiguration, #enterpriseConfiguration, #unsignedConfiguration').on('validated.bs.validator', function () {
  checkGroupErrors();
  Fliplet.Widget.autosize();
});

$('#appStoreConfiguration').validator().on('submit', function (event) {
  if (_.includes(['fl-store-appDevLogin', 'fl-store-appDevPass'], document.activeElement.id)) {
    // User submitted app store login form
    $('.login-appStore-button').trigger('click');
    return;
  }

  if (document.activeElement.id === 'fl-store-2fa-code') {
    // User submitted app store login form
    $('.2fa-code-store-button').trigger('click');
    return;
  }

  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    Fliplet.Modal.alert({
      message: 'Please fill in all the required information.'
    });
    return;
  }

  event.preventDefault();

  if (!isValidVersion($('[name="fl-store-versionNumber"]').val())) {
    Fliplet.Modal.alert({
      message: ERRORS.INVALID_VERSION
    });
    return;
  }

  if ($('[name="fl-store-screenshots"]:checked').val() === 'new' && !hasAllScreenshots) {
    Fliplet.Modal.alert({
      message: 'You need to add screenshots before submitting'
    });
    return;
  }

  if (!validateScreenshots()) {
    return;
  }

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('appStore') > -1) {
      if (appStoreLoggedIn) {
        var certificateKind = $('[name="fl-store-distribution"]:checked').val();

        if (certificateKind === 'generate-file' && !appStoreCertificateCreated) {
          Fliplet.Modal.alert({
            message: 'You need to generate a certificate before requesting a submission'
          });
          return;
        }

        if (certificateKind === 'upload-file' && (!appStoreFileField.files || !appStoreFileField.files[0])) {
          Fliplet.Modal.alert({
            message: 'You need to upload a certificate before requesting a submission'
          });
          return;
        }

        var message = 'Are you sure you wish to update your published app?';

        if (appStoreSubmission.status === "started") {
          message = 'Are you sure you wish to request your app to be published?';
        }

        Fliplet.Modal.confirm({
          message: message
        }).then(function (confirmed) {
          if (!confirmed) {
            return;
          }

          saveAppStoreData(true);
        });
      } else {
        Fliplet.Modal.alert({
          message: 'You need to login with your Apple developer account details.<br>Select one option to provide use with a distribution certificate.'
        });
      }
    } else {
      Fliplet.Modal.alert({
        message: 'Please configure your App Settings to contain the required information.'
      });
    }
  } else {
    var initialHtml = $('.button-appStore-request').html();
    $('.button-appStore-request').html('Please wait ' + spinner);
    $('.button-appStore-request').prop('disabled', true);

    publishApp('appStore').catch(function () {
      $('.button-appStore-request').html(initialHtml);
      $('.button-appStore-request').prop('disabled', false);
    });;
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

$('#enterpriseConfiguration').validator().on('submit', function (event) {
  if (_.includes(['fl-ent-appDevLogin', 'fl-ent-appDevPass'], document.activeElement.id)) {
    // User submitted enterprise login form
    $('.login-enterprise-button').trigger('click');
    return;
  }

  if (document.activeElement.id === 'fl-ent-2fa-code') {
    // User submitted app store login form
    $('.2fa-code-ent-button').trigger('click');
    return;
  }

  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    Fliplet.Modal.alert({
      message: 'Please fill in all the required information.'
    });
    return;
  }

  event.preventDefault();

  if (!isValidVersion($('[name="fl-ent-versionNumber"]').val())) {
    Fliplet.Modal.alert({
      message: ERRORS.INVALID_VERSION
    });
    return;
  }

  if (!enterpriseManual && !enterpriseLoggedIn) {
    Fliplet.Modal.alert({
      message: 'Please log in with the Apple Developer Account or choose to enter the data manually.'
    });
    return;
  }

  var credentialKind = $('[name="fl-ent-distribution"]:checked').val();

  if (!enterpriseManual) {
    if (credentialKind === 'generate-file' && !enterpriseCertificateCreated) {
      Fliplet.Modal.alert({
        message: 'You need to generate a certificate before requesting a submission'
      });
      return;
    }

    if (credentialKind === 'upload-file' && (!enterpriseFileField.files || !enterpriseFileField.files[0])) {
      Fliplet.Modal.alert({
        message: 'You need to upload a certificate before requesting a submission'
      });
      return;
    }
  }

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('enterprise') > -1) {
      var message = 'Are you sure you wish to update your published app?';

      if (enterpriseSubmission.status === "started") {
        message = 'Are you sure you wish to request your app to be published?';
      }

      Fliplet.Modal.confirm({
        message: message
      }).then(function (confirmed) {
        if (!confirmed) {
          return;
        }

        saveEnterpriseData(true);
      });
    } else {
      Fliplet.Modal.alert({
        message: 'Please configure your App Settings to contain the required information.'
      });
    }
  } else {
    var initialHtml = $('.button-enterprise-request').html();
    $('.button-enterprise-request').html('Please wait ' + spinner);
    $('.button-enterprise-request').prop('disabled', true);

    publishApp('enterprise').catch(function () {
      $('.button-enterprise-request').html(initialHtml);
      $('.button-enterprise-request').prop('disabled', false);
    });
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

$('#unsignedConfiguration').validator().on('submit', function (event) {
  if (event.isDefaultPrevented()) {
    // Gives time to Validator to apply classes
    setTimeout(checkGroupErrors, 0);
    Fliplet.Modal.alert({
      message: 'Please fill in all the required information.'
    });
    return;
  }

  event.preventDefault();

  if (!isValidVersion($('[name="fl-uns-versionNumber"]').val())) {
    Fliplet.Modal.alert({
      message: ERRORS.INVALID_VERSION
    });
    return;
  }

  if (appInfo && appInfo.productionAppId) {
    if (allAppData.indexOf('unsigned') > -1) {
      var message = 'Are you sure you wish to update your published app?';

      if (unsignedSubmission.status === "started") {
        message = 'Are you sure you wish to request your app to be published?';
      }

      Fliplet.Modal.confirm({
        message: message
      }).then(function (confirmed) {
        if (!confirmed) {
          return;
        }

        saveUnsignedData(true);
      });
    } else {
      Fliplet.Modal.alert({
        message: 'Please configure your App Settings to contain the required information.'
      });
    }
  } else {
    var initialHtml = $('.button-unsigned-request').html();
    $('.button-unsigned-request').html('Please wait ' + spinner);
    $('.button-unsigned-request').prop('disabled', true);

    publishApp('unsigned').catch(function () {
      $('.button-unsigned-request').html(initialHtml);
      $('.button-unsigned-request').prop('disabled', false);
    });
  }

  // Gives time to Validator to apply classes
  setTimeout(checkGroupErrors, 0);
});

/* SAVE PROGRESS CLICK */
$('[data-app-store-save]').on('click', function () {
  saveAppStoreData();
});
$('[data-enterprise-save]').on('click', function () {
  saveEnterpriseData();
});
$('[data-unsigned-save]').on('click', function () {
  saveUnsignedData();
});
$('[data-push-save]').on('click', function () {
  savePushData();
});

/* Credentials and Certificates App Store */
$('.login-appStore-button').on('click', function () {
  var $this = $(this);
  var devEmail = $('#fl-store-appDevLogin').val();
  var devPass = $('#fl-store-appDevPass').val();
  var emailError = $('#fl-store-appDevLogin').data('error');
  var passError = $('#fl-store-appDevPass').data('error');

  // Remove errors
  $('#fl-store-appDevLogin').parents('.form-group').removeClass('has-error has-danger');
  $('#fl-store-appDevLogin').next('.with-errors').html('');
  $('#fl-store-appDevPass').parents('.form-group').removeClass('has-error has-danger');
  $('#fl-store-appDevPass').next('.with-errors').html('');
  $this.nextAll('login-error').html('');

  toggleLoginForm('app-store', 'logging-in');

  if (devEmail === '') {
    $('#fl-store-appDevLogin').parents('.form-group').addClass('has-error has-danger');
    $('#fl-store-appDevLogin').next('.with-errors').html(emailError);
    toggleLoginForm('app-store', 'login');
  }

  if (devPass === '') {
    $('#fl-store-appDevPass').parents('.form-group').addClass('has-error has-danger');
    $('#fl-store-appDevPass').next('.with-errors').html(passError);
    toggleLoginForm('app-store', 'login');
  }

  if (devEmail !== '' && devPass !== '') {
    setCredentials(appStoreSubmission.id, {
      type: 'apple',
      status: 'created',
      email: devEmail,
      password: devPass
    })
      .then(function () {
        return appStoreTeamSetup(devEmail, true);
      })
      .catch(function (error) {
        var message = 'Unable to log in';

        if (Fliplet.parseError(error)) {
          message += '<div class="alert alert-info alert-sm">' + Fliplet.parseError(error) + '</div>'
        }

        Fliplet.Modal.hideAll();
        Fliplet.Modal.alert({
          message: message,
          size: 'small'
        });

        toggleLoginForm('app-store', 'login');
      });
  }
});

$('.log-out-appStore').on('click', function () {
  clearAppStoreCredentials();
});

$('[name="fl-store-distribution"]').on('change', function () {
  var value = $(this).val();

  $('#fl-store-teams').prop('required',true);

  if (value === 'previous-file') {
    if (appStoreCertificateReplaced) {
      $('.appStore-previous-file-success').addClass('show');
    }

    $('.appStore-generate-file, .appStore-generate-file-success, .appStore-upload-file').removeClass('show');
    $('#fl-store-certificate').prop('required',false);
  }
  if (value === 'generate-file') {
    if (appStoreCertificateCreated) {
      $('.appStore-generate-file-success').addClass('show');
    } else {
      $('.appStore-generate-file').addClass('show');
    }

    $('.appStore-previous-file-success, .appStore-upload-file').removeClass('show');
    $('#fl-store-certificate').prop('required',false);
  }
  if (value === 'upload-file') {
    $('.appStore-upload-file').addClass('show');
    $('.appStore-previous-file-success, .appStore-generate-file, .appStore-generate-file-success').removeClass('show');

    $('#fl-store-certificate').prop('required',true);
  }
  Fliplet.Widget.autosize();
});

$('#fl-load-store-teams').on('click', function (e) {
  e.preventDefault();
  var $button = $(this);
  var initialLabel = $button.html();
  $button.html('Loading ' + spinner).addClass('disabled');
  loadAppStoreTeams($('.appStore-logged-email').text())
    .then(function () {
      $button.html(initialLabel).removeClass('disabled');
    })
    .catch(function (error) {
      $button.html(initialLabel).removeClass('disabled');

      var message = 'Unable to load teams';

      if (Fliplet.parseError(error)) {
        message += '<div class="alert alert-info alert-sm">' + Fliplet.parseError(error) + '</div>'
      }

      Fliplet.Modal.hideAll();
      Fliplet.Modal.alert({
        message: message,
        size: 'small'
      });

      if (error && Fliplet.parseError(error).match(/^The email or password you entered .+ are wrong/)) {
        clearAppStoreCredentials();
      }
    });
});

$('#fl-store-teams').on('change', function () {
  var value = $(this).val();
  var teamName = value ? $('#fl-store-teams').find(":selected").data('team-name') : '';

  if (value !== '') {
    $('.appStore-more-options').addClass('show');
    $('.appStore-generate-cert').removeClass('disabled');
    $('.appStore-upload-certificate').removeClass('disabled');
  } else {
    $('.appStore-more-options').removeClass('show');
    $('.appStore-generate-cert').addClass('disabled');
    $('.appStore-upload-certificate').addClass('disabled');
  }

  var devEmail = $('#fl-store-appDevLogin').val();
  return refreshAppStoreOptions(devEmail, value, teamName);
});

$('.appStore-generate-cert').on('click', function () {
  var $this = $(this);
  $(this).html('Generating ' + spinner);
  $(this).addClass('disabled');
  $('.generate-error').html(''); // Cleans errors
  var teamId = $('#fl-store-teams').val();
  appStoreTeamId = teamId;
  var teamName = $('#fl-store-teams').find(":selected").data('team-name');

  return setCredentials(appStoreSubmission.id, {
      teamId: teamId,
      teamName: teamName
    })
    .then(function () {
      return createCertificates({
        organizationId: organizationID,
        submissionId: appStoreSubmission.id
      })
        .then(function (response) {
          var p12Url = Fliplet.Env.get('apiUrl') + 'v1/organizations/' + organizationID + '/credentials/submission-' + appStoreSubmission.id + '/download/p12'
          appStoreCertificateCreated = true;
          $('.appStore-generate-file-success').find('.appStore-file-name-success').html(response.certificate.name);
          $('.appStore-generate-file-success').find('.appStore-file-expire-success').html(moment(response.certificate.expiresAt).format('MMMM Do YYYY'));
          $('.appStore-generate-file-success').find('.appStore-file-download-success').attr('href', p12Url);
          $('.appStore-generate-file').removeClass('show');
          $('.appStore-generate-file-success').addClass('show');
          $this.html('Generate certificate');
          $this.removeClass('disabled');
        });
    })
    .catch(function (error) {
      $this.html('Generate certificate');
      $this.removeClass('disabled');
      console.log(error);
      $('.generate-error').html(Fliplet.parseError(error));
    });
});

$('#fl-store-certificate').on('change', function () {
  appStoreFileField = this;
  var fileName = appStoreFileField.value.replace(/\\/g, '/').replace(/.*\//, '');

  if (appStoreFileField.files && appStoreFileField.files[0]) {
    $('#fl-store-certificate-label').val(fileName);
  }
});

$('.appStore-replace-cert').on('click', function () {
  var $this = $(this);
  $(this).html('Replacing ' + spinner);
  $(this).addClass('disabled');
  $('.replace-error').html(''); // Cleans errors
  var teamId = appStorePreviousCredential ? appStorePreviousCredential.teamId : '';
  appStoreTeamId = teamId;
  var teamName = appStorePreviousCredential ? appStorePreviousCredential.teamName : '';

  if (appStorePreviousCredential.certificate && appStorePreviousCredential.certificate.id) {
    return revokeCertificate(appStoreSubmission.id, appStorePreviousCredential.certificate.id)
      .then(function () {
        return setCredentials(appStoreSubmission.id, {
            teamId: teamId,
            teamName: teamName
          })
          .then(function () {
            return createCertificates({
              organizationId: organizationID,
              submissionId: appStoreSubmission.id
            })
              .then(function (response) {
                var p12Url = Fliplet.Env.get('apiUrl') + 'v1/organizations/' + organizationID + '/credentials/submission-' + appStoreSubmission.id + '/download/p12'
                appStoreCertificateReplaced = true;
                $('.appStore-previous-file-success').find('.appStore-file-name-success').html(response.certificate.name);
                $('.appStore-previous-file-success').find('.appStore-file-expire-success').html(moment(response.certificate.expiresAt).format('MMMM Do YYYY'));
                $('.appStore-previous-file-success').find('.appStore-file-download-success').attr('href', p12Url);
                $('.appStore-previous-file-success').addClass('show');
                $this.html('Replace certificate');
                $this.removeClass('disabled');
              });
          });
      })
      .catch(function (error) {
        $this.html('Replace certificate');
        $this.removeClass('disabled');
        console.log(error);
        $('.replace-error').html(Fliplet.parseError(error));
      });
    } else {
      $this.html('Replace certificate');
      $this.removeClass('disabled');
      $('.replace-error').html("We could not replace the certificate.\nPlease log into your https://developer.apple.com/account/ and revoke the certificate and create a new one using Fliplet.");
    }
});
/**/

/* Credentials and Certificates Enterprise */
$('.login-enterprise-button').on('click', function () {
  var $this = $(this);
  var devEmail = $('#fl-ent-appDevLogin').val();
  var devPass = $('#fl-ent-appDevPass').val();
  var emailError = $('#fl-ent-distributionnt-appDevLogin').data('error');
  var passError = $('#fl-ent-appDevPass').data('error');

  // Remove errors
  $('#fl-ent-appDevLogin').parents('.form-group').removeClass('has-error has-danger');
  $('#fl-ent-appDevLogin').next('.with-errors').html('');
  $('#fl-ent-appDevPass').parents('.form-group').removeClass('has-error has-danger');
  $('#fl-ent-appDevPass').next('.with-errors').html('');
  $this.nextAll('login-error').html('');

  toggleLoginForm('enterprise', 'logging-in');

  if (devEmail === '') {
    $('#fl-ent-appDevLogin').parents('.form-group').addClass('has-error has-danger');
    $('#fl-ent-appDevLogin').next('.with-errors').html(emailError);
    toggleLoginForm('enterprise', 'login');
  }

  if (devPass === '') {
    $('#fl-ent-appDevPass').parents('.form-group').addClass('has-error has-danger');
    $('#fl-ent-appDevPass').next('.with-errors').html(passError);
    toggleLoginForm('enterprise', 'login');
  }

  if (devEmail !== '' && devPass !== '') {
    setCredentials(enterpriseSubmission.id, {
      type: 'apple-enterprise',
      status: 'created',
      email: devEmail,
      password: devPass
    })
    .then(function () {
      return enterpriseTeamSetup(devEmail, true);
    })
    .then(function () {
      $('[name="fl-ent-distribution"][value="generate-file"]').prop('checked', true).trigger('change');
    })
    .catch(function (error) {
      var message = 'Unable to log in';

      if (Fliplet.parseError(error)) {
        message += '<div class="alert alert-info alert-sm">' + Fliplet.parseError(error) + '</div>'
      }

      Fliplet.Modal.hideAll();
      Fliplet.Modal.alert({
        message: message,
        size: 'small'
      });

      toggleLoginForm('enterprise', 'login');
    });
  }
});

$('.log-out-enterprise').on('click', function () {
  clearEnterpriseCredentials();
});

$('[name="fl-ent-distribution"]').on('change', function () {
  var value = $(this).val();

  $('#fl-ent-teams').prop('required',true);

  if (value === 'previous-file') {
    if (enterpriseCertificateReplaced) {
      $('.enterprise-previous-file-success').addClass('show');
    }

    $('.enterprise-generate-file, .enterprise-generate-file-success, .enterprise-upload-file').removeClass('show');
  }
  if (value === 'generate-file') {
    if (enterpriseCertificateCreated) {
      $('.enterprise-generate-file-success').addClass('show');
    } else {
      $('.enterprise-generate-file').addClass('show');
    }
    $('.enterprise-previous-file-success, .enterprise-upload-file').removeClass('show');
    $('#fl-ent-certificate').prop('required',false);
  }
  if (value === 'upload-file') {
    $('.enterprise-upload-file').addClass('show');
    $('.enterprise-previous-file-success, .enterprise-generate-file, .enterprise-generate-file-success').removeClass('show');
    $('#fl-ent-certificate').prop('required',true);
  }
  Fliplet.Widget.autosize();
});

$('#fl-load-ent-teams').on('click', function (e) {
  e.preventDefault();
  var $button = $(this);
  var initialLabel = $button.html();
  $button.html('Loading ' + spinner).addClass('disabled');
  loadEnterpriseTeams($('.enterprise-logged-email').text())
    .then(function () {
      $button.html(initialLabel).removeClass('disabled');
    })
    .catch(function (error) {
      $button.html(initialLabel).removeClass('disabled');

      var message = 'Unable to load teams';

      if (Fliplet.parseError(error)) {
        message += '<div class="alert alert-info alert-sm">' + Fliplet.parseError(error) + '</div>'
      }

      Fliplet.Modal.hideAll();
      Fliplet.Modal.alert({
        message: message,
        size: 'small'
      });

      if (error && Fliplet.parseError(error).match(/^The email or password you entered .+ are wrong/)) {
        clearEnterpriseCredentials();
      }
    });
});

$('#fl-ent-teams').on('change', function () {
  var value = $(this).val();
  var teamName = value ? $('#fl-ent-teams').find(":selected").data('team-name') : '';

  if (value !== '') {
    $('.enterprise-more-options').addClass('show');
    $('.enterprise-generate-cert').removeClass('disabled');
    $('.enterprise-upload-certificate').removeClass('disabled');
  } else {
    $('.enterprise-more-options').removeClass('show');
    $('.enterprise-generate-cert').addClass('disabled');
    $('.enterprise-upload-certificate').addClass('disabled');
  }

  var devEmail = $('#fl-ent-appDevLogin').val();
  return refreshAppEnterpriseOptions(devEmail, value, teamName);
});

$('.enterprise-generate-cert').on('click', function () {
  var $this = $(this);
  $(this).html('Generating ' + spinner);
  $(this).addClass('disabled');
  $('.generate-error').html(''); // Cleans errors
  var teamId = $('#fl-ent-teams').val();
  enterpriseTeamId = teamId;
  var teamName = $('#fl-ent-teams').find(":selected").data('team-name');

  return setCredentials(enterpriseSubmission.id, {
      teamId: teamId,
      teamName: teamName
    })
    .then(function () {
      return createCertificates({
        organizationId: organizationID,
        submissionId: enterpriseSubmission.id,
        inHouse: true
      })
        .then(function (response) {
          var p12Url = Fliplet.Env.get('apiUrl') + 'v1/organizations/' + organizationID + '/credentials/submission-' + enterpriseSubmission.id + '/download/p12'
          enterpriseCertificateCreated = true;
          $('.enterprise-generate-file-success').find('.enterprise-file-name-success').html(response.certificate.name);
          $('.enterprise-generate-file-success').find('.enterprise-file-expire-success').html(moment(response.certificate.expiresAt).format('MMMM Do YYYY'));
          $('.enterprise-generate-file-success').find('.enterprise-file-download-success').attr('href', p12Url);
          $('.enterprise-generate-file').removeClass('show');
          $('.enterprise-generate-file-success').addClass('show');
          $this.html('Generate certificate');
          $this.removeClass('disabled');
        });
    })
    .catch(function (error) {
      $this.html('Generate certificate');
      $this.removeClass('disabled');
      console.log(error);
      $('.generate-error').html(Fliplet.parseError(error));
    });
});

$('#fl-ent-certificate').on('change', function () {
  enterpriseFileField = this;
  var fileName = enterpriseFileField.value.replace(/\\/g, '/').replace(/.*\//, '');

  if (enterpriseFileField.files && enterpriseFileField.files[0]) {
    $('#fl-ent-certificate-label').val(fileName);
  }
});

$('#fl-ent-certificate-manual-details').on('change', function () {
  enterpriseFileFieldManual = this;
  var fileName = enterpriseFileFieldManual.value.replace(/\\/g, '/').replace(/.*\//, '');

  if (enterpriseFileFieldManual.files && enterpriseFileFieldManual.files[0]) {
    $('#fl-ent-certificate-manual-details-label').val(fileName);
  }
});

$('#fl-ent-mobileprovision-manual-details').on('change', function () {
  enterpriseFileProvisionFieldManual = this;
  var fileName = enterpriseFileProvisionFieldManual.value.replace(/\\/g, '/').replace(/.*\//, '');

  if (enterpriseFileProvisionFieldManual.files && enterpriseFileProvisionFieldManual.files[0]) {
    $('#fl-ent-mobileprovision-manual-details-label').val(fileName);
  }
});

$('.enterprise-replace-cert').on('click', function () {
  var $this = $(this);
  $(this).html('Replacing ' + spinner);
  $(this).addClass('disabled');
  $('.replace-error').html(''); // Cleans errors
  var teamId = enterprisePreviousCredential ? enterprisePreviousCredential.teamId : '';
  enterpriseTeamId = teamId;
  var teamName = enterprisePreviousCredential ? enterprisePreviousCredential.teamName : '';

  if (enterprisePreviousCredential.certificate && enterprisePreviousCredential.certificate.id) {
    return revokeCertificate(enterpriseSubmission.id, enterprisePreviousCredential.certificate.id)
      .then(function () {
        return setCredentials(enterpriseSubmission.id, {
          teamId: teamId,
          teamName: teamName
        })
          .then(function () {
            return createCertificates({
              organiazationId: organizationID,
              submissionId: enterpriseSubmission.id,
              inHouse: true
            })
              .then(function (response) {
                var p12Url = Fliplet.Env.get('apiUrl') + 'v1/organizations/' + organizationID + '/credentials/submission-' + enterpriseSubmission.id + '/download/p12'
                enterpriseCertificateReplaced = true;
                $('.enterprise-previous-file-success').find('.enterprise-file-name-success').html(response.certificate.name);
                $('.enterprise-previous-file-success').find('.enterprise-file-expire-success').html(moment(response.certificate.expiresAt).format('MMMM Do YYYY'));
                $('.enterprise-previous-file-success').find('.enterprise-file-download-success').attr('href', p12Url);
                $('.enterprise-previous-file-success').addClass('show');
                $this.html('Replace certificate');
                $this.removeClass('disabled');
              });
          });
      })
      .catch(function (error) {
        $this.html('Replace certificate');
        $this.removeClass('disabled');
        console.log(error);
        $('.replace-error').html(Fliplet.parseError(error));
      });
  } else {
    $this.html('Replace certificate');
    $this.removeClass('disabled');
    $('.replace-error').html("We could not replace the certificate.\nPlease log into your https://developer.apple.com/account/ and revoke the certificate and create a new one using Fliplet.");
  }
});

$('.ent-enter-manually').on('click', function () {
  $('.enterprise-login-details').addClass('hidden');
  $('.enterprise-manual-details').addClass('show');
  enterpriseManual = true;

  $('#fl-ent-appDevLogin').prop('required', false);
  $('#fl-ent-appDevPass').prop('required', false);
  $('#fl-ent-teams').prop('required',false);

  $('#fl-ent-teamName').prop('required', true);
  $('#fl-ent-teamId').prop('required', true);
  $('#fl-ent-certificate-manual-details').prop('required', true);
  $('#fl-ent-mobileprovision-manual-details').prop('required', true);
});

$('.enterprise-back-login').on('click', function () {
  $('.enterprise-login-details').removeClass('hidden');
  $('.enterprise-manual-details').removeClass('show');
  enterpriseManual = false;

  $('#fl-ent-appDevLogin').prop('required', true);
  $('#fl-ent-appDevPass').prop('required', true);
  $('#fl-ent-teams').prop('required',true);

  $('#fl-ent-teamName').prop('required', false);
  $('#fl-ent-teamId').prop('required', false);
  $('#fl-ent-certificate-manual-details').prop('required', false);
  $('#fl-ent-mobileprovision-manual-details').prop('required', false);
});
/**/

$(document).on('click', '[data-cancel-build-id]', function () {
  var buildId = $(this).data('cancel-build-id');

  Fliplet.API.request({
    method: 'DELETE',
    url: 'v1/apps/' + Fliplet.Env.get('appId') + '/submissions/' + buildId
  })
  .then(function () {
    clearTimeout(initLoad);
    initialLoad(false, 0);
  })
});

$('.browse-files').on('click', function (e) {
  e.preventDefault();

  Fliplet.Studio.emit('overlay', {
    name: 'widget',
    options: {
      size: 'large',
      package: 'com.fliplet.file-manager',
      title: 'File Manager',
      classes: 'data-source-overlay',
      data: {
        context: 'overlay',
        appId: Fliplet.Env.get('appId')
      }
    }
  });
});

// Listen for 2FA code when requested
socket.on('aab.apple.login.2fa', function (data) {
  socketClientId = data.clientId;
  // Ask user for code
  toggleLoginForm(getCurrentLoginForm(), '2fa-code', data);
});

socket.on('aab.apple.login.2fa.devices', function (data) {
  socketClientId = data.clientId;
  // Ask user for device
  toggleLoginForm(getCurrentLoginForm(), '2fa-device', data);
});

/* INIT */
$('#appStoreConfiguration, #enterpriseConfiguration, #unsignedConfiguration').validator().off('change.bs.validator focusout.bs.validator');
$('[name="submissionType"][value="appStore"]').prop('checked', true).trigger('change');

updateServerLocation();

// Start
initLoad = initialLoad(true, 0);