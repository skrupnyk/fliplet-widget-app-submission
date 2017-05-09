Fliplet.Env.set('appId', 1);

var android;
var requiredList;

function validateForm(platform, submissionType){
	return new Promise(function (resolve, reject){

		requiredList = ['#appName', 
		'#appIconName', 
		'#shortdescription', 
		'#keywords', 
		'#primaryCategory', 
		'#description', 
		'#supportUrl',
		'#copyright',
		'#firstname',
		'#lastname',
		'#address',
		'#city',
		'#country',
		'#postcode',
		'#phonenumber',
		'#email'
		];

		$('.form-group').removeClass('has-error');

		for (var input in requiredList){
			if (!$(requiredList[input]).closest( '.form-group' ).hasClass( 'hidden' )) {
				if ( $(requiredList[input]).val() === '') {
  					$(requiredList[input]).closest( '.form-group' ).addClass( 'has-error' );
  				}
			}
		}

	});  
}

// Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  $form.submit();
});