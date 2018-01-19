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
var appStorePreviousCredential = undefined;
var appStoreFileField = undefined;
var appStoreTeamId = undefined;
var enterprisePreviousCredential = undefined;
var enterpriseFileField = undefined;
var enterpriseFileFieldManual = undefined;
var enterpriseFileProvisionFieldManual = undefined;
var enterpriseTeamId = undefined;
var enterpriseManual = false;
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
var organizationID = Fliplet.Env.get('organizationId');
var userInfo;
var hasFolders = false;
var screenShotsMobile = [];
var screenShotsTablet = [];
var haveScreenshots = false;
var screenshotValidationNotRequired = false;

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

function checkHasScreenshots() {
  haveScreenshots = hasFolders && screenShotsMobile.length && screenShotsTablet.length;
}

function addThumb(thumb) {
  var template = Fliplet.Widget.Templates['templates.thumbs'];
  return template(thumb);
}

function loadAppStoreData() {
  $('#appStoreConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");

    /* APP NAME */
    if (name === "fl-store-appName") {
      $('[name="' + name + '"]').val(appName);
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

    $('[name="' + name + '"]').val((typeof appStoreSubmission.data[name] !== "undefined") ? appStoreSubmission.data[name] : '');
  });

  if (appName !== '' && appIcon && ((hasFolders && screenShotsMobile.length && screenShotsTablet.length) || screenshotValidationNotRequired)) {
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }

    $('.app-details-appStore .app-screenshots').removeClass('has-error');

    allAppData.push('appStore');
  } else {
    $('.app-details-appStore').addClass('required-fill');

    if (appName === '') {
      $('.app-details-appStore .app-list-name').addClass('has-error');
    }
    if (!appIcon) {
      $('.app-details-appStore .app-icon-name').addClass('has-error');
    }
    if (appSettings.splashScreen && appSettings.splashScreen.size && (appSettings.splashScreen.size[0] && appSettings.splashScreen.size[1]) < 2732) {
      $('.app-details-appStore .app-splash-screen').addClass('has-warning');
    }

    if (hasFolders) {
      if (screenShotsMobile.length == 0 || screenShotsTablet.length == 0) {
        $('.app-details-appStore .app-screenshots').addClass('has-error');
      }
    } else {
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

    if (!appIcon) {
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

      $('.appStore-login-details').removeClass('hidden');
      $('.appStore-logged-in, .appStore-more-options').removeClass('show');
      appStoreLoggedIn = false;

      saveAppStoreData();
    }
    if (origin === "enterprise") {
      enterpriseSubmission = builtSubmission.submission;
      // Auto increments the version number and saves the submission
      var newVersionNumber = incrementVersionNumber(enterpriseSubmission.data['fl-ent-versionNumber']);
      $('[name="fl-ent-versionNumber"]').val(newVersionNumber);

      $('.enterprise-login-details').removeClass('hidden');
      $('.enterprise-logged-in, .enterprise-more-options').removeClass('show');
      enterpriseLoggedIn = false;

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
    $('.save-' + origin + '-request').addClass('saved').hide().fadeIn(250);

    clearTimeout(initLoad);
    initialLoad(false, 0);
    
    Fliplet.Widget.autosize();

    setTimeout(function() {
      $('.save-' + origin + '-request').fadeOut(250, function() {
        $('.save-' + origin + '-request').removeClass('saved');
        Fliplet.Widget.autosize();
      });
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
        if(submission.data.hasOwnProperty('fl-credentials')){
          delete submission.data['fl-credentials'];
        }
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
    submission.data.folderStructure = appSettings.folderStructure;
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
        if(submission.data.hasOwnProperty('fl-credentials')){
          delete submission.data['fl-credentials'];
        }
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

            // Check which type of certificate was given
            if (origin === "appStore" && appStoreSubmission.data['fl-store-distribution'] === 'previous-file' && appStorePreviousCredential) {
              return setCredentials(organizationID, appStoreSubmission.id, {
                  teamId: appStorePreviousCredential.teamId,
                  teamName: appStorePreviousCredential.teamName,
                  certSigningRequest: appStorePreviousCredential.certSigningRequest,
                  p12: appStorePreviousCredential.p12,
                  certificate: appStorePreviousCredential.certificate,
                  content: appStorePreviousCredential.content
                })
                .then(function() {
                  submissionBuild(newSubmission, origin);
                });
            }

            if (origin === "appStore" && appStoreSubmission.data['fl-store-distribution'] === 'upload-file') {
              var formData = new FormData();
              var fileName = appStoreFileField.value.replace(/\\/g, '/').replace(/.*\//, '');
              var teamID = $('#fl-store-team-upload').val();
              var teamName = $('#fl-store-team-upload option[value="'+teamID+'"]').data('team-name');

              if (appStoreFileField.files && appStoreFileField.files[0]) {
                formData.append('p12', appStoreFileField.files[0])
                formData.append('certificateName', fileName)
              }

              return setCertificateP12(organizationID, appStoreSubmission.id, formData)
                .then(function() {
                  return setCredentials(organizationID, appStoreSubmission.id, {
                    teamId: teamID,
                    teamName: teamName
                  });
                })
                .then(function() {
                  submissionBuild(newSubmission, origin);
                });
            }

            if (origin === "enterprise" && enterpriseSubmission.data['fl-ent-distribution'] === 'previous-file' && enterprisePreviousCredential) {
              return setCredentials(organizationID, enterpriseSubmission.id, {
                  teamId: enterprisePreviousCredential.teamId,
                  teamName: enterprisePreviousCredential.teamName,
                  certSigningRequest: enterprisePreviousCredential.certSigningRequest,
                  p12: enterprisePreviousCredential.p12,
                  certificate: enterprisePreviousCredential.certificate,
                  content: enterprisePreviousCredential.content
                })
                .then(function() {
                  submissionBuild(newSubmission, origin);
                });
            }

            if (origin === "enterprise" && enterpriseSubmission.data['fl-ent-distribution'] === 'upload-file') {
              var formData = new FormData();
              var fileName = enterpriseFileField.value.replace(/\\/g, '/').replace(/.*\//, '');
              var teamID = $('#fl-ent-team-upload').val();
              var teamName = $('#fl-ent-team-upload option[value="'+teamID+'"]').data('team-name');

              if (enterpriseFileField.files && enterpriseFileField.files[0]) {
                formData.append('p12', enterpriseFileField.files[0])
                formData.append('certificateName', fileName)
              }

              var teamId = $('#fl-ent-team-upload').val();
              var teamName = $('#fl-ent-team-upload[value="' + teamId + '"]').data('team-name');

              return setCredentials(organizationID, enterpriseSubmission.id, {
                  teamId: teamId,
                  teamName: teamName
                })
                .then(function() {
                  return setCertificateP12(organizationID, enterpriseSubmission.id, formData)
                })
                .then(function() {
                  return setCredentials(organizationID, enterpriseSubmission.id, {
                    teamId: teamID,
                    teamName: teamName
                  });
                })
                .then(function() {
                  submissionBuild(newSubmission, origin);
                });
            }

            submissionBuild(newSubmission, origin);
          });
      }

      Fliplet.App.Submissions.update(submission.id, submission.data).then(function() {
        // Check which type of certificate was given
        if (origin === "appStore" && appStoreSubmission.data['fl-store-distribution'] === 'previous-file' && appStorePreviousCredential) {
          return setCredentials(organizationID, appStoreSubmission.id, {
              teamId: appStorePreviousCredential.teamId,
              teamName: appStorePreviousCredential.teamName,
              certSigningRequest: appStorePreviousCredential.certSigningRequest,
              p12: appStorePreviousCredential.p12,
              certificate: appStorePreviousCredential.certificate,
              content: appStorePreviousCredential.content
            })
            .then(function() {
              submissionBuild(submission, origin);
            });
        }

        if (origin === "appStore" && appStoreSubmission.data['fl-store-distribution'] === 'upload-file') {
          var formData = new FormData();
          var fileName = appStoreFileField.value.replace(/\\/g, '/').replace(/.*\//, '');
          var teamID = $('#fl-store-team-upload').val();
          var teamName = $('#fl-store-team-upload option[value="'+teamID+'"]').data('team-name');

          if (appStoreFileField.files && appStoreFileField.files[0]) {
            formData.append('p12', appStoreFileField.files[0])
            formData.append('certificateName', fileName)
          }

          return setCertificateP12(organizationID, appStoreSubmission.id, formData)
            .then(function() {
              return setCredentials(organizationID, appStoreSubmission.id, {
                teamId: teamID,
                teamName: teamName
              });
            })
            .then(function() {
              submissionBuild(submission, origin);
            });
        }

        if (origin === "enterprise" && enterpriseSubmission.data['fl-ent-distribution'] === 'previous-file' && enterprisePreviousCredential) {
          return setCredentials(organizationID, enterpriseSubmission.id, {
              teamId: enterprisePreviousCredential.teamId,
              teamName: enterprisePreviousCredential.teamName,
              certSigningRequest: enterprisePreviousCredential.certSigningRequest,
              p12: enterprisePreviousCredential.p12,
              certificate: enterprisePreviousCredential.certificate,
              content: enterprisePreviousCredential.content
            })
            .then(function() {
              submissionBuild(submission, origin);
            });
        }

        if (origin === "enterprise" && enterpriseSubmission.data['fl-ent-distribution'] === 'upload-file') {
          var formData = new FormData();
          var fileName = enterpriseFileField.value.replace(/\\/g, '/').replace(/.*\//, '');
          var teamID = $('#fl-ent-team-upload').val();
          var teamName = $('#fl-ent-team-upload option[value="'+teamID+'"]').data('team-name');

          if (enterpriseFileField.files && enterpriseFileField.files[0]) {
            formData.append('p12', enterpriseFileField.files[0])
            formData.append('certificateName', fileName)
          }

          return setCertificateP12(organizationID, enterpriseSubmission.id, formData)
            .then(function() {
              return setCredentials(organizationID, enterpriseSubmission.id, {
                teamId: teamID,
                teamName: teamName
              });
            })
            .then(function() {
              submissionBuild(submission, origin);
            });
        }

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

    if (name === 'fl-store-distribution') {
      var newValue = $('[name="'+name+'"]:checked').val();
      if (newValue === 'previous-file') {
        pushData.apnTeamId = appStorePreviousCredential.teamId;
      }
      if (newValue === 'generate-file') {
        pushData.apnTeamId = $('#fl-store-team-generate').val();
      }
      if (newValue === 'upload-file') {
        pushData.apnTeamId = $('#fl-store-team-upload').val();
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

  $('#enterpriseConfiguration [name]').each(function(i, el) {
    var name = $(el).attr("name");
    var value = $(el).val();

    if (name === 'fl-ent-distribution') {
      var newValue = $('[name="'+name+'"]:checked').val();
      if (newValue === 'previous-file') {
        pushData.apnTeamId = enterprisePreviousCredential.teamId;
      }
      if (newValue === 'generate-file') {
        pushData.apnTeamId = $('#fl-ent-team-generate').val();
      }
      if (newValue === 'upload-file') {
        pushData.apnTeamId = $('#fl-ent-team-upload').val();
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
      }).then(function(files) {
        data['fl-ent-certificate-files'] = files;
        return Promise.resolve();
      });
    }

    uploadFilePromise.then(function() {
      enterpriseSubmission.data = data;
      notificationSettings = pushData;

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

    if (request) {
      requestBuild('enterprise', enterpriseSubmission);
    } else {
      save('enterprise', enterpriseSubmission);
    }
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
      alert('Your settings have been saved!\n\nHowever push notifications will only work on App Store and Enterprise apps.\nRequest an app for one of those types and fill in the Bundle ID and Team/Team ID fields.\n\nYou don\'t need to request another app if you have requested an app for App Store or Enterprise before with those two fields filled in already.');
    }

    setTimeout(function() {
      $('.save-push-progress').removeClass('saved');
    }, 4000);
  });
}

function setCredentials(organizationId, id, data) {
  return Fliplet.API.request({
    method: 'PUT',
    url: 'v1/organizations/' + organizationId + '/credentials/submission-' + id, 
    data: data
  })
  .then(() => {
    return Promise.resolve();
  })
}

function getTeams(organizationId, id) {
  return Fliplet.API.request({
    method: 'GET',
    url: 'v1/organizations/' + organizationId + '/credentials/submission-' + id + '/teams?itunes=false'
  })
  .then(function(result) {
    return Promise.resolve(result.teams);
  });
}

function searchCredentials(organizationId, data) {
  return Fliplet.API.request({
    method: 'POST',
    url: 'v1/organizations/' + organizationId + '/credentials/search',
    data: data
  })
  .then(function(credentials) {
    return Promise.resolve(credentials);
  });
}

function getCredential(organizationId, credentialKey) {
  return Fliplet.API.request({
    method: 'GET',
    url: 'v1/organizations/' + organizationId + '/credentials/' + credentialKey
  })
  .then(function(credential) {
    return Promise.resolve(credential);
  });
}

function createCertificates(organizationId, id) {
  return Fliplet.API.request({
    method: 'POST',
    url: 'v1/organizations/' + organizationId + '/credentials/submission-' + id + '/certificates'
  })
  .then(function(credential) {
    return Promise.resolve(credential);
  });
}

function setCertificateP12(organizationId, id, file) {
  return Fliplet.API.request({
    method: 'PUT',
    url: 'v1/organizations/' + organizationId + '/credentials/submission-' + id + '?fileName=p12',
    data: file,
    contentType: false,
    processData: false
  })
  .then(function() {
    return Promise.resolve();
  });
}

function revokeCertificate(organizationId, id, certId) {
  return Fliplet.API.request({
    method: 'DELETE',
    url: 'v1/organizations/' + organizationId + '/credentials/submission-' + id + '/' + certId
  })
  .then(function(result) {
    return Promise.resolve();
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
$('[name="fl-store-screenshots"]').on('change', function() {
  var value = $(this).val();
  var id = $(this).attr('id');
  checkHasScreenshots();

  if (value === 'new' && !haveScreenshots) {
    $('[data-item="fl-store-screenshots-new-warning"]').addClass('show');

    $('[data-item="fl-store-screenshots-new"]').removeClass('show');
    $('[data-item="fl-store-screenshots-existing"]').removeClass('show');
  }
  if (value === 'new' && haveScreenshots) {
    $('[data-item="fl-store-screenshots-new-warning"]').removeClass('show');
    $('[data-item="fl-store-screenshots-new"]').addClass('show');

    $('[data-item="fl-store-screenshots-existing"]').removeClass('show');

    
    _.take(screenShotsMobile, 4).forEach(function(thumb) {
      $('.mobile-thumbs').append(addThumb(thumb));
    });

    _.take(screenShotsTablet, 4).forEach(function(thumb) {
      $('.tablet-thumbs').append(addThumb(thumb));
    });
  }
  if (value === 'existing') {
    $('.app-details-appStore .app-screenshots').removeClass('has-error');
    $('[data-item="fl-store-screenshots-existing"]').addClass('show');

    $('[data-item="fl-store-screenshots-new-warning"]').removeClass('show');
    $('[data-item="fl-store-screenshots-new"]').removeClass('show');
  }
});

$('[name="submissionType"]').on('change', function() {
  var selectedOptionId = $(this).attr('id');

  $('.fl-sb-panel').removeClass('show');
  $('.' + selectedOptionId).addClass('show');

  Fliplet.Widget.autosize();
});

$('[name="fl-store-credentials"]').on('change', function() {
  var value = $(this).val();

  if (value === 'useOwn') {
    $('.fl-store-credential.indented-area').removeClass('hidden');
  } else {
    $('.fl-store-credential.indented-area').addClass('hidden');
  }

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
      if (appStoreLoggedIn) {
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
        alert('You need to login with your Apple developer account details.\nSelect one option to provide use with a distribution certificate.');
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

  if (!enterpriseManual && !enterpriseLoggedIn) {
    alert('Please log in with the Apple Developer Account or choose to enter the data manually.');
    return;
  }

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

/* Credentials and Certificates App Store */
$('.login-appStore-button').on('click', function() {
  var $this = $(this);
  $(this).html('Logging in...');
  $(this).addClass('disabled');
  var devEmail = $('#fl-store-appDevLogin').val();
  var devPass = $('#fl-store-appDevPass').val();
  var emailError = $('#fl-store-appDevLogin').data('error');
  var passError = $('#fl-store-appDevPass').data('error');

  // Remove errors
  $('#fl-store-appDevLogin').parents('.form-group').removeClass('has-error has-danger');
  $('#fl-store-appDevLogin').next('.with-errors').html('');
  $('#fl-store-appDevPass').parents('.form-group').removeClass('has-error has-danger');
  $('#fl-store-appDevPass').next('.with-errors').html('');
  $this.next('login-error').html('');
  
  if (devEmail === '') {
    $('#fl-store-appDevLogin').parents('.form-group').addClass('has-error has-danger');
    $('#fl-store-appDevLogin').next('.with-errors').html(emailError);
    $(this).html('Log in');
    $(this).removeClass('disabled');
    Fliplet.Widget.autosize();
  }

  if (devPass === '') {
    $('#fl-store-appDevPass').parents('.form-group').addClass('has-error has-danger');
    $('#fl-store-appDevPass').next('.with-errors').html(passError);
    $(this).html('Log in');
    $(this).removeClass('disabled');
    Fliplet.Widget.autosize();
  }

  if (devEmail !== '' && devPass !== '') {
    setCredentials(organizationID, appStoreSubmission.id, {
      type: 'apple',
      status: 'created',
      email: devEmail,
      password: devPass
    })
    .then(function() {
      return getTeams(organizationID, appStoreSubmission.id)
        .then(function(teams) {
          var appStoreTeams = _.filter(teams, function(team) {
            return team.type === "Company/Organization";
          })
          appStoreTeams.forEach(function(team, i) {
            $('.appStore-team').append('<option value="' + team.teamId + '" data-team-name="' + team.name + '">'+ team.name +' - ' + team.teamId + '</option>');
          });

          return searchCredentials(organizationID, {
              email: devEmail,
              password: devPass,
              type: 'apple'
            })
            .then(function(response) {
              var credentialKey = _.max(Object.keys(_.omit(response, 'submission-' + appStoreSubmission.id)), function (o) {
                return response[o].verifiedAt;
              });

              if (credentialKey) {
                return getCredential(organizationID, credentialKey)
                  .then(function(credential) {
                    if (credential.certificate) {
                      appStorePreviousCredential = credential;
                      var expiresAt = new Date(credential.certificate.expiresAt);
                      var todayDate = new Date();
                      var remainingTime = (expiresAt.getTime() - todayDate.getTime())/(1000*60*60*24.0);

                      if (remainingTime < 60) {
                        $('.appStore-certificate-expiring, .appStore-replace-element').removeClass('hidden');
                        $('.appStore-file-expire').addClass('text-warning');
                      }
                      $('[name="fl-store-distribution"][value="previous-file"]').prop('checked', true).trigger('change');
                      $('.appStore-previous-file').find('.appStore-file-name').html(credential.certificate.name);
                      $('.appStore-previous-file').find('.appStore-file-expire').html(moment(credential.certificate.expiresAt).format('MMMM Do YYYY'));
                    } else if (credential.p12) {
                      appStorePreviousCredential = credential;

                      $('[name="fl-store-distribution"][value="previous-file"]').prop('checked', true).trigger('change');
                      $('.appStore-previous-file').find('.appStore-file-name').html(credential.certificateName);
                      $('.appStore-previous-file').find('.appStore-file-expire').html('N/A');
                    } else {
                      $('.if-appStore-credential').addClass('hidden');
                      $('[name="fl-store-distribution"][value="generate-file"]').prop('checked', true).trigger('change');
                    }

                    $this.html('Log in');
                    $this.removeClass('disabled');
                    $('.appStore-logged-emai').html(devEmail);
                    $('.appStore-login-details').addClass('hidden');
                    $('.appStore-logged-in, .appStore-more-options').addClass('show');
                    appStoreLoggedIn = true;
                    Fliplet.Widget.autosize();
                  });
              } 

              $('.if-appStore-credential').addClass('hidden');
              $('[name="fl-store-distribution"][value="generate-file"]').prop('checked', true).trigger('change');
              $this.html('Log in');
              $this.removeClass('disabled');

              $('.appStore-logged-emai').html(devEmail);
              $('.appStore-login-details').addClass('hidden');
              $('.appStore-logged-in, .appStore-more-options').addClass('show');
              appStoreLoggedIn = true;
              Fliplet.Widget.autosize();
            });
        });
    })
    .catch(function(error) {
      if (error.responseJSON) {
        $this.next('.login-error').html(error.responseJSON.message);
      }
      $this.html('Log in');
      $this.removeClass('disabled');
      Fliplet.Widget.autosize();
    });
  }
});

$('.log-out-appStore').on('click', function() {
  appStoreLoggedIn = false;
  $('.appStore-logged-emai').html('');
  $('.appStore-login-details').removeClass('hidden');
  $('.appStore-logged-in, .appStore-more-options').removeClass('show');
});

$('[name="fl-store-distribution"]').on('change', function() {
  var value = $(this).val();

  if (value === 'previous-file') {
    if (appStoreCertificateReplaced) {
      $('.appStore-previous-file-success').addClass('show');
    } else {
      $('.appStore-previous-file').addClass('show');
    }
    $('.appStore-generate-file, .appStore-generate-file-success, .appStore-upload-file').removeClass('show');

    $('#fl-store-team-generate').prop('required',false);
    $('#fl-store-team-upload').prop('required',false);
    $('#fl-store-certificate').prop('required',false);
  }
  if (value === 'generate-file') {
    if (appStoreCertificateCreated) {
      $('.appStore-generate-file-success').addClass('show');
    } else {
      $('.appStore-generate-file').addClass('show');
    }
    $('.appStore-previous-file, .appStore-previous-file-success, .appStore-upload-file').removeClass('show');

    $('#fl-store-team-generate').prop('required',true);
    $('#fl-store-team-upload').prop('required',false);
    $('#fl-store-certificate').prop('required',false);
  }
  if (value === 'upload-file') {
    $('.appStore-upload-file').addClass('show');
    $('.appStore-previous-file, .appStore-previous-file-success, .appStore-generate-file, .appStore-generate-file-success').removeClass('show');

    $('#fl-store-team-generate').prop('required',false);
    $('#fl-store-team-upload').prop('required',true);
    $('#fl-store-certificate').prop('required',true);
  }
  Fliplet.Widget.autosize();
});

$('#fl-store-team-generate').on('change', function() {
  var value = $(this).val();

  if (value !== '') {
    $('.appStore-generate-cert').removeClass('disabled');
  } else {
    $('.appStore-generate-cert').addClass('disabled');
  }
});

$('#fl-store-team-upload').on('change', function() {
  var value = $(this).val();

  if (value !== '') {
    $('.appStore-upload-certificate').removeClass('disabled');
  } else {
    $('.appStore-upload-certificate').addClass('disabled');
  }
});

$('.appStore-generate-cert').on('click', function() {
  var $this = $(this);
  $(this).html('Generating...');
  $(this).addClass('disabled');
  $('.generate-error').html(''); // Cleans errors
  var teamId = $('#fl-store-team-generate').val();
  appStoreTeamId = teamId;
  var teamName = $('#fl-store-team-generate[value="' + teamId + '"]').data('team-name');

  return setCredentials(organizationID, appStoreSubmission.id, {
      teamId: teamId,
      teamName: teamName
    })
    .then(function() {
      return createCertificates(organizationID, appStoreSubmission.id)
        .then(function(response) {
          appStoreCertificateCreated = true;
          $('.appStore-generate-file-success').find('.appStore-file-name-success').html(response.certificate.name);
          $('.appStore-generate-file-success').find('.appStore-file-expire-success').html(moment(response.certificate.expiresAt).format('MMMM Do YYYY'));
          $('.appStore-generate-file').removeClass('show');
          $('.appStore-generate-file-success').addClass('show');
          $this.html('Generate certificate');
          $this.removeClass('disabled');
        });
    })
    .catch(function(error) {
      $this.html('Generate certificate');
      $this.removeClass('disabled');
      if (error.responseJSON.message) {
        $('.generate-error').html(error.responseJSON.message);
      }
    });
});

$('#fl-store-certificate').on('change', function() {
  appStoreFileField = this;
  var fileName = appStoreFileField.value.replace(/\\/g, '/').replace(/.*\//, '');

  if (appStoreFileField.files && appStoreFileField.files[0]) {
    $('#fl-store-certificate-label').val(fileName);
  }
});

$('.appStore-replace-cert').on('click', function() {
  var $this = $(this);
  $(this).html('Replacing...');
  $(this).addClass('disabled');
  $('.replace-error').html(''); // Cleans errors
  var teamId = appStorePreviousCredential ? appStorePreviousCredential.teamId : '';
  appStoreTeamId = teamId;
  var teamName = appStorePreviousCredential ? appStorePreviousCredential.teamName : '';

  if (appStorePreviousCredential.certificate && appStorePreviousCredential.certificate.id) {
    return revokeCertificate(organizationID, appStoreSubmission.id, appStorePreviousCredential.certificate.id)
      .then(function() {
        return setCredentials(organizationID, appStoreSubmission.id, {
            teamId: teamId,
            teamName: teamName
          })
          .then(function() {
            return createCertificates(organizationID, appStoreSubmission.id)
              .then(function(response) {
                appStoreCertificateReplaced = true;
                $('.appStore-previous-file-success').find('.appStore-file-name-success').html(response.certificate.name);
                $('.appStore-previous-file-success').find('.appStore-file-expire-success').html(moment(response.certificate.expiresAt).format('MMMM Do YYYY'));
                $('.appStore-previous-file').removeClass('show');
                $('.appStore-previous-file-success').addClass('show');
                $this.html('Replace certificate');
                $this.removeClass('disabled');
              });
          });
      })
      .catch(function(error) {
        $this.html('Replace certificate');
        $this.removeClass('disabled');
        if (error.responseJSON.message) {
          $('.replace-error').html(error.responseJSON.message);
        }
      });
    } else {
      $this.html('Replace certificate');
      $this.removeClass('disabled');
      $('.replace-error').html("We could not replace the certificate.\nPlease log into your https://developer.apple.com/account/ and revoke the certificate and create a new one using Fliplet.");
    }
    
});
/**/

/* Credentials and Certificates Enterprise */
$('.login-enterprise-button').on('click', function() {
  var $this = $(this);
  $(this).html('Logging in...');
  $(this).addClass('disabled');
  var devEmail = $('#fl-ent-appDevLogin').val();
  var devPass = $('#fl-ent-appDevPass').val();
  var emailError = $('#fl-ent-distributionnt-appDevLogin').data('error');
  var passError = $('#fl-ent-appDevPass').data('error');

  // Remove errors
  $('#fl-ent-appDevLogin').parents('.form-group').removeClass('has-error has-danger');
  $('#fl-ent-appDevLogin').next('.with-errors').html('');
  $('#fl-ent-appDevPass').parents('.form-group').removeClass('has-error has-danger');
  $('#fl-ent-appDevPass').next('.with-errors').html('');
  $this.next('login-error').html('');
  
  if (devEmail === '') {
    $('#fl-ent-appDevLogin').parents('.form-group').addClass('has-error has-danger');
    $('#fl-ent-appDevLogin').next('.with-errors').html(emailError);
    $(this).html('Log in');
    $(this).removeClass('disabled');
    Fliplet.Widget.autosize();
  }

  if (devPass === '') {
    $('#fl-ent-appDevPass').parents('.form-group').addClass('has-error has-danger');
    $('#fl-ent-appDevPass').next('.with-errors').html(passError);
    $(this).html('Log in');
    $(this).removeClass('disabled');
    Fliplet.Widget.autosize();
  }

  if (devEmail !== '' && devPass !== '') {
    setCredentials(organizationID, enterpriseSubmission.id, {
      type: 'apple-enterprise',
      status: 'created',
      email: devEmail,
      password: devPass
    })
    .then(function() {
      $('[name="fl-ent-distribution"][value="generate-file"]').prop('checked', true).trigger('change');

      return getTeams(organizationID, enterpriseSubmission.id)
        .then(function(teams) {
          var enterpriseTeams = _.filter(teams, function(team) {
            return team.type === "In-House";
          })
          enterpriseTeams.forEach(function(team, i) {
            $('.enterprise-team').append('<option value="' + team.teamId + '" data-team-name="' + team.name + '">'+ team.name +' - ' + team.teamId + '</option>');
          });

          return searchCredentials(organizationID, {
              email: devEmail,
              password: devPass,
              type: 'apple-enterprise'
            })
            .then(function(response) {
              var credentialKey = _.max(Object.keys(_.omit(response, 'submission-' + enterpriseSubmission.id)), function (o) {
                return response[o].verifiedAt;
              });

              if (credentialKey) {
                return getCredential(organizationID, credentialKey)
                  .then(function(credential) {
                    if (credential.certificate) {
                      enterprisePreviousCredential = credential;
                      var expiresAt = new Date(credential.certificate.expiresAt);
                      var todayDate = new Date();
                      var remainingTime = (expiresAt.getTime() - todayDate.getTime())/(1000*60*60*24.0);

                      if (remainingTime < 60) {
                        $('.enterprise-certificate-expiring, .enterprise-replace-element').removeClass('hidden');
                        $('.enterprise-file-expire').addClass('text-warning');
                      }
                      $('.enterprise-previous-file').find('.enterprise-file-name').html(credential.certificate.name);
                      $('.enterprise-previous-file').find('.enterprise-file-expire').html(moment(credential.certificate.expiresAt).format('MMMM Do YYYY'));
                    } else if (credential.p12) {
                      enterprisePreviousCredential = credential;

                      $('.enterprise-previous-file').find('.enterprise-file-name').html(credential.certificateName);
                      $('.enterprise-previous-file').find('.enterprise-file-expire').html('N/A');
                    } else {
                      $('.if-enterprise-credential').addClass('hidden');
                    }

                    $this.html('Log in');
                    $this.removeClass('disabled');
                    $('.enterprise-logged-emai').html(devEmail);
                    $('.enterprise-login-details').addClass('hidden');
                    $('.enterprise-logged-in, .enterprise-more-options').addClass('show');
                    enterpriseLoggedIn = true;
                    Fliplet.Widget.autosize();
                  });
              } 

              $('.if-enterprise-credential').addClass('hidden');
              $('[name="fl-ent-distribution"][value="generate-file"]').prop('checked', true).trigger('change');
              $this.html('Log in');
              $this.removeClass('disabled');

              $('.enterprise-logged-emai').html(devEmail);
              $('.enterprise-login-details').addClass('hidden');
              $('.enterprise-logged-in, .enterprise-more-options').addClass('show');
              enterpriseLoggedIn = true;
              Fliplet.Widget.autosize();
            });
        });
    })
    .catch(function(error) {
      if (error.responseJSON) {
        $this.next('.login-error').html(error.responseJSON.message);
      }
      $this.html('Log in');
      $this.removeClass('disabled');
      Fliplet.Widget.autosize();
    });
  }
});

$('.log-out-enterprise').on('click', function() {
  enterpriseLoggedIn = false;
  $('.enterprise-logged-emai').html('');
  $('.enterprise-login-details').removeClass('hidden');
  $('.enterprise-logged-in, .enterprise-more-options').removeClass('show');
});

$('[name="fl-ent-distribution"]').on('change', function() {
  var value = $(this).val();

  if (value === 'previous-file') {
    if (enterpriseCertificateReplaced) {
      $('.enterprise-previous-file-success').addClass('show');
    } else {
      $('.enterprise-previous-file').addClass('show');
    }
    $('.enterprise-generate-file, .enterprise-generate-file-success, .enterprise-upload-file').removeClass('show');

    $('#fl-ent-team-generate').prop('required',false);
    $('#fl-ent-team-upload').prop('required',false);
    $('#fl-ent-certificate').prop('required',false);
  }
  if (value === 'generate-file') {
    if (enterpriseCertificateCreated) {
      $('.enterprise-generate-file-success').addClass('show');
    } else {
      $('.enterprise-generate-file').addClass('show');
    }
    $('.enterprise-previous-file, .enterprise-previous-file-success, .enterprise-upload-file').removeClass('show');

    $('#fl-ent-team-generate').prop('required',true);
    $('#fl-ent-team-upload').prop('required',false);
    $('#fl-ent-certificate').prop('required',false);
  }
  if (value === 'upload-file') {
    $('.enterprise-upload-file').addClass('show');
    $('.enterprise-previous-file, .enterprise-previous-file-success, .enterprise-generate-file, .enterprise-generate-file-success').removeClass('show');

    $('#fl-ent-team-generate').prop('required',false);
    $('#fl-ent-team-upload').prop('required',true);
    $('#fl-ent-certificate').prop('required',true);
  }
  Fliplet.Widget.autosize();
});

$('#fl-ent-team-generate').on('change', function() {
  var value = $(this).val();

  if (value !== '') {
    $('.enterprise-generate-cert').removeClass('disabled');
  } else {
    $('.enterprise-generate-cert').addClass('disabled');
  }
});

$('#fl-ent-team-upload').on('change', function() {
  var value = $(this).val();

  if (value !== '') {
    $('.enterprise-upload-certificate').removeClass('disabled');
  } else {
    $('.enterprise-upload-certificate').addClass('disabled');
  }
});

$('.enterprise-generate-cert').on('click', function() {
  var $this = $(this);
  $(this).html('Generating...');
  $(this).addClass('disabled');
  $('.generate-error').html(''); // Cleans errors
  var teamId = $('#fl-ent-team-generate').val();
  enterpriseTeamId = teamId;
  var teamName = $('#fl-ent-team-generate[value="' + teamId + '"]').data('team-name');

  return setCredentials(organizationID, enterpriseSubmission.id, {
      teamId: teamId,
      teamName: teamName
    })
    .then(function() {
      return createCertificates(organizationID, enterpriseSubmission.id)
        .then(function(response) {
          enterpriseCertificateCreated = true;
          $('.enterprise-generate-file-success').find('.enterprise-file-name-success').html(response.certificate.name);
          $('.enterprise-generate-file-success').find('.enterprise-file-expire-success').html(moment(response.certificate.expiresAt).format('MMMM Do YYYY'));
          $('.enterprise-generate-file').removeClass('show');
          $('.enterprise-generate-file-success').addClass('show');
          $this.html('Generate certificate');
          $this.removeClass('disabled');
        });
    })
    .catch(function(error) {
      $this.html('Generate certificate');
      $this.removeClass('disabled');
      if (error.responseJSON.message) {
        $('.generate-error').html(error.responseJSON.message);
      }
    });
});

$('#fl-ent-certificate').on('change', function() {
  enterpriseFileField = this;
  var fileName = enterpriseFileField.value.replace(/\\/g, '/').replace(/.*\//, '');

  if (enterpriseFileField.files && enterpriseFileField.files[0]) {
    $('#fl-ent-certificate-label').val(fileName);
  }
});

$('#fl-ent-certificate-manual-details').on('change', function() {
  enterpriseFileFieldManual = this;
  var fileName = enterpriseFileFieldManual.value.replace(/\\/g, '/').replace(/.*\//, '');

  if (enterpriseFileFieldManual.files && enterpriseFileFieldManual.files[0]) {
    $('#fl-ent-certificate-manual-details-label').val(fileName);
  }
});

$('#fl-ent-mobileprovision-manual-details').on('change', function() {
  enterpriseFileProvisionFieldManual = this;
  var fileName = enterpriseFileProvisionFieldManual.value.replace(/\\/g, '/').replace(/.*\//, '');

  if (enterpriseFileProvisionFieldManual.files && enterpriseFileProvisionFieldManual.files[0]) {
    $('#fl-ent-mobileprovision-manual-details-label').val(fileName);
  }
});

$('.enterprise-replace-cert').on('click', function() {
  var $this = $(this);
  $(this).html('Replacing...');
  $(this).addClass('disabled');
  $('.replace-error').html(''); // Cleans errors
  var teamId = enterprisePreviousCredential ? enterprisePreviousCredential.teamId : '';
  enterpriseTeamId = teamId;
  var teamName = enterprisePreviousCredential ? enterprisePreviousCredential.teamName : '';

  if (enterprisePreviousCredential.certificate && enterprisePreviousCredential.certificate.id) {
    return revokeCertificate(organizationID, enterpriseSubmission.id, enterprisePreviousCredential.certificate.id)
      .then(function() {
        return setCredentials(organizationID, enterpriseSubmission.id, {
            teamId: teamId,
            teamName: teamName
          })
          .then(function() {
            return createCertificates(organizationID, enterpriseSubmission.id)
              .then(function(response) {
                enterpriseCertificateReplaced = true;
                $('.enterprise-previous-file-success').find('.enterprise-file-name-success').html(response.certificate.name);
                $('.enterprise-previous-file-success').find('.enterprise-file-expire-success').html(moment(response.certificate.expiresAt).format('MMMM Do YYYY'));
                $('.enterprise-previous-file').removeClass('show');
                $('.enterprise-previous-file-success').addClass('show');
                $this.html('Replace certificate');
                $this.removeClass('disabled');
              });
          });
      })
      .catch(function(error) {
        $this.html('Replace certificate');
        $this.removeClass('disabled');
        if (error.responseJSON.message) {
          $('.replace-error').html(error.responseJSON.message);
        }
      });
  } else {
    $this.html('Replace certificate');
    $this.removeClass('disabled');
    $('.replace-error').html("We could not replace the certificate.\nPlease log into your https://developer.apple.com/account/ and revoke the certificate and create a new one using Fliplet.");
  }
});

$('.ent-enter-manually').on('click', function() {
  $('.enterprise-login-details').addClass('hidden');
  $('.enterprise-manual-details').addClass('show');
  enterpriseManual = true;

  $('#fl-ent-appDevLogin').prop('required', false);
  $('#fl-ent-appDevPass').prop('required', false);
  $('#fl-ent-team-generate').prop('required',false);

  $('#fl-ent-teamName').prop('required', true);
  $('#fl-ent-teamId').prop('required', true);
  $('#fl-ent-certificate-manual-details').prop('required', true);
  $('#fl-ent-mobileprovision-manual-details').prop('required', true);
});

$('.enterprise-back-login').on('click', function() {
  $('.enterprise-login-details').removeClass('hidden');
  $('.enterprise-manual-details').removeClass('show');
  enterpriseManual = false;

  $('#fl-ent-appDevLogin').prop('required', true);
  $('#fl-ent-appDevPass').prop('required', true);
  $('#fl-ent-team-generate').prop('required',true);

  $('#fl-ent-teamName').prop('required', false);
  $('#fl-ent-teamId').prop('required', false);
  $('#fl-ent-certificate-manual-details').prop('required', false);
  $('#fl-ent-mobileprovision-manual-details').prop('required', false);
});
/**/

$(document).on('click', '[data-cancel-build-id]', function() {
  var buildId = $(this).data('cancel-build-id');

  Fliplet.API.request({
    method: 'DELETE',
    url: 'v1/apps/' + Fliplet.Env.get('appId') + '/submissions/' + buildId
  })
  .then(function() {
    clearTimeout(initLoad);
    initialLoad(false, 0);
  })
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
    return submission.status === "queued" || submission.status === "submitted" || submission.status === "processing" || submission.status === "completed" || submission.status === "failed" || submission.status === "cancelled" || submission.status === "ready-for-testing" || submission.status === "tested";
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
      build.updatedAt = ((submission.status === 'completed' || submission.status === 'failed' || submission.status === 'cancelled' || submission.status === 'ready-for-testing' || submission.status === 'tested') && submission.updatedAt) ?
        moment(submission.updatedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build.submittedAt = ((submission.status === 'queued' || submission.status === 'submitted') && submission.submittedAt) ?
        moment(submission.submittedAt).format('MMM Do YYYY, h:mm:ss a') :
        '';
      build[submission.status] = true;
      build.fileUrl = appBuild ? appBuild.url : '';

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
  var asub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "appStore" && submission.platform === "ios";
  });

  checkSubmissionStatus("appStore", asub);

  asub = _.maxBy(asub, function(el) {
    return new Date(el.createdAt).getTime();
  });
  appStoreSubmission = asub;

  var esub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "enterprise" && submission.platform === "ios";
  });

  checkSubmissionStatus("enterprise", esub);

  esub = _.maxBy(esub, function(el) {
    return new Date(el.createdAt).getTime();
  });
  enterpriseSubmission = esub;

  var usub = _.filter(submissions, function(submission) {
    return submission.data.submissionType === "unsigned" && submission.platform === "ios";
  });

  checkSubmissionStatus("unsigned", usub);

  usub = _.maxBy(usub, function(el) {
    return new Date(el.createdAt).getTime();
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
            method: 'GET',
            url: 'v1/apps/' + Fliplet.Env.get('appId')
          })
          .then(function(result) {
            appName = result.app.name;
            appIcon = result.app.icon;
            appSettings = result.app.settings;
          }),
          Fliplet.API.request({
            method: 'GET',
            url: 'v1/organizations/' + Fliplet.Env.get('organizationId')
          })
          .then(function(org) {
            organizationName = org.name;
          })
        ]);
      })
      .then(function() {
        if (appSettings.folderStructure) {
          var structure = [];
          hasFolders = true;
          var appleOnly = _.filter(appSettings.folderStructure, function(obj) {
            return obj.platform === 'apple';
          });

          return Promise.all(appleOnly.map((obj) => {
            return Fliplet.Media.Folders.get({folderId: obj.folderId})
              .then(function(result) {
                var tempObject = {
                  type: obj.type,
                  folderContent: result
                }

                structure.push(tempObject);
                return Promise.resolve(structure);
              });
          }))
          .then(function() {
            structure.forEach(function(el, idx) {
              if (el.type === 'mobile') {
                screenShotsMobile = el.folderContent.files
              }
              if (el.type === 'tablet') {
                screenShotsTablet = el.folderContent.files
              }
            });
          });
        } else {
          hasFolders = false;
          return;
        }
      })
      .then(function() {
        return Fliplet.API.request({
          method: 'GET',
          url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId')
        });
      })
      .then(function(response) {
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
