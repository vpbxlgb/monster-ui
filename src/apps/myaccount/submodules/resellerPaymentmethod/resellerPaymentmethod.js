define(function(require){
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		timezone = require('monster-timezone');

	var resellerPaymentmethod = {

		subscribe: {
			'myaccount.resellerPaymentmethod.renderContent': '_resellerPaymentmethodRenderContent'
		},

		_resellerPaymentmethodRenderContent: function(args){
			var self = this;

			self.resellerPaymentmethodGetData(function(data) {
				var resellerPaymentmethodTemplate = $(self.getTemplate({
					name: 'layout',
					data: data,
					submodule: 'resellerPaymentmethod'
				}));

				self.accountBindEvents(resellerPaymentmethodTemplate, data);

				monster.pub('myaccount.renderSubmodule', resellerPaymentmethodTemplate);

				args.callback && args.callback(resellerPaymentmethodTemplate);
			});
		},

		resellerPaymentmethodBindEvents: function(template, data) {
			var self = this;

			timezone.populateDropdown(template.find('#account_timezone'), data.account.timezone);
			template.find('#account_timezone').chosen({ search_contains: true, width: '220px' });

			//Temporary button design fix until we redesign the Accounts Manager
			template.find('#accountsmanager_carrier_save')
					.removeClass('btn btn-success')
					.addClass('monster-button-success');

			monster.pub('myaccount.events', {
				template: template,
				data: data
			});
		},

		resellerPaymentmethodGetData: function(globalCallback) {
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
				account_Id: function(callback) {
					callback && callback(null, self.accountId);
				}
			},
			function(err, results) {
				self.resellerPaymentmethodFormatData(results, globalCallback);
			}
		);
		},

		resellerPaymentmethodFormatData: function(data, globalCallback) {
			var self = this;

			if (data.payments === null) {
				data.payments == [];
			}

			globalCallback && globalCallback(data);
		}
	};

	return resellerPaymentmethod;
});
