define(function(require) {
    var $ = require('jquery'),
            _ = require('lodash'),
			moment = require('moment'),
            monster = require('monster'),
			toastr = require('toastr');

    var virtualpbx = {
		
		appFlags: {
			enabled_ui_apps: { appmenu: '#main_topbar_appmenu' },

			disabled_ui_apps: { voip: '#main_topbar_dashboard', userportal: '#main_topbar_userportal', 
				fax: '#main_topbar_fax', callqueues: '#main_topbar_callqueues',  pbxs: '#main_topbar_pbxs',
				voicemails: '#main_topbar_voicemail', blacklists: '#main_topbar_blacklists', operator: '#main_topbar_monitor',
				webphone: '#main_topbar_webphone', recording_manager: '#main_topbar_recording_manager',
				webhooks: '#main_topbar_webhooks', 'call-recording': '#main_topbar_private_recording', 
				integration_aws: '#main_topbar_integration_aws',  calllogs: '#main_topbar_calllogs',
				reports: '#main_topbar_reports', callflows: '#main_topbar_callflows', 'callqueues-pro': '#main_topbar_callqueues_pro',
				'dynamic-callerid': '#main_topbar_dynamic_callerid', numbers: '#main_topbar_numbers' , integration_ms_teams: '#main_topbar_integration_ms_teams' },
				
			userDefaultApp: 'voip'
		},

        shutdownIntercom: function() {
            var self = this;
            window.Intercom('shutdown');
        },

        updateIntercom: function(data) {
            var self = this;
			var currentUser = monster.apps['auth'].currentUser;
						
        	window.Intercom('update', {
        		"name": currentUser.first_name + " " + currentUser.last_name, 
				"email": currentUser.email,
				"user_hash": data.user_hash
        	});
		},
		
        checkFeaturePermission: function(feature) { 
			var self = this; 
		
			if(monster.apps.auth.currentAccount.hasOwnProperty('reseller_account') && 
				monster.apps.auth.currentAccount.reseller_account.hasOwnProperty('features')) { 
				return monster.apps.auth.currentAccount.reseller_account.features[feature]; 
			} else { 
				return false; 
			} 
		},

		hasFeaturePermission: function(feature) { 
			var self = this; 
		
			if(monster.apps.auth.currentAccount.hasOwnProperty('reseller_account') && 
				monster.apps.auth.currentAccount.reseller_account.hasOwnProperty('features')) { 
				return monster.apps.auth.currentAccount.reseller_account.features.hasOwnProperty(feature); 
			} else { 
				return false; 
			} 
		},

		filterWebhooks: function(name, callback) { 
			var self = this; 

			if (name.indexOf('Qubicle') > -1 && (self.vpbxCheckFeaturePermission('call_queues') || self.vpbxCheckFeaturePermission('call_queues_pro'))) {
				callback(true);
			} else if (name.indexOf('SMS') > -1 && self.vpbxCheckFeaturePermission('text_messages')) {
				callback(true);
			} else if (name.indexOf('Channel') > -1) {
				callback(true);
			} else {
				callback(false);
			}
		},

		getPlan: function(callback) { 
			var self = this; 
			var plan_name = 'Basic';
			
			if (monster.apps.auth.currentAccount.hasOwnProperty('reseller_account') && 
				(monster.apps.auth.currentAccount.reseller_account.hasOwnProperty('plan') && 
				monster.apps.auth.currentAccount.reseller_account.product.hasOwnProperty('name'))) { 
				plan_name = monster.apps.auth.currentAccount.reseller_account.plan.name; 
			} 
			callback(plan_name);
		},

		checkApp: function(appName) {
			var self = this;
			return Object.keys(self.appFlags.enabled_ui_apps).includes(appName);
		},

		getUserDevices: function(callback){
			var self = this; 
			monster.apps.auth.callApi({ 
				resource: 'device.list', 
				data: { 
					accountId: monster.apps.auth.currentAccount.id, 
					generateError: false 
				}, 
				success: function(data, status) { 
					data.data = data.data.filter( function(a) { return a.owner_id === monster.apps['auth'].currentUser.id }); 
					callback(data.data); 
				}, 
				error: function() { 
					callback([]); 
				} 
			}); 
		},

		getUser: function(userId, callback){
			var self = this; 

			monster.apps.auth.callApi({
				resource: 'user.get',
				data: {
					accountId: monster.apps.auth.currentAccount.id, 
					userId: userId
				},
				success: function(user) {
					callback && callback(user.data);
				}
			});
		},
		
		checkAgentStatus: function(callback) {
			var self = this;

			monster.apps.auth.callApi({
				resource: 'qubicleRecipients.list',
				data: {
					accountId: monster.apps.auth.currentAccount.id,
					filters: {
						paginate: 'false'
					}
				},
				success: function(_data, status) {
					_data.data = _data.data.filter( function(a) { return a.id === monster.apps['auth'].currentUser.id })
					if (_data.data.length > 0) {
						callback(false);

					} else {
						callback(true);
					}
				},
				error: function(_data, status) {
					// console.log(_data.data)
					callback(true);
				}
			});
		},

		filterToolsApps: function(appList, callback) {
			var self = this;

				Object.keys(self.appFlags.disabled_ui_apps).forEach(function(key){
					if (appList.includes(key)) {
						self.appFlags.enabled_ui_apps[key] = self.appFlags.disabled_ui_apps[key]								
						delete self.appFlags.disabled_ui_apps[key]
					}
				 });
				 
				callback(appList);
		},

		configurePlanUI: function(template) {
			var self = this;
			self.getPlan(function(plan_name){
				if (plan_name === "Voicemail Only") {
					template.find('.conf-number-row').remove();
					template.find('.conf-section-header').remove();
					template.find('.conf-section').remove();
					template.find('#users').remove();
					template.find('#groups').remove();
					template.find('#devices').remove();
					template.find('#greetings').remove();
					template.find('#featureCodes').remove();
					template.find('.menu-call').remove();
					template.find('.user-menu-call').remove();
					template.find('.advanced-callflow-call').remove();
					template.find('.account-info-box').remove();
					template.find('.caller-id').remove();
					template.find('#devices-chart').remove();
					template.find('#users-chart').remove();
					template.find('#main_topbar_status').remove();
					template.find('#routing').hide();
					template.find('.messaging-number').hide();
				} else if (plan_name.indexOf('Forward') !== -1) {
					template.find('#featureCodes').remove();
					template.find('.create-device[data-type="sip_device"]').remove();
					template.find('.create-device[data-type="softphone"]').remove();
					template.find('.create-device[data-type="webphone"]').remove();
					template.find('.create-device[data-type="fax"]').remove();
					template.find('.create-device[data-type="ata"]').remove();
					template.find('#routing').hide();
					template.find('.messaging-number').hide();
				}

				// Configure Webphones
				if (self.vpbxCheckFeaturePermission('webphone') === false) {
					template.find('[data-type="webphone"]').hide();
				}

				// Configure Video Conferences
				if (self.vpbxCheckFeaturePermission('video_conferences') === false) {
					template.find('.tabs-selector[data-section="video"]').hide();
				}

				// Auto Attendants
				if (self.vpbxCheckFeaturePermission('auto_attendants') === false) {
					template.find('#attendants').remove();
				}

				// Configure DISA
				if (self.vpbxCheckFeaturePermission('disa') === false && self.vpbxCheckFeaturePermission('select_route') === false && self.vpbxCheckFeaturePermission('auto_route') === false) {
					template.find('#routing').remove();
				} else {
						// Configure DISA
					if (self.vpbxCheckFeaturePermission('auto_route') === false) {
						template.find('[data-template="autoroute"]').remove();
					}

					// Configure DISA
					if (self.vpbxCheckFeaturePermission('select_route') === false) {
						template.find('[data-template="selectroute"]').remove();
					}

					// Configure DISA
					if (self.vpbxCheckFeaturePermission('disa') === false) {
						template.find('[data-template="disa"]').remove();
					}
				}

				// Configure Text Messages
				if (self.vpbxCheckFeaturePermission('text_messages') === false) {
					template.find('.messaging-number').remove();
				}

				if (self.hasFeaturePermission('internet_fax') && self.checkFeaturePermission('internet_fax') === false) {
					template.find('.create-device[data-type="fax"]').remove();
					template.find('[data-subcategory="strategy-faxingnum"]').remove();
					template.find('[data-template="faxingnum"]').remove();
					template.find('[data-feature="faxing"]').remove();
				}

				// self.getUserSoftphone(function(userDevices){
				// 	if (userDevices.length > 0) {
				// 		template.find('#config-vpbx-phone-provisioning').remove();
				// 		template.find('#enable-vpbx-phone-provisioning').remove();
				// 	}
				// });

			});
		},
		
		filterUserFeatures: function(callback) {
			var self = this;

			self.getPlan(function(plan_name){
				callback(plan_name.indexOf('Forward') !== -1);
			});
        },
        
        servicePlans: function(callback) {
            if (monster.util.isSuperDuper()) {
                monster.pub('common.servicePlanDetails.customizeSave', {
                    container: newAccountWizardForm.find('.common-container'),
                    accountId: newAccountId,
                    callback: function() {
                        callback();
                    }
                });
            } else {
                callback();
            }
        },

        isQubicleAdmin: function() {
			return monster.apps.auth.currentUser.hasOwnProperty('priv_level') &&
			monster.apps.auth.currentUser.priv_level === 'admin';
        },
        
        canAddWebhooks: function(templateData) {
			templateData.counters.total_webhooks = templateData.groupedWebhooks.length + templateData.ungroupedWebhooks.length
			templateData.allow_webhooks = (templateData.groupedWebhooks.length + templateData.ungroupedWebhooks.length) < 5 ? true : false;
        },

        filterWebHooks: function(data) {
            // VPBX Filter data
            data.data = _.filter(data.data, function(o) { 
                if (o.name.indexOf('channel') > -1) {
                    return true;
                } else {
                    return false;
                }
            });
        },

        vpbxCheckFeaturePermission: function(feature) { 
			var self = this;
		
			if(monster.apps.auth.currentAccount.hasOwnProperty('reseller_account') && 
				monster.apps.auth.currentAccount.reseller_account.hasOwnProperty('features')) { 
				return monster.apps.auth.currentAccount.reseller_account.features[feature]; 
			} else { 
                return false; 
            }
		},
		
		vpbxCheckCompliancePermission: function(feature) { 
			var self = this; 
		
			if(monster.apps.auth.currentAccount.hasOwnProperty('reseller_account') && 
				monster.apps.auth.currentAccount.reseller_account.hasOwnProperty('compliance')) { 
				return monster.apps.auth.currentAccount.reseller_account.compliance[feature]; 
			} else { 
                return true; 
            }
        },

		defaultVideoCodec: function() {
			var self = this;

			if(self.checkFeaturePermission('video_conferences')) { 
				return ["VP8"]; 
			} else { 
				return []; 
			}
		},
		
		accountNumbers: function(accountId, success, error) {
			var self = this;

			monster.apps.auth.callApi({
				resource: 'numbers.list',
				data: {
					accountId: accountId,
					filters: {
						paginate: 'false'
					}
				},
				success: function(_data, status) {
					success && success(_data.data);
				},
				error: function(_data, status) {
					error && error(_data.data);
				}
			});
		},
		
		allowNumbers: function(callback) {
			var self = this,
				created = monster.util.toFriendlyDate(monster.apps.auth.currentAccount.created),
				today = moment().subtract(14,'d').format('YYYY-MM-DD');
				
 			if (created < today) {
				callback(true);				
 			} else {
				self.getAccountNumbers(monster.apps.auth.currentAccount.id, function(numbers) {
					var count = Object.keys(numbers.numbers).length;

					if (count >= 5) {
						callback(false);
					} else {
						callback(true);
					}
				});							
 			}
		},

		checkAccountMenu: function() { 
			var self = this; 
			// DASHTOOLS
			// $('#main_topbar_account_toggle').show();

			if (self.vpbxCheckFeaturePermission('account_menu')){
				if(monster.apps.auth.currentAccount.hasOwnProperty('descendants_count') && 
					monster.apps.auth.currentAccount.descendants_count > 0 &&
					monster.apps.auth.currentUser.priv_level === 'admin') { 
					$('#main_topbar_account_toggle').show();
				} else { 
					$('#main_topbar_account_toggle').remove();
				}
			} else { 
				$('#main_topbar_account_toggle').remove();
			} 
		},

		getStoreUrl: function(callback){
			var self = this,
				store_url = "https://store.virtualpbx.com";

			if(monster.apps.auth.currentAccount.hasOwnProperty('reseller_account') && 
				monster.apps.auth.currentAccount.reseller_account.hasOwnProperty('discount_code')) { 
				store_url = store_url + "/discount/"  + monster.apps.auth.currentAccount.reseller_account.discount_code;
			} 

			if(monster.apps.auth.currentAccount.hasOwnProperty('reseller_account') && 
				monster.apps.auth.currentAccount.reseller_account.hasOwnProperty('custom_store_path')) { 
				store_url = store_url + "?redirect=" + monster.apps.auth.currentAccount.reseller_account.custom_store_path;
			} 

			callback(store_url); 
		},

		getProduct: function(callback) { 
			var self = this; 
			var app_name = 'userportal';
			
			if (monster.apps.auth.currentAccount.hasOwnProperty('reseller_account') && 
				(monster.apps.auth.currentAccount.reseller_account.hasOwnProperty('product') && 
				monster.apps.auth.currentAccount.reseller_account.product.hasOwnProperty('name'))) { 
				app_name = monster.apps.auth.currentAccount.reseller_account.product.name; 
			} 
			callback(app_name);
		},

		checkApp: function(appName) {
			var self = this;
			return Object.keys(self.appFlags.enabled_ui_apps).includes(appName);
		},

		getUserWebphone: function(callback){
			var self = this; 
			monster.apps.auth.callApi({ 
				resource: 'device.list', 
				data: {
					accountId: monster.apps.auth.currentAccount.id,
					generateError: false,
					filters: {
						paginate: 'false',
						'filter_media.webrtc': 'true'
					}
				}, 
				success: function(data, status) { 
					data.data = data.data.filter( function(a) { return a.owner_id === monster.apps['auth'].currentUser.id }); 
					callback(data.data); 
				}, 
				error: function() { 
					callback([]); 
				} 
			}); 
		},

		checkWebPhone: function() {
			var self = this;

			self.getUserWebphone(function(userDevices){
				if (userDevices.length > 0) {
					$('#main_topbar_webphone').show();
				} else {
					$('#main_topbar_webphone').hide();
				}
			});
		},

		getUserSoftphone: function(user_id, callback){
			var self = this; 
			monster.apps.auth.callApi({ 
				resource: 'device.list', 
				data: {
					accountId: monster.apps.auth.currentAccount.id,
					generateError: false,
					filters: {
						paginate: 'false',
						'filter_stretto.enabled': 'true'
					}
				}, 
				success: function(data, status) { 
					data.data = data.data.filter( function(a) { return a.owner_id === user_id }); 
					callback(data.data); 
				}, 
				error: function() { 
					callback([]); 
				} 
			}); 
		},


		checkSoftphone: function(user_id, callback) {
			var self = this;

			self.getUserSoftphone(user_id, function(userDevices){
				callback(user_id && userDevices.length == 0)
			});
		},

		filterApps: function(appList, callback) {
			var self = this,
				allowed_apps = [];

			self.getProduct(function(app){
				self.getPlan(function(plan_name){	
					
					// DASHTOOLS
					if (app === 'Dash' && plan_name === 'Voicemail Only') {
						self.appFlags.userDefaultApp = 'pbxs';

						allowed_apps.push('voip');
						self.appFlags.enabled_ui_apps['voip'] = self.appFlags.disabled_ui_apps['voip'];
						delete self.appFlags.disabled_ui_apps['voip'];

						allowed_apps.push('blacklists');
						self.appFlags.enabled_ui_apps['blacklists'] = self.appFlags.disabled_ui_apps['blacklists'];
						delete self.appFlags.disabled_ui_apps['blacklists'];

						allowed_apps.push('fax');
						self.appFlags.enabled_ui_apps['fax'] = self.appFlags.disabled_ui_apps['fax'];
						delete self.appFlags.disabled_ui_apps['fax'];

						allowed_apps.push('voicemails');
						self.appFlags.enabled_ui_apps['voicemails'] = self.appFlags.disabled_ui_apps['voicemails'];
						delete self.appFlags.disabled_ui_apps['voicemails'];

						appList = appList.filter( function(a) { return allowed_apps.includes(a) });

					} else if (app === 'Dash' && plan_name.indexOf('Forward') !== -1) { // Forward Placeholder
						self.appFlags.userDefaultApp = 'pbxs';

						allowed_apps.push('voip');
						self.appFlags.enabled_ui_apps['voip'] = self.appFlags.disabled_ui_apps['voip'];
						delete self.appFlags.disabled_ui_apps['voip'];

						allowed_apps.push('blacklists');
						self.appFlags.enabled_ui_apps['blacklists'] = self.appFlags.disabled_ui_apps['blacklists'];
						delete self.appFlags.disabled_ui_apps['blacklists'];

						allowed_apps.push('fax');
						self.appFlags.enabled_ui_apps['fax'] = self.appFlags.disabled_ui_apps['fax'];
						delete self.appFlags.disabled_ui_apps['fax'];

						allowed_apps.push('voicemails');
						self.appFlags.enabled_ui_apps['voicemails'] = self.appFlags.disabled_ui_apps['voicemails'];
						delete self.appFlags.disabled_ui_apps['voicemails'];

						allowed_apps.push('userportal');
						self.appFlags.enabled_ui_apps['userportal'] = self.appFlags.disabled_ui_apps['userportal'];
						delete self.appFlags.disabled_ui_apps['userportal'];

						allowed_apps.push('webhooks');
						self.appFlags.enabled_ui_apps['webhooks'] = self.appFlags.disabled_ui_apps['webhooks'];
						delete self.appFlags.disabled_ui_apps['webhooks'];

						if (self.checkFeaturePermission('private_recording')){
							allowed_apps.push('call_recording');
							self.appFlags.enabled_ui_apps['call_recording'] = self.appFlags.disabled_ui_apps['call_recording'];
							delete self.appFlags.disabled_ui_apps['call_recording'];
						} else if (self.checkFeaturePermission('call_recording')){
							self.appFlags.enabled_ui_apps['recording_manager'] = self.appFlags.disabled_ui_apps['recording_manager'];
							delete self.appFlags.disabled_ui_apps['recording_manager'];
						}

						appList = appList.filter( function(a) { return allowed_apps.includes(a) });

					} else if (app === 'ProSIP') {
						allowed_apps = ['pbxs', 'calllogs'];
						self.appFlags.userDefaultApp = 'pbxs';

						if (self.checkFeaturePermission('voip')){
							allowed_apps.push('voip');
						}
						
						appList = appList.filter( function(a) { return allowed_apps.includes(a) });
					} else {
						if (monster.apps['auth'].currentUser.priv_level === 'user') {
							allowed_apps = ['userportal'];
							self.appFlags.userDefaultApp = 'userportal';

							if (self.checkFeaturePermission('call_queues')){
								allowed_apps.push('callqueues');
								self.appFlags.enabled_ui_apps['callqueues'] = self.appFlags.disabled_ui_apps['callqueues'];
								delete self.appFlags.disabled_ui_apps['callqueues'];
							}

							if (self.checkFeaturePermission('call_queues_pro')){
								delete self.appFlags.enabled_ui_apps['callqueues']
								allowed_apps = _.filter(allowed_apps, function(o) { return o != 'callqueues'; });
								self.appFlags.disabled_ui_apps['callqueues'] = '#main_topbar_callqueues';

								allowed_apps.push('callqueues-pro');
								self.appFlags.enabled_ui_apps['callqueues-pro'] = self.appFlags.disabled_ui_apps['callqueues-pro'];
								delete self.appFlags.disabled_ui_apps['callqueues-pro'];
							}

							if (self.checkFeaturePermission('web_phone')){
								self.appFlags.enabled_ui_apps['webphone'] = self.appFlags.disabled_ui_apps['webphone'];
								$(self.appFlags.enabled_ui_apps['webphone']).hide();
								delete self.appFlags.disabled_ui_apps['webphone'];
							}

							appList = appList.filter( function(a) { return allowed_apps.includes(a) });

						}  else {
							allowed_apps = ['userportal', 'fax', 'voicemails', 'voip', 'numbers'];
							self.appFlags.userDefaultApp = 'voip';

							if (self.checkFeaturePermission('callflows')){
								allowed_apps.push('callflows');
								self.appFlags.enabled_ui_apps['callflows'] = self.appFlags.disabled_ui_apps['callflows'];
								delete self.appFlags.disabled_ui_apps['callflows'];
							} else {
								allowed_apps.push('blacklists');
								self.appFlags.enabled_ui_apps['blacklists'] = self.appFlags.disabled_ui_apps['blacklists'];
								delete self.appFlags.disabled_ui_apps['blacklists'];
							}
							
							if (self.checkFeaturePermission('call_queues')){
								allowed_apps.push('callqueues');
								self.appFlags.enabled_ui_apps['callqueues'] = self.appFlags.disabled_ui_apps['callqueues'];
								delete self.appFlags.disabled_ui_apps['callqueues'];
							}

							if (self.checkFeaturePermission('call_queues_pro')){
								delete self.appFlags.enabled_ui_apps['callqueues']
								allowed_apps = _.filter(allowed_apps, function(o) { return o != 'callqueues'; });
								self.appFlags.disabled_ui_apps['callqueues'] = '#main_topbar_callqueues';

								allowed_apps.push('callqueues-pro');
								self.appFlags.enabled_ui_apps['callqueues-pro'] = self.appFlags.disabled_ui_apps['callqueues-pro'];
								delete self.appFlags.disabled_ui_apps['callqueues-pro'];
							}
							
							if (self.checkFeaturePermission('call_monitor')){
								allowed_apps.push('operator');
								self.appFlags.enabled_ui_apps['operator'] = self.appFlags.disabled_ui_apps['operator'];
								delete self.appFlags.disabled_ui_apps['operator'];
							}

							if (self.checkFeaturePermission('web_hooks')){
								allowed_apps.push('webhooks');
								self.appFlags.enabled_ui_apps['webhooks'] = self.appFlags.disabled_ui_apps['webhooks'];
								delete self.appFlags.disabled_ui_apps['webhooks'];
							}

							if (self.checkFeaturePermission('web_phone')){
								self.appFlags.enabled_ui_apps['webphone'] = self.appFlags.disabled_ui_apps['webphone'];
								$(self.appFlags.enabled_ui_apps['webphone']).hide();
								delete self.appFlags.disabled_ui_apps['webphone'];
							}

							if (self.checkFeaturePermission('sip_trunks')){
								allowed_apps.push('pbxs');
								self.appFlags.enabled_ui_apps['pbxs'] = self.appFlags.disabled_ui_apps['pbxs'];
								delete self.appFlags.disabled_ui_apps['pbxs'];
							}

							if (self.checkFeaturePermission('call_logs')){
								allowed_apps.push('calllogs');
								self.appFlags.enabled_ui_apps['calllogs'] = self.appFlags.disabled_ui_apps['calllogs'];
								delete self.appFlags.disabled_ui_apps['calllogs'];
							}

							if (self.checkFeaturePermission('private_recording')){
								allowed_apps.push('call-recording');
								self.appFlags.enabled_ui_apps['call-recording'] = self.appFlags.disabled_ui_apps['call-recording'];
								delete self.appFlags.disabled_ui_apps['call-recording'];
							} else if (self.checkFeaturePermission('call_recording')){
								self.appFlags.enabled_ui_apps['recording_manager'] = self.appFlags.disabled_ui_apps['recording_manager'];
								delete self.appFlags.disabled_ui_apps['recording_manager'];
							}

							if (self.checkFeaturePermission('integration_aws')){
								allowed_apps.push('integration_aws');
								self.appFlags.enabled_ui_apps['integration_aws'] = self.appFlags.disabled_ui_apps['integration_aws'];
								delete self.appFlags.disabled_ui_apps['integration_aws'];
							}

							if (self.checkFeaturePermission('dynamic_callerid')){
								allowed_apps.push('dynamic-callerid');
								self.appFlags.enabled_ui_apps['dynamic-callerid'] = self.appFlags.disabled_ui_apps['dynamic-callerid'];
							}

							if (self.checkFeaturePermission('reports')){
								allowed_apps.push('reports');
								self.appFlags.enabled_ui_apps['reports'] = self.appFlags.disabled_ui_apps['reports'];
								delete self.appFlags.disabled_ui_apps['reports'];
							}

							if (self.checkFeaturePermission('integration_ms_teams')){
								allowed_apps.push('integration_ms_teams');
								self.appFlags.enabled_ui_apps['integration_ms_teams'] = self.appFlags.disabled_ui_apps['integration_ms_teams'];
								delete self.appFlags.disabled_ui_apps['integration_ms_teams'];
							}

							if (self.hasFeaturePermission('internet_fax') && !self.checkFeaturePermission('internet_fax')){
								delete self.appFlags.enabled_ui_apps['fax']
								allowed_apps = _.filter(allowed_apps, function(o) { return o != 'fax'; });
								self.appFlags.disabled_ui_apps['fax'] = '#main_topbar_fax';
							}

							appList = appList.filter( function(a) { return allowed_apps.includes(a) });
						}
					}
					
					Object.keys(self.appFlags.disabled_ui_apps).forEach(function(key){
						if (appList.includes(key)) {
							self.appFlags.enabled_ui_apps[key] = self.appFlags.disabled_ui_apps[key]								
							delete self.appFlags.disabled_ui_apps[key]
						}
					});
					
					callback(appList);
				});
			});
		},

		configureUI: function() {
			var self = this;

			Object.keys(self.appFlags.disabled_ui_apps).forEach(function(key){
				$(self.appFlags.disabled_ui_apps[key]).remove();				
			 });

			 Object.keys(self.appFlags.enabled_ui_apps).forEach(function(key){
				$(self.appFlags.enabled_ui_apps[key]).show();
			 });
		},

		checkMaintenance: function() {
			if (monster.config.virtualpbx.maintenance) {
				$('#maintenance-notice').show();
			}
		},

		filterWebphoneDeviceType: function (deviceData, callback) {
			var self = this;
			if (deviceData.device_type == "webphone") {
				deviceData.device_type = "softphone";
			}
			callback(deviceData);
		},

		provisionReset: function (data, callback) {
			var self = this;

			monster.waterfall([
				function (wfCallback) {
					self.provisionPhone(data, function(deviceData){
						if (deviceData) {
							wfCallback(null, deviceData);
						} else {
							wfCallback("bail", data);
						}
					});
				},
				function (deviceData, wfCallback) {
					if (deviceData.hasOwnProperty('stretto') && deviceData.stretto.hasOwnProperty('owner_id') === true) {
						self.getUser(deviceData.owner_id, function (user) {
							wfCallback(null, deviceData, user);
						});
					} else {
						wfCallback("bail", data);
					}
				},
				function (deviceData, user, wfCallback) {
					self.provisionGetData(user, deviceData, function(payload){
						wfCallback(null, deviceData, payload);
					})
				},
				function (deviceData, payload, wfCallback) {
					self.provisionGetResetURL(function(url){
						monster.request({
							resource: url,
							data: payload,
							success: function (responseData, status) {
								wfCallback(null, deviceData);
							}
						});
			
					});
				}
			], function (err, deviceData) {
				callback(deviceData);
			});
		},

		provisionPhone: function (deviceData, callback) {
			var self = this;

			if (deviceData.device_type === "softphone") {
				if (deviceData.hasOwnProperty('owner_id')) {
					deviceData.stretto.owner_id = deviceData.owner_id;
				} else {
					delete deviceData.stretto;
				}
				callback(deviceData);
			} else {
				callback(null);
			}
		},

		provisionGetProfile: function (callback) {
			var self = this;

			if (self.checkFeaturePermission('collaboration')) {
				callback('production.all');
			} else {
				if (self.vpbxCheckFeaturePermission('text_messages') && self.vpbxCheckFeaturePermission('video_conferences')) {
					callback('all.voice.sms.video');
				} else if (self.vpbxCheckFeaturePermission('text_messages') ) {
					callback('all.voice.sms');
				} else if (self.vpbxCheckFeaturePermission('video_conferences')) {
					callback('all.voice.video');
				} else {
					callback('all.voice');
				} 
			}
		},
		
		provisionGetCreateURL: function (callback) {
			var self = this;

			if (self.checkFeaturePermission('collaboration')) {
				callback('virtualpbx.flex.create');
			} else {
				callback('virtualpbx.stretto.create');
			}
		},

		provisionGetUpdateURL: function (callback) {
			var self = this;

			if (self.checkFeaturePermission('collaboration')) {
				callback('virtualpbx.flex.update');
			} else {
				callback('virtualpbx.stretto.update');
			}
		},

		provisionGetDeleteURL: function (callback) {
			var self = this;

			if (self.checkFeaturePermission('collaboration')) {
				callback('virtualpbx.flex.delete');
			} else {
				callback('virtualpbx.stretto.delete');
			}
		},

		provisionGetResetURL: function (callback) {
			var self = this;

			if (self.checkFeaturePermission('collaboration')) {
				callback('virtualpbx.flex.reset');
			} else {
				callback('virtualpbx.stretto.reset');
			}
		},

		provisionGetCheckUserURL: function (callback) {
			var self = this;
			callback('virtualpbx.flex.check_user');
		},

		provisionGetCheckEmailURL: function (callback) {
			var self = this;
			callback('virtualpbx.flex.check_email');
		},

		provisionGetUsername: function (user, deviceData, callback) {
			var self = this;
			if (deviceData.hasOwnProperty('stretto') && deviceData.stretto.hasOwnProperty('username')) {
				callback(deviceData.stretto.username);
			} else {
				var user_name = user.email.split("@")[0].toLowerCase();
				callback(user_name);
			}			
		},

		provisionUpdateDeviceData: function(deviceData, callback) {
			var self = this;

			if (deviceData.hasOwnProperty('stretto')) {
				if (deviceData.hasOwnProperty('owner_id') === true && deviceData.stretto.hasOwnProperty('owner_id') === true && deviceData.stretto.enabled === true) {
					// update
					self.provisionGetUpdateURL(function(url){
						deviceData.stretto.owner_id = deviceData.owner_id;
						callback(deviceData, url);
					});
				} else if (deviceData.hasOwnProperty('owner_id') === true && deviceData.stretto.hasOwnProperty('owner_id') === false && deviceData.stretto.enabled === true) {
					// create
					self.provisionGetCreateURL(function(url){
						deviceData.stretto.owner_id = deviceData.owner_id;
						callback(deviceData, url);
					});
				} else if (deviceData.hasOwnProperty('owner_id') === false && deviceData.stretto.hasOwnProperty('owner_id') === true && deviceData.stretto.enabled === false) {
					// delete
					self.provisionGetDeleteURL(function(url){
						delete deviceData.stretto;
						callback(deviceData, url);
					});
				} else {
					// delete
					delete deviceData.stretto;
					callback(deviceData, null);
				}
			} else {
				callback(deviceData, null);
			}
		},

		provisionGetUserInfo: function (currentUser, deviceData, callback) {
			var self = this;

			if (deviceData.device_type === "softphone" && currentUser) {
					
				if (!deviceData.hasOwnProperty('stretto')) {
					deviceData.stretto = {};
				}

				self.getUser(currentUser, function(user){
					self.checkUserSoftphone(user, function(data){

						var username = user.email.split("@")[0].toLowerCase();

						if (data.success) {
							username = username + _.random(0, 9);
						}

						self.provisionGetGroupname(deviceData, function(groupname) {
							deviceData.stretto.username = username;
							deviceData.stretto.groupname = groupname;
							callback(deviceData);
						})
					});

				});		
			} else {
				callback(deviceData);
			}
		},

		provisionNewUserInfo: function (currentUser, callback) {
			var self = this;

				var username = currentUser.email.split("@")[0].toLowerCase();
				var emailAddress = currentUser.email;

				self.provisionFormatGroupname(function(groupname) {
					callback(username, emailAddress, groupname);
				})
		},

		provisionGetGroupname: function (deviceData, callback) {
			var self = this;
			if (deviceData.hasOwnProperty('stretto') && deviceData.stretto.hasOwnProperty('groupname')) {
				callback(deviceData.stretto.groupname);
			} else {
				self.provisionFormatGroupname(function(groupname){
					callback(groupname);
				});
			}
		},

		provisionFormatGroupname: function (callback) {
			var self = this,
				groupname = monster.apps.auth.currentAccount.name.replace(/[^0-9a-z]/i, '').toLowerCase();
				
			callback(groupname);
		},

		provisionGetData: function (user, deviceData, callback) {
			var self = this;

			if (self.checkFeaturePermission('collaboration')) {
				self.provisionGetUsername(user.id, deviceData, function(userName){
					var payload = {
						"companyName": monster.apps.auth.currentAccount.name,
						"enableCollaboration": true,
						"firstName": user.first_name,
						"lastName": user.last_name,
						"userName": userName,
						"email": user.email,
						"extensionNumber": user.presence_id || "",
						"deviceName": deviceData.name,
						"sipUsername": deviceData.sip.username,
						"sipPassword": deviceData.sip.password,
						"realm": monster.apps.auth.currentAccount.realm
					}

					callback(payload);
				});
			} else {
				self.provisionGetProfile(function(profileName){
					var userName = deviceData.sip.username.replace("user_", "");
					// var stretto_user = userName + "@virtualpbx.com";

					var payload = {
						"username": userName,
						"email": user.email,
						"firstName": user.first_name,
						"lastName": user.last_name,
						"extensionNumber": user.presence_id || "",
						"deviceName": deviceData.name,
						"sipUsername": deviceData.sip.username,
						"sipPassword": deviceData.sip.password,
						"realm": monster.apps.auth.currentAccount.realm,
						"profileName": profileName
					}
		
					callback(payload);
				});
			}
			
		},
		
		provisionGetUser: function (deviceData, callback) {
			var self = this;

			if (deviceData.hasOwnProperty('media') && deviceData.media.hasOwnProperty('webrtc') && deviceData.media.webrtc === true) {
				callback(null);
			} else if (deviceData.hasOwnProperty('owner_id') === true) {
				self.getUser(deviceData.owner_id, function (user) {
					callback(user);
				});
			} else if (deviceData.hasOwnProperty('stretto') && deviceData.stretto.hasOwnProperty('owner_id')) {
				self.getUser(deviceData.stretto.owner_id, function (user) {
					callback(user);
				});
			} else {
				callback(null);
			}
		},

		createSoftphone: function (data, callback) {
			var self = this;

			monster.waterfall([
				function (wfCallback) {
					self.provisionPhone(data, function(deviceData){
						if (deviceData) {
							wfCallback(null, deviceData);
						} else {
							wfCallback("bail", data);
						}
					});
				},
				function (deviceData, wfCallback) {
					if (deviceData.hasOwnProperty('owner_id')) {
						self.getUser(deviceData.owner_id, function (user) {
							wfCallback(null, deviceData, user);
						});
					} else {
						wfCallback("bail", data);
					}
				},
				function (deviceData, user, wfCallback) {
					self.provisionGetData(user, deviceData, function(payload){
						wfCallback(null, deviceData, payload);
					})
				},
				function (deviceData, payload, wfCallback) {
					self.provisionGetCreateURL(function(url){

						wfCallback(data);
						monster.request({
							resource: url,
							data: payload, 
							success: function (data, status) {
								self.callApi({
									resource: 'device.update',
									data: {
										accountId: self.accountId,
										data: deviceData,
										deviceId: deviceData.id
									},
									success: function(updatedData) {
										wfCallback(null, updatedData);
									},
									error: function (updatedData) {
										wfCallback(null, data);
									}
								});

							}
						});
					});
				}
			], function (err, deviceData) {
				callback(deviceData);
			});
		},

		updateSoftphone: function (deviceData, callback) {
			var self = this;

			monster.waterfall([
				function (wfCallback) {
					self.provisionUpdateDeviceData(deviceData, function(updatedDevice, provisionUrl){
						if (provisionUrl) {
							wfCallback(null, updatedDevice, provisionUrl);
						} else {
							wfCallback("bail", updatedDevice);
						}
					});
				},function (updatedDevice, provisionUrl, wfCallback) {
					self.provisionGetUser(updatedDevice, function(user){
						if (user) {
							wfCallback(null, updatedDevice, provisionUrl, user);
						} else {
							wfCallback("bail", updatedDevice);
						}
					});
				},
				function (updatedDevice, provisionUrl, user, wfCallback) {
					self.provisionGetData(user, updatedDevice, function(payload){
						wfCallback(null, updatedDevice, provisionUrl, payload);
					})
				},
				function (updatedDevice, provisionUrl, payload, wfCallback) {
					monster.request({
						resource: provisionUrl,
						data: payload,
						success: function (data, status) {
						wfCallback(null, updatedDevice);
						}
					});
				}
			], function (err, updatedDevice) {
				callback(updatedDevice);
			});
		},

		deleteSoftphone: function (deviceData, callback) {
			var self = this;

			monster.waterfall([
				function (wfCallback) {
					if (deviceData.hasOwnProperty('stretto') && deviceData.stretto.hasOwnProperty('owner_id')) {
						wfCallback(null, deviceData);
					} else {
						wfCallback("bail", deviceData);
					}
				},
				function (deviceData, wfCallback) {
					self.provisionGetUser(deviceData, function(user){
						if (user) {
							wfCallback(null, deviceData, user);
						} else {
							wfCallback("bail", deviceData);
						}
					});
				},
				function (deviceData, user, wfCallback) {
					self.provisionGetData(user, deviceData, function(payload){
						wfCallback(null, deviceData, payload);
					})
				},
				function (deviceData, payload, wfCallback) {
					self.provisionGetDeleteURL(function(provisionUrl){
						wfCallback(null, deviceData, provisionUrl, payload);
					})
				},
				function (deviceData, provisionUrl, payload, wfCallback) {
					monster.request({
						resource: provisionUrl,
						data: payload,
						success: function (data, status) {
							wfCallback(null, deviceData);
						}, 
						error: function(data, status) {
							// console.log(data)
							// console.log(status)
							wfCallback(status, deviceData);
						} 
					});
				}
			], function (err, deviceData) {
				callback(deviceData);
			});
		},

		checkUserSoftphone: function (currentUser, callback) {
			var self = this;

			monster.waterfall([
				function (wfCallback) {
					self.provisionGetCheckUserURL(function(provisionUrl){
						if (provisionUrl) {
							wfCallback(null, provisionUrl);
						} else {
							wfCallback("bail", false);
						}
					});
				},
				function (provisionUrl, wfCallback) {
					
					self.provisionNewUserInfo(currentUser, function(username, emailAddress, groupname){
						var payload = {
							companyName: groupname,
							userName: username
						}

						wfCallback(null, provisionUrl, payload);
					});
				},
				function (provisionUrl, payload, wfCallback) {
					monster.request({
						resource: provisionUrl,
						data: payload,
						success: function (data, status) {
							wfCallback(null, data);
						}
					});
				}
			], function (err, data) {
				callback(data);
			});
		},

		checkUserEmail: function (currentUser, callback) {
			var self = this;

			monster.waterfall([
				function (wfCallback) {
					self.getUser(currentUser, function(user){
						if (user) {
							wfCallback(null, user);
						} else {
							wfCallback("bail", false);
						}
					});
				},
				function (user, wfCallback) {
					self.provisionFormatGroupname(function(groupname) {
						var payload = {
							companyName: groupname,
							emailAddress: user.email
						}

						wfCallback(null, payload);						
					});
				},
				function (payload, wfCallback) {
					self.provisionGetCheckEmailURL(function(provisionUrl){
						monster.request({
							resource: provisionUrl,
							data: payload,
							success: function (data, status) {
								wfCallback(null, data);
							}
						});
					});
				}
			], function (err, data) {

				if (data.success) {
					monster.ui.alert('warning', "The email address for this user is in use in the provisioning system. Please contact support for asssistance.", function () {
						callback(data);
					});
				} else {
					callback(data);
				}

			});
		},

		getValuesDeep: function(obj, key) {
			var self = this;
			var objects = [];
			for (var i in obj) {
				if (!obj.hasOwnProperty(i)) continue;
				if (typeof obj[i] == 'object') {
					objects = objects.concat(self.getValuesDeep(obj[i], key));
				} else if (i == key) {
					objects.push(obj[i]);
				}
			}
			return objects;
		}
	}

    return virtualpbx;
});