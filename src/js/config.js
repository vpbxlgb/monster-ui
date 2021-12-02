// var type = 'karlDev';
// var type = 'dev';
var type = 'staging';
// var type = 'qa';
// var type = 'prod';
// var type = 'provisioner';

var baseConfig = {
	developerFlags: {
		showAllCallflows: true
	},
	advancedView: true,
	whitelabel: {
		logoutTimer: 0
	}
};
var envConfig = {
	karlDev: {
		api: {
			'default': 'https://kanderson.2600hz.dev/api/v2/',
			socket: '',
			socketWebphone: ''
		},
		kazooClusterId: ''
	},
	dev: {
		api: {
			'default': 'https://ui.squanchy.2600hz.dev:8443/v2/',
			socket: 'wss://ui.squanchy.2600hz.dev:5443',
			socketWebphone: 'wss://ui.squanchy.2600hz.dev:5443'
		},
		kazooClusterId: '366a221c486922cf98efd6322677df92'
	},
	staging: {
		api: {
			'default': 'https://sandbox.2600hz.com:8443/v2/',
			provisioner: 'https://provisioner.sandbox.2600hz.com/',
			socket: 'wss://sandbox.2600hz.com:5443',
			socketWebphone: 'wss://sandbox.2600hz.com:5065'
		},
		kazooClusterId: 'aa2b36ac6a5edb290159cd1298283322'
	},
	qa: {
		api: {
			'default': 'https://ui.meeseeks.qa.2600hz.com:8443/v2/',
			provisioner: 'https://provisioner.meeseeks.qa.2600hz.com/',
			socket: 'wss://ui.meeseeks.qa.2600hz.com:5443',
			socketWebphone: 'wss://ui.meeseeks.qa.2600hz.com:5065'
		},
		kazooClusterId: 'b84d05d0e184ff746d2e46eff50018fe'
	},
	prod: {
		api: {
			'default': '//ui.zswitch.net/v2/',
			provisioner: '//p3.zswitch.net/',
			socket: 'wss://api.zswitch.net:5443',
			socketWebphone: 'wss://proxy.zswitch.net:5065'
		},
		kazooClusterId: '8a901bea1d3297ef7d4c8d34809472c2'
	},
	provisioner: {
		api: {
			kazoo: 'https://ui.provisioner.2600hz.dev:8000/v2/',
			provisioner: 'https://provisioner.2600hz.dev/'
		},
		kazooClusterId: '9d6f550746003b89601fcebfd530daaf'
	}
}[type];

/**
 * This file lets you connect your different backend services to Monster UI and
 * exposes other settings like whitelabeling that can be set for the entire UI.
 *
 * This minimal, working example is designed to get you up and running in no
 * time when Monster UI is installed on the same server running Kazoo and the
 * APIs are accessible at the default location (`:8000/v2/`).
 *
 * If that is not the case, you will need to hook up your Kazoo server with the
 * `api.'default'` property and you should be good to go.
 *
 * For a full list and description of configurable options, head over to:
 * https://docs.2600hz.com/ui/docs/configuration/
 */
define({
	api: {
		// US Production
		default: 'https://public-api.virtualpbx.com:8443/v2/',

		// US EAST Production
		// default: 'https://us-east.virtualpbx.net:8443/v2/',
	
		// US WEST Production
		// default: 'https://us-west.virtualpbx.net:8443/v2/',
	
		// US CENTRAL Production
		// default: 'https://us-central.virtualpbx.net:8443/v2/',

		// Websockets and provisioner
		socket: 'wss://websockets.virtualpbx.net:5443',
		// socketWebphone: 'wss://websockets.virtualpbx.net:5065',
		provisioner: 'https://p3.zswitch.net/',

		// Sandbox Test Account
		// default: 'https://sandbox.2600hz.com:8443/v2/', 
		// socket: 'wss://sandbox.2600hz.com:5443',
		// provisioner: 'https://provisioner.sandbox.2600hz.com/',
		// clusterManager: 'https://clustermanager.sandbox.2600hz.com/v1/',
		// socketWebphone: 'wss://sandbox.2600hz.com:5065'
		
	},

	// Sandbox
	// webrtc: {
	// 	websocketServers: ['wss://sandbox.2600hz.com:5065'],
	// 	disableVideo: true,
	// 	callSound: 'https://sandbox.2600hz.com/apps/webrtc/metadata/music/incoming.mp3',
	// 	notificationIcon: 'https://sandbox.2600hz.com/apps/webrtc/metadata/icon/WebRTC-Phone.png',
	// 	dtmfSoundsPath: 'https://sandbox.2600hz.com/apps/webrtc/metadata/music'
	// },

	// US Production
	resellerId: '118e374da8e6a0996b089d8229c57ac4',
	kazooClusterId: 'e3b9dfa14fc6b85d8f361f0fda5e19a9',
		
	// Sandbox
	// resellerId: '36a1a083dd0df9f3b3940b8a972c0e43',
	// kazooClusterId: 'aa2b36ac6a5edb290159cd1298283322',

	braintree: false,
	disableBraintree: true,
	developerFlags: {
		showAllCallflows: true
	},
	whitelabel: {
		companyName: 'VirtualPBX',
		applicationTitle: 'Dash by VirtualPBX',
		custom_welcome_message: 'Trusted VoIP for Any Office, Anywhere.',
		callReportEmail: 'support@virtualpbx.com',
		nav: {
			help: 'https://virtualpbx.com/support',
		},
		port: {
			loa: 'https://www.virtualpbx.com/wp-content/uploads/2017/12/LOA-LocalTollFree.pdf',
			resporg: 'https://www.virtualpbx.com/wp-content/uploads/2016/04/LOA-TollFreeAndLocal.pdf'
		},
		additionalCss: ['extra/brand.css'],
		logoPath: 'apps/auth/style/static/images/logo.svg',
		hide_powered: true,
		disableBraintree: true,
		hideAppStore: true,
		brandColor: '#2b96bd',
		hasMetaflowsEnabled: true,
		jiraFeedback: false,
		bookkeepers: {
			braintree: false
		},
		logoutTimer: 0,
		ui_url: 'https://dash.virtualpbx.com',
		// additionalLoggedInApps: ['voip', 'userportal', 'fax', 'callqueues', 'callqueues-pro', 'pbxs', 'calllogs', 'voicemails', 'webhooks', 'blacklists', 'call-recording', 'integration_aws', 'operator', 'callflows', 'dynamic-callerid', 'numbers']
		// includes: [
		// 	'https://sandbox.2600hz.com/hotjar.js',
		// 	'https://sandbox.2600hz.com/trigger.hotjar.js'
		//  ],
	},

	virtualpbx: {
		autoAttendantLimit: 20,
		maintenance: false
	}
});
