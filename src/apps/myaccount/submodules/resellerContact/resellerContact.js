define(function(require){
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var resellerContact = {
		requests: {
			'virtualpbx.billing.get_contactinfo': {
				apiRoot: 'https://us-central1-core-voice.cloudfunctions.net/view-billing-contact',
				url: '?env=production&account_Id={account_id}',
				verb: 'GET',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID',
					'X-Auth-Token',
					'Content-Type'
				]
			},
			'virtualpbx.billing.update_billing_contact': {
				apiRoot: 'https://us-central1-core-voice.cloudfunctions.net/update-bill-to-contact',
				url: '?env=production&type={type}&account_Id={account_id}&firstname={firstname}&lastname={lastname}&address1={address1}&address2={address2}&city={city}&state={state}&country={country}&zipcode={zipcode}&email={email}',
				verb: 'PUT',
				generateError: false,
				removeHeaders: [
					'X-Kazoo-Cluster-ID',
					'X-Auth-Token',
					'Content-Type'
				]
			}
		},

		subscribe: {
			'myaccount.resellerContact.renderContent': 'resellerContactRender'
		},

		resellerContactRender: function(args){
			var self = this,
				args = args || {},
				parent = args.parent || $('.right-content'),
				callback = args.callback;
			
			self.resellerContactGetData(function(data) {
				var resellerContactTemplate = $(self.getTemplate({
					name: 'layout',
					data: data,
					submodule: 'resellerContact'
				}));

				self.resellerContactBindEvents(resellerContactTemplate, data);

				parent
					.empty()
					.append(resellerContactTemplate);

				monster.pub('myaccount.renderSubmodule', resellerContactTemplate);
				
				callback && callback(resellerContactTemplate);
			});		
		},

		resellerContactBindEvents: function(template, data) {
			var self = this,
			callbackSave = function() {
						self.resellerContactRender();
					};

			template.find('#billtocontact').on('click', function() {
                		self.resellerContactRenderEdit('bill', data, callbackSave);
			});	

			template.find('#soldtocontact').on('click', function() {
                		self.resellerContactRenderEdit('sold', data, callbackSave);
			});	

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		},

        	resellerContactRenderEdit: function(typeofcontact, data, callbackEdit) {
			var self = this,
				templateEdit = $(self.getTemplate({
					name: 'edit',
					data: data,
					submodule: 'resellerContact'
				})),
				popupTitle = typeofcontact == 'bill' ? 'Bill To Contact' : 'Sold To Contact',
				popup;

			popup = monster.ui.dialog(templateEdit, {
				title: 'Update ' + popupTitle,
				width: '500',
				height: '600'
			});

			templateEdit.find('.actions .cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			templateEdit.find('.actions .save').on('click', function() {
				var formData = monster.ui.getFormData('form_contact');

				monster.request({
						resource: 'virtualpbx.billing.update_billing_contact',
						data: {
							"type"		: typeofcontact,
							"account_id": self.accountId,
							"address1"	: formData.address1,
							"address2"	: formData.address2,
							"firstname"	: formData.firstname,
							"lastname"	: formData.lastname,
							"city"		: formData.city,
							"state"		: formData.state,
							"zipcode"	: formData.zipcode,
							"country"	: formData.country,
							"email"		: formData.email
						},
						success: function(data, status) {
							popup.dialog('close').remove();
							self.resellerContactRender();
						},
						error: function(data, status) {
							callbackEdit && callbackEdit(null, null);
						}
					});
			});				
        	},

		resellerContactGetData: function(globalCallback) {
			var self = this;

			monster.parallel({
					account: function(callback) {
						self.callApi({
							resource: 'account.get',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								callback && callback(null, data.data);
							}
						});
					},
					billing: function(callback) {
						monster.request({
							resource: 'virtualpbx.billing.get_contactinfo',
							data: {
								"account_id": self.accountId
							},
							success: function(data, status) {
								callback && callback(null, data);
							},
							error: function(data, status) {
								callback && callback(null, null);
							}
						});
					}
				},
				function(err, results) {
					self.resellerContactFormatData(results, globalCallback);
				}
			);
		},

		resellerContactFormatData: function(data, globalCallback) {
			var self = this;
			globalCallback && globalCallback(data);
		}
	};

	return resellerContact;
});
