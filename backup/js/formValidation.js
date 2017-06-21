
var requiredList;

function validateForm(platform, submissionType){

	var hasError = false;

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
				hasError = true;
			}
		}
	}

	return hasError;
}
